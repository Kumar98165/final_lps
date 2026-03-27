import { motion } from 'framer-motion';
import {
    Activity,
    Box,
    Shield,
    Search,
    Filter,
    Zap
} from 'lucide-react';
import {
    containerVariants,
    itemVariants,
    IndustrialDashboardHeader,
    IndustrialKPICard,
    IndustrialHealthPanel,
    IndustrialConsole
} from '../../../components/industrial';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { AdminMonitoringTable } from './AdminMonitoringTable';

const AdminDashboardPage = () => {
    const { summary, loading, error } = useAdminDashboard();

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#FAFBFC]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                    <span className="text-slate-400 font-black uppercase tracking-[0.4em] animate-pulse">Accessing Core Nodes...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#FAFBFC]">
                <div className="bg-white border border-slate-200 rounded-[3rem] p-12 text-center space-y-6 max-w-md shadow-xl">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto">
                        <Activity size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 uppercase">System Error</h3>
                        <p className="text-slate-400 font-bold">{error.message}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full h-14 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary transition-all shadow-lg"
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
            className="p-8 lg:p-12 space-y-10 bg-[#FAFBFC] min-h-screen flex flex-col"
        >
            {/* Architectural Header Section */}
            <IndustrialDashboardHeader
                badge="System Core"
                title={<>Industrial Node<br /><span className="text-slate-300">Operational</span></>}
                actions={
                    <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                        <button className="px-6 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02]">Overview</button>
                        <button className="px-6 py-2.5 text-slate-400 text-[11px] font-black uppercase tracking-wider hover:text-slate-900 transition-colors">Analytics</button>
                        <button className="px-6 py-2.5 text-slate-400 text-[11px] font-black uppercase tracking-wider hover:text-slate-900 transition-colors">Reports</button>
                    </div>
                }
            />

            {/* Industrial Data Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-2 gap-8">
                {[
                    { label: 'OEE Performance', val: summary?.oee || '0%', icon: Activity, detail: 'Shift: B' },
                    { label: 'Node Efficiency', val: summary?.node_efficiency || '0%', icon: Zap, detail: 'Uptime: 100%' },
                    { label: 'Production Units', val: summary?.production_units || '0', icon: Box, detail: 'Daily Target: 1,500' },
                    { label: 'Security Status', val: summary?.security_status || 'Syncing...', icon: Shield, detail: 'Access Level: Admin' },
                ].map((card, i) => (
                    <IndustrialKPICard
                        key={i}
                        label={card.label}
                        value={card.val}
                        icon={card.icon}
                        detail={card.detail}
                        trend="+12%"
                    />
                ))}
            </div>

            {/* Architectural Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Main Data Panel */}
                <motion.div variants={itemVariants} className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">System Console</h2>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Live Node</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Search size={18} /></button>
                            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Filter size={18} /></button>
                        </div>
                    </div>

                    <IndustrialConsole
                        title="Operational Excellence"
                        description="Architectural data grid optimized for industrial throughput. System monitoring is active with zero detected latencies in the primary data pipeline."
                    />
                </motion.div>

                {/* Secondary Status Panel */}
                <IndustrialHealthPanel
                    title="Node Health"
                    badge="Critical Metrics"
                    metrics={[
                        { label: 'CPU Utilization', val: '24%', perc: 24 },
                        { label: 'Memory Buffer', val: '68%', perc: 68 },
                        { label: 'Sync Status', val: 'Synchronized', perc: 100 },
                    ]}
                />
            </div>
            
            {/* Added Monitoring Table Below */}
            <AdminMonitoringTable />
        </motion.div>
    );
};

export default AdminDashboardPage;
