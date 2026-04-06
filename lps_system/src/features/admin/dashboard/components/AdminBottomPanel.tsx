import React from 'react';
import { Mail, Bell, Activity, ChevronRight } from 'lucide-react';

export const AdminBottomPanel: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Orders Received via Email */}
            <div className="bg-white rounded-[2.5rem] border border-ind-border/50 shadow-sm p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                            <Mail size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-ind-text uppercase tracking-tight">Orders Received via Email</h3>
                            <p className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest leading-none mt-1">INCOMING DEMANDS</p>
                        </div>
                    </div>
                    <button className="p-2 bg-ind-bg text-ind-text3 hover:text-ind-text rounded-full transition-colors">
                        <ChevronRight size={18} />
                    </button>
                </div>
                <div className="space-y-4">
                    {[1, 2].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-ind-bg border border-ind-border/50 rounded-2xl group hover:border-[#1C5BFF]/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-ind-border flex items-center justify-center font-black text-xs text-ind-text">
                                    RJ
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-ind-text uppercase">rj_tml_2309_dem</p>
                                    <p className="text-[9px] font-bold text-ind-text3 uppercase tracking-widest">Received 2h ago</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-amber-50 text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
                                PENDING
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Alerts & Logs */}
            <div className="bg-white rounded-[2.5rem] border border-ind-border/50 shadow-sm p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                            <Bell size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-ind-text uppercase tracking-tight">System Alerts & Logs</h3>
                            <p className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest leading-none mt-1">FAST TRACKING</p>
                        </div>
                    </div>
                </div>
                <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-ind-border/30">
                    {[
                        { title: 'New DEM-041 Created', time: '2M AGO', color: 'bg-emerald-500' },
                        { title: 'DEO Login Alert: User #04', time: '15M AGO', color: 'bg-blue-500' },
                        { title: 'Stock Low: Model 903-A', time: '40M AGO', color: 'bg-rose-500' }
                    ].map((alert, i) => (
                        <div key={i} className="relative flex items-center justify-between pl-10 group">
                            <div className={`absolute left-[16px] w-2 h-2 rounded-full border-2 border-white ring-4 ring-slate-50 ${alert.color} group-hover:scale-125 transition-transform`} />
                            <p className="text-xs font-bold text-slate-700 uppercase">{alert.title}</p>
                            <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest">{alert.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Model Utilization Tracking */}
            <div className="bg-white rounded-[2.5rem] border border-ind-border/50 shadow-sm p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                            <Activity size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-ind-text uppercase tracking-tight">Model Utilization Tracking</h3>
                            <p className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest leading-none mt-1">LIVE STATUS</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    {[
                        { model: 'KUV-100 FRONT', utilization: 85, color: 'bg-emerald-500' },
                        { model: 'XUV-700 REAR', utilization: 42, color: 'bg-[#1C5BFF]' },
                        { model: 'SCORPIO N BODY', utilization: 68, color: 'bg-indigo-500' }
                    ].map((item, i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black text-ind-text uppercase tracking-tight">{item.model}</span>
                                <span className="text-[10px] font-black text-ind-text3 uppercase">{item.utilization}%</span>
                            </div>
                            <div className="h-2 bg-ind-bg border border-ind-border/50 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                                    style={{ width: `${item.utilization}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
