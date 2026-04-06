import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    ShieldCheck,
    Shield,
    Briefcase,
    Clock,
    Search,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    LayoutGrid,
    Users,
    LogIn,
    LogOut,
    Edit,
    Trash2,
    AlertCircle,
    Globe,
    Zap,
    TrendingUp
} from 'lucide-react';
import { API_BASE } from '../../lib/apiConfig';
import { getToken } from '../../lib/storage';

interface AuditStat {
    role: string;
    total: number;
    active: number;
    inactive: number;
}

interface AuditLogEntry {
    id: number;
    userId: number;
    username: string;
    action: string;
    ipAddress: string;
    timestamp: string;
    userStatus: string;
}

const AdminAuditPage: React.FC = () => {
    const [stats, setStats] = useState<AuditStat[]>([]);
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalActionsToday, setTotalActionsToday] = useState(0);

    const fetchData = async (pageNum = 1) => {
        try {
            const token = getToken();
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch Stats
            const statsRes = await fetch(`${API_BASE}/admin/audit/stats`, { headers });
            const statsData = await statsRes.json();
            if (statsData.success) {
                setStats(statsData.data);
            }

            // Fetch Logs with optional search filter
            const searchParam = searchTerm ? `&search=${searchTerm}` : '';
            const logsRes = await fetch(`${API_BASE}/admin/audit/list?page=${pageNum}${searchParam}`, { headers });
            const logsData = await logsRes.json();
            if (logsData.success) {
                setLogs(logsData.data.logs);
                setTotalPages(logsData.data.pages);
                setPage(logsData.data.current_page);
                setTotalActionsToday(logsData.data.total || logsData.data.logs.length);
            }
        } catch (error) {
            console.error('Failed to fetch audit data:', error);
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(page), 60000); // 1 minute
        return () => clearInterval(interval);
    }, [page]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchData(page);
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setPage(1);
    };

    const getRoleConfig = (role: string) => {
        const r = role.toUpperCase();
        if (r.includes('ADMIN')) return {
            icon: <ShieldCheck size={20} className="text-white" />,
            gradient: 'from-rose-400 to-rose-600',
            glow: 'shadow-rose-500/30'
        };
        if (r.includes('MANAGER')) return {
            icon: <Briefcase size={20} className="text-white" />,
            gradient: 'from-amber-400 to-orange-500',
            glow: 'shadow-orange-500/30'
        };
        if (r.includes('DEO')) return {
            icon: <Activity size={20} className="text-white" />,
            gradient: 'from-blue-400 to-indigo-600',
            glow: 'shadow-blue-500/30'
        };
        return {
            icon: <LayoutGrid size={20} className="text-white" />,
            gradient: 'from-emerald-400 to-teal-500',
            glow: 'shadow-emerald-500/30'
        };
    };

    const getActionConfig = (action: string) => {
        const act = action.toUpperCase();
        if (act.includes('LOGIN')) return {
            icon: <LogIn size={14} />,
            bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        };
        if (act.includes('LOGOUT')) return {
            icon: <LogOut size={14} />,
            bg: 'bg-ind-bg text-ind-text2 border border-ind-border',
        };
        if (act.includes('DELETE')) return {
            icon: <Trash2 size={14} />,
            bg: 'bg-rose-50 text-rose-600 border border-rose-100',
        };
        if (act.includes('UPDATE')) return {
            icon: <Edit size={14} />,
            bg: 'bg-blue-50 text-blue-600 border border-blue-100',
        };
        if (act.includes('ERROR') || act.includes('FAIL')) return {
            icon: <AlertCircle size={14} />,
            bg: 'bg-amber-50 text-amber-600 border border-amber-100',
        };
        return {
            icon: <Zap size={14} />,
            bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
        };
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        return { time, date: dateStr };
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans">
            <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-4 pb-24 relative">
                {/* Decorative background blurs */}
                <div className="absolute top-0 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-40 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-ind-text2 uppercase tracking-widest">System Status</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-ind-text tracking-tight leading-tight mb-1">
                            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F37021] to-orange-400">Audit Trail</span>
                        </h1>
                        <p className="text-ind-text2 font-medium text-xs md:text-sm">Comprehensive activity monitoring and security verification across operations.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center px-3 py-2 bg-white rounded-xl border border-ind-border/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <span className="text-[9px] font-bold text-ind-text3 uppercase tracking-wider mb-0.5">Live Sync</span>
                            <span className="text-sm font-black text-slate-800 leading-none">60s</span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[13px] transition-all shadow-md hover:shadow-slate-900/20 disabled:opacity-70"
                        >
                            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                            Refresh Data
                        </motion.button>
                    </div>
                </motion.header>

                {/* Key Metrics Summary */}
                <section className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-xl border border-white rounded-xl py-2.5 px-3.5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Users size={16} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-ind-text2 uppercase tracking-widest leading-none mb-1">Active Users</h3>
                                <div className="text-xl font-black text-slate-800 leading-none">
                                    {stats.reduce((sum, s) => sum + s.active, 0)}
                                </div>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase tracking-wider">
                            Online
                        </span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/80 backdrop-blur-xl border border-white rounded-xl py-2.5 px-3.5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <TrendingUp size={16} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-ind-text2 uppercase tracking-widest leading-none mb-1">Total Users</h3>
                                <div className="text-xl font-black text-slate-800 leading-none">
                                    {stats.reduce((sum, s) => sum + s.total, 0)}
                                </div>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase tracking-wider">
                            Reg
                        </span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/80 backdrop-blur-xl border border-white rounded-xl py-2.5 px-3.5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Activity size={16} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-ind-text2 uppercase tracking-widest leading-none mb-1">Audit Events</h3>
                                <div className="text-xl font-black text-slate-800 leading-none">
                                    {totalActionsToday || logs.length}
                                </div>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-bold uppercase tracking-wider">
                            Today
                        </span>
                    </motion.div>
                </section>

                {/* Role Distribution */}
                <section className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 mt-4">
                        <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Shield size={12} />
                        </div>
                        <h2 className="text-sm font-extrabold text-ind-text tracking-tight">Role Distribution</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {isLoading ? (
                            [1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white rounded-xl p-3 shadow-sm animate-pulse h-16 border border-ind-border/50/50" />
                            ))
                        ) : stats.length > 0 ? (
                            stats.map((stat, idx) => {
                                const config = getRoleConfig(stat.role);
                                const activeRate = stat.total > 0 ? Math.round((stat.active / stat.total) * 100) : 0;
                                return (
                                    <motion.div
                                        key={stat.role}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + idx * 0.1 }}
                                        whileHover={{ y: -2 }}
                                        className="bg-white/80 backdrop-blur-md rounded-xl border border-white p-3 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-between"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}>
                                                    {React.cloneElement(config.icon as React.ReactElement<any>, { size: 14 })}
                                                </div>
                                                <div>
                                                    <h3 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight leading-none">{stat.role}</h3>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${stat.active > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                                        <span className="text-[9px] font-bold text-ind-text2 uppercase tracking-wider leading-none">{stat.active > 0 ? 'Active' : 'Offline'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-baseline justify-end gap-0.5">
                                                    <span className="text-[13px] font-black text-slate-800 leading-none">{stat.active}</span>
                                                    <span className="text-[9px] font-bold text-ind-text3 leading-none">/{stat.total}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full bg-ind-border/30 rounded-full h-1 overflow-hidden mt-1">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${activeRate}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className={`h-full bg-gradient-to-r ${config.gradient}`}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="col-span-4 bg-orange-50 border border-orange-100 p-3 rounded-xl text-center shadow-inner">
                                <p className="text-[10px] font-bold text-orange-800">No role data available at the moment.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Audit Logs Table */}
                <section className="relative z-10">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 md:p-5 border-b border-ind-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/10">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-ind-text tracking-tight leading-none">Activity Ledger</h2>
                                    <p className="text-[11px] text-ind-text2 font-medium mt-1">Real-time audit trail of system operations</p>
                                </div>
                            </div>

                            <div className="relative w-full md:max-w-xs group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ind-text3 group-focus-within:text-blue-500 transition-colors" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search user, action, IP..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full bg-ind-bg border border-ind-border focus:border-blue-400 focus:bg-white rounded-xl py-2 pl-9 pr-3 text-[11px] font-semibold text-slate-700 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto overflow-y-auto flex-1">
                            <table className="w-full text-left relative text-[11px]">
                                <thead className="sticky top-0 z-20">
                                    <tr className="bg-ind-bg/95 backdrop-blur-xl shadow-sm">
                                        <th className="px-5 py-2.5 text-left text-[10px] font-bold text-ind-text2 capitalize tracking-wide whitespace-nowrap">Timestamp</th>
                                        <th className="px-5 py-2.5 text-left text-[10px] font-bold text-ind-text2 capitalize tracking-wide">User Profile</th>
                                        <th className="px-5 py-2.5 text-left text-[10px] font-bold text-ind-text2 capitalize tracking-wide">Action Performed</th>
                                        <th className="px-5 py-2.5 text-left text-[10px] font-bold text-ind-text2 capitalize tracking-wide">Network / IP Address</th>
                                        <th className="px-5 py-2.5 text-center text-[10px] font-bold text-ind-text2 capitalize tracking-wide">Current Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80">
                                    {logs.length > 0 ? logs.map((log, idx) => {
                                        const { time, date } = formatTimestamp(log.timestamp);
                                        const actionConfig = getActionConfig(log.action);
                                        return (
                                            <motion.tr
                                                key={log.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="hover:bg-blue-50/30 transition-colors group"
                                            >
                                                <td className="px-5 py-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-ind-border/50 group-hover:bg-blue-400 transition-colors"></div>
                                                        <div>
                                                            <div className="text-[11px] font-extrabold text-slate-800 leading-none mb-0.5">{time}</div>
                                                            <div className="text-[9px] font-bold text-ind-text3 uppercase tracking-widest leading-none">{date}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
                                                            {log.username.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-700">{log.username}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-2">
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[9px] font-bold uppercase tracking-wider ${actionConfig.bg}`}>
                                                        {React.cloneElement(actionConfig.icon as React.ReactElement<any>, { size: 12 })}
                                                        {log.action}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-ind-text2 bg-ind-bg px-2 py-1 rounded-md w-fit border border-ind-border/50">
                                                        <Globe size={12} className="text-ind-text3" />
                                                        {log.ipAddress}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-2">
                                                    <div className="flex justify-center">
                                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm ${log.userStatus === 'ACTIVE'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-500/10'
                                                            : 'bg-ind-bg text-ind-text2 border-ind-border shadow-slate-500/10'
                                                            }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${log.userStatus === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-400'}`} />
                                                            {log.userStatus}
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-20 h-20 bg-ind-bg rounded-full flex items-center justify-center mb-4">
                                                        <Search size={32} className="text-ind-text3" />
                                                    </div>
                                                    <p className="text-base font-bold text-ind-text2 mb-1">No matching records found</p>
                                                    <p className="text-sm text-ind-text3 font-medium">Try adjusting your search criteria</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-8 py-5 bg-ind-bg/50 border-t border-ind-border/50 flex items-center justify-between">
                            <div className="text-sm font-semibold text-ind-text2">
                                Showing <span className="text-ind-text font-extrabold">Page {page}</span> of <span className="text-ind-text font-extrabold">{totalPages}</span>
                                <span className="mx-2 text-ind-text3">|</span>
                                <span className="text-ind-text font-extrabold">{logs.length}</span> records
                            </div>
                            <div className="flex items-center gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-ind-border bg-white hover:border-slate-300 text-slate-700 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-transparent bg-slate-900 hover:bg-[#F37021] text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminAuditPage;
