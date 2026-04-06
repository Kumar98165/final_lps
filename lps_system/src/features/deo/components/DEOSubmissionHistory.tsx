import React from 'react';
import { 
    Database, 
    ArrowLeft, 
    CheckCircle, 
    X, 
    Clock
} from 'lucide-react';

interface DEOSubmissionHistoryProps {
    isLoadingHistory: boolean;
    submissionHistory: any[];
    selectedHistoryLog: any;
    setSelectedHistoryLog: (log: any) => void;
    handleHistoryRowUpdate: (logId: number, rowIndex: number, colKey: string, value: string) => void;
}

export const DEOSubmissionHistory: React.FC<DEOSubmissionHistoryProps> = ({
    isLoadingHistory,
    submissionHistory,
    selectedHistoryLog,
    setSelectedHistoryLog
}) => {
    if (isLoadingHistory) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="w-16 h-16 border-4 border-ind-border/50 border-t-[#F37021] rounded-full animate-spin" />
                <p className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">Loading History...</p>
            </div>
        );
    }

    if (selectedHistoryLog) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[3rem] p-10 border border-ind-border/50 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setSelectedHistoryLog(null)}
                            className="w-12 h-12 rounded-2xl bg-ind-bg flex items-center justify-center text-ind-text3 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <span className="text-[10px] font-black text-ind-primary uppercase tracking-[0.2em] mb-1 block">Submission Report</span>
                            <h2 className="text-3xl font-black text-ind-text uppercase tracking-tight">{selectedHistoryLog.model_name}</h2>
                            <p className="text-xs font-bold text-ind-text3 uppercase tracking-widest mt-1">
                                Submitted on {new Date(selectedHistoryLog.date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-ind-border/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-ind-bg/50">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-ind-text3 uppercase tracking-widest border-b border-r border-ind-border/50">Part Info</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-ind-text3 uppercase tracking-widest border-b border-r border-ind-border/50">Opening Stock</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-ind-text3 uppercase tracking-widest border-b border-r border-ind-border/50">Todays Stock</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-ind-text3 uppercase tracking-widest border-b border-r border-ind-border/50">Status</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-ind-text3 uppercase tracking-widest border-b">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(selectedHistoryLog.log_data || []).map((row: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-ind-bg/50 transition-colors">
                                        <td className="px-6 py-5 border-r border-slate-50">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black text-ind-text uppercase tracking-tight">{row["PART NUMBER"] || 'NO PART #'}</span>
                                                <span className="text-[9px] font-bold text-ind-text3 uppercase tabular-nums">{row["SAP PART NUMBER"] || row["SAP PART #"] || 'NO SAP #'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center border-r border-slate-50">
                                            <span className="text-[11px] font-black text-ind-text3 tabular-nums">{row["Opening Stock"] || 0}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center border-r border-slate-50">
                                            <span className="text-[11px] font-black text-ind-primary tabular-nums">{row["Todays Stock"] || 0}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center border-r border-slate-50">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                row["Production Status"] === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                            }`}>
                                                {row["Production Status"] || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {row.row_status === 'VERIFIED' ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                                                        <CheckCircle size={10} /> Verified
                                                    </span>
                                                </div>
                                            ) : row.row_status === 'REJECTED' ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-rose-100">
                                                        <X size={10} /> Rejected
                                                    </span>
                                                    {row.rejection_reason && (
                                                        <span className="text-[7px] font-bold text-rose-400 italic max-w-[120px] line-clamp-1">{row.rejection_reason}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest">Pending Review</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-ind-border/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                        <Database size={32} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-ind-text3 uppercase tracking-[0.2em] mb-1 block">Log Registry</span>
                        <h2 className="text-3xl font-black text-ind-text uppercase tracking-tight">Submission History</h2>
                        <p className="text-xs font-bold text-ind-text3 uppercase tracking-widest mt-1">
                            Review your past production log submissions.
                        </p>
                    </div>
                </div>
            </div>

            {submissionHistory.length === 0 ? (
                <div className="bg-white rounded-[3.5rem] p-24 border border-ind-border/50 shadow-sm text-center">
                    <Database size={48} className="text-slate-100 mx-auto mb-8" />
                    <p className="text-[10px] font-black text-ind-text3 uppercase tracking-[0.3em]">No submission history found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {submissionHistory.map((log) => (
                        <div 
                            key={log.id}
                            onClick={() => setSelectedHistoryLog(log)}
                            className="bg-white rounded-[3rem] p-8 border border-ind-border/50 shadow-sm hover:shadow-xl hover:border-ind-primary/20 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-ind-bg flex items-center justify-center text-ind-text3 group-hover:bg-orange-50 group-hover:text-ind-primary transition-colors">
                                    <Clock size={24} />
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                    log.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                    log.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    'bg-orange-50 text-orange-600 border-orange-100'
                                }`}>
                                    {log.status === 'PARTIAL' ? 'IN REVIEW' : log.status}
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-ind-text uppercase tracking-tight mb-2">{log.model_name}</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">
                                    {new Date(log.date).toLocaleDateString()}
                                </span>
                                <span className="text-[8px] font-black text-ind-text3 uppercase tracking-widest">
                                    {log.log_data?.length || 0} Parts Logged
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
