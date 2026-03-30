import React from 'react';
import { motion } from 'framer-motion';
import {
    Database,
    Bell,
    ClipboardList,
    Activity,
    Car
} from 'lucide-react';
import { ModelDetailModal } from './DEOModals';

interface AssignedModel {
    id: number;
    name: string;
    model_code: string;
    line_name: string;
    customer_name: string;
    deo_accepted: boolean;
    planned_qty?: number;
    actual_qty?: number;
    status?: string;
    supervisor_name?: string;
    supervisor_email?: string;
    manager_name?: string;
    manager_email?: string;
    customer_email?: string;
    target_quantity?: number;
    verified_at?: string;
}

interface DEOStatsProps {
    assignedModels: AssignedModel[];
    submissionHistory: any[];
    selectedModelId: number | null;
    setActiveTab: (tab: string) => void;
}

export const DEOStats: React.FC<DEOStatsProps> = ({
    assignedModels,
    submissionHistory,
    selectedModelId,
    setActiveTab
}) => {
    const [detailModel, setDetailModel] = React.useState<AssignedModel | null>(null);

    // Identify Active Models for the Dashboard Pulse
    const activePulseModels = assignedModels.filter(m => {
        const status = m.status?.toUpperCase() || '';
        const hasActivity = (m.actual_qty || 0) > 0;
        const isSelected = m.id === selectedModelId;
        const isReady = status === 'READY';
        return hasActivity || isSelected || isReady;
    });


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                {[
                    { label: 'Total Assigned', icon: Database, value: assignedModels.length, color: 'text-[#F37021]', bg: 'bg-[#F37021]/5' },
                    { label: 'Awaiting Accept', icon: Bell, value: assignedModels.filter(m => !m.deo_accepted).length, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { label: 'Logs Submitted', icon: ClipboardList, value: submissionHistory.length, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Live Status', icon: Activity, value: 'Active Shift', color: 'text-white', bg: 'bg-[#F37021]' }
                ].map((stat, i) => (
                    <div key={i} className={`p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:scale-[1.02] ${stat.bg} ${i === 3 ? 'shadow-lg shadow-orange-500/20 border-0' : 'bg-white'}`}>
                        <span className={`block text-[9px] font-black uppercase tracking-widest mb-2 ${i === 3 ? 'text-white/60' : 'text-slate-400'}`}>
                            {stat.label}
                        </span>
                        <div className="flex items-center gap-3">
                            <stat.icon size={18} className={stat.color} />
                            <span className={`text-2xl font-black tracking-tighter ${i === 3 ? 'text-white text-sm uppercase' : 'text-slate-900'}`}>
                                {stat.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Daily Production Pulse (Multi-Model) */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Daily Production Pulse</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Synchronized
                    </div>
                </div>

                {activePulseModels.length > 0 ? (
                    <div className="space-y-4">
                        {activePulseModels.map((model) => {
                            const totalTarget = model.planned_qty || 0;
                            const totalActual = model.actual_qty || 0;
                            const status = model.status?.toUpperCase() || '';
                            const isCompleted = status === 'COMPLETED' || status === 'VERIFIED';

                            // Fix KPI Logic: If target is 0 but production > 0, completion is 100%
                            let progressPercent = totalTarget > 0
                                ? Math.min(100, Math.round((totalActual / totalTarget) * 100))
                                : (totalActual > 0 ? 100 : 0);

                            // Force 100% if explicitly completed
                            if (isCompleted) progressPercent = 100;

                            const isOverTarget = (totalActual >= totalTarget && totalTarget > 0) || (totalActual > 0 && totalTarget === 0);
                            const isSelected = model.id === selectedModelId;

                            return (
                                <div key={model.id} className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden group ${isSelected ? 'border-[#F37021]/30 ring-4 ring-[#F37021]/5 shadow-md' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
                                    <div className="flex flex-col lg:flex-row items-stretch">
                                        {/* Model Info Segment */}
                                        <div className={`p-5 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-50 flex items-center gap-5 min-w-[280px] ${isSelected ? 'bg-orange-50/10' : 'bg-slate-50/30'}`}>
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:rotate-3 ${isSelected ? 'bg-[#F37021]' : 'bg-slate-900'}`}>
                                                <Car size={24} strokeWidth={2} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{model.name}</h2>
                                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold tracking-widest border shadow-sm ${isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-[#F37021] border-orange-100'}`}>
                                                        {isCompleted ? 'COMPLETED' : model.model_code}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    Line- {model.line_name?.split(' ').pop() || '01'}
                                                    <span className={`w-1 h-1 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-orange-400 animate-pulse'}`} />
                                                    {status || 'ACTIVE'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Live KPI Segment */}
                                        <div className="flex-1 p-5 lg:p-6 flex flex-col justify-center gap-2.5">
                                            <div className="flex justify-between items-end px-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-[#F37021] uppercase tracking-widest leading-none mb-1">Live Status</span>
                                                    <div className="flex items-center gap-2">
                                                        <Activity size={10} className="text-[#F37021] animate-pulse" />
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Tracking</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <div className={`px-4 py-1.5 rounded-full border shadow-sm transition-all duration-500 overflow-hidden relative group/pct ${isOverTarget || isCompleted ? 'bg-emerald-50 border-emerald-100 shadow-emerald-100/20' : 'bg-slate-50 border-slate-100'}`}>
                                                        <motion.div
                                                            key={progressPercent}
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className={`text-2xl lg:text-3xl font-black tracking-tighter tabular-nums leading-none flex items-baseline gap-0.5 ${isOverTarget || isCompleted ? 'text-emerald-500' : 'text-slate-900'}`}
                                                        >
                                                            {progressPercent}
                                                            <span className="text-[10px] font-black opacity-40 lowercase">%</span>
                                                        </motion.div>
                                                    </div>
                                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mt-2.5 pr-2">
                                                        Shift Goal Progress
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden p-0.5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercent}%` }}
                                                    className={`h-full rounded-full transition-all duration-1000 ${isCompleted || isOverTarget ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#F37021] to-orange-400'}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Action Segment */}
                                        <div className={`px-6 pb-5 lg:pb-0 lg:px-7 flex items-center ${isSelected ? 'bg-orange-50/5' : 'bg-slate-50/10'}`}>
                                            <button
                                                onClick={() => {
                                                    if (isCompleted) {
                                                        const historyItem = submissionHistory.find(s => s.model_name === model.name);
                                                        // Ensure log_data is passed for the parts breakdown
                                                        setDetailModel({
                                                            ...model,
                                                            log_data: historyItem?.log_data?.rows || historyItem?.log_data || []
                                                        } as any);
                                                    } else {
                                                        setActiveTab('ENTRY');
                                                    }
                                                }}
                                                className={`w-full lg:w-auto px-7 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 ${isCompleted ? 'bg-emerald-500 text-white shadow-emerald-500/10' : 'bg-slate-900 text-white shadow-lg'}`}
                                            >
                                                <ClipboardList size={12} /> {isCompleted ? 'View Report' : 'Enter Work'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] p-16 border border-slate-100 shadow-sm text-center group hover:border-[#F37021]/20 transition-all">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200 group-hover:bg-orange-50 group-hover:text-orange-200 transition-all">
                            <Car size={40} strokeWidth={1} />
                        </div>
                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-3">No Active Progress</h3>
                        <p className="text-[10px] font-bold text-slate-300 max-w-sm mx-auto uppercase tracking-widest leading-loose">
                            Select an assigned model from the <span className="text-slate-400">Models</span> tab or pick one from your assignments to see live production pulse data.
                        </p>
                        <button
                            onClick={() => setActiveTab('MODELS')}
                            className="mt-8 px-9 py-3.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                        >
                            Browse Assignments →
                        </button>
                    </div>
                )}
            </div>

            {/* Model Detail Modal (Premium Report View) */}
            <ModelDetailModal model={detailModel} onClose={() => setDetailModel(null)} />
        </div>
    );
};
