import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    ShieldCheck, 
    AlertCircle, 
    CheckCircle2, 
    MessageSquare,
    Info,
    Target,
    ArrowRight
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface SupervisorRowVerifyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (status: 'VERIFIED' | 'REJECTED', reason?: string) => Promise<void>;
    row: any;
}

export const SupervisorRowVerifyModal: React.FC<SupervisorRowVerifyModalProps> = ({
    isOpen,
    onClose,
    onVerify,
    row
}) => {
    if (!isOpen || !row) return null;

    const isTargetMet = Number(row["Today Produced"] || 0) >= Number(row["Target Qty"] || 0);
    const statusVal = (row["Production Status"] || 'PENDING').trim().toUpperCase();

    const renderDetailField = (label: string, value: any, icon?: any, colorClass: string = "text-slate-900") => (
        <div className="space-y-2 flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                {icon && React.createElement(icon, { size: 10 })}
                {label}
            </label>
            <div className={cn(
                "w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-black text-sm shadow-sm",
                colorClass
            )}>
                {value || '—'}
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-6">
                            <div className={cn(
                                "w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl",
                                row.row_status === 'VERIFIED' ? "bg-emerald-500" : row.row_status === 'REJECTED' ? "bg-rose-500" : "bg-slate-900"
                            )}>
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                    Row Verification Details
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    Reviewing S.: {row.id} &bull; SAP: <span className="text-[#F37021]">{row["SAP PART NUMBER"] || row["SAP PART #"]}</span>
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {renderDetailField("Part Number", row["PART NUMBER"] || row["Part Number"], Info)}
                            {renderDetailField("Part Description", row["PART DESCRIPTION"] || "Component Detail Not Specified", Info, "italic text-slate-500 font-bold")}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {renderDetailField("Target Qty", row["Target Qty"], Target)}
                            {renderDetailField("Today Produced", row["Today Produced"], CheckCircle2, "text-[#F37021]")}
                            {renderDetailField("Remain Qty", row["Remain Qty"] || row["Balance Qty"] || "0", Info)}
                            <div className="space-y-2 flex-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Production Status</label>
                                <div className={cn(
                                    "w-full border-2 rounded-2xl py-4 px-6 font-black text-sm text-center uppercase tracking-widest",
                                    statusVal === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                                    statusVal === 'IN_PROGRESS' || statusVal === 'IN PROGRESS' ? "bg-orange-50 text-[#F37021] border-orange-100" : 
                                    "bg-slate-50 text-slate-500 border-slate-200"
                                )}>
                                    {statusVal}
                                </div>
                            </div>
                        </div>

                        {/* DEO Remarks */}
                        <div className="space-y-4 pt-6 border-t border-slate-50">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <MessageSquare size={12} className="text-[#F37021]" />
                                DEO Submission Remarks
                            </h4>
                            <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-8 min-h-[120px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <MessageSquare size={80} />
                                </div>
                                <p className="text-sm font-bold text-slate-600 italic relative z-10 leading-relaxed">
                                    {row.Remarks || "No additional remarks provided by the operator for this entry."}
                                </p>
                            </div>
                        </div>

                        {/* Supervisor Action Message */}
                        {row.row_status === 'REJECTED' && (
                            <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                                <AlertCircle className="text-rose-500 mt-1" size={20} />
                                <div>
                                    <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Rejection Reason (Internal)</h5>
                                    <p className="text-xs font-bold text-rose-500 italic">{row.rejection_reason || "Marked as invalid by supervisor."}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center gap-4 sticky bottom-0 z-10">
                        <button
                            onClick={onClose}
                            className="flex-1 py-5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm"
                        >
                            Close Details
                        </button>
                        
                        {row.row_status !== 'VERIFIED' && (
                            <>
                                <button
                                    onClick={() => onVerify('REJECTED')}
                                    className="flex-1 py-5 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <X size={18} strokeWidth={3} />
                                    Reject Entry
                                </button>
                                <button
                                    onClick={() => onVerify('VERIFIED')}
                                    className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <CheckCircle2 size={18} />
                                    Authorize & Verify
                                    <ArrowRight size={16} />
                                </button>
                            </>
                        )}

                        {row.row_status === 'VERIFIED' && (
                            <div className="flex-[3] py-5 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-100 flex items-center justify-center gap-3 shadow-inner">
                                <ShieldCheck size={20} />
                                This entry was verified and authorized
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
