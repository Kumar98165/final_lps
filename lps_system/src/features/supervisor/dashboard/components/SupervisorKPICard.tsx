import { LucideIcon } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface SupervisorKPICardProps {
    title: string;
    value: any;
    icon: LucideIcon;
    color: string;
}

export const SupervisorKPICard = ({ title, value, icon: Icon, color }: SupervisorKPICardProps) => (
    <div className="card-industrial flex items-center gap-8">
        <div className={cn("w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", color)}>
            <Icon size={40} strokeWidth={1.5} />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">{title}</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
        </div>
    </div>
);
