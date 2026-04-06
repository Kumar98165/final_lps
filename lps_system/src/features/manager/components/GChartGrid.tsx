import { cn } from '../../../lib/utils';
import type { GChartData } from '../../../types/dashboard';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const GChartGrid = ({ data }: { data: GChartData[] }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-ind-bg/50 rounded-[2.5rem] border border-dashed border-ind-border">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ind-text3">Awaiting Production Nodes...</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto custom-scrollbar border border-ind-border/50 rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-ind-bg border-b border-ind-border/50">
                        <th className="sticky left-0 z-20 bg-ind-bg p-6 text-left text-[10px] font-black text-ind-text3 uppercase tracking-[0.2em] border-r border-ind-border/50 min-w-[180px]">
                            Car Model
                        </th>
                        {DAYS.map(day => (
                            <th key={day} className="p-4 text-center text-[10px] font-black text-ind-text3 border-r border-ind-border/50 min-w-[60px] last:border-r-0">
                                {day.toString().padStart(2, '0')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.map((row, idx) => (
                        <tr key={idx} className="group hover:bg-ind-bg transition-colors">
                            <td className="sticky left-0 z-10 bg-white p-6 text-xs font-black text-ind-text border-r border-ind-border/50 group-hover:bg-ind-bg transition-colors uppercase tracking-wider">
                                {row.model_name}
                                <div className="text-[9px] text-ind-text3 font-bold mt-1">VIN Series: 2024-X</div>
                            </td>
                            {row.days.length > 0 ? row.days.map((cellData: any, dIdx: number) => {
                                const status = cellData.actual === 0 ? 'none' : cellData.actual >= cellData.plan ? 'success' : 'missed';
                                return (
                                    <td key={dIdx} className="p-2 border-r border-slate-50 min-w-[60px] last:border-r-0">
                                        <div className={cn(
                                            "flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-300",
                                            status === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-100" :
                                                status === 'missed' ? "bg-rose-50 text-rose-600 border border-rose-100 shadow-sm shadow-rose-100" :
                                                    "bg-ind-bg text-ind-text3 border border-transparent"
                                        )}>
                                            <span className="text-[12px] font-black leading-none">{cellData.actual}</span>
                                            <div className="w-4 h-[1px] bg-current opacity-20 my-1.5" />
                                            <span className="text-[9px] font-black opacity-50 leading-none">{cellData.plan}</span>
                                        </div>
                                    </td>
                                );
                            }) : (
                                <td colSpan={31} className="p-4 text-center text-[10px] font-black text-ind-text3 uppercase tracking-widest italic opacity-50">
                                    No node data for sequence
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GChartGrid;
