import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    ArrowLeft,
    Car,
    Package,
    ShieldCheck,
    Activity,
    LayoutGrid,
    Box,
    Layers,
    Download
} from 'lucide-react';
import { getToken } from '../../lib/storage';
import { API_BASE } from '../../lib/apiConfig';
import CustomModal from './components/CustomModal';
import RowEditModal from './components/RowEditModal';


// Simulated Backend Service with real Flask fallback
const fetchBOMForModel = async (modelName: string): Promise<any[]> => {
    try {
        const token = getToken();

        const response = await fetch(`${API_BASE}/manager/master-data?model=${modelName}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) return data;
        }
    } catch (e) {
        console.error("Failed to fetch BOM from backend:", e);
    }

    // No fallback to JSON files anymore - everything must come from SQL
    return [];
};

const ProductionPlanningPage = () => {
    const { demandId } = useParams<{ demandId: string }>();
    const navigate = useNavigate();
    const [demand, setDemand] = useState<any>(null);
    const TRANSIENT_FIELDS = [
        "TOTAL SCHEDULE QTY", "PER DAY", "SAP Stock", "Opening Stock", 
        "Todays Stock", "Coverage Days", "Balance Qty", "Production Status", 
        "Defect Count", "Failure Reason", "Remarks"
    ];

    const [requirements, setRequirements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'all' | 'g-chart'>('all');

    // Custom Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        defaultValue: string;
        type: 'input' | 'confirm' | 'success' | 'error';
        onConfirm: (val: string) => void;
        description?: string;
    }>({
        isOpen: false,
        title: '',
        defaultValue: '',
        type: 'input',
        onConfirm: () => { }
    });

    const [editingRow, setEditingRow] = useState<any>(null);
    const [isRowModalOpen, setIsRowModalOpen] = useState(false);

    const [productionHeaders, setProductionHeaders] = useState<string[]>([]);

    const [materialHeaders, setMaterialHeaders] = useState<string[]>([
        "RM Thk mm", "Sheet Width", "Sheet Length", "No of comp per sheet",
        "RM SIZE", "RM Grade", "Act RM Sizes", "Revised", "VALIDITY"
    ]);

    const [commonHeaders] = useState<string[]>([
        "SN. NO",
        "SAP PART NUMBER",
        "PART NUMBER",
        "PART DESCRIPTION",
        "ASSEMBLY NUMBER"
    ]);

    useEffect(() => {
        const loadData = async () => {
            if (!demandId) return;

            setIsLoading(true);
            try {
                const token = getToken();
                const response = await fetch(`${API_BASE}/admin/demands/${demandId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        const foundDemand = result.data;
                        setDemand(foundDemand);

                        // 1. Fetch Schema (Headers) from Backend
                        try {
                            const schemaRes = await fetch(`${API_BASE}/manager/models/${foundDemand.model_name}/schema`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (schemaRes.ok) {
                                const schemaData = await schemaRes.json();
                                if (schemaData.success && schemaData.data) {
                                    if (schemaData.data.production_headers) setProductionHeaders(schemaData.data.production_headers);
                                }
                            }
                        } catch (e) {
                            console.warn("Could not load schema from backend.");
                        }

                        // 2. Fetch Data Rows
                        const rawData = await fetchBOMForModel(foundDemand.model_name);

                        // Format data with key normalization to match commonHeaders
                        let formatted = rawData.map((item: any, idx) => {
                            const row: any = {
                                id: idx + 1,
                                ...item.production_data,
                                ...item.material_data
                            };

                            if (item.common) {
                                row["SN. NO"] = idx + 1;
                                row["SR NO"] = row["SN. NO"];
                                row["Sr No"] = row["SN. NO"];
                                row["S."] = row["SN. NO"];
                                row["SN NO"] = row["SN. NO"];

                                row["PART NUMBER"] = item.common.part_number;
                                row["Part Number"] = item.common.part_number;

                                row["SAP PART NUMBER"] = item.common.sap_part_number;
                                row["SAP Part Number"] = item.common.sap_part_number;
                                row["SAP PART #"] = item.common.sap_part_number;

                                row["PART DESCRIPTION"] = item.common.description;
                                row["Part Description"] = item.common.description;
                                row["DESCRIPTION"] = item.common.description;

                                row["SALEABLE NO"] = item.common.saleable_no || "";
                                row["ASSEMBLY NUMBER"] = item.common.assembly_number || "";
                            }

                            if (row['SAP Part Number .1'] !== undefined) {
                                row['SAP PART NUMBER'] = row['SAP Part Number .1'];
                            }

                            TRANSIENT_FIELDS.forEach(field => {
                                row[field] = "";
                            });

                            return row;
                        });

                        if (formatted.length === 0) {
                            formatted = [{
                                id: 1,
                                ...commonHeaders.reduce((acc: any, h: any) => ({ ...acc, [h]: "" }), {}),
                                ...productionHeaders.reduce((acc: any, h: any) => ({ ...acc, [h]: "" }), {}),
                                ...materialHeaders.reduce((acc: any, h: any) => ({ ...acc, [h]: "" }), {})
                            }];
                        }

                        // ---- Merge with latest DEO daily log to show filled data ----
                        try {
                            const logsRes = await fetch(`${API_BASE}/supervisor/submissions`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (logsRes.ok) {
                                const logsData = await logsRes.json();
                                const allLogs = logsData.data || [];
                                const latestLog = allLogs
                                    .filter((s: any) => {
                                        const modelIdMatch = s.car_model_id && foundDemand.model_id && Number(s.car_model_id) === Number(foundDemand.model_id);
                                        const nameMatch = s.model_name?.toUpperCase().trim() === foundDemand.model_name?.toUpperCase().trim();
                                        const logDemandId = s.demand_id ? Number(s.demand_id) : null;
                                        const currentDemandId = foundDemand.id ? Number(foundDemand.id) : null;
                                        const demandMatch = currentDemandId ? (logDemandId === currentDemandId) : (!logDemandId);
                                        return (modelIdMatch || nameMatch) && demandMatch;
                                    })
                                    .sort((a: any, b: any) => b.id - a.id)[0];

                                if (latestLog && latestLog.log_data) {
                                    const DEO_EDITABLE_FIELDS = [
                                        "SAP Stock", "Opening Stock", "Todays Stock",
                                        "Balance Qty", "Production Status", 
                                        "Defect Count", "Failure Reason", "Remarks"
                                    ];

                                    formatted = formatted.map((fRow: any) => {
                                        const logRow = latestLog.log_data.find((l: any) =>
                                            l["SAP PART NUMBER"] === fRow["SAP PART NUMBER"] ||
                                            l["SAP PART #"] === fRow["SAP PART NUMBER"] ||
                                            l["Part Number"] === fRow["PART NUMBER"]
                                        );
                                        if (logRow) {
                                            const newFields: any = {};
                                            DEO_EDITABLE_FIELDS.forEach(field => {
                                                if (logRow[field] !== undefined && logRow[field] !== null && logRow[field] !== '') {
                                                    newFields[field] = logRow[field];
                                                }
                                            });
                                            if (logRow['PER DAY']) newFields['PER DAY'] = logRow['PER DAY'];
                                            if (logRow['TOTAL SCHEDULE QTY']) newFields['TOTAL SCHEDULE QTY'] = logRow['TOTAL SCHEDULE QTY'];
                                            if (logRow['Coverage Days']) newFields['Coverage Days'] = logRow['Coverage Days'];
                                            return { ...fRow, ...newFields };
                                        }
                                        return fRow;
                                    });
                                }
                            }
                        } catch (logErr) {
                            console.warn("Could not fetch DEO logs for admin view:", logErr);
                        }

                        if (foundDemand.quantity) {
                            const reqQty = Number(foundDemand.quantity) || 0;
                            let workingDays = 0;
                            if (foundDemand.start_date && foundDemand.end_date) {
                                const start = new Date(foundDemand.start_date);
                                const end = new Date(foundDemand.end_date);
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

                            formatted.forEach((row: any) => {
                                if (!row['PER DAY'] || row['PER DAY'] === '' || row['PER DAY'] === '0') {
                                    row['PER DAY'] = perDay;
                                }
                                if (!row['TOTAL SCHEDULE QTY'] || row['TOTAL SCHEDULE QTY'] === '') {
                                    row['TOTAL SCHEDULE QTY'] = String(reqQty);
                                }
                                const pDay = parseFloat(row['PER DAY']) || 0;
                                const tStock = parseFloat(row['Todays Stock'] || '0') || 0;
                                row['Coverage Days'] = pDay > 0 ? (tStock / pDay).toFixed(1) : '0.0';
                            });
                        }

                        setRequirements(formatted);
                    } else {
                        console.warn(`Demand ${demandId} data missing in response.`);
                        setDemand(null);
                    }
                } else {
                    console.warn(`Demand ${demandId} not found in backend.`);
                    setDemand(null);
                }
            } catch (error) {
                console.error("Failed to load production plan", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [demandId, commonHeaders.length, productionHeaders.length, materialHeaders.length]);
    const handleRowEdit = (row: any) => {
        setEditingRow(row);
        setIsRowModalOpen(true);
    };

    const handleRowSave = async (updatedRow: any) => {
        const sapNum = updatedRow['SAP PART #'] || updatedRow.sap_part_number || updatedRow['SAP PART NUMBER'];

        if (!sapNum) {
            alert("Error: SAP PART NUMBER is required to save this row to the database.");
            return;
        }
        // Auto-calculate RM SIZE logic for row-level save
        const thk = updatedRow['RM Thk mm'] || '';
        const width = updatedRow['Sheet Width'] || '';
        const length = updatedRow['Sheet Length'] || '';

        if (thk || width || length) {
            updatedRow['RM SIZE'] = `${thk}X${width}X${length}`.replace(/XX/g, 'X').replace(/^X|X$/g, '');
        }
        const updatedRequirements = requirements.map(req =>
            req.id === updatedRow.id ? updatedRow : req
        );
        setRequirements(updatedRequirements);

        const coreKeys = ["PART NUMBER", "PART NO", "SAP PART #", "SAP PART NUMBER", "PART DESCRIPTION", "DESCRIPTION", "SALEABLE NO", "ASSEMBLY NUMBER", "MODEL", "id"];
        const production_data: any = {};
        const material_data: any = {};

        // Segregate dynamic fields based on their headers, EXCLUDING transient G-Chart data
        Object.keys(updatedRow).forEach(key => {
            const isTransient = TRANSIENT_FIELDS.includes(key) || TRANSIENT_FIELDS.includes(key.toUpperCase());
            if (!coreKeys.includes(key.toUpperCase()) && !isTransient) {
                // If it's a production header, put it there, otherwise material
                if (productionHeaders.includes(key)) production_data[key] = updatedRow[key];
                else material_data[key] = updatedRow[key];
            }
        });

        setIsSaving(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/manager/master-data/${sapNum}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    common: {
                        model: demand?.model_name,
                        part_number: updatedRow["PART NUMBER"] || updatedRow["Part Number"] || updatedRow["PART NO"],
                        sap_part_number: sapNum,
                        description: updatedRow["PART DESCRIPTION"] || updatedRow["Part Description"] || updatedRow["DESCRIPTION"],
                        assembly_number: updatedRow["ASSEMBLY NUMBER"] || updatedRow["Assembly Number"],
                        saleable_no: updatedRow["SALEABLE NO"] || updatedRow["Saleable No"]
                    },
                    production_data,
                    material_data
                })
            });

            if (!response.ok) throw new Error("Sync failed");

            // Success pop message
            setModalConfig({
                isOpen: true,
                title: 'SUCCESS',
                description: 'Record successfully updated in the master database.',
                defaultValue: '',
                type: 'success',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });

            // Close the edit modal automatically after successful save
            setIsRowModalOpen(false);
            setEditingRow(null);
        } catch (e) {
            console.error("Auto-sync failed", e);
            setModalConfig({
                isOpen: true,
                title: 'SYNC ERROR',
                description: 'Changes saved locally but failed to sync with cloud database. Please check your connection.',
                defaultValue: '',
                type: 'error',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setIsSaving(false);
        }
    };

    const saveModelSchema = async (updatedHeaders: string[], type: 'id' | 'prod' | 'mat') => {
        if (!demand) return;
        const token = getToken();
        const payload: any = {};
        if (type === 'id') payload.identification_headers = updatedHeaders;
        if (type === 'prod') payload.production_headers = updatedHeaders;
        if (type === 'mat') payload.material_headers = updatedHeaders;

        try {
            await fetch(`${API_BASE}/manager/models/${demand.model_name}/schema`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
        } catch (e) { console.error("Failed to save schema:", e); }
    };

    const addRow = () => {
        setModalConfig({
            isOpen: true,
            title: 'ADD COMPONENT',
            description: 'Are you sure you want to add a NEW manual component to this model? You will need to fill in all the details manually.',
            defaultValue: '',
            type: 'confirm',
            onConfirm: () => {
                const nextId = requirements.length > 0 ? Math.max(...requirements.map(r => r.id)) + 1 : 1;
                const newRow: any = {
                    id: nextId,
                    "SN NO": requirements.length + 1,
                    "SR NO": requirements.length + 1,
                    "S.": requirements.length + 1,
                    ...commonHeaders.reduce((acc, h) => ({ ...acc, [h]: "" }), {}),
                    ...productionHeaders.reduce((acc, h) => ({ ...acc, [h]: "" }), {}),
                    ...materialHeaders.reduce((acc, h) => ({ ...acc, [h]: "" }), {}),
                    "row_status": "NEW"
                };

                setRequirements([...requirements, newRow]);
                setModalConfig(prev => ({ ...prev, isOpen: false }));

                // Automatically trigger Edit Modal for the new row
                setEditingRow(newRow);
                setIsRowModalOpen(true);
            }
        });
    };

    const addColumn = (atIndex?: number) => {
        let count = 1;
        let colName = "NEW COLUMN";
        const allHeaders = [...commonHeaders, ...productionHeaders, ...materialHeaders];
        while (allHeaders.includes(colName)) { colName = `NEW COLUMN ${count++}`; }

        let newHeaders = [];

        if (viewMode === 'g-chart') {
            return;
        } else {
            newHeaders = [...materialHeaders];
            if (typeof atIndex === 'number') newHeaders.splice(atIndex, 0, colName);
            else newHeaders.push(colName);
            setMaterialHeaders(newHeaders);
            saveModelSchema(newHeaders, 'mat');
        }

        setRequirements(prev => prev.map(row => ({
            ...row,
            [colName]: ""
        })));
    };

    const renameHeader = (oldName: string) => {
        setModalConfig({
            isOpen: true,
            title: `Rename Column`,
            defaultValue: oldName,
            type: 'input',
            onConfirm: (newName) => {
                if (!newName || newName === oldName) {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    return;
                }
                let newHeaders = [];
                const finalName = newName;
                if (viewMode === 'g-chart') {
                    //
                } else {
                    newHeaders = materialHeaders.map(h => h === oldName ? finalName : h);
                    setMaterialHeaders(newHeaders);
                    saveModelSchema(newHeaders, 'mat');
                }
                setRequirements(prev => prev.map(row => {
                    const newRow = { ...row };
                    newRow[finalName] = row[oldName];
                    delete newRow[oldName];
                    return newRow;
                }));
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const deleteRow = (id: number) => {
        const rowToDelete = requirements.find(r => r.id === id);
        const sapNum = rowToDelete?.['SAP PART #'] || rowToDelete?.sap_part_number || rowToDelete?.['SAP PART NUMBER'];

        setModalConfig({
            isOpen: true,
            title: sapNum ? `Delete Part ${sapNum}?` : 'Delete Unsaved Row?',
            defaultValue: '',
            type: 'confirm',
            onConfirm: async () => {
                setRequirements(prev => prev.filter(req => req.id !== id));
                setModalConfig(prev => ({ ...prev, isOpen: false }));

                if (sapNum) {
                    setIsSaving(true);
                    try {
                        const token = getToken();
                        await fetch(`${API_BASE}/manager/master-data/${sapNum}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    } catch (e) {
                        console.error("Failed to delete from DB");
                    } finally {
                        setIsSaving(false);
                    }
                }
            }
        });
    };

    const deleteColumn = (colName: string) => {
        setModalConfig({
            isOpen: true,
            title: `Delete Column?`,
            defaultValue: '',
            type: 'confirm',
            onConfirm: () => {
                let newHeaders = [];
                if (viewMode === 'g-chart') {
                    //
                } else {
                    newHeaders = materialHeaders.filter(h => h !== colName);
                    setMaterialHeaders(newHeaders);
                    saveModelSchema(newHeaders, 'mat');
                }
                setRequirements(prev => prev.map(row => {
                    const newRow = { ...row };
                    delete newRow[colName];
                    return newRow;
                }));
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const markAsReady = async () => {
        if (!demand || !demand.model_id) return;
        
        setIsSaving(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/manager/car-models/${demand.model_id}/ready`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setModalConfig({
                    isOpen: true,
                    title: 'PLAN SUBMITTED',
                    description: `${demand.model_name} is now marked as READY. It will now appear in the Car Models Assignment section for DEO and Supervisor assignment.`,
                    defaultValue: '',
                    type: 'success',
                    onConfirm: () => {
                        setModalConfig(prev => ({ ...prev, isOpen: false }));
                        navigate('/manager/demand');
                    }
                });
            } else {
                throw new Error("Failed to update status");
            }
        } catch (e) {
            console.error("Failed to mark ready", e);
            setModalConfig({
                isOpen: true,
                title: 'SUBMISSION ERROR',
                description: 'Failed to submit plan for assignment. Please check your connection.',
                defaultValue: '',
                type: 'error',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredRequirements = requirements.filter(req =>
        Object.values(req).some(val =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-ind-bg flex items-center justify-center flex-col gap-4">
                <div className="animate-spin text-ind-primary">
                    <Layers size={40} />
                </div>
                <p className="font-black text-ind-text3 text-xs tracking-widest uppercase animate-pulse">Fetching BOM Data...</p>
            </div>
        );
    }

    if (!demand) {
        return (
            <div className="min-h-screen bg-ind-bg flex items-center justify-center flex-col gap-6 text-center p-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shadow-inner">
                    <Car size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">PLAN NOT FOUND</h2>
                    <p className="text-ind-text2 font-bold text-sm max-w-md mx-auto">
                        This production requirement plan may have been deleted by an administrator or the demand ID is invalid.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/manager/demand')}
                    className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#F37021] transition-all shadow-lg"
                >
                    Return to Demand List
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ind-bg/50 p-6 md:p-8 font-sans w-full max-w-full overflow-x-hidden">
            {/* Unified Production Planning Header - Ultra Compact & Dynamic */}
            <div className="bg-white rounded-2xl border border-ind-border shadow-[0_2px_15px_rgb(0,0,0,0.02)] p-5 mb-5 relative overflow-hidden group">
                {/* Subtle Ghost Background Icon - Minimalist */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.015] pointer-events-none group-hover:opacity-[0.03] transition-opacity duration-1000">
                    <Car size={150} strokeWidth={0.5} />
                </div>

                <div className="relative z-10">
                    {/* Top Row: Navigation, Title & Primary Action */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-7 h-7 rounded-full border border-ind-border/50 flex items-center justify-center text-ind-text3 hover:bg-ind-bg transition-all shadow-sm"
                                >
                                    <ArrowLeft size={12} />
                                </button>
                                <h1 className="text-lg font-black text-ind-text tracking-tight flex items-center gap-2 uppercase">
                                    PRODUCTION REQUIREMENT PLAN
                                    {isSaving ? (
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[8px] font-black rounded-md border border-indigo-100/30 tracking-[0.02em] animate-pulse flex items-center gap-1">
                                            <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" />
                                            SYNCING...
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-orange-50 text-ind-primary text-[8px] font-black rounded-md border border-orange-100/30 tracking-[0.02em]">
                                            LIVE-SYNC ACTIVE
                                        </span>
                                    )}
                                </h1>
                            </div>
                            <p className="text-ind-text3 text-[9px] font-bold uppercase tracking-[0.1em] flex items-center gap-2 pl-10">
                                BREAKDOWN FOR <span className="text-ind-primary">{demand.model_name}</span>
                                <span className="text-slate-200 mx-1">•</span>
                                ORDER: <span className="text-ind-text2 font-extrabold">{demand.formatted_id || `DEM-${demand.id.toString().padStart(3, '0')}`}</span>
                            </p>
                        </div>

                        {/* Submit Action Block */}
                        {demand.status === 'PENDING' && (
                            <div className="flex items-center gap-3">
                                <div className="hidden lg:flex flex-col items-end mr-2">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Planning Phase</span>
                                    <span className="text-[8px] font-bold text-ind-text3 uppercase">Submit to finalize setup</span>
                                </div>
                                <button
                                    onClick={markAsReady}
                                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] border border-emerald-400 hover:bg-emerald-600 hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 active:scale-95 group shadow-lg"
                                >
                                    <ShieldCheck size={14} className="group-hover:scale-110 transition-transform" />
                                    Submit for Assignment
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Middle Row: The 3 Summary Cards - Ultra Condensed */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        {/* 1. Target Production */}
                        <div className="bg-ind-bg/20 rounded-xl border border-ind-border/50 p-3.5 flex flex-col relative overflow-hidden group/card hover:bg-white transition-all">
                            <span className="text-[8px] font-black text-ind-text3 uppercase tracking-widest mb-1.5">Target Production</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-ind-text tracking-tighter">{demand.quantity}</span>
                                <span className="text-[9px] font-black text-ind-text3 uppercase">Vehicles</span>
                            </div>
                            <div className="absolute top-3.5 right-4 text-indigo-500/20">
                                <Box size={14} />
                            </div>
                        </div>

                        {/* 2. Total Parts */}
                        <div className="bg-ind-bg/20 rounded-xl border border-ind-border/50 p-3.5 flex flex-col relative overflow-hidden group/card hover:bg-white transition-all">
                            <span className="text-[8px] font-black text-ind-text3 uppercase tracking-widest mb-1.5">Total Unique Parts</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-ind-text tracking-tighter">{requirements.length}</span>
                                <span className="text-[9px] font-black text-ind-text3 uppercase">Components</span>
                            </div>
                            <div className="absolute top-3.5 right-4 text-emerald-500/20">
                                <Layers size={14} />
                            </div>
                        </div>

                        {/* 3. Total Material Units */}
                        <div className="bg-ind-bg/20 rounded-xl border border-ind-border/50 p-3.5 flex flex-col relative overflow-hidden group/card hover:bg-white transition-all">
                            <span className="text-[8px] font-black text-ind-text3 uppercase tracking-widest mb-1.5">Total Requirements</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-ind-primary tracking-tighter">
                                    {requirements.reduce((sum, req) => {
                                        const val = String(req.required_qty).replace(/,/g, '');
                                        return sum + (parseFloat(val) || 0);
                                    }, 0).toLocaleString()}
                                </span>
                                <span className="text-[9px] font-black text-ind-text3 uppercase">Units</span>
                            </div>
                            <div className="absolute top-3.5 right-4 text-orange-500/20">
                                <Download size={14} />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Ultra Slim Metadata Inline Bar */}
                    <div className="flex items-center gap-6 px-4 py-2 bg-ind-bg/30 rounded-lg border border-ind-border/50/30">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-indigo-400 mr-1" />
                            <span className="text-[7.5px] font-black text-ind-text3 uppercase tracking-widest">Line:</span>
                            <span className="text-[9px] font-black text-ind-text2 uppercase">{demand.line || 'T4 LINE'}</span>
                        </div>
                        <div className="w-px h-2.5 bg-ind-border/50" />
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-emerald-400 mr-1" />
                            <span className="text-[7.5px] font-black text-ind-text3 uppercase tracking-widest">Responsible:</span>
                            <span className="text-[9px] font-black text-ind-text2 uppercase">{demand.manager || 'RAJESH SHARMA'}</span>
                        </div>
                        <div className="w-px h-2.5 bg-ind-border/50" />
                        <div className="flex items-center gap-2">
                            <span className="text-[7.5px] font-black text-ind-text3 uppercase tracking-widest">Customer:</span>
                            <span className="text-[9px] font-black text-ind-text2 uppercase">{demand.customer || 'TATA MOTORS'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl border border-ind-border shadow-sm overflow-hidden flex flex-col h-[700px]">

                {/* Simplified Toolbar - Matching Mockup */}
                <div className="p-4 border-b border-ind-border/50 flex items-center justify-between gap-3 bg-white z-20">
                    <div className="flex items-center gap-2">
                        {/* View Switcher Tabs - Premium Style */}
                        <div className="flex bg-ind-border/30/50 p-1 rounded-full border border-ind-border shadow-inner gap-0.5">
                            <button
                                onClick={() => setViewMode('g-chart')}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all flex items-center gap-2 uppercase ${viewMode === 'g-chart'
                                    ? 'bg-[#F37021] text-white shadow-[0_4px_12px_rgba(243,112,33,0.3)] scale-[1.02]'
                                    : 'text-ind-text3 hover:text-ind-text2 hover:bg-white/50'
                                    }`}
                            >
                                <Activity size={13} strokeWidth={2.5} />
                                G-Chart View
                            </button>
                            <button
                                onClick={() => setViewMode('all')}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all flex items-center gap-2 uppercase ${viewMode === 'all'
                                    ? 'bg-[#F37021] text-white shadow-[0_4px_12px_rgba(243,112,33,0.3)] scale-[1.02]'
                                    : 'text-ind-text3 hover:text-ind-text2 hover:bg-white/50'
                                    }`}
                            >
                                <LayoutGrid size={13} strokeWidth={2.5} />
                                All
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Add Buttons */}
                        <div className="flex bg-ind-bg p-1.5 rounded-2xl border border-ind-border shadow-sm gap-2">
                            <button
                                onClick={() => addRow()}
                                className="h-10 px-5 bg-emerald-500 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.15em] border border-emerald-400 hover:bg-emerald-600 hover:shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 active:scale-95 group"
                            >
                                <Plus size={12} className="group-hover:rotate-90 transition-transform duration-300" /> 
                                Add Component
                            </button>
                            <button
                                onClick={() => addColumn()}
                                className="h-10 px-5 bg-indigo-500 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.15em] border border-indigo-400 hover:bg-indigo-600 hover:shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all flex items-center gap-2 active:scale-95 group"
                            >
                                <Plus size={12} className="group-hover:rotate-180 transition-transform duration-500" /> 
                                Add Field
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative group w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ind-text3 group-focus-within:text-ind-primary transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search by part or SAP #"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-ind-bg border border-ind-border focus:border-ind-primary rounded-xl py-2 pl-10 pr-4 text-ind-text2 font-bold text-xs placeholder:text-ind-text3 outline-none transition-all"
                            />
                        </div>

                    </div>
                </div>


                {/* Main Table Content - Premium Grid Design with Sticky ID */}
                <div className="flex-1 w-full relative bg-white overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto w-full border-b border-ind-border/50 custom-scrollbar bg-ind-bg/20">
                        {filteredRequirements.length > 0 ? (
                            <table className={`w-full min-w-max border-separate border-spacing-0`}>
                                <thead>
                                    {/* GROUP HEADERS ROW */}
                                    {viewMode === 'all' && (
                                        <tr className="bg-white border-b border-ind-border">
                                            {/* Sticky Offset Header (No Index Column) */}
                                            {/* Identification Headers - ALWAYS visible as a reference */}
                                            <th colSpan={viewMode === 'all' ? (commonHeaders.length >= 3 ? 3 : 2) : 1} className="text-[10px] font-black text-ind-text3 uppercase tracking-[0.2em] px-4 text-center py-4 bg-ind-bg/50 border-r border-b border-ind-border sticky left-0 z-[60]">
                                                <div className="flex items-center justify-center gap-2">
                                                    <ShieldCheck size={14} className="text-orange-500" />
                                                    Part Identification
                                                </div>
                                            </th>

                                            {viewMode === 'all' && commonHeaders.length > (commonHeaders.length >= 3 ? 3 : 2) && (
                                                <th key="empty-id-space" colSpan={commonHeaders.length - (commonHeaders.length >= 3 ? 3 : 2)} className="bg-ind-bg/20 border-r border-b border-ind-border"></th>
                                            )}

                                            {/* Production Group Header only in g-chart to avoid dead comparisons */}
                                            {(viewMode === 'all') && (
                                                <th colSpan={materialHeaders.length} className="text-[10px] font-black text-ind-text3 uppercase tracking-[0.2em] px-4 text-center py-4 bg-ind-bg/30 border-b border-ind-border">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Package size={14} className="text-orange-500" />
                                                        RM Sheet Data
                                                    </div>
                                                </th>
                                            )}
                                            <th className="w-12 border-b border-ind-border bg-white"></th>
                                        </tr>
                                    )}

                                    {/* COLUMN TITLES ROW */}
                                    <tr className="sticky top-0 z-50 bg-white">
                                        {/* Sticky Spacer Header (No Index Column) */}
                                        {/* Removed 56px spacer here */}

                                        {/* Reference Columns (First 3 Common Headers: SN. NO, Part Number, SAP Part Number) - Visibility depends on view mode */}
                                        {commonHeaders.slice(0, viewMode === 'all' ? (commonHeaders.length >= 3 ? 3 : 2) : 1).map((h, i) => {
                                            const isSrNo = h.toUpperCase().includes('SN') || h.toUpperCase().includes('SR') || h.toUpperCase() === 'S.';
                                            const width = isSrNo ? '50px' : (h.includes('SAP') ? '240px' : '220px');
                                            let leftOffset = 0;
                                            for (let j = 0; j < i; j++) {
                                                const prevH = commonHeaders[j];
                                                const prevIsSrNo = prevH.toUpperCase().includes('SN') || prevH.toUpperCase().includes('SR') || prevH.toUpperCase() === 'S.';
                                                leftOffset += prevIsSrNo ? 50 : (prevH.includes('SAP') ? 240 : 220);
                                            }

                                            return (
                                                <th
                                                    key={h}
                                                    style={{
                                                        left: `${leftOffset}px`,
                                                        minWidth: width,
                                                        maxWidth: width
                                                    }}
                                                    className={`py-4 px-2 text-[10px] font-black text-ind-text3 uppercase tracking-widest text-left bg-ind-bg border-b border-ind-border sticky z-[50] group/h`}
                                                >
                                                    <div className="flex items-center justify-between gap-2 pl-2">
                                                        <span className="truncate">{h}</span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover/h:opacity-100 transition-opacity whitespace-nowrap">
                                                            <button onClick={() => addColumn(i + 1)} className="p-1 hover:bg-emerald-50 rounded text-emerald-500" title="Add Column After"><Plus size={10} /></button>
                                                            {!isSrNo && <button onClick={() => renameHeader(h)} className="p-1 hover:bg-orange-50 rounded text-orange-500"><Edit size={10} /></button>}
                                                            {!isSrNo && <button onClick={() => deleteColumn(h)} className="p-1 hover:bg-rose-50 rounded text-rose-400"><Trash2 size={10} /></button>}
                                                        </div>
                                                    </div>
                                                </th>
                                            );
                                        })}

                                        {/* Remaining Identification Headers */}
                                        {viewMode === 'all' && commonHeaders.slice((commonHeaders.length >= 3 ? 3 : 2)).map((h) => (
                                            <th
                                                key={h}
                                                style={{ minWidth: (h === 'DESCRIPTION' || h.includes('DESC')) ? '300px' : '180px' }}
                                                className="py-4 px-2 text-[10px] font-black text-ind-text3 uppercase tracking-widest text-left bg-ind-bg border-b border-ind-border group/h"
                                            >
                                                <div className="flex items-center justify-between gap-2 pl-2">
                                                    <span className="truncate">{h}</span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/h:opacity-100 transition-opacity whitespace-nowrap">
                                                        <button onClick={() => addColumn(commonHeaders.indexOf(h) + 1)} className="p-1 hover:bg-emerald-50 rounded text-emerald-500" title="Add Column After"><Plus size={10} /></button>
                                                        <button onClick={() => renameHeader(h)} className="p-1 hover:bg-orange-50 rounded text-orange-500"><Edit size={10} /></button>
                                                        <button onClick={() => deleteColumn(h)} className="p-1 hover:bg-rose-50 rounded text-rose-400"><Trash2 size={10} /></button>
                                                    </div>
                                                </div>
                                            </th>
                                        ))}

                                        {/* Material Headers (RM Sheet columns) */}
                                        {(viewMode === 'all') && materialHeaders.map((h) => (
                                            <th
                                                key={h}
                                                className={`min-w-[130px] py-4 px-2 text-[10px] font-black text-ind-text3 uppercase tracking-widest text-center bg-ind-bg/10 border-b border-ind-border group/h`}
                                            >
                                                <div className="flex items-center justify-between gap-1 overflow-hidden">
                                                    <span className="flex-1 truncate">{h}</span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/h:opacity-100 transition-opacity whitespace-nowrap">
                                                        <button onClick={() => addColumn(materialHeaders.indexOf(h) + 1)} className="p-1 hover:bg-emerald-50 rounded text-emerald-500" title="Add Column After"><Plus size={10} /></button>
                                                        <button onClick={() => renameHeader(h)} className="p-1 hover:bg-white/50 rounded text-orange-500"><Edit size={10} /></button>
                                                        <button onClick={() => deleteColumn(h)} className="p-1 hover:bg-rose-50 rounded text-rose-400"><Trash2 size={10} /></button>
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                        {viewMode === 'g-chart' && (
                                            <>
                                                {['TOTAL SCHEDULE QTY', 'PER DAY', 'SAP Stock', 'Opening Stock', 'Todays Stock', 'Coverage Days'].map((h) => (
                                                    <th
                                                        key={h}
                                                        className="min-w-[80px] py-3 px-2 text-[9px] font-black text-ind-text2 uppercase tracking-wider text-center bg-orange-50/20 border-b border-ind-border border-r"
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </>
                                        )}
                                        <th className="w-12 border-b border-ind-border bg-white"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequirements.map((req, index) => (
                                        <tr key={req.id} className="group hover:bg-ind-bg transition-all duration-200 bg-white border-b border-slate-50">
                                            {/* Sticky Spacer Cell (No Index Column) */}
                                            {/* Removed 56px spacer here */}

                                            {/* Reference Cells (Visibility depends on view mode) */}
                                            {commonHeaders.slice(0, viewMode === 'all' ? (commonHeaders.length >= 3 ? 3 : 2) : 1).map((h, i) => {
                                                const isSrNo = h.toUpperCase() === 'SR NO' || h.toUpperCase() === 'SR. NO.' || h.toUpperCase() === 'S.' || h.toUpperCase() === 'SN NO';
                                                
                                                // Calculate left offset (must match header calculation exactly)
                                                let leftOffset = 0;
                                                for (let j = 0; j < i; j++) {
                                                    const prevH = commonHeaders[j];
                                                    const prevIsSrNo = prevH.toUpperCase() === 'SR NO' || prevH.toUpperCase() === 'SR. NO.' || prevH.toUpperCase() === 'S.' || prevH.toUpperCase() === 'SN NO';
                                                    leftOffset += prevIsSrNo ? 60 : (prevH.includes('SAP') ? 240 : 220);
                                                }
                                                const width = isSrNo ? '60px' : (h.includes('SAP') ? '240px' : '220px');

                                                return (
                                                    <td
                                                        key={h}
                                                        style={{ left: `${leftOffset}px`, minWidth: width, maxWidth: width }}
                                                        className={`p-1.5 align-middle sticky z-[40] bg-white group-hover:bg-ind-bg tracking-tighter`}
                                                    >
                                                        <div className="relative group/idx flex items-center w-full h-full min-h-[44px] cursor-pointer" onClick={() => handleRowEdit(req)}>
                                                            {isSrNo ? (
                                                                <span className="text-[13px] font-black text-slate-800 w-10 flex items-center justify-center transition-all">
                                                                    {index + 1}
                                                                </span>
                                                            ) : (
                                                                <div className="flex-1">
                                                                    <div className={`w-full py-4 px-6 text-[12px] font-black uppercase text-slate-800 bg-white border border-ind-border/50/80 shadow-sm rounded-2xl group-hover/idx:border-ind-primary/30 transition-all`}>
                                                                        {req[h] || '-'}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {isSrNo && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); addRow(); }}
                                                                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/idx:opacity-100 hover:scale-110 transition-all shadow-lg z-[60]"
                                                                    title="Add Row Below"
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}

                                            {/* Remaining Identification Cells */}
                                            {viewMode === 'all' && commonHeaders.slice(3).map((h) => (
                                                <td key={h} className="p-1.5 align-middle cursor-pointer" onClick={() => handleRowEdit(req)}>
                                                    <div className="w-full py-4 px-6 text-[12px] font-black uppercase text-slate-800 bg-white border border-ind-border/50/80 shadow-sm rounded-2xl group-hover:border-ind-primary/30 transition-all">
                                                        {req[h] || '-'}
                                                    </div>
                                                </td>
                                            ))}

                                            {/* Material Data Cells */}
                                            {(viewMode === 'all') && materialHeaders.map((h) => (
                                                <td key={h} className={`p-1.5 align-middle bg-ind-bg/5 border-r border-b border-ind-border/50 last:border-r-0 cursor-pointer hover:bg-orange-50/30`} onClick={() => handleRowEdit(req)}>
                                                    <div className="w-full py-3 px-2 text-[11px] font-bold text-slate-700 text-center min-w-[100px]">
                                                        {req[h] || '-'}
                                                    </div>
                                                </td>
                                            ))}
                                            {viewMode === 'g-chart' && (
                                                <>
                                                    {['TOTAL SCHEDULE QTY', 'PER DAY', 'SAP Stock', 'Opening Stock', 'Todays Stock', 'Coverage Days'].map((h) => {
                                                        const cv = parseFloat(req[h] || '0');
                                                        const isLowCoverage = h === 'Coverage Days' && cv > 0 && cv < 5.0;
                                                        return (
                                                            <td key={h} className={`p-1.5 border-r border-b border-ind-border/50 ${isLowCoverage ? 'bg-red-50' : 'bg-orange-50/10'} text-center min-w-[80px] cursor-pointer`} onClick={() => handleRowEdit(req)}>
                                                                <div className={`text-[11px] font-bold ${isLowCoverage ? 'text-red-600' : 'text-orange-700'}`}>
                                                                    {/* Show data if manually entered, but keep it empty by default (auto-calculation disabled) */}
                                                                    {req[h] || ''}
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
                                                </>
                                            )}
                                            <td className="py-2 px-2 text-center align-middle border-b border-ind-border/50">
                                                <button
                                                    onClick={() => deleteRow(req.id)}
                                                    className="p-2.5 rounded-xl text-ind-text3 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete Row"
                                                >
                                                    <Trash2 size={16} strokeWidth={2.5} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                </tbody>
                            </table>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-32 text-ind-text3 gap-6">
                                <div className="w-20 h-20 bg-white rounded-3xl border border-ind-border flex items-center justify-center shadow-xl shadow-slate-200/50">
                                    <Layers size={32} className="text-slate-200 animate-pulse" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">No Design Data Found</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ind-text3 max-w-xs mx-auto leading-relaxed">
                                        Start your car design by adding the first component row to this model.
                                    </p>
                                </div>
                                <button
                                    onClick={() => addRow()}
                                    className="px-8 py-3 bg-[#0F172A] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                                >
                                    Initialize Design Sheet
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Bar - Professional Float */}
                <div className="bg-[#0F172A] border-t border-white/5 py-2.5 px-6 flex items-center justify-between text-white/50">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Database Live</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">•</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest">Active Components: {requirements.length}</span>
                        </div>
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest">
                        Design Mode v4.0.2
                    </div>
                </div>

                {/* Absolute Floating Sync Status */}
                {isSaving && (
                    <div className="absolute top-20 right-10 z-[70] animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white px-4 py-2.5 rounded-2xl border border-ind-border shadow-2xl flex items-center gap-3">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Syncing Design...</span>
                        </div>
                    </div>
                )}
            </div>

            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={(val) => modalConfig.onConfirm(val)}
                title={modalConfig.title}
                description={modalConfig.description}
                defaultValue={modalConfig.defaultValue}
                type={modalConfig.type}
            />

            <RowEditModal
                isOpen={isRowModalOpen}
                onClose={() => setIsRowModalOpen(false)}
                row={editingRow}
                commonHeaders={commonHeaders}
                productionHeaders={productionHeaders}
                materialHeaders={materialHeaders}
                onSave={handleRowSave}
                onDelete={deleteRow}
            />
        </div>
    );
};

export default ProductionPlanningPage;
