import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Activity,
    AlertCircle,
    Database,
    Users,
    Search,
    ChevronLeft,
} from 'lucide-react';
import { getPendingVerifications, verifyDailyProductionRow, verifyDailyProductionLog } from '../api';
import { API_BASE } from '../../../lib/apiConfig';
import { getToken } from '../../../lib/storage';
import {
    SUPERVISOR_DASHBOARD,
    SUPERVISOR_MONITORING,
    SUPERVISOR_PROGRESS,
    SUPERVISOR_VERIFY,
    SUPERVISOR_REPORTS,
    SUPERVISOR_ALERTS
} from '../../../config/routePaths';
import { CustomModal } from '../../deo/components/DEOModals';

// Modular Components
import { SupervisorVerifyLogs } from './components/SupervisorVerifyLogs';
import { LogDetailView } from './components/LogDetailModal';
import DEORowManualModal from '../../deo/components/DEORowManualModal';
import { RowRejectionModal } from './components/RowRejectionModal';
import {
    MonitoringView,
    ProgressView,
    ReportsView,
    AlertsView
} from './components/SupervisorViews';


const SupervisorDashboardPage = () => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verifications, setVerifications] = useState<any[]>([]);
    const [assignedModels, setAssignedModels] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [rejectingRowIndex, setRejectingRowIndex] = useState<number | null>(null);
    const [rowRejectionComment, setRowRejectionComment] = useState('');
    const [activeVerifyTab, setActiveVerifyTab] = useState<'pending' | 'ready'>('pending');
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'confirm' as 'confirm' | 'alert' | 'input',
        onConfirm: (_: string) => { }
    });

    const refreshSupervisorData = async (silent = false) => {
        if (!silent) setLoading(true);
        const token = getToken();
        try {
            const [modelsRes, data] = await Promise.all([
                fetch(`${API_BASE}/deo/assigned-work`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                getPendingVerifications()
            ]);

            if (modelsRes.ok) {
                const modelsData = await modelsRes.json();
                setAssignedModels(modelsData.data || []);
            }
            setVerifications(data);
        } catch (error) {
            console.error("Failed to load supervisor data", error);
            if (!silent) setError("Failed to connect to the server. Please check if the backend is running.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        refreshSupervisorData();
        const interval = setInterval(() => {
            // Only poll if no log is being reviewed and no modal is open
            if (!selectedLog && !modalConfig.isOpen) {
                refreshSupervisorData(true);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [selectedLog, modalConfig.isOpen]);


    const handleRowVerify = async (rowIndex: number, status: 'VERIFIED' | 'REJECTED', reason: string = "") => {
        if (!selectedLog) return;

        // Optimistic UI update
        const updatedLog = { ...selectedLog };
        updatedLog.log_data[rowIndex] = {
            ...updatedLog.log_data[rowIndex],
            row_status: status,
            rejection_reason: reason
        };
        setSelectedLog(updatedLog);

        const sap_part_number = selectedLog.log_data[rowIndex]?.["SAP PART NUMBER"] ||
            selectedLog.log_data[rowIndex]?.["SAP PART #"] ||
            selectedLog.log_data[rowIndex]?.["sap_part_number"];

        const success = await verifyDailyProductionRow(selectedLog.id, rowIndex, status, reason, sap_part_number);
        if (!success) {
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Failed to update row verification status.',
                type: 'alert',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        } else {
            // Silently refresh other lists
            refreshSupervisorData(true);
        }
    };

    const handleBulkVerify = async () => {
        if (!selectedLog) return;

        setModalConfig({
            isOpen: true,
            title: 'Verify Production',
            message: `Authorize final verification for ${selectedLog.model_name}?`,
            type: 'confirm',
            onConfirm: async (_: string) => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                try {
                    const token = getToken();
                    // 1. Verify all individual rows
                    const verifyPromises = selectedLog.log_data.map((row: any, index: number) => {
                        const sap_part_number = row?.["SAP PART NUMBER"] || row?.["SAP PART #"] || row?.["sap_part_number"] || "";
                        return verifyDailyProductionRow(selectedLog.id, index, 'VERIFIED', 'Bulk Verified by Supervisor', sap_part_number);
                    });
                    await Promise.all(verifyPromises);

                    // 2. Finalize the entire assignment
                    const response = await fetch(`${API_BASE}/supervisor/finalize-assignment/${selectedLog.car_model_id}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        setModalConfig({
                            isOpen: true,
                            title: 'Verification Confirmed',
                            message: `The production log for ${selectedLog.model_name} has been successfully verified.`,
                            type: 'alert',
                            onConfirm: (_: string) => {
                                setModalConfig(prev => ({ ...prev, isOpen: false }));
                                setSelectedLog(null); // Close detail view
                                refreshSupervisorData(); // Full refresh
                            }
                        });
                    } else {
                        const errorData = await response.json();
                        setModalConfig({
                            isOpen: true,
                            title: 'Failed',
                            message: `Finalization failed: ${errorData.message}`,
                            type: 'alert',
                            onConfirm: (_: string) => {
                                setModalConfig(prev => ({ ...prev, isOpen: false }));
                                refreshSupervisorData();
                            }
                        });
                    }
                } catch (error) {
                    console.error('Bulk verify error:', error);
                    setModalConfig({
                        isOpen: true,
                        title: 'Error',
                        message: 'An error occurred during bulk verification.',
                        type: 'alert',
                        onConfirm: (_: string) => setModalConfig(prev => ({ ...prev, isOpen: false }))
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleRejectLog = async (reason: string) => {
        if (!selectedLog) return;

        const success = await verifyDailyProductionLog(selectedLog.id, 'REJECTED', reason);
        if (success) {
            setModalConfig({
                isOpen: true,
                title: 'Submission Rejected',
                message: `The log for ${selectedLog.model_name} has been returned to the DEO for correction.`,
                type: 'alert',
                onConfirm: (_: string) => {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    setSelectedLog(null);
                    refreshSupervisorData();
                }
            });
        } else {
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Failed to reject the submission. Please try again.',
                type: 'alert',
                onConfirm: (_: string) => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    if (loading) return (
        <div className="p-24 text-center flex flex-col items-center justify-center min-h-[60vh]">
            <Activity size={48} className="text-[#F37021] animate-spin mb-6" />
            <div className="text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">Initializing Supervisor Control...</div>
        </div>
    );

    if (error) return (
        <div className="p-24 text-center flex flex-col items-center justify-center min-h-[60vh]">
            <AlertCircle size={48} className="text-rose-500 mb-6" />
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Something went wrong</h3>
            <p className="text-slate-500 font-bold max-w-md">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
                Try Again
            </button>
        </div>
    );

    const activeAssignedModels = assignedModels.filter(m => !!m.assigned_deo_name && !!m.line_name);

    const filteredModels = activeAssignedModels.filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.model_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderContent = () => {
        switch (location.pathname) {
            case SUPERVISOR_MONITORING:
                return <MonitoringView assignedModels={activeAssignedModels} />;
            case SUPERVISOR_PROGRESS:
                return <ProgressView assignedModels={activeAssignedModels} />;
            case SUPERVISOR_VERIFY:
                return (
                    <SupervisorVerifyLogs
                        verifications={verifications}
                        activeVerifyTab={activeVerifyTab}
                        setActiveVerifyTab={setActiveVerifyTab}
                        setSelectedLog={setSelectedLog}
                    />
                );
            case SUPERVISOR_REPORTS:
                return <ReportsView />;
            case SUPERVISOR_ALERTS:
                return <AlertsView />;
            case SUPERVISOR_DASHBOARD:
            default:
                return (
                    <div className="space-y-12">
                        {/* Quick Stats Removed at user request */}

                        {/* Assigned Models */}
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Your Active Oversight</h2>
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F37021] transition-all duration-300" size={20} />
                                        <input
                                            type="text"
                                            placeholder="SEARCH MODELS..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="bg-white border-2 border-slate-100 rounded-3xl py-4 pl-14 pr-8 text-xs font-black tracking-widest uppercase focus:border-[#F37021]/30 focus:ring-0 transition-all w-full md:w-96 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-slate-200 placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Header for Columns (Hidden on small screens) */}
                                <div className="hidden md:flex px-12 py-2">
                                    <div className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vehicle Configuration</div>
                                    <div className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Line Routing</div>
                                    <div className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Operator</div>
                                </div>

                                {filteredModels.length > 0 ? (
                                    filteredModels.map((model) => (
                                        <div key={model.id} className="bg-white rounded-[2.5rem] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:border-[#F37021]/10 transition-all duration-500 flex flex-col md:flex-row md:items-center p-8 group relative overflow-hidden">
                                            {/* Hover Accent Line */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F37021] opacity-0 group-hover:opacity-100 transition-opacity" />

                                            {/* Vehicle Configuration */}
                                            <div className="flex-1 flex items-center gap-6 mb-6 md:mb-0">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl group-hover:scale-105 group-hover:bg-[#F37021] transition-all duration-500 relative overflow-hidden">
                                                    <Database size={28} strokeWidth={2.5} />
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                </div>
                                                <div>
                                                    <span className="block text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1.5 transition-colors group-hover:text-[#F37021]">
                                                        {model.name}
                                                    </span>
                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{model.model_code}</span>
                                                        <span className="opacity-50">•</span>
                                                        {model.variant_name || 'Standard'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Line Routing */}
                                            <div className="flex-1 flex items-center gap-4 mb-6 md:mb-0">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#F37021] group-hover:bg-[#F37021]/10 transition-all duration-300">
                                                    <Activity size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Line Assignment</span>
                                                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest">
                                                        {model.line_name || 'NOT ASSIGNED'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Assigned Operator */}
                                            <div className="flex-1 flex items-center">
                                                {model.assigned_deo_name ? (
                                                    <div className="flex items-center gap-4 bg-slate-50/50 p-2 pr-6 rounded-[2rem] group-hover:bg-white group-hover:shadow-sm transition-all duration-300 border border-transparent group-hover:border-slate-100">
                                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#F37021] shadow-md border border-slate-50 relative">
                                                            <Users size={20} />
                                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                                                        </div>
                                                        <div>
                                                            <span className="block text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1">
                                                                {model.assigned_deo_name}
                                                            </span>
                                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                                                ALLOCATED
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4 opacity-70">
                                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                                                            <Users size={20} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-5 py-2 rounded-full border border-amber-100 shadow-sm animate-pulse">
                                                            Pending Assignment
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Indicator */}
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500 hidden md:block">
                                                <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center text-white shadow-lg">
                                                    <ChevronLeft size={20} className="rotate-180" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-24 text-center">
                                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                                            <Search size={48} strokeWidth={1} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">No results found</h3>
                                        <p className="text-slate-400 font-bold max-w-xs mx-auto text-sm leading-relaxed">We couldn't find any vehicle matching your search criteria.</p>
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="mt-8 text-[#F37021] font-black text-xs uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-[1920px] mx-auto min-h-screen font-sans bg-[#F8FAFC]">
            <div className="p-8 pb-4">
                <div>
                    {/* Oversight Dashboard Header Removed at user request */}
                </div>
            </div>

            <div className="px-8 pb-12">
                {selectedLog ? (
                    <LogDetailView
                        selectedLog={selectedLog}
                        setSelectedLog={setSelectedLog}
                        onBulkVerify={handleBulkVerify}
                        onRejectLog={handleRejectLog}
                        onRowVerify={handleRowVerify}
                    />
                ) : (
                    renderContent()
                )}
            </div>

            <DEORowManualModal
                isOpen={selectedRowIndex !== null}
                onClose={() => setSelectedRowIndex(null)}
                row={selectedRowIndex !== null ? selectedLog?.log_data[selectedRowIndex] : null}
                isSupervisor={false} // Allow editing so supervisor can correct Target/Produced
                onSave={async (updatedRow) => {
                    if (selectedRowIndex !== null && selectedLog) {
                        const updatedLog = { ...selectedLog };
                        // Automatically mark as verified when supervisor saves
                        updatedRow.row_status = 'VERIFIED';
                        updatedLog.log_data[selectedRowIndex] = updatedRow;
                        setSelectedLog(updatedLog);

                        // Sync to backend
                        const token = getToken();
                        try {
                            const res = await fetch(`${API_BASE}/supervisor/update-log`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    log_id: selectedLog.id,
                                    model_name: selectedLog.model_name,
                                    car_model_id: selectedLog.car_model_id,
                                    demand_id: selectedLog.demand_id,
                                    deo_id: selectedLog.deo_id, 
                                    log_data: updatedLog.log_data,
                                    is_final: selectedLog.status === 'SUBMITTED' || selectedLog.status === 'VERIFIED'
                                })
                            });
                            if (res.ok) {
                                refreshSupervisorData(true);
                            }
                        } catch (e) {
                            console.error("Failed to sync supervisor edit", e);
                        }
                    }
                    setSelectedRowIndex(null);
                }}
                onVerify={async (status, reason, updatedRow) => {
                    if (selectedRowIndex !== null && selectedLog) {
                        // If supervisor edited data before verifying, sync it first
                        if (updatedRow) {
                            const updatedLog = { ...selectedLog };
                            updatedLog.log_data[selectedRowIndex] = { ...updatedRow, row_status: status, rejection_reason: reason };
                            setSelectedLog(updatedLog);

                            // Save the full log to ensure the correction is persisted
                            const token = getToken();
                            await fetch(`${API_BASE}/supervisor/update-log`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    log_id: selectedLog.id,
                                    model_name: selectedLog.model_name,
                                    car_model_id: selectedLog.car_model_id,
                                    demand_id: selectedLog.demand_id,
                                    deo_id: selectedLog.deo_id,
                                    log_data: updatedLog.log_data,
                                    is_final: true
                                })
                            });
                        }

                        if (status === 'REJECTED') {
                            setRejectingRowIndex(selectedRowIndex);
                            setSelectedRowIndex(null);
                        } else {
                            await handleRowVerify(selectedRowIndex, status, reason);
                            setSelectedRowIndex(null);
                        }
                    }
                }}
            />

            <RowRejectionModal
                rejectingRowIndex={rejectingRowIndex}
                setRejectingRowIndex={setRejectingRowIndex}
                rowRejectionComment={rowRejectionComment}
                setRowRejectionComment={setRowRejectionComment}
                handleRowVerify={handleRowVerify}
            />

            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />
        </div>
    );
}

export default SupervisorDashboardPage;
