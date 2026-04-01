import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import type { Line, Assignment, MailOrder } from '../../hooks/useIndustrialState';

interface StageProgressProps {
    productionEvents: any[];
    lines: Line[];
    assignments: Assignment[];
    mailOrders: MailOrder[];
}

export const StageWorkProgress: React.FC<StageProgressProps> = ({ lines, assignments, mailOrders }) => {

    // Sorting lines numerically (LINE 01, LINE 02, etc.) as requested
    const sortedLines = [...lines].sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
        return numA - numB;
    });

    const data = sortedLines.map(line => {
        const assignment = assignments.find(a => a.lineId === line.id || a.id === line.name);
        const progressPct = ((line.completed / Math.max(1, line.target)) * 100);

        const lineModel = line.model || assignment?.model;
        const totalOrdersForLine = mailOrders.filter(o =>
            o.model === lineModel &&
            (o.status === 'accepted' || o.status === 'approved' || o.status === 'pending')
        ).length;

        return {
            name: line.name,
            progress: parseFloat(progressPct.toFixed(1)),
            completed: line.completed,
            target: line.target,
            model: lineModel || "N/A",
            totalOrders: totalOrdersForLine,
            deo: assignment?.deo || "—",
            supervisor: assignment?.supervisor || "—"
        };
    });

    // Minimalist Tooltip: Just related text, no card-like background
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const lineData = payload[0].payload;
            return (
                <div className="pointer-events-none z-50 p-0 text-left">
                    <p className="text-[12px] font-black text-slate-900 uppercase mb-1">
                        {lineData.name}: {lineData.progress}%
                    </p>
                    <p className="text-[10px] font-bold text-slate-600 leading-tight">
                        MODEL: <span className="text-emerald-600 font-black">{lineData.model}</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-600 leading-tight">
                        OPERATOR: <span className="text-slate-900 font-black">{lineData.deo}</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-600 leading-tight">
                        SUPERVISOR: <span className="text-slate-900 font-black">{lineData.supervisor}</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-600 leading-tight">
                        TOTAL ORDERS: <span className="text-blue-600 font-black">{lineData.totalOrders}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#EDF2F7] border border-ind-border rounded-[2.5rem] p-8 shadow-sm flex flex-col h-[550px] mb-8"
        >
            <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-[#38BDF8] rounded-full" />
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                        Line Work Progress
                    </h3>
                </div>
                <div className="flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full border border-slate-300">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        Live Monitoring
                    </span>
                </div>
            </div>

            <div className="flex-1 w-full relative overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ bottom: 40, top: 40, left: 20, right: 20 }}
                        barCategoryGap="4%" // Minimum space between bars
                    >
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22C55E" stopOpacity={1} />
                                <stop offset="100%" stopColor="#4ADE80" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.3} />

                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 13, fontWeight: 900, fill: '#1E293B' }}
                            dy={15}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }}
                            label={{
                                value: 'Efficiency %',
                                angle: -90,
                                position: 'insideLeft',
                                fontSize: 11,
                                fontWeight: 900,
                                fill: '#64748b',
                                dy: -40
                            }}
                            domain={[0, 100]}
                        />

                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(34, 197, 94, 0.04)' }}
                            wrapperStyle={{ zIndex: 9999 }}
                        />

                        <Bar
                            dataKey="progress"
                            radius={[6, 6, 0, 0]}
                            barSize={120} // Very wide bars for minimal gap
                            minPointSize={50} // Big height even at 0%
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                            ))}
                        </Bar>

                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        In Progress
                    </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-sm bg-slate-300 opacity-30" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Pending
                    </span>
                </div>
            </div>
        </motion.div>
    );
};