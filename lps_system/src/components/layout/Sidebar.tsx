import { useState } from 'react';
import {
    LayoutDashboard,
    Layers,
    Target,
    ClipboardList,
    Mail,
    Users,
    LogOut,
    Menu,
    ChevronLeft,
    X,
    Activity,
    Database,
    ClipboardCheck,
    AlertCircle
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { getUser, clearTokens } from '../../lib/storage';
import { UserRole } from '../../config/roles';
import logoLps from '../../assets/logo_lps.jpeg';

import {
    ADMIN_HOME,
    AUTH_LOGIN,
    ADMIN_LINES,
    ADMIN_MODELS,
    ADMIN_ASSIGNMENTS,
    ADMIN_DEMAND,
    ADMIN_ORDERS,
    ADMIN_USERS,
    ADMIN_AUDIT,
    ADMIN_PLANNING,
    DEO_DASHBOARD,
    DEO_MODELS,
    DEO_ENTRY,
    ADMIN_ISSUES,
    SUPERVISOR_ISSUES,
    DEO_ISSUES
} from '../../config/routePaths';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const user = getUser();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        clearTokens();
        navigate(AUTH_LOGIN);
    };

    const normalizeRole = (role?: string) => role?.toLowerCase() || '';

    const isAdmin = normalizeRole(user?.role) === normalizeRole(UserRole.ADMIN);
    const isManager = normalizeRole(user?.role) === normalizeRole(UserRole.MANAGER);

    // Configuration for Admin (Full Access)
    const adminSections = [
        {
            title: 'PRODUCTION OVERVIEW',
            items: [
                { icon: LayoutDashboard, label: 'Main Dashboard', path: ADMIN_HOME },
                { icon: Layers, label: 'Planning Chart', path: ADMIN_PLANNING },
            ]
        },
        {
            title: 'DEMAND MANAGEMENT',
            items: [
                { icon: Target, label: 'Demand management', path: ADMIN_DEMAND },
                { icon: Activity, label: 'Production Lines', path: ADMIN_LINES },
                { icon: Database, label: 'Car Models Assignment', path: ADMIN_ASSIGNMENTS },
                { icon: Mail, label: 'Order Requests', path: ADMIN_ORDERS },
                { icon: Target, label: 'New Registration Car Model', path: ADMIN_MODELS },
            ]
        },
        {
            title: 'SYSTEM',
            items: [
                { icon: Users, label: 'User Accounts', path: ADMIN_USERS },
                { icon: Activity, label: 'System Audit', path: ADMIN_AUDIT },
                { icon: AlertCircle, label: 'Support Hub', path: ADMIN_ISSUES },
            ]
        }
    ];

    // Configuration for Supervisor & Manager
    const supervisorNavigationItems = [
        {
            title: 'OVERSIGHT & VERIFICATION',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/supervisor/dashboard' },
                { icon: ClipboardCheck, label: 'Verify Daily Production', path: '/supervisor/verify' },
                { icon: AlertCircle, label: 'Issue tracker', path: SUPERVISOR_ISSUES },
            ]
        }
    ];

    const managerSections = supervisorNavigationItems;
    const supervisorSections = supervisorNavigationItems;

    // Configuration for DEO
    const deoSections = [
        {
            title: 'OPERATOR CONSOLE',
            items: [
                { icon: Activity, label: 'Dashboard', path: DEO_DASHBOARD },
                { icon: Database, label: 'My Assigned Models', path: DEO_MODELS },
                { icon: ClipboardList, label: 'Production Entry', path: DEO_ENTRY },
                { icon: AlertCircle, label: 'Report Issue', path: DEO_ISSUES },
            ]
        }
    ];

    // Select sections based on role
    const isSupervisor = normalizeRole(user?.role) === normalizeRole(UserRole.SUPERVISOR);
    const isDEO = normalizeRole(user?.role) === normalizeRole(UserRole.DEO);

    const sections = isAdmin ? adminSections :
        isManager ? managerSections :
            isSupervisor ? supervisorSections :
                isDEO ? deoSections : [];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            <div className={cn(
                "fixed inset-y-0 left-0 z-40 bg-white flex flex-col border-r border-slate-200/50 transition-transform duration-300 md:translate-x-0 md:static md:h-full shadow-2xl md:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full",
                isCollapsed ? "w-24" : "w-72"
            )}>
                {/* CIE Branding - Large Box Style */}
                <div className="p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-900 md:hidden"
                    >
                        <X size={20} />
                    </button>

                    <div className={cn(
                        "bg-[#F8E3D7]/30 border border-[#F8E3D7] rounded-xl p-4 flex items-center group transition-all duration-500 overflow-hidden relative mt-4 md:mt-0",
                        isCollapsed ? "justify-center px-0" : "justify-between"
                    )}>
                        {!isCollapsed && (
                            <img src={logoLps} alt="CIE" className="h-10 w-auto relative z-10 animate-in fade-in zoom-in-95 duration-500" />
                        )}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={cn(
                                "h-8 w-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-100 shadow-sm transition-all duration-500 hover:bg-white hover:scale-110 active:scale-95 hidden md:flex",
                                isCollapsed ? "" : "relative z-10"
                            )}
                        >
                            {isCollapsed ? <Menu size={14} className="text-slate-400" /> : <ChevronLeft size={14} className="text-slate-400" />}
                        </button>
                    </div>
                </div>

                {/* Navigation Sections */}
                <nav className="flex-1 px-6 py-2 space-y-10 overflow-y-auto pr-3 scrollbar-hide">
                    {sections.map((section: any, idx: number) => {
                        if (section.items.length === 0) return null;

                        return (
                            <div key={idx} className="space-y-4">
                                {!isCollapsed && (
                                    <h3 className="px-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-in slide-in-from-left-2 duration-500">
                                        {section.title}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {section.items.map((item: any) => {
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => onClose?.()}
                                                className={cn(
                                                    "flex items-center gap-4 px-4 py-3 rounded-[1.25rem] transition-all duration-300 relative group overflow-hidden",
                                                    isActive
                                                        ? "bg-[#F37021] text-white shadow-[0_10px_20px_-5px_rgba(243,112,33,0.4)]"
                                                        : "text-slate-500 hover:text-slate-900",
                                                    isCollapsed && "justify-center px-0"
                                                )}
                                            >
                                                <item.icon size={20} className={cn(
                                                    "transition-colors flex-shrink-0",
                                                    isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
                                                )} />
                                                {!isCollapsed && (
                                                    <span className="font-black text-[13px] tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-500">
                                                        {item.label}
                                                    </span>
                                                )}

                                                {/* Shine Effect on Active */}
                                                {isActive && (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Footer / User Profile Card */}
                <div className="p-6">
                    <div className={cn(
                        "px-4 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center group transition-all duration-500",
                        isCollapsed ? "justify-center px-0" : "justify-between"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary/20 flex-shrink-0">
                                {user?.username?.[0]?.toUpperCase() || 'A'}
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500">
                                    <span className="text-sm font-black text-slate-900 leading-none mb-1">{user?.username || 'admin'}</span>
                                    <span className="text-[10px] font-black text-[#F37021] uppercase tracking-widest">
                                        {user?.role?.toUpperCase() === 'MANAGER' ? 'SUPERVISOR' : (user?.role || 'ADMIN')}
                                    </span>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-300 hover:text-slate-900 transition-colors animate-in fade-in duration-700"
                            >
                                <LogOut size={20} className="transform rotate-180" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
