import { motion } from 'framer-motion';
import {
    Calendar,
    TrendingUp,
    Target,
    CheckCircle2,
    AlertTriangle,
    Activity,
    Clock,
    Box,
    Shield,
    Search
} from 'lucide-react';
import GChartGrid from './components/GChartGrid';
import { cn } from '../../lib/utils';
import {
    containerVariants,
    itemVariants,
    IndustrialDashboardHeader,
    IndustrialKPICard,
    IndustrialHealthPanel,
    IndustrialConsole,
    IndustrialModuleNode
} from '../../components/industrial';
import { useManagerDashboard } from './hooks/useManagerDashboard';

const ManagerDashboardPage = () => {
    const { summary, gChartData, loading } = useManagerDashboard();

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#FAFBFC]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-slate-400 font-black uppercase tracking-[0.4em] animate-pulse">Synchronizing Daily Plan...</span>
                </div>
            </div>
        );
    }


    const kpis = [
        { label: 'Plan Adherence', value: `${summary?.plan_adherence || 94}%`, detail: 'In Sync', icon: Target, color: 'text-[#F37021]', trend: '+1.2%' },
        { label: 'Daily Throughput', value: summary?.daily_target || 45, detail: '+2 v/h', icon: TrendingUp, color: 'text-emerald-500', trend: '+4%' },
        { label: 'Completed Today', value: '32', detail: '71% Done', icon: CheckCircle2, color: 'text-blue-500', trend: 'On Track' },
        { label: 'Critical Gaps', value: '1', detail: 'Paint Shop', icon: AlertTriangle, color: 'text-rose-500', trend: 'Urgent' },
    ];

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-4 lg:p-12 space-y-8 lg:space-y-12 bg-[#FAFBFC] min-h-screen flex flex-col"
        >
            {/* Architectural Header */}
            <IndustrialDashboardHeader
                badge="Production Control"
                title={<>Supervisor<br /><span className="text-slate-300">Dashboard</span></>}
                actions={
                    <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02]">
                            <Calendar size={14} />
                            <span>Select Month</span>
                        </button>
                        <button className="px-6 py-2.5 text-slate-400 text-[11px] font-black uppercase tracking-wider hover:text-slate-900 transition-colors">Export Plan</button>
                    </div>
                }
            />

            {/* Industrial Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-8">
                {kpis.map((kpi, i) => (
                    <IndustrialKPICard
                        key={i}
                        label={kpi.label}
                        value={kpi.value}
                        icon={kpi.icon}
                        detail={kpi.detail}
                        trend={kpi.trend}
                        color={kpi.color}
                    />
                ))}
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-10">
                {/* Main Data Panel & Module Access */}
                <motion.div variants={itemVariants} className="xl:col-span-2 space-y-8">
                    {/* Management Nodes Area */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Management Nodes</h2>
                            <div className="h-0.5 flex-1 bg-slate-200/60 rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                            {[
                                { label: 'New Demand Car Model', path: '/admin/models', icon: Box, detail: 'Model Management' },
                                { label: 'Production Planning', path: '/admin/planning', icon: Activity, detail: 'Shift Orchestration' },
                                { label: 'User Accounts', path: '/admin/users', icon: Shield, detail: 'Quality Control' },
                            ].map((module, i) => (
                                <IndustrialModuleNode
                                    key={i}
                                    label={module.label}
                                    detail={module.detail}
                                    icon={module.icon}
                                    path={module.path}
                                />
                            ))}
                        </div>
                    </div>

                    {/* G-Chart Monitoring Section */}
                    <div className="space-y-8 pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Shop G-Charts</h2>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Live Tracking</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                                    <span>Target Met</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                                    <span>Shortage</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-[3rem] p-4 md:p-10 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
                            <div className="relative z-10 overflow-x-auto">
                                <div className="min-w-[500px]">
                                    <GChartGrid data={gChartData} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Industrial Console / Operational Excellence */}
                    <IndustrialConsole
                        title="Operational Excellence"
                        description="Architectural data grid optimized for industrial throughput. System monitoring is active with zero detected latencies in the primary data pipeline."
                    />

                    {/* Industrial Shift Console */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                        {[
                            { title: 'Shift A: Logistics Delay', desc: 'Minor disruption in chassis delivery between 08:30 - 09:15. Compensation plan active in Shift B.', status: 'RESOLVED', icon: Clock },
                            { title: 'Shift B: Target Boost', desc: 'Line efficiency increased to 98%. Recovered 4 units against morning shortage.', status: 'ACTIVE', icon: Activity },
                        ].map((note, i) => (
                            <div key={i} className="p-8 bg-white border border-slate-200 rounded-[2rem] hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 transition-colors group-hover:text-primary text-slate-400 bg-slate-50 rounded-xl">
                                        <note.icon size={20} />
                                    </div>
                                    <span className={cn("text-[10px] font-black px-3 py-1 rounded-full", note.status === 'ACTIVE' ? 'bg-orange-50 text-primary' : 'bg-emerald-50 text-emerald-600')}>
                                        {note.status}
                                    </span>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 mb-2">{note.title}</h4>
                                <p className="text-sm text-slate-500 font-bold leading-relaxed">{note.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Right Analytics Panel */}
                <motion.div variants={itemVariants} className="space-y-8">
                    <IndustrialHealthPanel
                        title="System Health"
                        badge="Operational OEE"
                        mainVal="94.5%"
                        metrics={[
                            { label: 'Quality Index', val: '99.2%', perc: 99 },
                            { label: 'Availability', val: '96.8%', perc: 96 },
                            { label: 'Performance', val: '88.4%', perc: 88 },
                        ]}
                        icon={Activity}
                        customActionLabel="Advanced Telemetry"
                    />

                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-xl transition-all group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                <Search size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase">Search Records</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Vault</p>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="NODE ID / VIN..."
                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest outline-none focus:border-primary/30 transition-all"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ManagerDashboardPage;
