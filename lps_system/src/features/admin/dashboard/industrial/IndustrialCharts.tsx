import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend, Cell, ComposedChart, Line
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Target, Activity } from 'lucide-react';

interface ChartProps {
    productionData: any[];
    stats: any;
    allModels: string[];
}

export const IndustrialChartsHub: React.FC<ChartProps> = ({ productionData, stats, allModels }) => {
    // 1. Mock Time-Series Data for "Production Trend" (Line/Area)
    // In a real app, this would come from a /timeseries endpoint
    const trendData = [
        { time: '08:00', actual: 12, target: 15 },
        { time: '10:00', actual: 28, target: 30 },
        { time: '12:00', actual: 45, target: 45 },
        { time: '14:00', actual: 62, target: 60 },
        { time: '16:00', actual: 78, target: 75 },
        { time: '18:00', actual: 95, target: 90 },
        { time: '20:00', actual: 110, target: 105 },
    ];

    // 2. Model Performance Data (Similar to User's Reference Image)
    const modelData = allModels.slice(0, 8).map(model => ({
        name: model,
        produced: Math.floor(Math.random() * 40) + 10,
        defects: Math.floor(Math.random() * 5),
        target: 50
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-md border border-ind-border p-3 rounded-xl shadow-xl ring-4 ring-black/5 animate-in fade-in zoom-in duration-200">
                    <p className="text-[0.6rem] font-black text-ind-text3 uppercase tracking-widest mb-2 border-b border-ind-border/50 pb-1">{label}</p>
                    {payload.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="text-[0.65rem] font-bold text-ind-text2 uppercase">{p.name}</span>
                            </div>
                            <span className="text-[0.7rem] font-black text-ind-text">{p.value} UNITS</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 overflow-hidden">
            {/* 1. Production Trend Card */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-ind-border rounded-[2rem] p-8 shadow-sm flex flex-col h-[400px] relative group"
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-ind-blue flex items-center justify-center shadow-sm">
                            <Activity size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Operational Velocity</h3>
                            <p className="text-[0.65rem] font-bold text-ind-text3 uppercase tracking-widest">Real-time Production Trend vs Target</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[0.6rem] font-black tracking-widest">LIVE DATA FEED</span>
                    </div>
                </div>

                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="time" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <Area 
                                type="monotone" 
                                dataKey="actual" 
                                name="Produced"
                                stroke="#3b82f6" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorActual)" 
                                animationDuration={1500}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="target" 
                                name="Target"
                                stroke="#94a3b8" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill="transparent"
                                animationDuration={1500}
                                animationBegin={300}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* 2. Model Performance Card (Combined Bar/Line style from Image 2) */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-ind-border rounded-[2rem] p-8 shadow-sm flex flex-col h-[400px] group"
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-ind-primary flex items-center justify-center shadow-sm">
                            <BarChart3 size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Segment Intelligence</h3>
                            <p className="text-[0.65rem] font-bold text-ind-text3 uppercase tracking-widest">Model Distribution & Defect Analysis</p>
                        </div>
                    </div>
                    <div className="bg-ind-bg px-4 py-2 rounded-xl border border-ind-border/50 flex items-center gap-3">
                        <span className="text-[0.6rem] font-black text-ind-text2 tracking-widest">TOTAL MODELS:</span>
                        <span className="text-sm font-black text-ind-primary">{allModels.length}</span>
                    </div>
                </div>

                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={modelData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="produced" 
                                name="Production"
                                radius={[6, 6, 0, 0]} 
                                barSize={24}
                                animationDuration={1000}
                            >
                                {modelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#F37021' : '#fb923c'} />
                                ))}
                            </Bar>
                            <Line 
                                type="monotone" 
                                dataKey="target" 
                                name="Line Target"
                                stroke="#10b981" 
                                strokeWidth={3}
                                dot={{ r: 4, fill: 'white', strokeWidth: 2 }}
                                animationDuration={1500}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
};
