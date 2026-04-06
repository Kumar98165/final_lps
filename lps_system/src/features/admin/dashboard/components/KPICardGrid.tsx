import React from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, 
    Box, 
    Layers, 
    Zap, 
    Mail, 
    Clock, 
    CheckCircle, 
    AlertTriangle 
} from 'lucide-react';

export const KPICardGrid: React.FC = () => {
    const kpis = [
        { label: 'Orders Received', value: '10', icon: Mail, tag: 'MONTHLY', color: 'text-blue-500', bg: 'bg-blue-50', borderColor: 'border-blue-200' },
        { label: 'Pending Orders', value: '4', icon: Clock, tag: 'ACTION NEEDED', color: 'text-orange-500', bg: 'bg-orange-50', borderColor: 'border-orange-200' },
        { label: 'Processing', value: '0', icon: Zap, tag: 'LIVE NOW', color: 'text-emerald-500', bg: 'bg-emerald-50', borderColor: 'border-emerald-200' },
        { label: 'Completed', value: '6', icon: CheckCircle, tag: 'THIS WEEK', color: 'text-purple-500', bg: 'bg-purple-50', borderColor: 'border-purple-200' },
        { label: 'Total Production', value: '0', icon: Box, tag: '+12.5%', color: 'text-indigo-500', bg: 'bg-indigo-50', borderColor: 'border-indigo-200' },
        { label: 'OEE Performance', value: '0.0%', icon: Activity, tag: '+2.1%', color: 'text-blue-600', bg: 'bg-blue-100', borderColor: 'border-blue-300' },
        { label: 'Approved Parts', value: '0', icon: CheckCircle, tag: '98.5%', color: 'text-emerald-600', bg: 'bg-emerald-100', borderColor: 'border-emerald-300' },
        { label: 'Rejected Parts', value: '0', icon: AlertTriangle, tag: '1.5%', color: 'text-rose-600', bg: 'bg-rose-100', borderColor: 'border-rose-300' },
        { label: 'Pending Reviews', value: '0', icon: Layers, tag: 'NEEDS ACTION', color: 'text-amber-600', bg: 'bg-amber-100', borderColor: 'border-amber-300' },
        { label: 'Active Lines', value: '2', icon: Zap, tag: 'STABLE', color: 'text-ind-text2', bg: 'bg-ind-border/30', borderColor: 'border-slate-300' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {kpis.map((kpi, i) => (
                <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white p-6 rounded-[2.5rem] border border-ind-border/50 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden flex flex-col"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-2.5 ${kpi.bg} ${kpi.color} rounded-xl group-hover:scale-110 transition-transform`}>
                            <kpi.icon size={20} strokeWidth={2.5} />
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black tracking-widest ${kpi.bg} ${kpi.color} border ${kpi.borderColor}`}>
                            {kpi.tag}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-4xl font-black text-ind-text tracking-tighter leading-none mb-2">{kpi.value}</h3>
                        <p className="text-[10px] font-black text-ind-text3 uppercase tracking-widest leading-none mt-4">{kpi.label}</p>
                    </div>
                    {/* Decorative subtle background icon */}
                    <kpi.icon className="absolute -right-4 -bottom-4 text-slate-50 opacity-10" size={100} strokeWidth={1} />
                </motion.div>
            ))}
        </div>
    );
};
