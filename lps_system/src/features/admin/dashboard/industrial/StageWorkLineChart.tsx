import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import type { Line as LineType, Assignment } from '../../hooks/useIndustrialState';

interface Props {
  lines: LineType[];
  assignments: Assignment[];
}

export const StageWorkLineChart: React.FC<Props> = ({ lines, assignments }) => {

  const data = lines.map(line => {
    const assignment = assignments.find(a => a.lineId === line.id);
    const progress = (line.completed / Math.max(1, line.target)) * 100;

    return {
      name: line.name,
      progress: parseFloat(progress.toFixed(1)),
      target: line.target,
      completed: line.completed,
      operator: assignment?.deo || "—",
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-5 rounded-2xl shadow-2xl border border-ind-border text-sm min-w-[200px] pointer-events-none z-[9999]">
          <p className="font-black text-slate-800 uppercase tracking-tight mb-2 border-b border-ind-border/50 pb-1">{d.name}</p>
          <div className="space-y-1 text-[11px] font-bold text-ind-text2">
            <p className="flex justify-between"><span>Progress:</span> <span className="text-emerald-600 font-black">{d.progress}%</span></p>
            <p className="flex justify-between"><span>Done:</span> <span className="text-ind-text">{d.completed}</span></p>
            <p className="flex justify-between"><span>Target:</span> <span className="text-ind-text">{d.target}</span></p>
            <p className="flex justify-between pt-1 mt-1 border-t border-slate-50 italic text-ind-text3"><span>Operator:</span> <span className="text-slate-700">{d.operator}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#EDF2F7] border border-ind-border rounded-[2.5rem] p-8 shadow-sm flex flex-col h-[450px] mb-8 w-full"
    >
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-ind-border">
        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Line Progress Trend</h3>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                domain={[0, 100]}
                label={{ value: 'Efficiency %', angle: -90, position: 'insideLeft', fontSize: 11, fontWeight: 900, fill: '#64748b', dy: -40 }}
            />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
            <Line
                type="monotone"
                dataKey="progress"
                stroke="#22C55E"
                strokeWidth={4}
                dot={{ r: 6, fill: 'white', strokeWidth: 3, stroke: '#22C55E' }}
                activeDot={{ r: 9, fill: '#22C55E', stroke: 'white', strokeWidth: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
