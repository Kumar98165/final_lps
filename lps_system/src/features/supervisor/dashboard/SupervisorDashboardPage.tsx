import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Activity,
    AlertCircle,
    ShieldCheck,
    Database,
    Target,
    Users,
    Search,
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
import { SupervisorKPICard as KPICard } from './components/SupervisorKPICard';
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
        onConfirm: (_: string) => {}
    });

    const refreshSupervisorData = async (silent = false) => {
        if (!silent) setLoading(true);
        const token = getToken();
        try {
            const [modelsRes, data] = await Promise.all([
                fetch(`${API_BASE}/production/assigned-work`, {
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
            title: 'Confirm Finalization',
            message: `Are you sure you want to VERIFY ALL rows and mark ${selectedLog.model_name} as READY?\n\nThis will synchronize the completed status across all dashboards.`,
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
                    const response = await fetch(`${API_BASE}/production/finalize-assignment/${selectedLog.car_model_id}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        setModalConfig({
                            isOpen: true,
                            title: 'Success',
                            message: `${selectedLog.model_name} is now READY and synchronized!`,
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
                message: `${selectedLog.model_name} has been sent back to DEO for correction.\n\nReason: ${reason}`,
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

    const filteredModels = assignedModels.filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.model_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderContent = () => {
        switch (location.pathname) {
            case SUPERVISOR_MONITORING:
                return <MonitoringView assignedModels={assignedModels} />;
            case SUPERVISOR_PROGRESS:
                return <ProgressView assignedModels={assignedModels} />;
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
                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <KPICard title="Total Assigned" value={assignedModels.length} icon={Database} color="bg-slate-900 text-white" />
                            <KPICard title="Pending Verify" value={verifications.length} icon={ShieldCheck} color="bg-orange-500 text-white" />
                            <KPICard title="Active DEOs" value={Array.from(new Set(assignedModels.map(m => m.assigned_deo_name))).filter(Boolean).length} icon={Users} color="bg-blue-600 text-white" />
                            <KPICard title="Shift Progress" value={`${Math.max(0, 100 - (verifications.length * 4))}%`} icon={Target} color="bg-emerald-500 text-white" />
                        </div>

                        {/* Assigned Models */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Your Active Oversight</h2>
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F37021] transition-colors" size={18} />
                                        <input
                                            type="text"
                                            placeholder="SEARCH MODELS..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-6 text-xs font-black tracking-widest uppercase focus:border-[#F37021]/50 focus:ring-0 transition-all w-64 md:w-80 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vehicle Configuration</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Line Routing</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Operator</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredModels.length > 0 ? (
                                            filteredModels.map((model) => (
                                                <tr key={model.id} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="px-8 py-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                                                <Database size={20} />
                                                            </div>
                                                            <div>
                                                                 <span className="block text-sm font-black text-slate-900 uppercase tracking-tight">
                                                                    {model.name}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                    {model.model_code} • {model.variant_name || 'Standard'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-8">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                                <Activity size={12} />
                                                            </div>
                                                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                                                                {model.line_name || 'NOT ASSIGNED'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-8">
                                                        {model.assigned_deo_name ? (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-[#F37021]/10 flex items-center justify-center text-[#F37021]">
                                                                    <Users size={14} />
                                                                </div>
                                                                <div>
                                                                    <span className="block text-xs font-black text-slate-900 uppercase tracking-tight">
                                                                        {model.assigned_deo_name}
                                                                    </span>
                                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                                                        <Activity size={10} /> Allocated
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-3 opacity-50">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                                    <Users size={14} />
                                                                </div>
                                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                                                    Pending Assignment
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-10 py-20 text-center">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                        <AlertCircle size={24} />
                                                    </div>
                                                    <p className="text-slate-500 font-black text-xs uppercase tracking-widest">No matching vehicles found.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-[1920px] mx-auto min-h-screen font-sans bg-[#F8FAFC]">
            <div className="p-8 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-[#F37021]/10 px-3 py-1 rounded-full">
                                <span className="text-[10px] font-black tracking-[0.2em] text-[#F37021] uppercase">Oversight Dashboard</span>
                            </div>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            OVERVIEW
                        </h1>
                    </div>
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
                            const res = await fetch(`${API_BASE}/production/daily-logs`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    model_name: selectedLog.model_name,
                                    car_model_id: selectedLog.car_model_id,
                                    demand_id: selectedLog.demand_id,
                                    deo_id: selectedLog.deo_id, // Ensure we update the CORRECT DEO's log
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
                            await fetch(`${API_BASE}/production/daily-logs`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
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
