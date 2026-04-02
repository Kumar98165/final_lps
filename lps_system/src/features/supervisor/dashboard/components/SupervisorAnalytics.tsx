import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { Activity, Target, ClipboardList } from 'lucide-react';

interface SupervisorAnalyticsProps {
    assignedModels: any[];
    verifications: any[];
}

const COLORS = {
    indigo: '#6366F1',
    emerald: '#10B981',
    amber: '#F59E0B',
    rose: '#EF4444',
    slate: '#94A3B8',
    orange: '#F37021',
};

export const SupervisorAnalytics = ({ assignedModels, verifications }: SupervisorAnalyticsProps) => {
    // 1. Model Performance Data (Actual vs Target) - Grouped Bar
    // Logic Sync: If a model is verified/completed, produced units match planned units (e.g. 100/100)
    const performanceData = assignedModels
        .map(m => {
            const planned = m.target_quantity || m.planned_qty || 0;
            const modelLogs = verifications.filter(v => v.car_model_id === m.id || v.model_name === m.name);
            const isVerified = modelLogs.some(v => v.status === 'VERIFIED' || v.status === 'APPROVED' || v.status === 'READY' || v.status === 'DONE');
            
            // Recharts hover fix: Use unique name key by appending ID if name is repeated
            const displayName = m.name.length > 8 ? m.name.substring(0, 8) + '..' : m.name;
            
            return {
                id: m.id,
                name: displayName,
                uniqueKey: `${m.name}_${m.id}`, // Unique key for internal identification
                produced: isVerified ? planned : (m.actual_qty || 0),
                planned: planned,
            };
        })
        .filter(m => m.planned > 0)
        .slice(0, 15); // Increased slice to 15 for better density in "All Lines" view

    // 2. Workforce Deployment Data (Active vs Idle) - Radial Donut
    const uniqueDeos = Array.from(new Set(assignedModels.map(m => m.assigned_deo_name).filter(Boolean)));
    const activeDeoNames = Array.from(new Set(assignedModels.filter(m => (m.actual_qty || 0) > 0).map(m => m.assigned_deo_name)));
    const idleCount = uniqueDeos.length - activeDeoNames.length;

    const safeWorkforceData = [
        { name: 'Working', value: activeDeoNames.length, color: COLORS.emerald },
        { name: 'Idle', value: idleCount >= 0 ? idleCount : 0, color: COLORS.orange },
    ].filter(d => d.value > 0);

    const finalWorkforceData = safeWorkforceData.length > 0 ? safeWorkforceData : [{ name: 'No data', value: 1, color: '#f1f5f9' }];

    // 3. Production Status Monitor (Model Counts) - Stacked Bar
    const statusAggregation = assignedModels.reduce((acc, m) => {
        const line = m.line_name || 'Others';
        if (!acc[line]) acc[line] = { name: line, verified: 0, awaiting: 0, in_progress: 0 };
        
        const modelLogs = verifications.filter(v => v.car_model_id === m.id || v.model_name === m.name);
        const isVerified = modelLogs.some(v => v.status === 'VERIFIED' || v.status === 'APPROVED' || v.status === 'READY' || v.status === 'DONE');
        const isAwaiting = modelLogs.some(v => v.status === 'SUBMITTED' || v.status === 'PENDING');

        if (isVerified) acc[line].verified += 1;
        else if (isAwaiting) acc[line].awaiting += 1;
        else acc[line].in_progress += 1;
        
        return acc;
    }, {} as any);

    const statusChartData = Object.values(statusAggregation).sort((a: any, b: any) => a.name.localeCompare(b.name));

    const renderHeader = (title: string, subtitle: string, icon: any, bgColor: string) => (
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center text-white shadow-sm`}>
                {icon}
            </div>
            <div>
                <h3 className="text-[11px] font-black text-slate-800 leading-none uppercase tracking-tight">{title}</h3>
                <p className="text-[9px] font-bold text-slate-400 mt-1">{subtitle}</p>
            </div>
        </div>
    );

    const cardClass = "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-[320px] transition-all hover:shadow-md";

    return (
        <div className="space-y-5 pb-8 font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Model Performance (Grouped Bar Chart) */}
                <div className={cardClass}>
                    {renderHeader("Model performance", "Planned vs produced comparison", <Target size={16} />, "bg-[#F37021]")}
                    <div className="flex-1 w-full overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }} barGap={6}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }} 
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }} />
                                <Tooltip 
                                    cursor={{ fill: '#F8FAFC' }} 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} 
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '8px' }} formatter={(v) => <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{v} units</span>} />
                                <Bar dataKey="produced" fill={COLORS.emerald} radius={[3, 3, 0, 0]} barSize={20} name="produced" />
                                <Bar dataKey="planned" fill={COLORS.orange} radius={[3, 3, 0, 0]} barSize={20} name="planned" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Workforce Deployment */}
                <div className={cardClass}>
                    {renderHeader("Workforce deployment", "Operator activity monitor", <Activity size={16} />, "bg-indigo-500")}
                    <div className="flex-1 w-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={finalWorkforceData}
                                    cx="50%" cy="50%"
                                    innerRadius={65} outerRadius={95}
                                    paddingAngle={8} dataKey="value"
                                    stroke="none" cornerRadius={6}
                                >
                                    {finalWorkforceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center mt-8 pointer-events-none">
                            <span className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{activeDeoNames.length.toString().padStart(2, '0')}</span>
                            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Active floor</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Production Status Monitor (Model Counts) */}
            <div className={`${cardClass} h-[360px]`}>
                {renderHeader("Production status monitor", "Model distribution by verification state", <ClipboardList size={16} />, "bg-emerald-500")}
                <div className="flex-1 w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusChartData} margin={{ top: 5, right: 30, left: -20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px' }} formatter={(v) => <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{v.replace('_', ' ')}</span>} />
                            <Bar dataKey="verified" stackId="a" fill={COLORS.emerald} radius={[0, 0, 0, 0]} barSize={35} name="Ready / verified models" />
                            <Bar dataKey="awaiting" stackId="a" fill={COLORS.orange} radius={[0, 0, 0, 0]} barSize={35} name="Awaiting review" />
                            <Bar dataKey="in_progress" stackId="a" fill="#E2E8F0" radius={[5, 5, 0, 0]} barSize={35} name="Pending setup" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
