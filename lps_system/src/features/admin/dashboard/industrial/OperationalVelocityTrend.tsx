import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

interface VelocityTrendProps {
    productionTotal: number;
    efficiency: number;
    data?: any[];
}

export const OperationalVelocityTrend: React.FC<VelocityTrendProps> = ({ productionTotal, efficiency, data = [] }) => {
    const [period, setPeriod] = useState('MONTH');

    // 📈 JAN-JUL Fallback if DB is empty
    const fallbackData = [
        { name: 'JAN', actual: 184, target: 210 },
        { name: 'FEB', actual: 236, target: 240 },
        { name: 'MAR', actual: 368, target: 350 },
        { name: 'APR', actual: 290, target: 330 },
        { name: 'MAY', actual: 512, target: 480 },
        { name: 'JUN', actual: 442, target: 450 },
        { name: 'JUL', actual: 488, target: 500 },
    ];

    const chartData = data && data.length > 0 ? data : fallbackData;
    const isPlayback = !data || data.length === 0;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 flex flex-col h-[520px] mb-8 overflow-hidden relative border border-ind-border"
        >
            {/* Top Premium Intelligence Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                <div className="flex items-center gap-12">
                    <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-ind-text tracking-tighter font-sans">{productionTotal}</span>
                            {isPlayback ? (
                                <span className="text-[0.6rem] font-bold text-ind-g1 px-1.5 py-0.5 bg-ind-g1/10 rounded border border-ind-g1/20 uppercase">Simulation</span>
                            ) : (
                                <span className="text-[0.6rem] font-bold text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20 uppercase">Live Performance</span>
                            )}
                        </div>
                        <p className="text-[10px] font-black text-ind-text2 uppercase tracking-[0.25em]">Units Produced</p>
                    </div>
                    
                    <div className="space-y-1 border-l border-ind-border pl-12">
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black text-ind-text tracking-tighter font-sans">{efficiency.toFixed(1)}%</span>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-600 text-[9px] font-black uppercase tracking-tight">
                                <span>↑</span>
                                <span>Optimal</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-ind-text2 uppercase tracking-[0.25em]">Efficiency Rate</p>
                    </div>
                </div>

                <div className="flex bg-ind-border/30 p-1 rounded-2xl border border-ind-border">
                    {['YEAR', 'MONTH', 'WEEK'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all duration-300 tracking-[0.1em] ${
                                period === p 
                                ? 'bg-[#F37021] text-white shadow-lg shadow-orange-500/20' 
                                : 'text-ind-text2 hover:text-slate-700'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Area Chart Container */}
            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F37021" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#F37021" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#64748b" opacity={0.1} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b', letterSpacing: '0.15em' }}
                            dy={15}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }}
                            domain={[0, 'auto']}
                        />
                        
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#FFFFFF', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '16px', 
                                padding: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#64748B', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
                            cursor={{ stroke: '#e2e8f0' }}
                        />

                        {/* Velocity Curve (Project Orange) - Only Actual Output Shown */}
                        <Area 
                            type="monotone" 
                            dataKey="actual" 
                            name="Actual Produced"
                            stroke="#F37021" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorActual)" 
                            dot={{ r: 4, fill: '#F37021', strokeWidth: 2.5, stroke: '#FFFFFF' }}
                            activeDot={{ r: 6, fill: '#F37021', stroke: 'white', strokeWidth: 3 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Background Branding Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/[0.03] blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/[0.03] blur-[120px] rounded-full pointer-events-none" />
        </motion.div>
    );
};
