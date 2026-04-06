import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Edit2, 
    Shield, 
    AlertCircle, 
    CheckCircle2,
    Activity
} from 'lucide-react';

interface DEORowManualModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedRow: any) => void;
    row: any;
    isSupervisor?: boolean;
    onVerify?: (status: 'VERIFIED' | 'REJECTED', reason?: string, updatedRow?: any) => Promise<void>;
}

const DEORowManualModal: React.FC<DEORowManualModalProps> = ({
    isOpen,
    onClose,
    onSave,
    row,
    isSupervisor = false,
    onVerify
}) => {
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        if (isOpen && row) {
            setFormData({ ...row });
        }
    }, [isOpen, row]);

    if (!isOpen || !formData) return null;

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => {
            const newData = { ...prev, [key]: value };

            // Auto-calculate RM SIZE if dimensions are edited
            if (['RM Thk mm', 'Sheet Width', 'Sheet Length'].includes(key)) {
                const thk = key === 'RM Thk mm' ? value : (prev['RM Thk mm'] || '');
                const width = key === 'Sheet Width' ? value : (prev['Sheet Width'] || '');
                const length = key === 'Sheet Length' ? value : (prev['Sheet Length'] || '');

                if (thk || width || length) {
                    newData['RM SIZE'] = `${thk}X${width}X${length}`.replace(/XX/g, 'X').replace(/^X|X$/g, '');
                }
            }

            // Auto-calculate Coverage Days
            if (['Todays Stock', 'Target Qty', 'PER DAY'].includes(key)) {
                const stockValue = parseFloat(key === 'Todays Stock' ? value : (prev['Todays Stock'] || '0'));
                const perDay = parseFloat(key === 'Target Qty' || key === 'PER DAY' ? value : (prev['PER DAY'] || prev['Target Qty'] || '0'));
                
                if (perDay > 0) {
                    newData['Coverage Days'] = (stockValue / perDay).toFixed(1);
                } else {
                    newData['Coverage Days'] = "0.0";
                }
            }

            return newData;
        });
    };


    const renderReadOnlyField = (label: string, value: any, showErrorBadge: boolean = false) => (
        <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-wider">
                    {label}
                </label>
                {showErrorBadge && (
                    <div className="flex items-center gap-1 bg-[#EDF2F7] px-2 py-0.5 rounded-full border border-[#E2E8F0]">
                        <AlertCircle size={10} className="text-[#718096]" />
                        <span className="text-[8px] font-black text-[#718096] uppercase italic">Data Error</span>
                    </div>
                )}
            </div>
            <div className="w-full bg-[#F7FAFC] border border-[#EDF2F7] rounded-[1.5rem] py-4 px-6 text-[#718096] font-extrabold text-sm shadow-sm">
                {value || '—'}
            </div>
        </div>
    );

    const renderInputField = (label: string, key: string, placeholder: string = "", type: string = "text", isFocused: boolean = false) => (
        <div className="space-y-2 flex-1">
            <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-wider px-1">
                {label}
            </label>
            <input
                type={type}
                value={formData[key] ?? ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                disabled={isSupervisor}
                className={`w-full bg-white border-2 ${isFocused ? 'border-ind-primary ring-4 ring-[#F37021]/5' : 'border-[#F1F5F9]'} ${isSupervisor ? 'bg-ind-bg cursor-not-allowed opacity-75 border-ind-border' : ''} rounded-[1.5rem] py-4 px-6 text-[#1A202C] font-black text-sm outline-none transition-all placeholder:text-[#CBD5E0] shadow-sm`}
            />
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#1A202C]/40 backdrop-blur-[2px]"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-6xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-[#F1F5F9] flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-[#0F172A] rounded-full flex items-center justify-center text-white shadow-xl">
                                <Edit2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight">
                                    {isSupervisor ? 'Verification Detail View' : 'Component Detailed View'}
                                </h3>
                                <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] mt-1">
                                    Viewing Specific S.: {formData.id || row.id}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 bg-ind-bg hover:bg-[#F1F5F9] rounded-full flex items-center justify-center text-[#94A3B8] transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar flex-1 bg-white">
                        {/* Section 1: Entry Details */}
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-6 py-2.5 rounded-full shadow-lg">
                                <Shield size={14} className="text-ind-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Entry Details</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {renderReadOnlyField("S.", formData.id || row.id)}
                                {renderReadOnlyField("SAP Part Number", formData["SAP PART NUMBER"] || formData["SAP PART #"])}
                                {renderReadOnlyField("Part Number", formData["PART NUMBER"])}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {renderReadOnlyField("Part Description", formData["PART DESCRIPTION"])}
                                {renderReadOnlyField("Assembly Number", formData["ASSEMBLY NUMBER"] || "—")}
                                {renderInputField("Target Qty", "Target Qty", "0", "number", true)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {renderInputField("Todays Stock", "Todays Stock", "Enter stock...", "number")}
                                <div className="space-y-2 flex-1">
                                    <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-wider px-1">
                                        Production Status
                                    </label>
                                    <select
                                        value={formData["Production Status"] || "PENDING"}
                                        onChange={(e) => handleChange("Production Status", e.target.value)}
                                        disabled={isSupervisor}
                                        className={`w-full bg-white border-2 border-[#F1F5F9] rounded-[1.5rem] py-4 px-6 text-[#1A202C] font-black text-sm outline-none transition-all shadow-sm ${isSupervisor ? 'bg-ind-bg cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                                    >
                                        <option value="PENDING">PENDING</option>
                                        <option value="IN_PROGRESS">IN PROGRESS</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2 flex-1">
                                    <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-wider px-1">
                                        Coverage Days
                                    </label>
                                    <div className={`w-full rounded-[1.5rem] py-4 px-6 font-black text-sm shadow-sm flex items-center justify-between ${
                                        Number(formData["Coverage Days"] || 0) < 5 ? "bg-red-50 border-2 border-red-100 text-red-600" : "bg-emerald-50 border-2 border-emerald-100 text-emerald-600"
                                    }`}>
                                        <span>{formData["Coverage Days"] || "0.0"} DAYS</span>
                                        {Number(formData["Coverage Days"] || 0) < 5 && (
                                            <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-[8px] animate-pulse">
                                                <AlertCircle size={10} />
                                                <span>LOW STOCK</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 flex-1 opacity-0 pointer-events-none md:block hidden" />
                            </div>
                        </div>

                        {/* Supervisor Rejection Message (If Any) */}
                        {formData.row_status === 'REJECTED' && (
                            <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-[2rem] flex items-start gap-6 animate-pulse">
                                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/20">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Supervisor Rejection Reason</h5>
                                    <p className="text-sm font-black text-rose-500 italic uppercase">
                                        {formData.rejection_reason || "Marked as invalid. Please check your production entry and re-submit."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Section 2: Remarks (Always visible for technical reporting) */}
                        <div className="space-y-6 pt-10 border-t border-[#F1F5F9]">
                            <div className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-6 py-2.5 rounded-full shadow-lg">
                                <Edit2 size={14} className="text-ind-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">DEO Remarks / Issue Report</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-extrabold text-[#A0AEC0] uppercase tracking-wider px-1 flex items-center gap-2">
                                        <Activity size={12} className="text-ind-text3" /> DEO Production Remarks
                                    </label>
                                    {isSupervisor ? (
                                        <div className="w-full bg-ind-bg border-2 border-ind-border/50 rounded-[2rem] p-6 text-sm font-bold text-ind-text2 min-h-[140px] shadow-inner italic">
                                            {formData["Remarks"] || 'No remarks provided by DEO.'}
                                        </div>
                                    ) : (
                                        <textarea
                                            value={formData["Remarks"] || ''}
                                            onChange={(e) => handleChange("Remarks", e.target.value)}
                                            placeholder="Describe any production issue or remark here..."
                                            className="w-full bg-white border-2 border-ind-border focus:border-ind-primary rounded-[2rem] p-6 text-sm font-bold text-slate-800 outline-none transition-all min-h-[140px] resize-none shadow-sm"
                                        />
                                    )}
                                </div>


                                {isSupervisor && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-extrabold text-ind-primary uppercase tracking-wider px-1 flex items-center gap-2">
                                            <Shield size={12} /> Supervisor Review Comments
                                        </label>
                                        <textarea
                                            value={formData.rejection_reason || ''}
                                            onChange={(e) => handleChange("rejection_reason", e.target.value)}
                                            placeholder="Add your review feedback or rejection reason here..."
                                            className="w-full bg-white border-2 border-ind-border focus:border-ind-primary rounded-[2rem] p-6 text-sm font-bold text-slate-800 outline-none transition-all min-h-[140px] resize-none shadow-sm"
                                        />
                                    </div>
                                )}
                                
                                {!isSupervisor && formData.rejection_reason && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider px-1 flex items-center gap-2">
                                            <AlertCircle size={12} /> Supervisor Rejection Feedback
                                        </label>
                                        <div className="w-full bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-6 text-sm font-bold text-rose-700 min-h-[140px] shadow-inner">
                                            {formData.rejection_reason}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-white border-t border-[#F1F5F9] flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-5 bg-white border-2 border-[#EDF2F7] text-[#718096] rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-[#F7FAFC] transition-colors"
                        >
                            {isSupervisor ? 'Close Details' : 'Cancel Operation'}
                        </button>
                        
                        {!isSupervisor ? (
                            <button
                                onClick={() => onSave(formData)}
                                className="flex-[2] py-5 bg-[#F37021] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#F37021]/20 hover:bg-[#E66010] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                <CheckCircle2 size={18} />
                                Save & Sync to Table
                            </button>
                        ) : (
                            <>
                                {formData.row_status !== 'VERIFIED' && (
                                    <>
                                        <button
                                            onClick={() => onVerify?.('REJECTED', '', formData)}
                                            className="flex-1 py-5 bg-rose-50 border-2 border-rose-100 text-rose-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            <X size={18} strokeWidth={3} />
                                            Reject Entry
                                        </button>
                                        <button
                                            onClick={() => onVerify?.('VERIFIED', '', formData)}
                                            className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            <CheckCircle2 size={18} />
                                            Authorize & Verify
                                        </button>
                                    </>
                                )}
                                {formData.row_status === 'VERIFIED' && (
                                    <div className="flex-[3] py-5 bg-emerald-50 text-emerald-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest border border-emerald-100 flex items-center justify-center gap-3 shadow-inner">
                                        <Shield size={20} />
                                        This entry is verified
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DEORowManualModal;
