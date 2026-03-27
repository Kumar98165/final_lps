import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface ModuleNodeProps {
    label: string;
    detail: string;
    icon: LucideIcon;
    path: string;
}

export const IndustrialModuleNode = ({ label, detail, icon: Icon, path }: ModuleNodeProps) => {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            onClick={() => navigate(path)}
            className="bg-white border border-slate-200 rounded-[2rem] p-6 text-left space-y-4 group transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-200/40"
        >
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <Icon size={24} strokeWidth={1.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{detail}</p>
                <h4 className="text-sm font-black text-slate-900 uppercase leading-snug group-hover:text-primary transition-colors">{label}</h4>
            </div>
        </button>
    );
};
