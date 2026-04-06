import React from 'react';
import { motion } from 'framer-motion';
import {
    Flame,
    Activity,
    Clock,
    ClipboardCheck,
    AlertTriangle
} from 'lucide-react';

import { DEOAnalytics } from './DEOAnalytics';

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
    selectedDate: string;
}

export const DEOStats: React.FC<DEOStatsProps> = ({
    assignedModels,
    submissionHistory,
    selectedDate
}) => {
    // 0. Filter submission history for the selected date for rejections
    const dateStr = new Date(selectedDate).toISOString().split('T')[0];
    const todaysSubmissions = submissionHistory.filter(s => s.date?.split('T')[0] === dateStr);

    const totalDemand = assignedModels.reduce((sum, m) => sum + (m.planned_qty || m.target_quantity || 0), 0);
    const rejections = todaysSubmissions.filter(s => s.status === 'REJECTED').length;

    const readyModelsCount = assignedModels.filter(m => {
        const s = m.status?.toUpperCase();
        return s === 'READY' || s === 'COMPLETED' || s === 'VERIFIED';
    }).length;

    const pendingModelsCount = assignedModels.filter(m => {
        const isReady = ['READY', 'COMPLETED', 'VERIFIED'].includes(m.status?.toUpperCase() || '');
        return m.deo_accepted && !isReady;
    }).length;

    const kpis = [
        { 
            label: 'Total Demand', 
            value: totalDemand, 
            icon: Flame, 
            color: 'text-ind-text', 
            iconBg: 'bg-ind-bg',
            bg: 'bg-white',
            textColor: 'text-ind-text',
            labelColor: 'text-ind-text2'
        },
        { 
            label: 'Active Models', 
            value: pendingModelsCount, 
            icon: Activity, 
            color: 'text-white', 
            iconBg: 'bg-white/20',
            bg: 'bg-[#F37021]', 
            textColor: 'text-white',
            labelColor: 'text-orange-100',
            isSpecial: true
        },
        { 
            label: 'Pending Models', 
            value: pendingModelsCount, 
            icon: Clock, 
            color: 'text-rose-600', 
            iconBg: 'bg-rose-50',
            bg: 'bg-white',
            textColor: 'text-ind-text',
            labelColor: 'text-ind-text2'
        },
        { 
            label: 'Ready Models', 
            value: readyModelsCount, 
            icon: ClipboardCheck, 
            color: 'text-emerald-600', 
            iconBg: 'bg-emerald-50',
            bg: 'bg-white',
            textColor: 'text-ind-text',
            labelColor: 'text-ind-text2'
        },
        { 
            label: 'Rejections', 
            value: rejections, 
            icon: AlertTriangle, 
            color: 'text-rose-600', 
            iconBg: 'bg-rose-50',
            bg: 'bg-white',
            textColor: 'text-ind-text',
            labelColor: 'text-ind-text2'
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-10">
            {/* 1. Industrial KPI Grid (Based on Simple Design) */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {kpis.map((kpi, index) => (
                    <motion.div 
                        key={index} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${kpi.bg} rounded-2xl p-5 border border-ind-border/50 shadow-sm transition-all duration-300 hover:shadow-md group flex flex-col justify-between min-h-[140px] relative overflow-hidden`}
                    >
                        {kpi.isSpecial && (
                            <div className="absolute top-[-30%] right-[-15%] w-24 h-24 bg-white/10 blur-xl rounded-full" />
                        )}

                        <div className="flex items-start justify-between relative z-10 font-sans">
                            <div className={`w-9 h-9 rounded-xl ${kpi.iconBg} flex items-center justify-center ${kpi.color} group-hover:scale-105 transition-transform`}>
                                 <kpi.icon size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span className={`text-[8px] font-black uppercase tracking-widest ${kpi.textColor === 'text-white' ? 'text-white/80' : 'text-ind-text3'}`}>
                                    Live
                                </span>
                            </div>
                        </div>
                        
                        <div className="mt-5 relative z-10 font-sans">
                            <h3 className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${kpi.labelColor}`}>
                                {kpi.label}
                            </h3>
                            <div className="flex items-baseline gap-1.5">
                                <span className={`text-3xl font-black tracking-tighter tabular-nums ${kpi.textColor}`}>
                                    {kpi.value.toString().padStart(2, '0')}
                                </span>
                                <span className={`text-[8px] font-bold uppercase tracking-tight ${kpi.textColor === 'text-white' ? 'text-orange-100' : 'text-ind-text3'}`}>
                                    units
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 2. Unified Analytics Suite */}
            <div className="bg-ind-bg/20 rounded-[2.5rem] p-4 lg:p-8 border border-ind-border/50/50">
                 <DEOAnalytics 
                    assignedModels={assignedModels} 
                    submissionHistory={submissionHistory} 
                    selectedDate={selectedDate}
                />
            </div>
        </div>
    );
};
