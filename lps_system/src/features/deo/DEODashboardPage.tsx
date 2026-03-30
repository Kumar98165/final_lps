import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box
} from 'lucide-react';
import { API_BASE } from '../../lib/apiConfig';
import { getToken } from '../../lib/storage';
import {
    DEO_DASHBOARD,
    DEO_MODELS,
    DEO_ENTRY,
    DEO_REPORTS,
    DEO_VERIFY,
    DEO_NOTIFICATIONS
} from '../../config/routePaths';
import { CustomModal, RejectionModal } from './components/DEOModals';
import { DEOModelList } from './components/DEOModelList';
import { DEOProductionEntry } from './components/DEOProductionEntry';
import { DEOSubmissionHistory } from './components/DEOSubmissionHistory';
import { DEOStats } from './components/DEOStats';

interface AssignedModel {
    id: number;
    name: string;
    model_code: string;
    line_name: string;
    customer_name: string;
    deo_accepted: boolean;
    is_submitted_today?: boolean;
    status?: string;
    supervisor_name?: string;
    supervisor_email?: string;
    manager_name?: string;
    manager_email?: string;
    customer_email?: string;
    target_quantity?: number;
    verified_at?: string;
    supervisor_comment?: string;
    planned_qty?: number;
    actual_qty?: number;
}

const DEODashboardPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [assignedModels, setAssignedModels] = useState<AssignedModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
    const [isEditingPart, setIsEditingPart] = useState(false);
    const [modelFilter, setModelFilter] = useState<'ALL' | 'NEW' | 'ACCEPTED' | 'READY' | 'REJECTED'>('ALL');
    const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);

    const entryModels = useMemo(() =>
        assignedModels.filter(m => 
            // In entry, only show accepted models that are NOT yet finished
            m.deo_accepted && 
            m.status?.toUpperCase() !== 'COMPLETED' && 
            m.status?.toUpperCase() !== 'VERIFIED'
        ),
        [assignedModels]
    );

    const verifyModels = useMemo(() =>
        assignedModels.filter(m => {
            const isCompleted = m.status?.toUpperCase() === 'COMPLETED' || m.status?.toUpperCase() === 'VERIFIED';
            if (!isCompleted) return false;
            
            // For completed models, don't show them if they are rejected in history
            const hasRejected = submissionHistory.some(s =>
                (s.car_model_id === m.id || s.model_name === m.name) && s.status === 'REJECTED'
            );
            return !hasRejected;
        }),
        [assignedModels, submissionHistory]
    );

    // BOM Table State
    const [requirements, setRequirements] = useState<any[]>([]);
    const [demand, setDemand] = useState<any>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [selectedHistoryLog, setSelectedHistoryLog] = useState<any>(null);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message?: string;
        defaultValue: string;
        type: 'input' | 'confirm' | 'alert';
        onConfirm: (val: string) => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        defaultValue: '',
        type: 'input',
        onConfirm: () => { }
    });
    const [rejectionModalData, setRejectionModalData] = useState<{ part: string; reason: string } | null>(null);
    
    // Sync management: Debounce and sequence control
    const syncTimeoutRef = useRef<any>(null);
    const lastSyncTimeRef = useRef<number>(0);

    const handleCellEdit = useCallback(async (rowId: number, colKeyOrEdits: string | Record<string, any>, value?: any) => {
        const edits = typeof colKeyOrEdits === 'string' ? { [colKeyOrEdits]: value } : colKeyOrEdits;
        
        let finalEdits = { ...edits };

        // 1. Update local state first for immediate feedback
        setRequirements(prev => {
            return prev.map(req => {
                if (req.id === rowId) {
                    const tempReq = { ...req, ...edits };
                    
                    // Derived: Coverage Days
                    if (edits['Todays Stock'] !== undefined || edits['PER DAY'] !== undefined) {
                        const today = parseFloat(tempReq['Todays Stock'] || '0') || 0;
                        const pDay = parseFloat(tempReq['PER DAY'] || '0') || 0;
                        const coverage = pDay > 0 ? (today / pDay).toFixed(1) : '0.0';
                        finalEdits['Coverage Days'] = coverage;
                        tempReq['Coverage Days'] = coverage;
                    }

                    // Derived: Remain Qty & Status
                    if (edits['Today Produced'] !== undefined || edits['Target Qty'] !== undefined) {
                        const target = parseFloat(tempReq['Target Qty'] || '0') || 0;
                        const produced = parseFloat(tempReq['Today Produced'] || '0') || 0;
                        const remain = Math.max(0, target - produced).toString();
                        
                        finalEdits['Remain Qty'] = remain;
                        tempReq['Remain Qty'] = remain;

                        if (produced >= target && target > 0) {
                            finalEdits['Production Status'] = 'COMPLETE';
                            tempReq['Production Status'] = 'COMPLETE';
                        } else if (produced > 0) {
                            finalEdits['Production Status'] = 'IN PROGRESS';
                            tempReq['Production Status'] = 'IN PROGRESS';
                        }
                    }

                    // Reset audit flags on any edit
                    finalEdits['row_status'] = null;
                    finalEdits['supervisor_reviewed'] = false;
                    tempReq.row_status = null;
                    tempReq.supervisor_reviewed = false;

                    return tempReq;
                }
                return req;
            });
        });

        // 2. Sync with backend (Debounced)
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = setTimeout(async () => {
            const syncId = Date.now();
            lastSyncTimeRef.current = syncId;

            try {
                const token = getToken();
                const res = await fetch(`${API_BASE}/deo/sync/${rowId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        ...finalEdits,
                        car_model_id: selectedModelId,
                        demand_id: demand?.id
                    })
                });

                // Ignore this response if a newer sync has already started
                if (lastSyncTimeRef.current !== syncId) return;

                if (!res.ok) {
                    console.error('Failed to sync cell update');
                }
            } catch (error) {
                console.error('Sync error:', error);
            }
        }, 500); // 500ms debounce
    }, [selectedModelId, demand?.id]);

    const handleHistoryRowUpdate = async (logId: number, rowIndex: number, colKey: string, value: string) => {
        if (!selectedHistoryLog) return;
        const updatedLogData = [...selectedHistoryLog.log_data];
        const updatedRow = { ...updatedLogData[rowIndex], [colKey]: value };
        updatedLogData[rowIndex] = updatedRow;
        setSelectedHistoryLog({ ...selectedHistoryLog, log_data: updatedLogData });
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/deo/update-history-row`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ log_id: logId, row_index: rowIndex, updated_row_data: { [colKey]: value } })
            });
            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    const historyRes = await fetch(`${API_BASE}/deo/history`, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (historyRes.ok) {
                        const historyData = await historyRes.json();
                        setSubmissionHistory(historyData.data || []);
                        const currentLog = historyData.data.find((l: any) => l.id === logId);
                        if (currentLog) setSelectedHistoryLog(currentLog);
                    }
                }
            }
        } catch (e) { console.error("Failed to update history row:", e); }
    };

    const isSubmittedToday = useMemo(() => {
        const selectedModel = assignedModels.find(m => m.id === selectedModelId);
        if (selectedModel && selectedModel.is_submitted_today) return true;
        if (!selectedModelId || !submissionHistory.length) return false;
        if (!selectedModel) return false;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        return submissionHistory.some(s => {
            const sDate = s.date ? s.date.split('T')[0] : '';
            const idMatch = s.car_model_id && selectedModelId && Number(s.car_model_id) === Number(selectedModelId);
            const nameMatch = s.model_name?.toUpperCase().trim() === selectedModel.name.toUpperCase().trim();
            const dateMatch = sDate === todayStr || sDate === localTodayStr;
            const logDemandId = s.demand_id ? Number(s.demand_id) : null;
            const currentDemandId = demand?.id ? Number(demand.id) : null;
            const demandMatch = currentDemandId ? (logDemandId === currentDemandId) : (!logDemandId);
            return (idMatch || nameMatch) && dateMatch && demandMatch && (s.status === 'PENDING' || s.status === 'VERIFIED' || s.status === 'SUBMITTED');
        });
    }, [selectedModelId, submissionHistory, assignedModels, demand]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitDailyLog = async () => {
        const entryModel = assignedModels.find(m => m.id === selectedModelId);
        if (!entryModel) return;

        if (isSubmittedToday) {
            setModalConfig({
                isOpen: true,
                title: 'Already Submitted',
                message: `A daily log for ${entryModel.name} has already been submitted today and is awaiting review.`,
                type: 'alert',
                defaultValue: '',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        setModalConfig({
            isOpen: true,
            title: 'Submit Daily Log?',
            message: `Are you sure you want to submit the Daily Production Log for ${entryModel.name}?\n\nThis will be sent to your supervisor for review.`,
            type: 'confirm',
            defaultValue: '',
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                setIsSubmitting(true);
                try {
                    const token = getToken();
                    const response = await fetch(`${API_BASE}/deo/submit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            model_name: entryModel.name,
                            car_model_id: entryModel.id,
                            demand_id: demand?.id,
                            log_data: requirements,
                            is_final: true
                        })
                    });
                    if (response.ok) {
                        setModalConfig({
                            isOpen: true,
                            title: 'Success',
                            message: 'Daily Progress Logged and Sent to Supervisor for Review!',
                            type: 'alert',
                            defaultValue: '',
                            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                        });
                        const [workRes, historyRes] = await Promise.all([
                            fetch(`${API_BASE}/deo/assigned-work`, { headers: { 'Authorization': `Bearer ${token}` } }),
                            fetch(`${API_BASE}/deo/history`, { headers: { 'Authorization': `Bearer ${token}` } })
                        ]);
                        if (workRes.ok) {
                            const workData = await workRes.json();
                            if (workData.success) setAssignedModels(workData.data);
                        }
                        if (historyRes.ok) {
                            const historyData = await historyRes.json();
                            setSubmissionHistory(historyData.data || []);
                        }
                    } else {
                        const errorData = await response.json();
                        setModalConfig({
                            isOpen: true,
                            title: 'Submission Failed',
                            message: `Failed to submit: ${errorData.message || 'Unknown error'}`,
                            type: 'alert',
                            defaultValue: '',
                            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                } catch (error) {
                    console.error('Submission error:', error);
                    setModalConfig({
                        isOpen: true,
                        title: 'Error',
                        message: 'An error occurred during submission.',
                        type: 'alert',
                        defaultValue: '',
                        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                    });
                } finally { setIsSubmitting(false); }
            }
        });
    };


    const activeTab = useMemo(() => {
        const path = location.pathname;
        if (path === DEO_MODELS) return 'MODELS';
        if (path === DEO_ENTRY) return 'ENTRY';
        if (path === DEO_REPORTS) return 'REPORTS';
        if (path === DEO_VERIFY) return 'VERIFY';
        if (path === DEO_NOTIFICATIONS) return 'NOTIFICATIONS';
        return 'DASHBOARD';
    }, [location.pathname]);

    const setActiveTab = (tab: string) => {
        switch (tab) {
            case 'MODELS': navigate(DEO_MODELS); break;
            case 'ENTRY': navigate(DEO_ENTRY); break;
            case 'REPORTS': navigate(DEO_REPORTS); break;
            case 'VERIFY': navigate(DEO_VERIFY); break;
            case 'NOTIFICATIONS': navigate(DEO_NOTIFICATIONS); break;
            default: navigate(DEO_DASHBOARD); break;
        }
    };

    useEffect(() => {
        let currentModels = assignedModels;
        if (activeTab === 'ENTRY') currentModels = entryModels;
        if (activeTab === 'VERIFY') currentModels = verifyModels;

        const isSelectedValid = currentModels.some(m => m.id === selectedModelId);
        if (!isSelectedValid) {
            if (currentModels.length > 0) {
                const firstAccepted = currentModels.find(m => m.deo_accepted);
                setSelectedModelId(firstAccepted ? firstAccepted.id : currentModels[0].id);
            } else {
                setSelectedModelId(null);
            }
        }
    }, [assignedModels, entryModels, verifyModels, activeTab, selectedModelId]);

    const fetchDashboardData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const token = getToken();
            const [workRes, statusRes, historyRes] = await Promise.all([
                fetch(`${API_BASE}/deo/assigned-work`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/deo/daily-status`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/deo/history`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (workRes.ok) {
                const result = await workRes.json();
                if (result.success) setAssignedModels(result.data);
            }
            if (statusRes.ok) {
                // consume the response
                await statusRes.json();
            }
            if (historyRes.ok) {
                const result = await historyRes.json();
                if (result.success) setSubmissionHistory(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const fetchBOM = async (silent = false) => {
        const targetId = selectedModelId || (assignedModels.length > 0 ? assignedModels[0].id : null);
        if (!targetId) return;
        const selectedModel = assignedModels.find(m => m.id === targetId);
        if (!selectedModel) return;

        if (!silent) setIsLoading(true);
        try {
            const token = getToken();
            const [demandRes, schemaRes, bomRes, histRes] = await Promise.all([
                fetch(`${API_BASE}/admin/demands`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/manager/models/${selectedModel.name}/schema`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/manager/master-data?model=${selectedModel.name}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/deo/history`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            let modelDemand: any = null;
            if (demandRes.ok) {
                const result = await demandRes.json();
                const demands = result.data || [];
                modelDemand = demands.find((d: any) => d.model_name === selectedModel.name && d.status !== 'COMPLETED') ||
                    demands.find((d: any) => d.model_name === selectedModel.name);
                if (modelDemand) setDemand(modelDemand);
            }

            if (schemaRes.ok) {
                const schemaData = await schemaRes.json();
                if (schemaData.success && schemaData.data) {
                    // Intentionally left blank or handle schema info as needed
                }
            }

            if (bomRes.ok) {
                const rawData = await bomRes.json();
                const freshHistory = histRes.ok ? (await histRes.json()).data || [] : [];
                setSubmissionHistory(freshHistory);

                // *** CRITICAL: If user is actively editing, do NOT overwrite requirements ***
                // We'll trust the user's manual edits for now

                const formatted = rawData.map((item: any, idx: number) => {
                    const row: any = {
                        id: 10000 + idx,
                        ...item.production_data,
                        ...item.material_data,
                        "SN NO": item.production_data?.["SN NO"] || item.production_data?.["SR NO"] || (idx + 1),
                        "PART NUMBER": item.common?.part_number,
                        "SAP PART NUMBER": item.common?.sap_part_number,
                        "PART DESCRIPTION": item.common?.description,
                        "ASSEMBLY NUMBER": item.common?.assembly_number || "",
                        "Target Qty": "0",
                        "Today Produced": "",
                        "Remain Qty": "0",
                        "Balance Qty": "0",
                        "Production Status": "PENDING",
                        "SAP Stock": "",
                        "Opening Stock": "",
                        "Todays Stock": "",
                        "TOTAL SCHEDULE QTY": "",
                        "PER DAY": "",
                        "Coverage Days": "0.0"
                    };
                    return row;
                });


                // Merge with latest saved log data to restore DEO-entered values
                const latestLog = freshHistory
                    .filter((s: any) => {
                        const idMatch = s.car_model_id && selectedModel.id && Number(s.car_model_id) === Number(selectedModel.id);
                        const nameMatch = s.model_name?.toUpperCase().trim() === selectedModel.name.toUpperCase().trim();
                        const logDemandId = s.demand_id ? Number(s.demand_id) : null;
                        const currentDemandId = modelDemand?.id ? Number(modelDemand.id) : null;
                        const demandMatch = currentDemandId ? (logDemandId === currentDemandId) : (!logDemandId);
                        return (idMatch || nameMatch) && demandMatch;
                    })
                    .sort((a: any, b: any) => b.id - a.id)[0];

                // Determine if we should restore "today's" session data or start fresh
                // If the latest log is already APPROVED/VERIFIED, it's likely from a previous session/day
                const isNewSession = latestLog && (latestLog.status === 'APPROVED' || latestLog.status === 'VERIFIED' || latestLog.status === 'COMPLETED');

                // Fields that DEO actually types in
                const DATA_FIELDS = ["SAP Stock", "Opening Stock", "Todays Stock", "Balance Qty", "Defect Count", "Failure Reason", "Remarks", "PER DAY"];
                const RESET_FIELDS = ["Today Produced", "Remain Qty", "Production Status", "row_status", "rejection_reason", "supervisor_reviewed", "deo_reply"];

                let finalData = formatted;

                if (latestLog && latestLog.log_data) {
                    finalData = formatted.map((fRow: any) => {
                        const hRow = latestLog.log_data.find((l: any) =>
                            l["SAP PART NUMBER"] === fRow["SAP PART NUMBER"] ||
                            l["SAP PART #"] === fRow["SAP PART NUMBER"] ||
                            l["Part Number"] === fRow["PART NUMBER"]
                        );
                        if (hRow) {
                            const newFields: any = {};
                            
                            // 1. Always restore static data fields (Stock counts etc.)
                            DATA_FIELDS.forEach(field => {
                                if (hRow[field] !== undefined && hRow[field] !== null && hRow[field] !== '') {
                                    newFields[field] = hRow[field];
                                }
                            });

                            // 2. Only restore status/production fields if NOT a new session (e.g. editing a DRAFT or REJECTED log)
                            if (!isNewSession) {
                                RESET_FIELDS.forEach(field => {
                                    if (hRow[field] !== undefined && hRow[field] !== null && hRow[field] !== '') {
                                        newFields[field] = hRow[field];
                                    }
                                });
                            }

                            return { ...fRow, ...newFields };
                        }
                        return fRow;
                    });
                }

                // ALWAYS apply demand calculations LAST so they can never be overwritten
                if (modelDemand) {
                    const reqQty = Number(modelDemand.quantity) || 0;
                    let workingDays = 0;
                    if (modelDemand.start_date && modelDemand.end_date) {
                        const start = new Date(modelDemand.start_date);
                        const end = new Date(modelDemand.end_date);
                        if (start <= end) {
                            const current = new Date(start);
                            while (current <= end) {
                                if (current.getDay() !== 0) workingDays++;
                                current.setDate(current.getDate() + 1);
                            }
                        }
                    }
                    if (workingDays === 0) workingDays = 25;
                    const perDay = reqQty > 0 ? (reqQty / workingDays).toFixed(2) : '0';

                    finalData.forEach((row: any) => {
                        row['TOTAL SCHEDULE QTY'] = reqQty;
                        row['PER DAY'] = perDay;
                        // Recalculate Coverage Days: Todays Stock / Per Day
                        const pDay = parseFloat(perDay) || 0;
                        const tStock = parseFloat(row['Todays Stock'] || '0') || 0;
                        row['Coverage Days'] = pDay > 0 ? (tStock / pDay).toFixed(1) : '0.0';
                    });
                }

                setRequirements(finalData);
            }
        } catch (error) {
            console.error('Failed to fetch BOM data:', error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    // Initial data fetch - only once
    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Background polling for dashboard data - pauses during editing
    useEffect(() => {
        const interval = setInterval(() => {
            if (!modalConfig.isOpen && !isEditingPart) {
                fetchDashboardData(true);
            }
        }, 20000);
        return () => clearInterval(interval);
    }, [modalConfig.isOpen, isEditingPart]);

    // Fetch BOM when model or tab changes — NOT on isEditing change
    useEffect(() => {
        if (activeTab === 'ENTRY' || activeTab === 'VERIFY') {
            fetchBOM();
        }
    }, [selectedModelId, activeTab, assignedModels.length]);

    // Background BOM polling - pauses during editing, separate from initial fetch
    useEffect(() => {
        if (activeTab !== 'ENTRY' && activeTab !== 'VERIFY') return;
        const interval = setInterval(() => {
            if (!modalConfig.isOpen && !isEditingPart) {
                fetchBOM(true);
            }
        }, 45000); // 45 seconds
        return () => clearInterval(interval);
    }, [activeTab, selectedModelId, modalConfig.isOpen, isEditingPart]);

    useEffect(() => {
        if (activeTab === 'REPORTS') {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const token = getToken();
                    const res = await fetch(`${API_BASE}/deo/history`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const result = await res.json();
                        if (result.success) setSubmissionHistory(result.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch submission history:', error);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [activeTab]);

    const handleAccept = async (id: number) => {
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/deo/accept-assignment/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setAssignedModels(prev => prev.map(m => m.id === id ? { ...m, deo_accepted: true, status: 'IN_PROGRESS' } : m));
                setSelectedModelId(id);
                setActiveTab('ENTRY');
            }
        } catch (e) { console.error(e); }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse" />
                    ))}
                </div>
            );
        }

        switch (activeTab) {
            case 'DASHBOARD':
                return (
                    <div className="space-y-8">
                        <DEOStats
                            assignedModels={assignedModels}
                            submissionHistory={submissionHistory}
                            selectedModelId={selectedModelId}
                            setActiveTab={setActiveTab}
                        />
                    </div>
                );

            case 'MODELS':
                return (
                    <DEOModelList
                        assignedModels={assignedModels}
                        submissionHistory={submissionHistory}
                        modelFilter={modelFilter}
                        setModelFilter={setModelFilter}
                        selectedModelId={selectedModelId}
                        setSelectedModelId={setSelectedModelId}
                        setActiveTab={setActiveTab}
                        handleAccept={handleAccept}
                    />
                );

            case 'ENTRY':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        {entryModels.length > 0 ? (
                            <>
                                <DEOProductionEntry
                                    assignedModels={entryModels}
                                    selectedModelId={selectedModelId}
                                    setSelectedModelId={setSelectedModelId}
                                    requirements={requirements}
                                    demand={demand}
                                    handleCellEdit={handleCellEdit}
                                    handleSubmitDailyLog={handleSubmitDailyLog}
                                    isSubmitting={isSubmitting}
                                    onEditingChange={setIsEditingPart}
                                />
                            </>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-[700px] relative">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                    <Box size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No Active Work Assignments</h3>
                                <p className="text-slate-500 font-bold max-w-xs mx-auto text-sm uppercase">You have currently completed all assigned models.</p>
                            </div>
                        )}
                    </motion.div>
                );

            case 'REPORTS':
                return (
                    <DEOSubmissionHistory
                        isLoadingHistory={isLoadingHistory}
                        submissionHistory={submissionHistory}
                        selectedHistoryLog={selectedHistoryLog}
                        setSelectedHistoryLog={setSelectedHistoryLog}
                        handleHistoryRowUpdate={handleHistoryRowUpdate}
                    />
                );

            case 'VERIFY':
                const vModel = assignedModels.find(m => m.id === selectedModelId);
                if (!vModel) return null;
                return (
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 pb-8">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Model:</span>
                            <select
                                value={selectedModelId || ''}
                                onChange={(e) => setSelectedModelId(Number(e.target.value))}
                                className="bg-white border-2 border-slate-100 rounded-2xl px-8 py-4 text-xs font-black uppercase tracking-widest"
                            >
                                {verifyModels.map(model => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                            <h1 className="text-xl font-black uppercase tracking-tight mb-4">{vModel.name} VERIFIED DATA</h1>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Part No</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Today Produced</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requirements.map(req => (
                                            <tr key={req.id} className="border-b border-slate-100">
                                                <td className="p-4 text-xs font-bold">{req["PART NUMBER"]}</td>
                                                <td className="p-4 text-xs">{req["PART DESCRIPTION"]}</td>
                                                <td className="p-4 text-xs font-black">{req["Todays Stock"]}</td>
                                                <td className="p-4 text-xs font-black">{req["Today Produced"]}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                defaultValue={modalConfig.defaultValue}
                type={modalConfig.type}
            />

            <RejectionModal
                data={rejectionModalData}
                onClose={() => setRejectionModalData(null)}
            />
        </div>
    );
};

export default DEODashboardPage;
