import React from 'react';
import {
    Activity,
    Box,
    Layers,
    ClipboardCheck,
    Users,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AdminSummary } from '../../../../types/dashboard';

interface StatsGridProps {
    summary: AdminSummary;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ summary }) => {
    const stats = [
        {
            label: 'Total Production',
            value: summary.production_units,
            icon: Box,
            trend: '+12.5%',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50'
        },
        {
            label: 'OEE Performance',
            value: summary.oee,
            icon: Activity,
            trend: '+2.1%',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50'
        },
        {
            label: 'Active Lines',
            value: summary.stats.active_lines,
            icon: Zap,
            trend: 'Stable',
            color: 'text-amber-500',
            bgColor: 'bg-amber-50'
        },
        {
            label: 'Pending Reviews',
            value: summary.stats.pending_reviews,
            icon: ClipboardCheck,
            trend: summary.stats.pending_reviews > 5 ? 'High' : 'Normal',
            color: 'text-rose-500',
            bgColor: 'bg-rose-50'
        },
        {
            label: 'Total Models',
            value: summary.stats.total_models,
            icon: Layers,
            trend: 'Active',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-50'
        },
        {
            label: 'Active DEOs',
            value: summary.stats.active_deos,
            icon: Users,
            trend: 'Live',
            color: 'text-ind-text2',
            bgColor: 'bg-ind-border/30'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-[2rem] border border-ind-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2.5 ${stat.bgColor} ${stat.color} rounded-xl group-hover:scale-110 transition-transform`}>
                            <stat.icon size={20} strokeWidth={2} />
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stat.trend === 'High' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'
                            }`}>
                            {stat.trend}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-ind-text tracking-tighter">{stat.value}</h3>
                        <p className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                    {/* Decorative subtle background icon */}
                    <stat.icon className="absolute -right-4 -bottom-4 text-slate-50 opacity-10" size={80} strokeWidth={1} />
                </motion.div>
            ))}
        </div>
    );
};
