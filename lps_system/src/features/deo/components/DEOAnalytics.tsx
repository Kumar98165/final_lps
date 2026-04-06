import { useMemo, useState } from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
    LabelList,
    AreaChart,
    Area
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, LineChart as ChartIcon } from 'lucide-react';

interface DEOAnalyticsProps {
    assignedModels: any[];
    submissionHistory: any[];
    selectedDate: string;
}

const COLORS = {
    indigo: '#6366F1',
    emerald: '#10B981',
    amber: '#F59E0B',
    rose: '#EF4444',
    slate: '#94A3B8',
    orange: '#F37021',
    blue: '#3b82f6',
};

export const DEOAnalytics = ({ assignedModels, submissionHistory, selectedDate }: DEOAnalyticsProps) => {
    // 0. Filter submission history for the selected date
    const dateStr = new Date(selectedDate).toISOString().split('T')[0];
    const todaysSubmissions = submissionHistory.filter(s => s.date?.split('T')[0] === dateStr);

    // 1. Aggregated Model Performance (Grouped by Name)
    const performanceData = useMemo(() => {
        const groups: Record<string, { name: string; output: number; planned: number }> = {};

        assignedModels.forEach(m => {
            const shortName = m.name.length > 8 ? m.name.substring(0, 8) + '..' : m.name;
            if (!groups[m.name]) {
                groups[m.name] = {
                    name: shortName,
                    output: 0,
                    planned: 0
                };
            }

            const modelPlanned = (m.target_quantity || m.planned_qty || 0);
            groups[m.name].planned += modelPlanned;

            const isCompleted = ['READY', 'COMPLETED', 'VERIFIED'].includes(m.status?.toUpperCase() || '');

            if (isCompleted) {
                groups[m.name].output += modelPlanned;
            } else {
                const modelSubmissions = todaysSubmissions.filter(s =>
                    (s.car_model_id === m.id || s.model_name === m.name)
                );

                const producedQty = modelSubmissions.reduce((sum, s) => {
                    const count = s.log_data
                        ? (Array.isArray(s.log_data)
                            ? s.log_data.length
                            : (s.log_data.rows ? s.log_data.rows.length : 0))
                        : 0;
                    return sum + count;
                }, 0);

                groups[m.name].output += producedQty;
            }
        });

        return Object.values(groups)
            .filter(g => g.planned > 0 || g.output > 0)
            .sort((a, b) => b.output - a.output)
            .slice(0, 8);
    }, [assignedModels, todaysSubmissions]);

    // 2. Model Status Mix (Accepted vs Pending vs Rejected)
    const statusData = useMemo(() => {
        const accepted = assignedModels.filter(m => ['READY', 'COMPLETED', 'VERIFIED'].includes(m.status?.toUpperCase() || '')).length;
        const rejected = assignedModels.filter(m => m.status?.toUpperCase() === 'REJECTED').length;
        const pending = assignedModels.filter(m => m.deo_accepted && !['READY', 'COMPLETED', 'VERIFIED', 'REJECTED'].includes(m.status?.toUpperCase() || '')).length;

        return [
            { name: 'Accepted', value: accepted, color: COLORS.emerald },
            { name: 'Pending', value: pending, color: COLORS.amber },
            { name: 'Rejected', value: rejected, color: COLORS.rose }
        ].filter(d => d.value > 0);
    }, [assignedModels]);

    // 3. Historical Production Trend (Week/Month)
    const [timeframe, setTimeframe] = useState<'week' | 'month'>('month');

    const trendData = useMemo(() => {
        if (timeframe === 'month') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyCounts = months.map(m => ({ name: m, production: 0, models: {} as any }));
            
            submissionHistory.forEach(s => {
                const date = new Date(s.date);
                const monthIdx = date.getMonth();
                const qty = s.log_data 
                    ? (Array.isArray(s.log_data) ? s.log_data.length : (s.log_data.rows ? s.log_data.rows.length : 1)) 
                    : 1;
                monthlyCounts[monthIdx].production += qty;
                const modelName = s.model_name || 'Unknown';
                monthlyCounts[monthIdx].models[modelName] = (monthlyCounts[monthIdx].models[modelName] || 0) + qty;
                
                // Track unique model count
                const currentModels = Object.keys(monthlyCounts[monthIdx].models);
                (monthlyCounts[monthIdx] as any).modelCount = currentModels.length;
            });
            return monthlyCounts;
        } else {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayCounts: any[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                dayCounts.push({ 
                    name: days[d.getDay()], 
                    fullDate: d.toISOString().split('T')[0],
                    production: 0,
                    models: {} as any
                });
            }

            submissionHistory.forEach(s => {
                const sDate = s.date?.split('T')[0];
                const match = dayCounts.find(d => d.fullDate === sDate);
                if (match) {
                    const qty = s.log_data 
                        ? (Array.isArray(s.log_data) ? s.log_data.length : (s.log_data.rows ? s.log_data.rows.length : 1)) 
                        : 1;
                    match.production += qty;
                    const modelName = s.model_name || 'Unknown';
                    match.models[modelName] = (match.models[modelName] || 0) + qty;
                    
                    // Track unique model count
                    const currentModels = Object.keys(match.models);
                    (match as any).modelCount = currentModels.length;
                }
            });
            return dayCounts;
        }
    }, [submissionHistory, timeframe]);

    const renderHeader = (title: string, subtitle: string, icon: any, bgColor: string) => (
        <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center text-white shadow-sm border border-white/10`}>
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-black text-ind-text leading-none uppercase tracking-tight">{title}</h3>
                <p className="text-[10px] font-bold text-ind-text3 mt-1.5 uppercase tracking-widest">{subtitle}</p>
            </div>
        </div>
    );

    const CustomTrendTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const modelEntries = Object.entries(data.models || {});
            return (
                <div className="bg-white/95 backdrop-blur-2xl border border-white/40 p-5 rounded-[1.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-ind-primary mb-3">{data.name}</p>
                    <div className="space-y-2">
                        {modelEntries.length > 0 ? (
                            modelEntries.map(([name, qty]: any) => (
                                <div key={name} className="flex items-center gap-6 justify-between min-w-[140px]">
                                    <span className="text-[10px] font-bold text-ind-text2 uppercase tracking-tight">{name} FINISHED:</span>
                                    <span className="text-[10px] font-black text-ind-text">{qty}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] font-bold text-ind-text3 uppercase italic">No production logged</p>
                        )}
                        {data.production > 0 && (
                            <div className="mt-3 pt-3 border-t border-ind-border/50/50 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">MODELS ASSIGNED:</span>
                                    <span className="text-[10px] font-black text-ind-text">{data.modelCount || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">TOTAL PRODUCTION:</span>
                                    <span className="text-[10px] font-black text-ind-text">{data.production} Units</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    const cardClass = "bg-white rounded-[1.5rem] p-8 border border-ind-border/50 shadow-sm flex flex-col h-[400px] transition-all hover:shadow-md";

    return (
        <div className="space-y-6 pb-12 font-sans">
            {/* 1. Primary Production Progress Chart */}
            <div className={cardClass}>
                {renderHeader("Production Progress", "Quantity Produced vs Planned Target", <TrendingUp size={20} />, "bg-[#0f172a]")}
                <div className="flex-1 w-full overflow-hidden mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 'bold' }} cursor={{ fill: '#f8fafc' }} />
                            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                            <Bar name="Produced" dataKey="output" fill={COLORS.orange} radius={[6, 6, 0, 0]} barSize={40}>
                                <LabelList dataKey="output" position="top" style={{ fill: '#F37021', fontSize: 10, fontWeight: 900 }} offset={10} />
                            </Bar>
                            <Bar name="Planned" dataKey="planned" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={40}>
                                <LabelList dataKey="planned" position="top" style={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} offset={10} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Operational Status Mix & Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${cardClass} h-auto`}>
                    {renderHeader("Order Status Mix", "Overall Assignment Distribution", <PieIcon size={20} />, "bg-indigo-500")}
                    <div className="flex items-center justify-around h-full py-4 relative">
                        <div className="w-1/2 h-[200px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" cornerRadius={6}>
                                        {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-3 pl-4">
                            {statusData.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-[10px] font-bold text-ind-text2 uppercase tracking-widest">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-700">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`${cardClass} h-auto`}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <ChartIcon size={16} className="text-blue-500" />
                                <h3 className="text-xs font-black text-ind-text uppercase tracking-tight">Production Trend</h3>
                            </div>
                            <p className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest">Historical Performance</p>
                        </div>
                        <div className="flex bg-ind-border/30 p-1 rounded-xl">
                            {['week', 'month'].map((t) => (
                                <button key={t} onClick={() => setTimeframe(t as any)} className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-lg transition-all ${timeframe === t ? 'bg-white shadow-sm text-blue-600' : 'text-ind-text3 hover:text-ind-text2'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 w-full h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }} />
                                <Tooltip content={<CustomTrendTooltip />} />
                                <Area type="monotone" dataKey="production" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProd)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
