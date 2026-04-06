import React from 'react';
import { Shield, FileText, Download } from 'lucide-react';

export const AdminHeader: React.FC = () => {
    return (
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-ind-border/60 pb-10">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-12 bg-slate-900 rounded-full" />
                    <h1 className="text-5xl lg:text-7xl font-black text-ind-text uppercase tracking-tighter leading-none">
                        ADMIN<br /><span className="text-ind-text3">PRODUCTION</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-ind-text3 uppercase tracking-[0.3em]">
                        LIVE SYSTEM MONITOR • 100% OPERATIONAL
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-ind-border text-ind-text3 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:text-ind-text hover:border-slate-900 transition-all shadow-sm group">
                    <Shield size={14} className="group-hover:scale-110 transition-transform" />
                    Security
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-ind-border text-ind-text3 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:text-ind-text hover:border-slate-900 transition-all shadow-sm group">
                    <FileText size={14} className="group-hover:scale-110 transition-transform" />
                    Reports
                </button>
                <button className="flex items-center gap-2 px-8 py-3 bg-[#1C5BFF] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 group">
                    <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                    Export
                </button>
            </div>
        </div>
    );
};
