import { 
    Layout, Database, Target, Activity, Users, FileSpreadsheet, Bell
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface MonitoringViewProps {
    assignedModels: any[];
}

export const MonitoringView = ({ assignedModels }: MonitoringViewProps) => (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-ind-text uppercase tracking-tighter">Line Efficiency Monitoring</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {assignedModels.length > 0 ? Array.from(new Set(assignedModels.map(m => m.line_name))).filter(Boolean).map((lineName) => (
                <div key={lineName} className="bg-white rounded-[2.5rem] p-10 border border-ind-border/50 shadow-sm group hover:border-ind-primary/30 transition-all duration-500">
                    <div className="flex justify-between items-start mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                <Layout size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-ind-text uppercase tracking-tight">{lineName}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Operations</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest block mb-1">Current Efficiency</span>
                            <span className="text-3xl font-black text-ind-text tracking-tighter tabular-nums">
                                {(() => {
                                    const lineModels = assignedModels.filter(m => m.line_name === lineName);
                                    const totalPlanned = lineModels.reduce((acc, m) => acc + (m.planned_qty || 0), 0);
                                    const totalActual = lineModels.reduce((acc, m) => acc + (m.actual_qty || 0), 0);
                                    return totalPlanned > 0 ? `${((totalActual / totalPlanned) * 100).toFixed(1)}%` : '0.0%';
                                })()}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-50">
                        <div className="bg-ind-bg/50 rounded-2xl p-6">
                            <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest block mb-1">Avg. Takt Time</span>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-black text-ind-text tracking-tighter tabular-nums">124s</span>
                                <span className="text-[10px] font-black text-ind-text3 uppercase mb-1">/UNIT</span>
                            </div>
                        </div>
                        <div className="bg-ind-bg/50 rounded-2xl p-6">
                            <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest block mb-1">Active DEOs</span>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-black text-ind-text tracking-tighter tabular-nums">
                                    {assignedModels.filter(m => m.line_name === lineName).length}
                                </span>
                                <span className="text-[10px] font-black text-ind-text3 uppercase mb-1">OPERATORS</span>
                            </div>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="col-span-full bg-white rounded-[2rem] p-10 border border-ind-border/50 shadow-sm text-center">
                    <Activity size={48} className="text-slate-200 mx-auto mb-6" />
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">No Active Lines</h2>
                    <p className="max-w-md mx-auto text-ind-text3 font-bold text-xs uppercase tracking-widest leading-relaxed">
                        There are currently no production lines assigned to your oversight.
                    </p>
                </div>
            )}
        </div>
    </div>
);

interface ProgressViewProps {
    assignedModels: any[];
}

export const ProgressView = ({ assignedModels }: ProgressViewProps) => (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-ind-text uppercase tracking-tighter">Model Completion Tracking</h2>
        </div>
        <div className="grid grid-cols-1 gap-8">
            {assignedModels.length > 0 ? assignedModels.map((model) => (
                <div key={model.id} className="bg-white rounded-[2.5rem] p-10 border border-ind-border/50 shadow-sm group hover:border-emerald-500/30 transition-all duration-500 overflow-hidden relative">
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
                                <Database size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-2xl font-black text-ind-text uppercase tracking-tight">{model.name}</h3>
                                    <span className="px-3 py-1 bg-ind-border/30 rounded-full text-[9px] font-black text-ind-text2 uppercase tracking-widest">
                                        {model.model_code}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-ind-text3 uppercase tracking-widest">
                                    <span>{model.variant_name || 'Standard'}</span>
                                    <div className="w-1.5 h-1.5 bg-ind-border/50 rounded-full" />
                                    <span className="text-ind-primary">Line: {model.line_name || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                         <div className="flex-1 max-w-2xl px-10">
                            {(() => {
                                const progress = model.planned_qty > 0 ? (model.actual_qty / model.planned_qty) * 100 : 0;
                                return (
                                    <>
                                        <div className="flex justify-between items-end mb-4">
                                            <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">Production Progress</span>
                                            <span className="text-2xl font-black text-ind-text tracking-tighter tabular-nums">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="h-4 bg-ind-border/30 rounded-full overflow-hidden p-1">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            />
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <div className="flex items-center gap-12">
                            <div className="text-center">
                                <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest block mb-1">Target</span>
                                <span className="text-3xl font-black text-ind-text tracking-tighter">{model.planned_qty || 0}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest block mb-1">Actual</span>
                                <span className="text-3xl font-black text-emerald-500 tracking-tighter">{model.actual_qty || 0}</span>
                            </div>
                        </div>
                    </div>
                    {/* Abstract background accent */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-ind-bg/50 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none" />
                </div>
            )) : (
                <div className="bg-white rounded-[2rem] p-10 border border-ind-border/50 shadow-sm text-center">
                    <Target size={48} className="text-slate-200 mx-auto mb-6" />
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">No Active Targets</h2>
                    <p className="max-w-md mx-auto text-ind-text3 font-bold text-xs uppercase tracking-widest leading-relaxed">
                        Track the completion rate here once models are assigned.
                    </p>
                </div>
            )}
        </div>
    </div>
);

export const ReportsView = () => (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-ind-text uppercase tracking-tighter">Shift Data Reports</h2>
            <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F37021] transition-all flex items-center gap-2">
                <FileSpreadsheet size={16} />
                Export CSV
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { title: 'Production Variance', date: 'TODAY', status: 'Generated', icon: Activity },
                { title: 'Takt Time Analysis', date: 'YESTERDAY', status: 'Archived', icon: Target },
                { title: 'DEO Performance', date: 'THIS WEEK', status: 'Review', icon: Users }
            ].map((report, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-8 border border-ind-border/50 shadow-sm hover:border-ind-primary/20 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-ind-bg flex items-center justify-center text-ind-text3 mb-6 group-hover:bg-[#F37021]/10 group-hover:text-ind-primary transition-colors">
                        <report.icon size={24} />
                    </div>
                    <h3 className="text-lg font-black text-ind-text uppercase tracking-tight mb-1">{report.title}</h3>
                    <p className="text-[10px] font-black text-ind-text3 uppercase tracking-[0.2em] mb-6">{report.date}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <span className="text-[9px] font-black text-ind-text2 uppercase tracking-widest px-3 py-1 bg-ind-bg rounded-full">{report.status}</span>
                        <button className="text-[10px] font-black text-ind-primary uppercase tracking-widest hover:translate-x-1 transition-transform">Download →</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const AlertsView = () => (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-ind-text uppercase tracking-tighter">Critical Notifications</h2>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-ind-border/50 shadow-sm overflow-hidden">
            {[
                { title: 'Efficiency Warning', desc: 'Line B is operating below 85% takt time target.', type: 'critical', time: '12m ago' },
                { title: 'Verification Required', desc: '14 new nodes pending for model CURVV-EV.', type: 'info', time: '1h ago' },
                { title: 'Safety Audit Due', desc: 'Weekly machine safety check scheduled for 4 PM.', type: 'notice', time: '3h ago' }
            ].map((alert, i) => (
                <div key={i} className="p-8 border-b border-slate-50 last:border-0 flex items-start gap-6 hover:bg-ind-bg/50 transition-colors">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                        alert.type === 'critical' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                    )}>
                        <Bell size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="text-base font-black text-ind-text uppercase tracking-tight">{alert.title}</h3>
                            <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">{alert.time}</span>
                        </div>
                        <p className="text-xs font-bold text-ind-text2 tracking-tight">{alert.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
