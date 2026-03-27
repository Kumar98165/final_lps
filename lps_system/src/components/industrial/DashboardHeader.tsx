import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Download } from 'lucide-react';
import { itemVariants } from './animations';

interface DashboardHeaderProps {
    badge: string;
    title: string | React.ReactNode;
    actions?: React.ReactNode;
    showDownload?: boolean;
}

export const IndustrialDashboardHeader = ({ badge, title, actions, showDownload = true }: DashboardHeaderProps) => {
    return (
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200/60 pb-10">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-12 bg-primary rounded-full" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{badge}</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                    {title}
                </h1>
            </div>

            <div className="flex items-center gap-3">
                {actions}
                {showDownload && (
                    <button className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
                        <Download size={20} />
                    </button>
                )}
            </div>
        </motion.div>
    );
};
