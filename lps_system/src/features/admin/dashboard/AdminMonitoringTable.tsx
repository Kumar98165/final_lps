import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { API_BASE } from '../../../lib/apiConfig';
import { getToken } from '../../../lib/storage';

export const AdminMonitoringTable = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = getToken();
                // Admin can hit supervisor submissions to see all logs
                const res = await fetch(`${API_BASE}/supervisor/submissions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success) {
                        setLogs(json.data || []);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch logs for monitoring", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, []);

    // Flatten data to get individual row items to allow SAP part number filtering
    const flattenedData = useMemo(() => {
        let allRows: any[] = [];
        logs.forEach(log => {
            if (log.status === 'APPROVED' || log.status === 'REJECTED' || log.status === 'VERIFIED') {
                const logData = Array.isArray(log.log_data) ? log.log_data : [];
                logData.forEach((row: any) => {
                    allRows.push({
                        logId: log.id,
                        modelName: log.model_name,
                        deoId: log.deo_id,
                        logStatus: log.status,
                        supervisorComment: log.supervisor_comment,
                        date: log.date ? new Date(log.date).toLocaleDateString() : 'N/A',
                        sapPartNumber: row['SAP PART NUMBER'] || 'N/A',
                        partDescription: row['PART DESCRIPTION'] || 'N/A',
                        todaysStock: row['Todays Stock'] || '0',
                        targetQty: row['Target Qty'] || row['TOTAL SCHEDULE QTY'] || '0',
                    });
                });
            }
        });
        return allRows;
    }, [logs]);



    if (isLoading) {
        return (
            <div className="bg-white rounded-[2.5rem] p-8 border border-ind-border mt-10">
                <div className="animate-pulse h-10 w-48 bg-ind-border/30 rounded-lg mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-ind-bg rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-ind-border shadow-sm mt-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-ind-text uppercase tracking-tight mb-2">Production Monitoring</h2>
                    <p className="text-sm font-bold text-ind-text3 uppercase tracking-widest">Track Rejected and Approved Components</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr>
                            <th className="pb-4 px-4 text-[10px] font-black text-ind-text3 uppercase tracking-widest border-b border-ind-border/50">Date & Model</th>
                            <th className="pb-4 px-4 text-[10px] font-black text-ind-text3 uppercase tracking-widest border-b border-ind-border/50">Part Description</th>
                            <th className="pb-4 px-4 text-[10px] font-black text-ind-text3 uppercase tracking-widest border-b border-ind-border/50 text-right">Current Stock</th>
                            <th className="pb-4 px-4 text-[10px] font-black text-ind-text3 uppercase tracking-widest border-b border-ind-border/50 table-cell">Status</th>
                            <th className="pb-4 px-4 text-[10px] font-black text-ind-text3 uppercase tracking-widest border-b border-ind-border/50">Comment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {flattenedData.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-ind-text3 font-bold uppercase text-xs">
                                    No records found
                                </td>
                            </tr>
                        ) : flattenedData.map((row, idx) => (
                            <motion.tr 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                key={`${row.logId}-${idx}`}
                                className="bg-white border border-ind-border/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl transition-all hover:scale-[1.01]"
                            >
                                <td className="p-4 rounded-l-2xl border-y border-l border-ind-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-ind-bg p-2 rounded-xl">
                                            <Box size={16} className="text-ind-text3" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-tight text-ind-text">{row.modelName}</p>
                                            <p className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest flex items-center gap-1">
                                                <Clock size={10} /> {row.date}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 border-y border-ind-border/50">
                                    <p className="text-[11px] font-bold text-slate-700 max-w-[250px] uppercase leading-tight">{row.partDescription}</p>
                                </td>
                                <td className="p-4 border-y border-ind-border/50 text-right">
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-end gap-1">
                                            <span className="text-sm font-black text-ind-primary">{row.todaysStock}</span>
                                            <span className="text-[10px] font-bold text-ind-text3 mb-0.5">Units In Stock</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 border-y border-ind-border/50">
                                    {row.logStatus === 'APPROVED' || row.logStatus === 'VERIFIED' ? (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            <CheckCircle size={12} />
                                            {row.logStatus === 'VERIFIED' ? 'Verified' : 'Approved'}
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100">
                                            <AlertTriangle size={12} />
                                            Rejected
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 rounded-r-2xl border-y border-r border-ind-border/50">
                                    {row.logStatus === 'REJECTED' && row.supervisorComment ? (
                                        <p className="text-xs font-bold text-ind-text2 max-w-xs">{row.supervisorComment}</p>
                                    ) : (
                                        <span className="text-ind-text3 font-bold">-</span>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Also declare Box as imported locally since motion is imported
const Box = ({ size, className }: { size: number, className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);
