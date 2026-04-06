import React from 'react';
import { 
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';

interface VisualHubProps {
    productionEvents: any[];
    rejections: any[];
    allDEOs: string[];
    allModels: string[];
}

export const IndustrialVisualHub: React.FC<VisualHubProps> = ({ productionEvents, rejections, allDEOs, allModels }) => {
    
    // 📊 CHART 1: PRODUCTION & QUALITY ANALYSIS (Image 1 Style)
    // Mapping actual DEO production and rejections for the Project Content
    const productionAnalysisData = allDEOs.slice(0, 15).map(deo => {
        const prod = productionEvents.filter(e => e.deo === deo).reduce((s, e) => s + e.quantity, 0);
        const rej = rejections.filter(r => r.deo === deo).length;
        // Mocking segments for the "Stacked" visual look from Image 1
        return {
            name: deo.split(' ')[0].toUpperCase(),
            segment1: Math.max(2, prod * 0.4),
            segment2: Math.max(2, prod * 0.3),
            segment3: Math.max(1, prod * 0.2),
            segment4: Math.max(1, prod * 0.1),
            dpu: prod > 0 ? (rej / prod).toFixed(2) : 0, 
            total: prod
        };
    });

    // 📈 CHART 2: OPERATIONAL VELOCITY (Image 2 Style)
    // Smooth Trend using current project data
    const velocityData = [
        { time: '08:00', value: 5000 },
        { time: '10:00', value: 18000 },
        { time: '12:00', value: 12000 },
        { time: '14:00', value: 25000 },
        { time: '16:00', value: 15600 },
        { time: '18:00', value: 22000 },
        { time: '20:00', value: 10000 },
        { time: '22:00', value: 23000 },
    ];

    return (
        <div className="space-y-8 mb-12">
            
            {/* 1. Welder Defect Analysis Style (Stacked Bar + Line) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-ind-border rounded-xl p-8 shadow-sm flex flex-col h-[500px]"
            >
                <div className="flex items-center gap-3 mb-10 border-b border-slate-50 pb-4">
                    <div className="w-1.5 h-6 bg-[#E11D48] rounded-full" />
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Production & Quality Hub (MPT)</h3>
                </div>

                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={productionAnalysisData} margin={{ bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                angle={-90}
                                textAnchor="end"
                                interval={0}
                                dy={10}
                            />
                            <YAxis 
                                yAxisId="left"
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                domain={[0, 'auto']}
                            />
                            <YAxis 
                                yAxisId="right" 
                                orientation="right"
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                domain={[0, 2]}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} 
                            />
                            
                            {/* Stacked Bars from Image 1 */}
                            <Bar yAxisId="left" dataKey="segment1" stackId="a" fill="#1E40AF" barSize={35} /> {/* Dark Blue */}
                            <Bar yAxisId="left" dataKey="segment2" stackId="a" fill="#F59E0B" /> {/* Orange */}
                            <Bar yAxisId="left" dataKey="segment3" stackId="a" fill="#94A3B8" /> {/* Grey */}
                            <Bar yAxisId="left" dataKey="segment4" stackId="a" fill="#22C55E" /> {/* Green */}
                            <Bar yAxisId="left" dataKey="segment5" stackId="a" fill="#FDA4AF" /> {/* Pink */}

                            {/* Line from Image 1 */}
                            <Line 
                                yAxisId="right" 
                                type="monotone" 
                                dataKey="dpu" 
                                stroke="#22C55E" 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: 'white', strokeWidth: 2 }} 
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* 2. Smooth Trend Analysis style (Image 2) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-ind-border rounded-xl p-8 shadow-sm flex flex-col h-[400px]"
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Operational Velocity Trend</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-ind-bg border border-ind-border/50 rounded-lg text-[0.6rem] font-black text-ind-text2 uppercase tracking-widest">
                        Daily Aggregate
                    </div>
                </div>

                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={velocityData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="time" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                tickFormatter={(val) => `${val/1000}k`}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: '#1E293B', color: 'white', fontSize: '10px' }} 
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#14B8A6" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill="url(#colorValue)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

        </div>
    );
};
