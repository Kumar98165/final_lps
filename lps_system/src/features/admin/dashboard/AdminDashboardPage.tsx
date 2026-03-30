import { motion } from 'framer-motion';
import { 
    Activity,
    LayoutDashboard,
    TrendingUp,
    FileText,
    Download
} from 'lucide-react';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

// Custom Components
import { StatsGrid } from './components/StatsGrid';
import { AdminMonitoringTable } from './AdminMonitoringTable';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
} as const;

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 } as const
    }
} as const;

const AdminDashboardPage = () => {
    const { summary, loading, error } = useAdminDashboard();

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#FAFBFC] min-h-screen">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                    <span className="text-slate-400 font-black uppercase tracking-[0.4em] animate-pulse">Initializing Dashboard Core...</span>
                </div>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#FAFBFC] min-h-screen">
                <div className="bg-white border border-slate-200 rounded-[3rem] p-12 text-center space-y-6 max-w-md shadow-xl">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto">
                        <Activity size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 uppercase">System Error</h3>
                        <p className="text-slate-400 font-bold">{error?.message || 'Failed to load system metrics'}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full h-14 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
                    >
                        Re-initialize System
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-6 lg:p-10 space-y-8 bg-[#FAFBFC] min-h-screen"
        >
            {/* Professional Header Section */}
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200/60 pb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-12 bg-slate-900 rounded-full" />
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">System Overview</span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                        Admin<br /><span className="text-slate-300">Monitoring</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-slate-900/20 transition-all">
                            <LayoutDashboard size={14} /> Overview
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2.5 text-slate-400 text-[11px] font-black uppercase tracking-wider hover:text-slate-900 transition-colors">
                            <TrendingUp size={14} /> Analytics
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2.5 text-slate-400 text-[11px] font-black uppercase tracking-wider hover:text-slate-900 transition-colors">
                            <FileText size={14} /> Reports
                        </button>
                    </div>
                    <button className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm group">
                        <Download size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </motion.div>

            {/* Top KPI Cards (Stats Grid) */}
            <StatsGrid summary={summary} />

            {/* Production Monitoring Table */}
            <AdminMonitoringTable />
        </motion.div>
    );
};

export default AdminDashboardPage;
