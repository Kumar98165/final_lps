import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ShieldCheck,
    CheckCircle2,
    Database,
    ChevronDown,
    MessageSquare,
    AlertCircle,
    Send
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
    const [comment, setComment] = React.useState('');
    const [isRejecting, setIsRejecting] = React.useState(false);

    if (!isOpen || !row) return null;

    const sn = row.index !== undefined ? row.index + 1 : 1;

    const prodStatus = row['Production Status'];
    const status = prodStatus === 'VERIFIED' 
        ? 'VERIFIED' 
        : prodStatus === 'REJECTED' 
            ? 'REJECTED' 
            : prodStatus === 'COMPLETED'
                ? 'COMPLETED'
                : (prodStatus === 'IN PROGRESS' || prodStatus === 'IN_PROGRESS')
                    ? 'IN PROGRESS'
                    : 'PENDING';
        
    const statusColor =
        status === 'VERIFIED' || status === 'COMPLETED'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
            : status === 'REJECTED'
                ? 'bg-rose-50 border-rose-100 text-rose-600'
                : status === 'IN PROGRESS'
                    ? 'bg-amber-50 border-amber-100 text-amber-700'
                    : 'bg-white border-[#EDF2F7] text-[#1A202C]';

    // ── Reusable read-only field ──
    const Field = ({ label, value, center = false }: { label: string; value: any; center?: boolean }) => (
        <div className="space-y-2 flex-1">
            <label className="text-[11px] font-bold text-[#A0AEC0] tracking-wide block px-1">
                {label}
            </label>
            <div className={`w-full bg-[#F7FAFC] border border-[#EDF2F7] rounded-[1.5rem] py-4 px-6 text-[#718096] font-extrabold text-sm shadow-sm ${center ? 'text-center' : ''}`}>
                {value || '—'}
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#1A202C]/40 backdrop-blur-[2px]"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-[#F1F5F9] flex items-center justify-between bg-white">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-[#F37021] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#F37021]/20">
                                <Database size={26} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">
                                    Verification detail view
                                </h3>
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
                    <div className="p-10 pt-4 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">

                        {/* Section 1: Entry Details */}
                        <div className="space-y-6">
                            {(status === 'VERIFIED' || status === 'REJECTED') && (
                                <div className={`px-6 py-4 rounded-2xl flex items-center justify-center gap-3 border ${
                                    status === 'VERIFIED' 
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                        : 'bg-rose-50 border-rose-100 text-rose-600'
                                } shadow-inner animate-in slide-in-from-top-2`}>
                                    {status === 'VERIFIED' ? <ShieldCheck size={20} /> : <X size={20} />}
                                    <span className="font-bold tracking-wider uppercase text-xs">
                                        This entry is currently {status.toLowerCase()}
                                    </span>
                                </div>
                            )}
                            
                            {/* Row 1: SN · SAP Part Number · Part Number */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2 flex-1">
                                    <label className="text-[11px] font-bold text-[#A0AEC0] tracking-wide block px-1">Sn</label>
                                    <div className="w-full bg-[#FFF9F5] border border-orange-100 rounded-[1.5rem] py-4 px-6 text-[#F37021] font-black text-sm text-center shadow-sm">
                                        {sn}
                                    </div>
                                </div>
                                <Field label="Sap part number" value={row['SAP PART NUMBER'] || row['SAP PART #'] || row['SAP Part Number']} />
                                <Field label="Part number" value={row['PART NUMBER'] || row['Part Number']} />
                            </div>

                            {/* Row 2: Part Description & Optional Assembly Number */}
                            <div className={cn("grid gap-8", (row['ASSEMBLY NUMBER'] && row['ASSEMBLY NUMBER'] !== "—") ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                                <Field label="Part description" value={row['PART DESCRIPTION'] || row['Description']} />
                                {(row['ASSEMBLY NUMBER'] && row['ASSEMBLY NUMBER'] !== "—") && (
                                    <Field label="Assembly number" value={row['ASSEMBLY NUMBER']} />
                                )}
                            </div>

                            {/* Row 3: Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <Field label="Per day" value={row['PER DAY'] || row['Per Day'] || '0'} center />
                                <Field label="Sap stock" value={row['SAP Stock'] || '0.0'} center />
                                <Field label="Opening stock" value={row['Opening Stock'] || '0.0'} center />
                                <Field label="Todays stock" value={row['Todays Stock'] || '0.0'} center />
                            </div>

                            {/* Row 4: Coverage Days · Status Tracking */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2 flex-1">
                                    <label className="text-[11px] font-bold text-[#A0AEC0] tracking-wide block px-1">Coverage days</label>
                                    <div className="w-full bg-[#F7FAFC] border border-[#EDF2F7] rounded-[1.5rem] py-4 px-6 shadow-sm flex items-center justify-center min-h-[58px]">
                                        <span className="bg-[#E6F6EC] text-[#00A651] px-6 py-1.5 rounded-full text-[11px] font-black tracking-wide">
                                            {row['Coverage Days'] || '0.0'} days
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 flex-1">
                                    <label className="text-[11px] font-bold text-[#A0AEC0] tracking-wide block px-1">Status tracking</label>
                                    <div className={`w-full border rounded-[1.5rem] py-4 px-6 font-black text-sm shadow-sm flex items-center justify-between min-h-[58px] ${statusColor}`}>
                                        <span className="capitalize">{status.toLowerCase()}</span>
                                        <ChevronDown size={15} className="opacity-60" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Communication Loop */}
                        <div className="pt-10 border-t border-[#F1F5F9] space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* DEO Remarks */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-[#A0AEC0] tracking-wide px-1 flex items-center gap-2">
                                        <MessageSquare size={12} className="text-[#F37021]" /> Deo submission remarks
                                    </label>
                                    <div className="w-full bg-[#F7FAFC] border border-[#EDF2F7] rounded-[1.5rem] p-5 text-sm font-extrabold text-[#718096] min-h-[100px] shadow-sm italic">
                                        {row['deo_reply'] || row['Remarks'] || row['issue_remark'] || 'No remarks provided by DEO.'}
                                    </div>
                                </div>

                                {/* Conditional Rejection Note */}
                                {isRejecting && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-3"
                                    >
                                        <label className="text-[11px] font-bold text-rose-500 tracking-wide px-1 flex items-center gap-2">
                                            <AlertCircle size={12} /> Rejection reason (required)
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Please specify why this entry is being rejected..."
                                            className="w-full bg-white border-2 border-rose-100 focus:border-rose-500 rounded-[1.5rem] p-5 text-sm font-bold text-[#1A202C] outline-none transition-all min-h-[100px] resize-none shadow-sm placeholder:text-rose-200"
                                            autoFocus
                                        />
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-white border-t border-[#F1F5F9] flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-5 bg-white border-2 border-[#EDF2F7] text-[#718096] rounded-[1.5rem] font-bold text-[11px] tracking-wide hover:bg-[#F7FAFC] transition-colors"
                        >
                            Close detail
                        </button>

                        {status !== 'VERIFIED' && (
                            <>
                                {isRejecting ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsRejecting(false);
                                                setComment('');
                                            }}
                                            className="flex-1 py-5 bg-white border-2 border-[#EDF2F7] text-[#718096] rounded-[1.5rem] font-bold text-[11px] tracking-wide hover:bg-[#F7FAFC] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => onVerify('REJECTED', comment)}
                                            disabled={!comment.trim()}
                                            className={`flex-[2] py-5 text-white rounded-[1.5rem] font-bold text-[11px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${comment.trim() ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700' : 'bg-rose-300 cursor-not-allowed opacity-50'}`}
                                        >
                                            <Send size={18} />
                                            Confirm rejection
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsRejecting(true)}
                                            className="flex-1 py-5 bg-rose-50 border-2 border-rose-100 text-rose-600 rounded-[1.5rem] font-bold text-[11px] tracking-wide hover:bg-rose-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            <X size={18} strokeWidth={3} />
                                            Reject entry
                                        </button>
                                        <button
                                            onClick={() => onVerify('VERIFIED')}
                                            className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold text-[11px] tracking-widest shadow-xl shadow-slate-900/10 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            <CheckCircle2 size={18} />
                                            Verify
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {status === 'VERIFIED' && (
                            <div className="flex-[3] py-5 bg-emerald-50 text-emerald-600 rounded-[1.5rem] font-bold text-[11px] tracking-wide border border-emerald-100 flex items-center justify-center gap-3 shadow-inner">
                                <ShieldCheck size={20} />
                                This entry is verified & authorized
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
