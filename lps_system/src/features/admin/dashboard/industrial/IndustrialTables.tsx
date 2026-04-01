import React from 'react';
import { Factory, UserCheck, Box, AlertTriangle } from 'lucide-react';
import type { Line, Assignment, MailOrder, Rejection } from '../../hooks/useIndustrialState';

interface TablesProps {
    lines: Line[];
    assignments: Assignment[];
    orders: MailOrder[];
    rejections: Rejection[];
    onRecordProd: (id: string) => void;
    onAddLine: () => void;
    onAssign: () => void;
}

export const IndustrialTablesSection: React.FC<TablesProps> = ({ 
    lines, assignments, orders, rejections, onRecordProd, onAddLine, onAssign 
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 overflow-x-auto">
            {/* Production Lines */}
            <div className="bg-ind-card border border-ind-border rounded-xl flex flex-col shadow-lg min-w-[280px]">
                <div className="flex items-center justify-between p-3.5 border-b border-ind-border bg-ind-bg2/40">
                    <div className="flex items-center gap-2 font-bold text-ind-text text-sm">
                        <Factory size={15} /> Lines
                    </div>
                    <button onClick={onAddLine} className="px-2 py-1 bg-ind-bg2 border border-ind-border rounded-md text-ind-text2 text-[0.6rem] hover:text-ind-g1 hover:border-ind-g1/30 transition-all">+ Add</button>
                </div>
                <div className="p-3.5 flex-1 space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar">
                    {lines.map(l => {
                        const pct = Math.round((l.completed / l.target) * 100);
                        return (
                            <div key={l.id} className="pb-3 border-b border-slate-100 last:border-0 group">
                                <div className="flex justify-between items-start mb-1.5">
                                    <div>
                                        <div className="text-sm font-bold text-ind-text group-hover:text-ind-g1 transition-colors">{l.name}</div>
                                        <div className="font-mono-jet text-[0.58rem] text-ind-text3 uppercase">{l.model}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono-jet text-[0.7rem] text-ind-text2 font-bold"><span className="text-ind-g1">{l.completed}</span>/{l.target}</div>
                                    </div>
                                </div>
                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-2 shadow-inner">
                                    <div className="h-full bg-linear-to-r from-ind-g3 to-ind-g1 shadow-sm" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono-jet text-[0.56rem] text-ind-text3">{pct}% CAP.</span>
                                    <button 
                                        onClick={() => onRecordProd(l.id)}
                                        disabled={l.completed >= l.target}
                                        className="text-[0.62rem] font-bold px-3 py-1 rounded bg-ind-bg2 border border-ind-border text-ind-text2 hover:text-ind-g1 hover:border-ind-g1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        + Record
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Assignments */}
            <div className="bg-ind-card border border-ind-border rounded-xl shadow-lg min-w-[280px]">
                <div className="flex items-center justify-between p-3.5 border-b border-ind-border bg-ind-bg2/40">
                    <div className="flex items-center gap-2 font-bold text-ind-text text-sm">
                        <UserCheck size={15} /> Assignments
                    </div>
                    <button onClick={onAssign} className="px-2 py-1 bg-ind-bg2 border border-ind-border rounded-md text-ind-text2 text-[0.6rem] hover:text-ind-g1 hover:border-ind-g1/30 transition-all">+ Assign</button>
                </div>
                <div className="p-3.5 overflow-x-auto max-h-[400px] custom-scrollbar">
                    <table className="w-full font-mono-jet text-[0.7rem] text-ind-text2">
                        <thead className="text-[0.56rem] text-ind-text3 uppercase border-b border-ind-border">
                            <tr>
                                <th className="text-left py-2">Model</th>
                                <th className="text-left py-2">Line</th>
                                <th className="text-left py-2">DEO</th>
                                <th className="text-left py-2">Sup</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {assignments.map((a, i) => (
                                <tr key={i} className="hover:bg-ind-g1/[0.02] cursor-default transition-colors">
                                    <td className="py-2.5 font-bold text-ind-teal">{a.model}</td>
                                    <td className="py-2.5">{a.lineId}</td>
                                    <td className="py-2.5">{a.deo}</td>
                                    <td className="py-2.5">{a.supervisor}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* All Orders */}
            <div className="bg-ind-card border border-ind-border rounded-xl shadow-lg min-w-[280px]">
                <div className="flex items-center justify-between p-3.5 border-b border-ind-border bg-ind-bg2/40">
                    <div className="flex items-center gap-2 font-bold text-ind-text text-sm">
                        <Box size={15} /> All Orders
                    </div>
                </div>
                <div className="p-3.5 overflow-x-auto max-h-[400px] custom-scrollbar">
                    <table className="w-full font-mono-jet text-[0.7rem] text-ind-text2">
                        <thead className="text-[0.56rem] text-ind-text3 uppercase border-b border-ind-border">
                            <tr>
                                <th className="text-left py-2 px-1">Co.</th>
                                <th className="text-left py-2">Model</th>
                                <th className="text-left py-2">Qty</th>
                                <th className="text-left py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {orders.map((o, i) => (
                                <tr key={i} className="hover:bg-ind-g1/[0.02] cursor-default transition-colors">
                                    <td className="py-2.5 px-1 truncate max-w-[60px] font-bold">{o.company.split(' ')[0]}</td>
                                    <td className="py-2.5">{o.model}</td>
                                    <td className="py-2.5 font-black text-ind-text">{o.qty}</td>
                                    <td className="py-2.5">
                                        <div className={`text-[0.56rem] px-2 py-0.5 rounded-full inline-block font-bold uppercase tracking-tighter ${
                                            o.status === 'accepted' ? 'bg-ind-teal/10 text-ind-teal border border-ind-teal/20' : 
                                            o.status === 'rejected' ? 'bg-ind-red/10 text-ind-red border border-ind-red/20' : 
                                            'bg-ind-yellow/10 text-ind-yellow border border-ind-yellow/20'
                                        }`}>
                                            {o.status}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rejection Log */}
            <div className="bg-ind-card border border-ind-border rounded-xl shadow-lg min-w-[280px]">
                <div className="flex items-center justify-between p-3.5 border-b border-ind-border bg-ind-bg2/40">
                    <div className="flex items-center gap-2 font-bold text-ind-text text-sm">
                        <AlertTriangle size={15} className="text-ind-red" />
                        Rejection Log
                    </div>
                    <span className="bg-ind-red/10 text-ind-red border border-ind-red/20 px-2.5 py-0.5 rounded-full text-[0.6rem] font-bold">{rejections.length}</span>
                </div>
                <div className="p-3.5 space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar">
                    {rejections.length === 0 ? (
                        <div className="text-center py-10 text-ind-text3 italic text-[0.7rem]">Clean log. No defects recorded.</div>
                    ) : (
                        [...rejections].reverse().map((r, i) => (
                            <div key={i} className="flex items-start gap-2.5 pb-3 border-b border-white/5 last:border-0 group animate-in slide-in-from-right-2">
                                <div className="w-7 h-7 rounded-lg bg-ind-red/10 border border-ind-red/20 flex items-center justify-center text-ind-red shrink-0 group-hover:scale-110 transition-transform">
                                    <AlertTriangle size={12} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[0.8rem] font-bold text-ind-text truncate">{r.model}</div>
                                    <div className="font-mono-jet text-[0.6rem] text-ind-text3 truncate tracking-tighter">{r.part} · {r.reason}</div>
                                    <div className="font-mono-jet text-[0.58rem] text-ind-teal mt-1">DEO: {r.deo} · {r.lineId}</div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="font-mono-jet text-[0.58rem] text-ind-text3">{r.date}</div>
                                    <div className="font-mono-jet text-[0.6rem] text-ind-g1 font-bold truncate max-w-[60px]">{r.rejectedBy}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
