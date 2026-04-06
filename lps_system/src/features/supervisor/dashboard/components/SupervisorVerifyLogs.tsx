import {
    ClipboardCheck, Clock, CheckCircle2, ShieldCheck, ChevronLeft, Database
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface SupervisorVerifyLogsProps {
    verifications: any[];
    activeVerifyTab: 'pending' | 'ready';
    setActiveVerifyTab: (tab: 'pending' | 'ready') => void;
    setSelectedLog: (log: any) => void;
}

export const SupervisorVerifyLogs = ({
    verifications,
    activeVerifyTab,
    setActiveVerifyTab,
    setSelectedLog
}: SupervisorVerifyLogsProps) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-ind-text uppercase tracking-tighter flex items-center gap-3">
                        <ClipboardCheck className="text-ind-primary" size={28} strokeWidth={2.5} />
                        Verify Daily Production
                    </h2>

                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-ind-border/50 shadow-sm">
                    <div className="px-4 py-2 text-center">
                        <span className="block text-[8px] font-black text-ind-text3 uppercase tracking-[0.2em] mb-1">Awaiting Review</span>
                        <span className="text-lg font-black text-ind-primary">
                            {verifications.filter(v => v.status === 'PENDING' || v.status === 'SUBMITTED' || v.status === 'REJECTED' || !v.status).length}
                        </span>
                    </div>
                    <div className="w-px h-8 bg-ind-border/30" />
                    <div className="px-4 py-2 text-center text-emerald-500">
                        <span className="block text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">System Status</span>
                        <div className="flex items-center gap-1.5 justify-center mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Live Syncing</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Tabs Navigation */}
            <div className="flex items-center gap-1 p-1 bg-ind-border/30/50 rounded-2xl w-fit border border-ind-border/50">
                <button
                    onClick={() => setActiveVerifyTab('pending')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                        activeVerifyTab === 'pending'
                            ? "bg-white text-ind-primary shadow-sm"
                            : "text-ind-text3 hover:text-ind-text2"
                    )}
                >
                    <Clock size={14} />
                    Awaiting Review
                    <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[8px] font-black",
                        activeVerifyTab === 'pending' ? "bg-orange-50 text-ind-primary" : "bg-ind-border/50 text-ind-text3"
                    )}>
                        {verifications.filter(v => v.status === 'PENDING' || v.status === 'SUBMITTED' || v.status === 'REJECTED' || !v.status).length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveVerifyTab('ready')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                        activeVerifyTab === 'ready'
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                            : "text-ind-text3 hover:text-ind-text2"
                    )}
                >
                    <CheckCircle2 size={14} />
                    Ready / Verified
                    <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[8px] font-black",
                        activeVerifyTab === 'ready' ? "bg-emerald-400 text-white" : "bg-ind-border/50 text-ind-text3"
                    )}>
                        {verifications.filter(v => v.status === 'APPROVED' || v.status === 'VERIFIED' || v.status === 'READY' || v.status === 'DONE').length}
                    </span>
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-ind-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                {(() => {
                    // Simply filter the verifications directly into the correct tabs
                    // This perfectly matches the metric counts shown in the UI tabs
                    let filteredVerifications = verifications.filter((item: any) =>
                        activeVerifyTab === 'ready'
                            ? (item.status === 'APPROVED' || item.status === 'VERIFIED' || item.status === 'READY' || item.status === 'DONE')
                            : (item.status === 'PENDING' || item.status === 'SUBMITTED' || item.status === 'REJECTED' || !item.status)
                    ).sort((a: any, b: any) => b.id - a.id);

                    if (filteredVerifications.length > 0) {
                        return (
                            <div className="divide-y divide-slate-50">
                                {filteredVerifications.map((item) => (
                                    <div key={item.id} className="p-10 flex flex-col md:flex-row items-start md:items-center justify-between group hover:bg-ind-bg transition-all duration-300">
                                        <div className="flex items-start gap-8">
                                            <div className={cn(
                                                "w-16 h-16 rounded-[1.5rem] border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm",
                                                activeVerifyTab === 'ready'
                                                    ? "bg-emerald-50 text-emerald-500 border-emerald-100"
                                                    : "bg-orange-50 text-ind-primary border-orange-100"
                                            )}>
                                                {activeVerifyTab === 'ready' ? <ShieldCheck size={32} strokeWidth={1.5} /> : <ClipboardCheck size={32} strokeWidth={1.5} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="text-2xl font-black text-ind-text tracking-tighter">{item.model_name}</span>
                                                    <span className={cn(
                                                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                                                        (item.status === 'APPROVED' || item.status === 'VERIFIED' || item.status === 'READY' || item.status === 'DONE')
                                                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                            : item.status === 'REJECTED'
                                                                ? "bg-red-50 text-red-600 border-red-100"
                                                                : "bg-orange-50 text-ind-primary border-orange-100"
                                                    )}>
                                                        {item.status || 'PENDING'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-6 text-xs font-bold text-ind-text3">
                                                    <span className="uppercase tracking-widest font-black text-ind-text2">
                                                        ORDER ID: <span className="text-ind-primary">{item.formatted_id || `DEM-${item.id?.toString().padStart(3, '0')}`}</span>
                                                    </span>
                                                    <div className="w-1.5 h-1.5 bg-ind-border/50 rounded-full" />
                                                    <span className="text-ind-text font-black uppercase tracking-tight">{item.date}</span>
                                                    <div className="w-1.5 h-1.5 bg-ind-border/50 rounded-full" />
                                                    <span className="text-ind-primary font-black uppercase tracking-widest whitespace-nowrap">OPERATOR: {item.deo_name || 'N/A'}</span>
                                                    <div className="w-1.5 h-1.5 bg-ind-border/50 rounded-full" />
                                                    <span className="text-ind-text3 font-black uppercase tracking-widest whitespace-nowrap">CUSTOMER: {item.customer_name || 'CIE AUTOMOTIVE'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 mt-6 md:mt-0 w-full md:w-auto">
                                            <button
                                                onClick={() => setSelectedLog(item)}
                                                className="px-10 py-4 bg-ind-text text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest hover:bg-ind-primary shadow-xl transition-all active:scale-95 flex items-center gap-3"
                                            >
                                                {activeVerifyTab === 'ready' ? 'View Verified' : 'Review Production'}
                                                <ChevronLeft className="rotate-180" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    }

                    return (
                        <div className="px-10 py-24 text-center bg-ind-bg/30">
                            <div className={cn(
                                "w-20 h-20 bg-white shadow-sm border rounded-full flex items-center justify-center mx-auto mb-6 relative",
                                activeVerifyTab === 'ready' ? "text-ind-text3 border-ind-border/50" : "text-ind-primary border-ind-border/50"
                            )}>
                                {activeVerifyTab === 'ready' ? <Database size={32} /> : <CheckCircle2 size={32} />}
                                {activeVerifyTab !== 'ready' && <div className="absolute inset-0 rounded-full border-2 border-ind-primary animate-ping opacity-20" />}
                            </div>
                            <h3 className="text-xl font-black text-ind-text uppercase tracking-tight mb-2">
                                {activeVerifyTab === 'ready' ? 'No Records Found' : 'All Clear!'}
                            </h3>
                            <p className="text-ind-text3 font-bold text-xs uppercase tracking-[0.2em] max-w-xs mx-auto">
                                {activeVerifyTab === 'ready'
                                    ? 'You haven\'t verified any production logs for this period yet.'
                                    : 'All DEO daily production logs have been fully reviewed and authorized.'}
                            </p>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};
