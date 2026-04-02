import { Users, Activity, ClipboardCheck, Clock, AlertTriangle } from 'lucide-react';

interface KPIProps {
    totalDeos: number;
    activeDeos: number;
    readyModels: number;
    pendingModels: number;
    rejectedModels: number;
}

export const SupervisorKPI = ({ 
    totalDeos, 
    activeDeos, 
    readyModels, 
    pendingModels,
    rejectedModels
}: KPIProps) => {
    const kpis = [
        { 
            label: 'Total deos', 
            value: totalDeos, 
            icon: Users, 
            color: 'text-indigo-600', 
            iconBg: 'bg-indigo-50',
            bg: 'bg-white',
            textColor: 'text-[#0f172a]',
            labelColor: 'text-slate-500'
        },
        { 
            label: 'Active now', 
            value: activeDeos, 
            icon: Activity, 
            color: 'text-white', 
            iconBg: 'bg-white/20',
            bg: 'bg-[#F37021]', 
            textColor: 'text-white',
            labelColor: 'text-orange-100',
            isSpecial: true
        },
        { 
            label: 'Pending models', 
            value: pendingModels, 
            icon: Clock, 
            color: 'text-rose-600', 
            iconBg: 'bg-rose-50',
            bg: 'bg-white',
            textColor: 'text-[#0f172a]',
            labelColor: 'text-slate-500',
            alert: pendingModels > 0
        },
        { 
            label: 'Ready models', 
            value: readyModels, 
            icon: ClipboardCheck, 
            color: 'text-emerald-600', 
            iconBg: 'bg-emerald-50',
            bg: 'bg-white',
            textColor: 'text-[#0f172a]',
            labelColor: 'text-slate-500'
        },
        { 
            label: 'Rejected models', 
            value: rejectedModels, 
            icon: AlertTriangle, 
            color: 'text-rose-600', 
            iconBg: 'bg-rose-50',
            bg: 'bg-white',
            textColor: 'text-[#0f172a]',
            labelColor: 'text-slate-500',
            alert: rejectedModels > 0
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 px-2">
            {kpis.map((kpi, index) => (
                <div 
                    key={index} 
                    className={`${kpi.bg} rounded-xl p-4 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md group flex flex-col justify-between min-h-[130px] relative overflow-hidden`}
                >
                    {kpi.isSpecial && (
                        <div className="absolute top-[-30%] right-[-15%] w-20 h-20 bg-white/10 blur-xl rounded-full" />
                    )}

                    <div className="flex items-start justify-between relative z-10 font-sans">
                        <div className={`w-8 h-8 rounded-lg ${kpi.iconBg} flex items-center justify-center ${kpi.color} group-hover:scale-105 transition-transform`}>
                             <kpi.icon size={16} />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1 h-1 rounded-full ${kpi.alert ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                            <span className={`text-[8px] font-black uppercase tracking-widest ${kpi.textColor === 'text-white' ? 'text-white/80' : 'text-slate-400'}`}>
                                {kpi.alert ? 'Alert' : 'Live'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="mt-4 relative z-10 font-sans">
                        <h3 className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${kpi.labelColor}`}>
                            {kpi.label}
                        </h3>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-3xl font-black tracking-tighter tabular-nums ${kpi.alert && !kpi.isSpecial ? 'text-rose-600' : kpi.textColor}`}>
                                {kpi.value.toString().padStart(2, '0')}
                            </span>
                            <span className={`text-[8px] font-bold uppercase tracking-tight ${kpi.textColor === 'text-white' ? 'text-orange-100' : 'text-slate-400'}`}>
                                units
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
