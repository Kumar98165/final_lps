import React from 'react';
import { UserCog, UserCheck } from 'lucide-react';
import type { Line, Assignment, Rejection } from '../../hooks/useIndustrialState';

interface PersonnelProps {
    lines: Line[];
    assignments: Assignment[];
    rejections: Rejection[];
    productionEvents: any[];
}

export const PersonnelSection: React.FC<PersonnelProps> = ({ lines, assignments, rejections, productionEvents }) => {
    // Collect unique DEOs and Supervisors
    const deos = Array.from(new Map(assignments.map(a => [a.deo, a])).values());
    const sups = Array.from(new Map(assignments.map(a => [a.supervisor, a])).values());

    // Analytics Calculation
    const rejByDeo: Record<string, number> = {};
    const rejBySup: Record<string, number> = {};
    const prodByLine: Record<string, number> = {};

    rejections.forEach(r => {
        rejByDeo[r.deo] = (rejByDeo[r.deo] || 0) + 1;
        rejBySup[r.rejectedBy] = (rejBySup[r.rejectedBy] || 0) + 1;
    });

    productionEvents.forEach(e => {
        prodByLine[e.lineId] = (prodByLine[e.lineId] || 0) + e.quantity;
    });

    const PersonCard = ({ name, role, lineId, isOnline, colorClass, stats }: any) => {
        const line = lines.find(l => l.id === lineId);
        return (
            <div className="bg-ind-bg2 border border-ind-border rounded-xl p-4 text-center transition-all hover:border-ind-border2 hover:-translate-y-1 group relative shadow-md">
                {/* Status Dot */}
                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${isOnline ? 'bg-ind-g1 shadow-sm animate-pulse' : 'bg-ind-text3'}`} />
                
                <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center font-black text-white shadow-lg border-2 border-ind-bg transition-transform group-hover:scale-110 ${colorClass}`}>
                    {name.slice(0, 2).toUpperCase()}
                </div>
                
                <div className="font-bold text-ind-text text-sm mb-0.5">{name}</div>
                <div className="font-mono-jet text-[0.55rem] text-ind-text3 tracking-wider uppercase mb-1">{role}</div>
                <div className="font-mono-jet text-[0.6rem] text-ind-teal mb-3">{line?.name || lineId}</div>
                
                <div className="flex justify-center gap-4 mt-2">
                    {stats.map((s: any, idx: number) => (
                        <div key={idx} className="text-center">
                            <div className={`text-sm font-bold ${s.color}`}>{s.val}</div>
                            <div className="font-mono-jet text-[0.5rem] text-ind-text3 uppercase">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* DEO Section */}
            <div className="bg-ind-card border border-ind-border rounded-xl overflow-hidden shadow-lg animate-in slide-in-from-left-4 duration-500">
                <div className="flex items-center justify-between p-4 border-b border-ind-border bg-ind-bg2/30">
                    <div className="flex items-center gap-2 font-bold text-ind-text text-sm">
                        <UserCog size={16} className="text-ind-g1" />
                        Production Operators (DEO)
                    </div>
                    <span className="font-mono-jet text-[0.6rem] text-ind-text3 uppercase tracking-widest">{deos.length} Active</span>
                </div>
                <div className="p-4 overflow-x-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {deos.map((a, i) => (
                            <PersonCard 
                                key={i}
                                name={a.deo}
                                role="DEO"
                                lineId={a.lineId}
                                isOnline={i < 2}
                                colorClass={i % 2 === 0 ? "bg-linear-to-br from-ind-g3 to-ind-g1" : "bg-linear-to-br from-ind-teal to-ind-g2"}
                                stats={[
                                    { label: 'Units', val: prodByLine[a.lineId] || 0, color: 'text-ind-g1' },
                                    { label: 'Rej', val: rejByDeo[a.deo] || 0, color: 'text-ind-red' }
                                ]}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Supervisor Section */}
            <div className="bg-ind-card border border-ind-border rounded-xl overflow-hidden shadow-lg animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between p-4 border-b border-ind-border bg-ind-bg2/30">
                    <div className="flex items-center gap-2 font-bold text-ind-text text-sm">
                        <UserCheck size={16} className="text-ind-teal" />
                        Verification Supervisors
                    </div>
                    <span className="font-mono-jet text-[0.6rem] text-ind-text3 uppercase tracking-widest">{sups.length} On Duty</span>
                </div>
                <div className="p-4 overflow-x-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {sups.map((a, i) => (
                            <PersonCard 
                                key={i}
                                name={a.supervisor}
                                role="SUP"
                                lineId={a.lineId}
                                isOnline={true}
                                colorClass={i % 2 === 0 ? "bg-linear-to-br from-ind-blue to-ind-teal" : "bg-linear-to-br from-ind-purple to-ind-teal"}
                                stats={[
                                    { label: 'Rej', val: rejBySup[a.supervisor] || 0, color: 'text-ind-orange' },
                                    { label: 'Prod', val: lines.find(l => l.id === a.lineId)?.completed || 0, color: 'text-ind-text' }
                                ]}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
