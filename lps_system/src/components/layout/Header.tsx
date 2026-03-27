import { User, ChevronRight, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getUser } from '../../lib/storage';

interface HeaderProps {
    onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
    const user = getUser();
    const location = useLocation();

    // Breadcrumb logic
    const pathParts = location.pathname.split('/').filter(Boolean);
    const mainSectionRaw = pathParts[0]?.toUpperCase() || 'SYSTEM';
    const mainSection = mainSectionRaw === 'MANAGER' ? 'SUPERVISOR' : mainSectionRaw;
    const subSection = pathParts[1]?.toUpperCase() || 'DASHBOARD';
    const displayRole = user?.role?.toUpperCase() === 'MANAGER' ? 'SUPERVISOR' : (user?.role || 'Restricted');

    return (
        <header className="h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 px-6 md:px-10 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] sticky top-0 z-50">
            {/* Navigation Context / Breadcrumbs */}
            <div className="flex items-center gap-4 md:gap-6">
                <button
                    onClick={onMenuToggle}
                    className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <Menu size={24} />
                </button>

                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] hidden sm:inline">{mainSection}</span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] sm:hidden">APP</span>
                    <ChevronRight size={14} className="text-slate-200" />
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">{subSection}</span>
                </div>

                <div className="h-8 w-[1px] bg-slate-100 mx-4 hidden lg:block" />
            </div>

            {/* Identity Only */}
            <div className="flex items-center gap-4 md:gap-8">
                {/* Refined Identity Node */}
                <div className="flex items-center gap-5 group cursor-pointer pl-2">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-black text-slate-900 leading-none tracking-tight mb-1">{user?.name || user?.username || 'Guest'}</p>
                        <div className="flex items-center justify-end gap-2">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{displayRole}</p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white border border-slate-800 shadow-xl group-hover:scale-105 group-hover:bg-primary transition-all duration-300 overflow-hidden ring-4 ring-transparent group-hover:ring-primary/10">
                            <User size={18} strokeWidth={2.5} />
                            {/* Metallic Sweep Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
