import { X } from 'lucide-react';

interface RowRejectionModalProps {
    rejectingRowIndex: number | null;
    setRejectingRowIndex: (index: number | null) => void;
    rowRejectionComment: string;
    setRowRejectionComment: (comment: string) => void;
    handleRowVerify: (index: number, status: 'VERIFIED' | 'REJECTED', reason?: string) => Promise<void>;
}

export const RowRejectionModal = ({
    rejectingRowIndex,
    setRejectingRowIndex,
    rowRejectionComment,
    setRowRejectionComment,
    handleRowVerify
}: RowRejectionModalProps) => {
    if (rejectingRowIndex === null) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-ind-border/50 animate-in fade-in zoom-in duration-200">
                <div className="p-8 border-b border-ind-border/50 flex items-center justify-between">
                    <h3 className="text-xl font-black text-ind-text tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                            <X size={20} strokeWidth={2.5} />
                        </div>
                        REJECT ROW {rejectingRowIndex + 1}
                    </h3>
                    <button 
                        onClick={() => { setRejectingRowIndex(null); setRowRejectionComment(''); }} 
                        className="p-2 hover:bg-ind-bg rounded-xl transition-colors"
                    >
                        <X size={20} className="text-ind-text3" />
                    </button>
                </div>
                <div className="p-8">
                    <p className="text-[11px] font-black text-ind-text2 uppercase tracking-widest mb-4">Reason for rejection (Visible to DEO):</p>
                    <textarea
                        className="w-full bg-ind-bg border border-ind-border rounded-xl p-4 text-[12px] font-bold outline-none focus:border-ind-primary hover:border-slate-300 transition-all placeholder:text-ind-text3 min-h-[120px] resize-y"
                        placeholder="Enter specific feedback or reason here..."
                        value={rowRejectionComment}
                        onChange={(e) => setRowRejectionComment(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="p-8 bg-ind-bg border-t border-ind-border/50 flex justify-end gap-3">
                    <button
                        onClick={() => { setRejectingRowIndex(null); setRowRejectionComment(''); }}
                        className="px-6 py-3.5 text-[10px] font-black text-ind-text2 hover:bg-ind-border/50 rounded-xl transition-colors uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (rejectingRowIndex !== null) {
                                handleRowVerify(rejectingRowIndex, 'REJECTED', rowRejectionComment);
                                setRejectingRowIndex(null);
                                setRowRejectionComment('');
                            }
                        }}
                        className="px-8 py-3.5 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 active:scale-95 flex items-center gap-2"
                    >
                        <X size={14} strokeWidth={3} /> Submit Rejection
                    </button>
                </div>
            </div>
        </div>
    );
};
