import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { itemVariants } from './animations';
import { cn } from '../../lib/utils';

interface KPICardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    detail: string;
    trend?: string;
    color?: string;
}

export const IndustrialKPICard = ({ label, value, icon: Icon, detail, trend, color }: KPICardProps) => {
    return (
        <motion.div
            variants={itemVariants}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-6 group transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 relative overflow-hidden"
        >
            <div className="flex justify-between items-start">
                <div className={cn("p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-colors", color)}>
                    <Icon size={24} strokeWidth={1.5} />
                </div>
                {trend && (
                    <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">{trend}</div>
                )}
            </div>
            <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
            </div>
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">{detail}</span>
                <ArrowRight size={14} className="text-slate-200 group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
            </div>
            {/* High-end decorative pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-primary/5 transition-colors duration-700" />
        </motion.div>
    );
};
