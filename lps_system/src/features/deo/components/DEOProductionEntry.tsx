import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Database, ClipboardCheck, Target, ChevronDown,
    AlertTriangle, X, CheckCircle2, MessageSquare,
    Activity, Layers, Clock, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface AssignedModel {
    id: number;
    name: string;
    model_code: string;
    line_name: string;
    customer_name: string;
    deo_accepted: boolean;
    supervisor_comment?: string;
}

interface DEOProductionEntryProps {
    assignedModels: AssignedModel[];
    selectedModelId: number | null;
    setSelectedModelId: (id: number | null) => void;
    requirements: any[];
    demand: any; // Define a proper type for demand if possible
    handleCellEdit: (rowId: number, edits: string | Record<string, any>, value?: any) => void;
    handleSubmitDailyLog: () => void;
    isSubmitting: boolean;
    onEditingChange: (isEditing: boolean) => void;
}

export const DEOProductionEntry: React.FC<DEOProductionEntryProps> = ({
    assignedModels,
    selectedModelId,
    setSelectedModelId,
    requirements,
    demand,
    handleCellEdit,
    handleSubmitDailyLog,
    isSubmitting,
    onEditingChange
}) => {
    const [editingPart, setEditingPart] = React.useState<any>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const syncTimeoutRef = useRef<any>(null);

    // Sync editing state with parent
    useEffect(() => {
        onEditingChange(!!editingPart);
    }, [editingPart, onEditingChange]);

    // Validation for final submission (Updated: Now only requires stock data as Produced is removed)
    const isFormValid = useMemo(() => {
        if (!requirements || requirements.length === 0) return false;
        return requirements.every(req => {
            const stockVal = req["Todays Stock"];
            // Allow 0 (zero), but reject undefined, null, or empty strings
            return stockVal !== undefined && stockVal !== null && String(stockVal).trim() !== "";
        });
    }, [requirements]);

    // Identification columns (Updated: Dynamic "ASSEMBLY NUMBER" based on data)
    const displayColumns = useMemo(() => {
        const hasAssemblyData = requirements.some(r => r["ASSEMBLY NUMBER"] && String(r["ASSEMBLY NUMBER"]).trim() !== "");

        const cols = ["SN. NO", "SAP PART NUMBER", "PART NUMBER", "PART DESCRIPTION"];
        if (hasAssemblyData) {
            cols.push("ASSEMBLY NUMBER");
        }
        cols.push("PER DAY", "SAP Stock", "Opening Stock", "Todays Stock", "Coverage Days");
        return cols;
    }, [requirements]);

    const vModel = assignedModels.find(m => m.id === selectedModelId);

    // Force-flush all edits in the modal to the API immediately (called on SAVE & DISMISS)
    const forceSaveAndDismiss = useCallback(async () => {
        if (!editingPart) {
            setEditingPart(null);
            return;
        }
        setIsSaving(true);
        // Cancel any pending debounced sync first
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        const realId = editingPart._real_id;
        console.log(`[FORCE SAVE] Sending immediate sync for row: ${editingPart.id} (Real ID: ${realId})`);

        const payload: Record<string, any> = {
            car_model_id: selectedModelId,
            demand_id: demand?.id,
            "SAP Stock": editingPart["SAP Stock"],
            "Opening Stock": editingPart["Opening Stock"],
            "Todays Stock": editingPart["Todays Stock"],
            "Production Status": editingPart["Production Status"] || "PENDING",
            "deo_reply": editingPart["deo_reply"] || "",
            "row_status": null,
            "supervisor_reviewed": false,
            // Pass real_entry_id so backend uses Mode A (direct PK lookup)
            ...(realId ? { real_entry_id: realId } : {}),
        };

        try {
            const { getToken } = await import('../../../lib/storage');
            const { API_BASE } = await import('../../../lib/apiConfig');
            const token = getToken();
            const res = await fetch(`${API_BASE}/deo/sync/${editingPart.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                console.log(`[FORCE SAVE SUCCESS] Row: ${editingPart.id}`);
            } else {
                console.error('[FORCE SAVE FAILED]', await res.text());
            }
        } catch (err) {
            console.error('Force-save error:', err);
        } finally {
            setIsSaving(false);
            setEditingPart(null);
        }
    }, [editingPart, selectedModelId, demand?.id]);

    if (!vModel) {
        return (
            <div className="bg-white rounded-[4rem] p-24 text-center border border-ind-border/50 shadow-sm">
                <ClipboardCheck size={48} className="text-slate-200 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Select a Model to Start Entry</h3>
            </div>
        );
    }


    const lowCoverageCount = requirements.filter(r => {
        const cov = parseFloat(r['Coverage Days'] || '0');
        return cov > 0 && cov < 5;
    }).length;

    const todayDate = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });

    return (
        <div className="space-y-6">
            {/* Professional Header Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] border border-ind-border/50 p-6 shadow-[0_15px_40px_-12px_rgba(0,0,0,0.04)] space-y-6 overflow-hidden relative"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-ind-primary shadow-sm">
                            <ClipboardCheck size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-0.5">
                                <h1 className="text-xl font-black text-ind-text uppercase tracking-tight">
                                    {vModel.name} <span className="text-ind-text3 font-bold">DAILY LOG</span>
                                </h1>
                                <span className={cn(
                                    "px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-widest border border-emerald-100 flex items-center gap-2",
                                    vModel.deo_accepted ? "bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-500/10" : "bg-white text-ind-text3"
                                )}>
                                    <div className={cn("w-1 h-1 rounded-full", vModel.deo_accepted ? "bg-emerald-500" : "bg-slate-300 animate-pulse")} />
                                    {vModel.deo_accepted ? "REFERRED TO REVIEW" : "LIVE-SYNC ACTIVE"}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest">
                                Breakdown for <span className="text-ind-primary">{vModel.name}</span> <span className="mx-2">•</span> ORDER ID: <span className="text-ind-text font-black">{demand?.formatted_id || `DEM-${demand?.id?.toString().padStart(3, '0') || '000'}`}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-ind-bg p-1.5 rounded-2xl border border-ind-border/50 shadow-inner">
                            <div className="px-4 py-1 border-r border-ind-border">
                                <span className="block text-[7px] font-black text-ind-text3 uppercase tracking-widest mb-0.5 leading-none">TARGET MODEL</span>
                                <select
                                    value={selectedModelId || ''}
                                    onChange={(e) => setSelectedModelId(Number(e.target.value))}
                                    className="bg-transparent border-none p-0 text-xs font-black text-ind-text focus:ring-0 uppercase tracking-tight cursor-pointer hover:text-orange-600 transition-colors"
                                >
                                    {assignedModels.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="px-4 py-1">
                                <span className="block text-[7px] font-black text-ind-text3 uppercase tracking-widest mb-0.5 leading-none">LINE ROUTING</span>
                                <div className="flex items-center gap-1.5">
                                    <Activity size={10} className="text-orange-500" />
                                    <span className="text-xs font-black text-ind-text uppercase tracking-tight">{vModel.line_name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Stats Card 1 */}
                    <div className="bg-ind-bg/50 rounded-2xl p-4 border border-ind-border/50/50 flex justify-between items-center group hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-500">
                        <div>
                            <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest block mb-1 px-1">TARGET PRODUCTION</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-ind-text tracking-tighter">{demand?.quantity || 10}</span>
                                <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">VEHICLES</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-400 group-hover:bg-blue-50 transition-colors">
                            <Target size={20} />
                        </div>
                    </div>

                    {/* Stats Card 2 */}
                    <div className="bg-ind-bg/50 rounded-2xl p-4 border border-ind-border/50/50 flex justify-between items-center group hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-500">
                        <div>
                            <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest block mb-1 px-1">TOTAL UNIQUE PARTS</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-ind-text tracking-tighter">{requirements.length}</span>
                                <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">COMPONENTS</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-400 group-hover:bg-emerald-50 transition-colors">
                            <Layers size={20} />
                        </div>
                    </div>

                    {/* Stats Card 3 */}
                    <div className="bg-ind-bg/50 rounded-2xl p-4 border border-ind-border/50/50 flex justify-between items-center group hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-500">
                        <div>
                            <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest block mb-1 px-1">LOW COVERAGE</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-rose-500 tracking-tighter">{lowCoverageCount}</span>
                                <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">UNITS</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-400 group-hover:bg-rose-50 transition-colors">
                            <Activity size={20} />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                            <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">
                                LINE: <span className="text-ind-text px-1">{vModel.line_name}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">
                                RESPONSIBLE: <span className="text-ind-text px-1">DEO / SUPERVISOR</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">
                                CUSTOMER: <span className="text-ind-text px-1">{vModel.customer_name}</span>
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-ind-text3">
                        <Clock size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            SUBMISSION DATE: <span className="text-ind-text px-1">{todayDate}</span>
                        </span>
                    </div>
                </div>
            </motion.div>


            {/* Pop Form Modal */}
            <AnimatePresence>
                {editingPart && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-5xl max-h-[92vh] rounded-[2rem] shadow-2xl overflow-hidden border border-ind-border/50 flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#F37021] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#F37021]/20">
                                        <Database size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-ind-text uppercase tracking-tight leading-tight">Edit Production Data</h2>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditingPart(null)}
                                    className="w-8 h-8 bg-ind-bg hover:bg-ind-border/30 rounded-full flex items-center justify-center text-ind-text3 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-8 py-5 flex-1 overflow-y-auto space-y-5 custom-scrollbar bg-white">
                                <div className="grid grid-cols-12 gap-x-5 gap-y-4 font-bold uppercase tracking-tight">
                                    {vModel.supervisor_comment && (
                                        <div className="col-span-12 mb-4 p-5 bg-rose-50 border-2 border-rose-100 rounded-[2rem] flex items-start gap-5 shadow-sm shadow-rose-900/5 transition-all hover:bg-rose-100/50">
                                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-md flex-shrink-0 animate-bounce">
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div className="space-y-1.5 py-1">
                                                <h4 className="text-[11px] font-black text-rose-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    Global Supervisor Feedback
                                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                                </h4>
                                                <p className="text-[14px] font-black text-rose-800 tracking-tight leading-snug italic">
                                                    "{vModel.supervisor_comment}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rejection Note Alert */}
                                    {editingPart.row_status === 'REJECTED' && (
                                        <div className="col-span-12 bg-red-50 border-2 border-red-100 rounded-[1.5rem] p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                <CheckCircle2 size={24} className="text-emerald-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xs font-black text-red-900 uppercase tracking-tight mb-0.5">Row Rejected by Supervisor</h3>
                                                <p className="text-[10px] font-bold text-red-700 leading-relaxed italic">
                                                    "{editingPart.rejection_reason || 'Data requires correction before it can be verified.'}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-span-12 grid grid-cols-12 gap-4">
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1 text-center">SN</label>
                                            <div className="bg-[#F37021]/5 border border-ind-primary/10 rounded-xl px-4 py-2.5 text-sm font-black text-ind-primary flex items-center justify-center shadow-sm h-[40px]">
                                                {editingPart.tableIndex}
                                            </div>
                                        </div>
                                        <div className="col-span-5 space-y-1.5">
                                            <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1">Sap part number</label>
                                            <div className="bg-ind-bg border border-ind-border/50 rounded-xl px-4 py-2.5 text-sm font-black text-ind-text break-all min-h-[40px] flex items-center shadow-sm">
                                                {editingPart["SAP PART NUMBER"] ?? editingPart["SAP PART #"] ?? editingPart["SAP Part Number"] ?? "—"}
                                            </div>
                                        </div>
                                        <div className="col-span-5 space-y-1.5">
                                            <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1">Part number</label>
                                            <div className="bg-ind-bg border border-ind-border/50 rounded-xl px-4 py-2.5 text-sm font-black text-ind-text break-all min-h-[40px] flex items-center shadow-sm">
                                                {editingPart["PART NUMBER"] ?? editingPart["Part Number"] ?? "—"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-12 space-y-1.5">
                                        <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1">Part description</label>
                                        <div className="bg-ind-bg border border-ind-border/50 rounded-xl px-4 py-2.5 text-sm font-black text-ind-text min-h-[40px] flex items-center shadow-sm leading-tight">
                                            {editingPart["PART DESCRIPTION"] ?? editingPart["Description"] ?? "—"}
                                        </div>
                                    </div>

                                    {editingPart["ASSEMBLY NUMBER"] && (
                                        <div className="col-span-12 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1 text-ind-primary">Assembly number</label>
                                            <div className="bg-orange-50/30 border border-orange-100 rounded-xl px-4 py-3 text-sm font-black text-ind-text flex items-center shadow-sm">
                                                {editingPart["ASSEMBLY NUMBER"]}
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-span-12 grid grid-cols-4 gap-4 pt-1">
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1">Per day</label>
                                            <div className="bg-ind-bg border border-ind-border/50 rounded-xl px-4 py-2.5 text-sm font-black text-ind-text flex items-center shadow-sm h-[48px] justify-center">
                                                {editingPart["PER DAY"] || "0"}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1">Sap stock</label>
                                            <input
                                                type="number"
                                                value={editingPart["SAP Stock"] ?? ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEditingPart((prev: any) => ({ ...prev, "SAP Stock": val, row_status: null }));
                                                    handleCellEdit(editingPart.id, "SAP Stock", val);
                                                }}
                                                className="w-full bg-white border-2 border-ind-border/50 focus:border-ind-primary rounded-xl p-3 text-center text-sm font-black text-ind-text transition-all outline-none shadow-sm h-[48px]"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1">Opening stock</label>
                                            <input
                                                type="number"
                                                value={editingPart["Opening Stock"] ?? ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEditingPart((prev: any) => ({ ...prev, "Opening Stock": val, row_status: null }));
                                                    handleCellEdit(editingPart.id, "Opening Stock", val);
                                                }}
                                                className="w-full bg-white border-2 border-ind-border/50 focus:border-ind-primary rounded-xl p-3 text-center text-sm font-black text-ind-text transition-all outline-none shadow-sm h-[48px]"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1">Todays stock</label>
                                            <input
                                                type="number"
                                                value={editingPart["Todays Stock"] ?? ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const perDay = parseFloat(editingPart["PER DAY"] || "0");
                                                    const stockValue = parseFloat(val || "0");
                                                    const calculatedCoverage = perDay > 0 ? (stockValue / perDay).toFixed(1) : "0.0";

                                                    setEditingPart((prev: any) => ({
                                                        ...prev,
                                                        "Todays Stock": val,
                                                        "Coverage Days": calculatedCoverage,
                                                        row_status: null
                                                    }));
                                                    handleCellEdit(editingPart.id, {
                                                        "Todays Stock": val,
                                                        "Coverage Days": calculatedCoverage
                                                    });
                                                }}
                                                className="w-full bg-white border-2 border-ind-border/50 focus:border-ind-primary rounded-xl p-3 text-center text-sm font-black text-ind-text transition-all outline-none shadow-sm h-[48px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-12 grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1">Coverage days</label>
                                            <div className="bg-ind-bg border border-ind-border/50 rounded-xl px-4 py-2.5 text-[11px] font-black text-ind-text flex justify-center items-center shadow-inner h-[48px]">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-lg text-xs",
                                                    parseFloat(editingPart["Coverage Days"] || "0") < 5 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                                                )}>
                                                    {editingPart["Coverage Days"] || "0.0"} DAYS
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1">Status tracking</label>
                                            <div className="relative">
                                                <select
                                                    value={editingPart["Production Status"] || "PENDING"}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setEditingPart((prev: any) => ({ ...prev, "Production Status": val, row_status: null }));
                                                        handleCellEdit(editingPart.id, "Production Status", val);
                                                    }}
                                                    className={cn(
                                                        "w-full h-[48px] rounded-xl px-4 text-xs font-black uppercase tracking-widest transition-all border-2 outline-none appearance-none cursor-pointer",
                                                        (editingPart["Production Status"] || 'PENDING') === 'COMPLETED'
                                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                            : (editingPart["Production Status"] || 'PENDING') === 'IN PROGRESS'
                                                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                                                : "bg-ind-bg border-ind-border text-ind-text2"
                                                    )}
                                                >
                                                    <option value="PENDING">PENDING</option>
                                                    <option value="IN PROGRESS">IN PROGRESS</option>
                                                    <option value="COMPLETED">COMPLETED</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ind-text3">
                                                    <ChevronDown size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="col-span-12 mt-2 pt-5 border-t border-ind-border/50">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-[#F37021]/10 flex items-center justify-center">
                                                <MessageSquare size={16} className="text-ind-primary" />
                                            </div>
                                            <h3 className="text-[11px] font-black text-ind-text uppercase tracking-widest">Correction Loop</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-[11px] font-black text-ind-text3 uppercase tracking-widest px-1 flex items-center gap-2">
                                                    <AlertTriangle size={12} className="text-red-500" />
                                                    Issue Remark
                                                </label>
                                                <div className={cn(
                                                    "w-full rounded-2xl p-4 text-xs font-bold leading-relaxed min-h-[80px]",
                                                    editingPart.row_status === 'REJECTED'
                                                        ? "bg-red-50 text-red-800 border border-red-100 shadow-inner"
                                                        : "bg-ind-bg text-ind-text3 border border-ind-border/50 italic"
                                                )}>
                                                    {editingPart.rejection_reason || "No reported issues."}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[11px] font-black text-ind-primary uppercase tracking-widest px-1 flex items-center gap-2">
                                                    <CheckCircle2 size={16} />
                                                    Action Taken
                                                </label>
                                                <textarea
                                                    value={editingPart.deo_reply || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setEditingPart((prev: any) => ({
                                                            ...prev,
                                                            deo_reply: val,
                                                            row_status: null
                                                        }));
                                                        handleCellEdit(editingPart.id, { deo_reply: val });
                                                    }}
                                                    placeholder="Briefly describe what was fixed..."
                                                    rows={3}
                                                    className="w-full bg-white border border-ind-primary/10 focus:border-ind-primary rounded-2xl p-4 text-sm font-bold text-ind-text placeholder:text-ind-text3 outline-none transition-all resize-none shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 py-5 border-t border-slate-50 bg-ind-bg/50 shrink-0">
                                <button
                                    onClick={forceSaveAndDismiss}
                                    disabled={isSaving}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-3"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            SAVING...
                                        </>
                                    ) : (
                                        'SAVE & DISMISS VIEW'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >

            < div className="bg-white rounded-[2.5rem] border border-ind-border/50 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-[700px] relative" >
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {requirements.length > 0 ? (
                        <table className="min-w-max border-separate border-spacing-0 w-full">
                            <thead>
                                <tr className="sticky top-0 z-30 bg-ind-bg/50 backdrop-blur-md">
                                    {displayColumns.map((h, i) => {
                                        const isSticky = i < 2;
                                        let leftOffset = 0;
                                        if (i === 1) leftOffset = 80;

                                        const labelMap: Record<string, string> = {
                                            "SN. NO": "Sn",
                                            "SAP PART NUMBER": "Sap part number",
                                            "PART NUMBER": "Part number",
                                            "PART DESCRIPTION": "Part description",
                                            "ASSEMBLY NUMBER": "Assembly number",
                                            "PER DAY": "Per day",
                                            "SAP Stock": "Sap stock",
                                            "Opening Stock": "Opening stock",
                                            "Todays Stock": "Todays stock",
                                            "Coverage Days": "Coverage days"
                                        };

                                        return (
                                            <th key={h}
                                                style={{ left: isSticky ? `${leftOffset}px` : 'auto' }}
                                                className={cn(
                                                    "py-4 px-4 text-[9px] font-black text-ind-text3 tracking-[0.2em] text-center border-b border-ind-border/50 z-40 bg-ind-bg/50",
                                                    isSticky ? 'sticky shadow-[2px_0_10px_rgba(0,0,0,0.05)] border-r border-ind-border/50' : '',
                                                    h === "SN. NO" ? "min-w-[80px]" :
                                                        h === "SAP PART NUMBER" ? "min-w-[220px]" :
                                                            h === "PART DESCRIPTION" ? "min-w-[300px] text-left" :
                                                                h === "ASSEMBLY NUMBER" ? "min-w-[200px]" : "min-w-[150px]"
                                                )}>
                                                {labelMap[h] || h}
                                            </th>
                                        )
                                    })}
                                    <th className="py-4 px-4 text-[9px] font-black text-ind-text3 tracking-[0.2em] text-center border-b border-ind-border/50 bg-ind-bg/50 sticky right-0 z-40">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {requirements.map((req, idx) => {
                                    return (
                                        <motion.tr
                                            key={req.id || idx}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            onClick={() => setEditingPart({ ...req, tableIndex: idx + 1 })}
                                            className="group hover:bg-ind-bg transition-all cursor-pointer"
                                        >
                                            {displayColumns.map((h, i) => {
                                                const isSticky = i < 2;
                                                let leftOffset = 0;
                                                if (i === 1) leftOffset = 80;

                                                const val = req[h] ?? "0";
                                                const isCode = h === "SAP PART NUMBER" || h === "PART NUMBER" || h === "PART DESCRIPTION" || h === "ASSEMBLY NUMBER";
                                                const isStat = h === "PER DAY" || h === "SAP Stock" || h === "Opening Stock" || h === "Todays Stock" || h === "Coverage Days";

                                                return (
                                                    <td
                                                        key={h}
                                                        style={{ left: isSticky ? `${leftOffset}px` : 'auto' }}
                                                        className={cn(
                                                            "p-2 border-b border-slate-50 transition-colors bg-white group-hover:bg-ind-bg",
                                                            isSticky ? "sticky z-10 shadow-[2px_0_10px_rgba(0,0,0,0.05)] border-r border-slate-50" : ""
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-full rounded-2xl p-4 flex items-center justify-center border border-ind-border/50 shadow-sm transition-all bg-white min-h-[60px]",
                                                            h === "PART DESCRIPTION" ? "justify-start text-left px-6 min-w-[300px]" :
                                                                h === "ASSEMBLY NUMBER" ? "min-w-[200px]" :
                                                                    h === "SAP PART NUMBER" ? "min-w-[220px]" :
                                                                        h === "PART NUMBER" ? "min-w-[200px]" : "min-w-[100px]"
                                                        )}>
                                                            {h === "SN. NO" ? (
                                                                <span className="text-sm font-black text-ind-text">{idx + 1}</span>
                                                            ) : isCode ? (
                                                                <span className={cn(
                                                                    "text-[10px] font-black uppercase tracking-tight text-ind-text",
                                                                    (h === "PART DESCRIPTION" || h === "ASSEMBLY NUMBER") ? "text-left leading-[1.4]" : "text-center leading-tight"
                                                                )}>
                                                                    {val}
                                                                </span>
                                                            ) : isStat ? (
                                                                <span className={cn(
                                                                    "text-sm font-black transition-colors",
                                                                    h === "Coverage Days" && parseFloat(val) < 5
                                                                        ? "text-rose-500 underline decoration-rose-200"
                                                                        : "text-ind-text"
                                                                )}>
                                                                    {val}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-bold text-ind-text2">{val}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            {/* PRODUCTION STATUS Column */}
                                            <td className="p-2 border-b border-slate-50 sticky right-0 z-20 bg-white group-hover:bg-ind-bg">
                                                <div className="flex justify-center items-center h-[60px]">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <div className={cn(
                                                            "px-4 py-1.5 rounded-xl text-[11px] font-black text-center min-w-[95px] shadow-sm transition-all duration-300 transform group-hover:scale-105",
                                                            req["Production Status"] === "VERIFIED"
                                                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                                                : req["Production Status"] === "REJECTED"
                                                                    ? "bg-red-500 text-white shadow-md shadow-red-200"
                                                                    : req["Production Status"] === "COMPLETED"
                                                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                                                        : (req["Production Status"] === "IN_PROGRESS" || req["Production Status"] === "IN PROGRESS")
                                                                            ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                                                                            : "bg-slate-100 text-slate-500"
                                                        )}>
                                                            {req["Production Status"] === "VERIFIED"
                                                                ? "Verified"
                                                                : req["Production Status"] === "REJECTED"
                                                                    ? "Rejected"
                                                                    : req["Production Status"] === "COMPLETED"
                                                                        ? "Not verified"
                                                                        : (req["Production Status"] === "IN_PROGRESS" || req["Production Status"] === "IN PROGRESS") 
                                                                            ? "In progress" 
                                                                            : "Pending"}
                                                        </div>
                                                        {req["Production Status"] === "REJECTED" && (
                                                            <span className="text-[9px] font-black text-red-500 animate-pulse tracking-tight mt-1">Re-entry required</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-32 text-center">
                            <Database size={56} className="text-slate-100 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-ind-text3 uppercase tracking-tight">No Components Found</h3>
                        </div>
                    )}
                </div>

                {/* Fixed Footer with Submission Button - Synchronized with Header */}
                <div className="p-8 bg-ind-bg border-t border-ind-border/50 flex justify-end items-center gap-8 relative z-50">
                    {!isFormValid && (
                        <div className="flex items-center gap-3 text-ind-text3 font-bold text-[10px] uppercase tracking-widest animate-pulse">
                            <AlertTriangle size={14} />
                            Please fill all stock data to finalize
                        </div>
                    )}
                    <button
                        onClick={handleSubmitDailyLog}
                        disabled={isSubmitting || !isFormValid}
                        className={cn(
                            "px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-4 z-20 hover:-translate-y-1 active:translate-y-0",
                            vModel.deo_accepted
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20"
                                : "bg-slate-900 text-white hover:bg-black shadow-slate-900/30 disabled:opacity-20 disabled:cursor-not-allowed border-2 border-white/5"
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                SUBMITTING...
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={20} className={cn(isFormValid ? "text-emerald-400" : "text-ind-text2")} />
                                <span>FINALIZE & UPDATE SUBMISSION</span>
                            </>
                        )}
                    </button>
                </div>
            </div >
        </div >
    );
};
