import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Terminal } from 'lucide-react';
import { itemVariants } from './animations';

interface HealthMetric {
    label: string;
    val: string;
    perc: number;
}

interface HealthPanelProps {
    title: string;
    badge: string;
    metrics: HealthMetric[];
    mainVal?: string;
    icon?: LucideIcon;
    customActionLabel?: string;
    onCustomAction?: () => void;
}

export const IndustrialHealthPanel = ({
    title,
    badge,
    metrics,
    mainVal,
    icon: Icon,
    customActionLabel,
    onCustomAction
}: HealthPanelProps) => {
    return (
        <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">{title}</h2>

            <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-10 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
                <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{badge}</span>
                    </div>
                    {mainVal ? (
                        <h3 className="text-6xl font-black tracking-tighter italic">{mainVal}</h3>
                    ) : (
                        <h3 className="text-3xl font-black tracking-tighter uppercase leading-tight">{title}</h3>
                    )}
                </div>

                <div className="space-y-8 relative z-10">
                    {metrics.map((row, i) => (
                        <div key={i} className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{row.label}</span>
                                <span className="text-sm font-black text-white">{row.val}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${row.perc}%` }}
                                    transition={{ delay: i * 0.2 + 0.5, duration: 1 }}
                                    className="h-full bg-primary shadow-[0_0_10px_rgba(243,112,33,0.5)]"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-6 relative z-10">
                    <button
                        onClick={onCustomAction}
                        className="w-full h-16 bg-white/5 border border-white/10 rounded-[1.5rem] flex items-center justify-center gap-3 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        {Icon ? <Icon size={16} className="text-primary" /> : <Terminal size={14} />}
                        {customActionLabel || 'View Details'}
                    </button>
                </div>

                {/* Background flare */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] -mr-32 -mt-32" />
            </div>
        </motion.div>
    );
};
