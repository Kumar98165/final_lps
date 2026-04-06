import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Activity,
    AlertCircle,
    ChevronDown,
    Calendar,
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
import { SupervisorKPI } from './components/SupervisorKPI';
import { SupervisorAnalytics } from './components/SupervisorAnalytics';


const SupervisorDashboardPage = () => {
    const location = useLocation();
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verifications, setVerifications] = useState<any[]>([]);
    const [assignedModels, setAssignedModels] = useState<any[]>([]);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [rejectingRowIndex, setRejectingRowIndex] = useState<number | null>(null);
    const [rowRejectionComment, setRowRejectionComment] = useState('');
    const [activeVerifyTab, setActiveVerifyTab] = useState<'pending' | 'ready'>('pending');
    
    // Phase 3 Filters
    const [selectedLine, setSelectedLine] = useState('Select Line');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLineOpen, setIsLineOpen] = useState(false);

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
            if (!selectedLog && !modalConfig.isOpen) {
                refreshSupervisorData(true);
            }
        }, 60000); // 60s
        return () => clearInterval(interval);
    }, [selectedLog, modalConfig.isOpen]);

    // Filtering Logic
    const uniqueLines = useMemo(() => {
        const lines = Array.from(new Set(assignedModels.map(m => m.line_name).filter(Boolean)));
        return lines.sort();
    }, [assignedModels]);

    const filteredAssignedModels = useMemo(() => {
        if (selectedLine === 'Select Line') return assignedModels;
        return assignedModels.filter(m => m.line_name === selectedLine);
    }, [assignedModels, selectedLine]);

    const filteredVerifications = useMemo(() => {
        let filtered = verifications;
        // Filter by Date (Match "YYYY-MM-DD" or similar)
        if (selectedDate) {
            filtered = filtered.filter(v => v.date === selectedDate);
        }
        if (selectedLine !== 'Select Line') {
            filtered = filtered.filter(v => v.line_name === selectedLine);
        }
        return filtered;
    }, [verifications, selectedLine, selectedDate]);

    // KPI Logic
    const kpiStats = useMemo(() => {
        const activeAssigned = filteredAssignedModels;
        const uniqueDeos = Array.from(new Set(activeAssigned.map(m => m.assigned_deo_name).filter(Boolean)));
        const activeDeos = Array.from(new Set(activeAssigned.filter(m => (m.actual_qty || 0) > 0).map(m => m.assigned_deo_name))).length;
        // Accurate Live Mapping
        const awaitingReview = filteredVerifications.filter(v => v.status === 'SUBMITTED' || v.status === 'PENDING' || !v.status).length;
        const readyVerified = filteredVerifications.filter(v => v.status === 'VERIFIED' || v.status === 'APPROVED' || v.status === 'READY' || v.status === 'DONE').length;
        const rejectedCount = filteredVerifications.filter(v => v.status === 'REJECTED').length;
        
        return {
            totalDeos: uniqueDeos.length,
            activeDeos: activeDeos,
            readyModels: readyVerified,
            pendingModels: awaitingReview,
            rejectedModels: rejectedCount
        };
    }, [filteredAssignedModels, filteredVerifications]);


    const handleRowVerify = async (rowIndex: number, status: 'VERIFIED' | 'REJECTED', reason: string = "") => {
        if (!selectedLog) return;
        const updatedLog = { ...selectedLog };
        updatedLog.log_data[rowIndex] = {
            ...updatedLog.log_data[rowIndex],
            row_status: status,
            'Production Status': status,
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
                    const verifyPromises = selectedLog.log_data.map((row: any, index: number) => {
                        const sap_part_number = row?.["SAP PART NUMBER"] || row?.["SAP PART #"] || row?.["sap_part_number"] || "";
                        return verifyDailyProductionRow(selectedLog.id, index, 'VERIFIED', 'Bulk Verified by Supervisor', sap_part_number);
                    });
                    await Promise.all(verifyPromises);
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
                                setSelectedLog(null);
                                refreshSupervisorData();
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
                message: '',
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
        <div className="bg-ind-bg min-h-screen flex flex-col items-center justify-center">
            <Activity size={48} className="text-ind-primary animate-spin mb-6" />
            <div className="text-ind-text3 font-bold uppercase tracking-[0.2em] animate-pulse">Syncing production data...</div>
        </div>
    );

    if (error) return (
        <div className="bg-ind-bg min-h-screen flex flex-col items-center justify-center">
            <AlertCircle size={48} className="text-rose-500 mb-6" />
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Sync Interrupted</h3>
            <p className="text-ind-text2 font-bold max-md">{error}</p>
        </div>
    );


    const renderContent = () => {
        switch (location.pathname) {
            case SUPERVISOR_MONITORING:
                return <MonitoringView assignedModels={filteredAssignedModels} />;
            case SUPERVISOR_PROGRESS:
                return <ProgressView assignedModels={filteredAssignedModels} />;
            case SUPERVISOR_VERIFY:
                return (
                    <SupervisorVerifyLogs
                        verifications={filteredVerifications}
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
                    <div className="space-y-5 pb-8 font-sans">
                        {/* Professional Professional Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4">
                            <div>
                                <h1 className="text-4xl font-black text-ind-text tracking-tight leading-none">Supervisor Dashboard</h1>
                            </div>
                            
                            <div className="flex items-center gap-4 relative">
                                {/* Line Selection (Professional Update) */}
                                <div className="relative">
                                    <div 
                                        onClick={() => setIsLineOpen(!isLineOpen)}
                                        className={`bg-white rounded-xl px-4 py-2.5 flex items-center justify-between min-w-[140px] shadow-sm border border-ind-border/60 cursor-pointer hover:border-slate-300 transition-all group z-[60]`}
                                    >
                                        <span className={`text-[11px] font-bold ${selectedLine === 'Select Line' ? 'text-ind-text3' : 'text-ind-text'}`}>
                                            {selectedLine === 'Select Line' ? 'All lines' : selectedLine}
                                        </span>
                                        <ChevronDown size={14} className={`text-ind-text3 group-hover:text-ind-text2 transition-transform ${isLineOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    
                                    {isLineOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[55]" onClick={() => setIsLineOpen(false)} />
                                            <div className="absolute top-[110%] left-0 w-full bg-white rounded-xl shadow-xl overflow-hidden z-[100] border border-ind-border/50 py-1 animate-in fade-in slide-in-from-top-2">
                                                <div 
                                                    onClick={() => { setSelectedLine('Select Line'); setIsLineOpen(false); }}
                                                    className="px-4 py-2.5 text-[10px] font-bold text-ind-text3 hover:bg-ind-bg cursor-pointer"
                                                >
                                                    All
                                                </div>
                                                {uniqueLines.map(line => (
                                                    <div 
                                                        key={line}
                                                        onClick={() => { setSelectedLine(line); setIsLineOpen(false); }}
                                                        className={`px-4 py-2.5 text-[10px] font-bold hover:bg-orange-50 hover:text-orange-900 cursor-pointer transition-colors ${selectedLine === line ? 'bg-orange-50 text-orange-900' : 'text-ind-text2'}`}
                                                    >
                                                        {line}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Date Selection (Sentence Case Fix) */}
                                <div 
                                    onClick={() => dateInputRef.current?.showPicker()}
                                    className="bg-white rounded-xl px-4 py-2.5 flex items-center gap-4 shadow-sm border border-ind-border/60 cursor-pointer hover:border-slate-300 transition-all group relative"
                                >
                                    <input 
                                        ref={dateInputRef}
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="absolute inset-0 opacity-0 pointer-events-none"
                                    />
                                    <span className="text-[11px] font-bold text-ind-text">
                                        {new Date(selectedDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                    </span>
                                    <Calendar size={15} className="text-ind-text3 group-hover:text-ind-primary transition-colors" />
                                </div>
                            </div>
                        </div>

                        <SupervisorKPI 
                            totalDeos={kpiStats.totalDeos}
                            activeDeos={kpiStats.activeDeos}
                            readyModels={kpiStats.readyModels}
                            pendingModels={kpiStats.pendingModels}
                            rejectedModels={kpiStats.rejectedModels}
                        />

                        {/* Analytical Data Stream */}
                        <div className="space-y-4">
                            <h2 className="text-[9px] font-black uppercase text-ind-text3 px-4 mb-2 tracking-[0.2em]">Operational analytics</h2>
                            <SupervisorAnalytics 
                                assignedModels={filteredAssignedModels} 
                                verifications={filteredVerifications}
                            />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-[1700px] mx-auto min-h-screen font-sans bg-ind-bg">
            <div className="px-5 py-6 relative">
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
                isSupervisor={false} 
                onSave={async (updatedRow) => {
                    if (selectedRowIndex !== null && selectedLog) {
                        const updatedLog = { ...selectedLog };
                        updatedRow.row_status = 'VERIFIED';
                        updatedLog.log_data[selectedRowIndex] = updatedRow;
                        setSelectedLog(updatedLog);
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
                            if (res.ok) { refreshSupervisorData(true); }
                        } catch (e) { console.error("Failed to sync supervisor edit", e); }
                    }
                    setSelectedRowIndex(null);
                }}
                onVerify={async (status, reason, updatedRow) => {
                    if (selectedRowIndex !== null && selectedLog) {
                        if (updatedRow) {
                            const updatedLog = { ...selectedLog };
                            updatedLog.log_data[selectedRowIndex] = { 
                                ...updatedRow, 
                                row_status: status, 
                                'Production Status': status,
                                rejection_reason: reason 
                            };
                            setSelectedLog(updatedLog);
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
