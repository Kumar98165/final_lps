import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { API_BASE } from '../../../lib/apiConfig';
import { getToken } from '../../../lib/storage';

export const AdminMonitoringTable = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [selectedSAP, setSelectedSAP] = useState<string>('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = getToken();
                // Admin can hit supervisor submissions to see all logs
                const res = await fetch(`${API_BASE}/production/supervisor/submissions`, {
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
            if (log.status === 'APPROVED' || log.status === 'REJECTED') {
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
                        todayProduced: row['Today Produced'] || '0',
                        targetQty: row['Target Qty'] || '0',
                    });
                });
            }
        });
        return allRows;
    }, [logs]);

    // Unique options for slicers
    const modelOptions = useMemo(() => Array.from(new Set(flattenedData.map(d => d.modelName))).filter(Boolean).sort(), [flattenedData]);
    const sapOptions = useMemo(() => {
        const data = selectedModel ? flattenedData.filter(d => d.modelName === selectedModel) : flattenedData;
        return Array.from(new Set(data.map(d => d.sapPartNumber))).filter(Boolean).sort();
    }, [flattenedData, selectedModel]);

    // Apply filters
    const filteredData = useMemo(() => {
        return flattenedData.filter(d => {
            const matchModel = selectedModel ? d.modelName === selectedModel : true;
            const matchSAP = selectedSAP ? d.sapPartNumber === selectedSAP : true;
            return matchModel && matchSAP;
        });
    }, [flattenedData, selectedModel, selectedSAP]);

    if (isLoading) {
        return (
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 mt-10">
                <div className="animate-pulse h-10 w-48 bg-slate-100 rounded-lg mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-slate-200 shadow-sm mt-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Production Monitoring</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Track Rejected and Approved Components</p>
                </div>
                
                <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Model Slicer</label>
                        <select 
                            value={selectedModel} 
                            onChange={e => { setSelectedModel(e.target.value); setSelectedSAP(''); }}
                            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-4 py-3 min-w-[150px] outline-none focus:ring-2 focus:ring-slate-900"
                        >
                            <option value="">ALL MODELS</option>
                            {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SAP Part Slicer</label>
                        <select 
                            value={selectedSAP} 
                            onChange={e => setSelectedSAP(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-4 py-3 min-w-[150px] outline-none focus:ring-2 focus:ring-slate-900"
                        >
                            <option value="">ALL PARTS</option>
                            {sapOptions.map(sap => <option key={sap} value={sap}>{sap}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr>
                            <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date & Model</th>
                            <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Part Details</th>
                            <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Production</th>
                            <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 table-cell">Status</th>
                            <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Comment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-400 font-bold uppercase text-xs">
                                    No records found matching current filters
                                </td>
                            </tr>
                        ) : filteredData.map((row, idx) => (
                            <motion.tr 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                key={`${row.logId}-${row.sapPartNumber}-${idx}`}
                                className="bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl transition-all hover:scale-[1.01]"
                            >
                                <td className="p-4 rounded-l-2xl border-y border-l border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-50 p-2 rounded-xl">
                                            <Box size={16} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-tight text-slate-900">{row.modelName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Clock size={10} /> {row.date}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 border-y border-slate-100">
                                    <p className="font-black text-xs text-slate-900 uppercase">{row.sapPartNumber}</p>
                                    <p className="text-[10px] font-bold text-slate-500 max-w-[200px] truncate">{row.partDescription}</p>
                                </td>
                                <td className="p-4 border-y border-slate-100 text-right">
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-end gap-1">
                                            <span className="text-sm font-black text-slate-900">{row.todayProduced}</span>
                                            <span className="text-[10px] font-bold text-slate-400 mb-0.5">/ {row.targetQty}</span>
                                        </div>
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${row.logStatus === 'APPROVED' ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                                style={{ width: `${Math.min(100, (Number(row.todayProduced) / Math.max(1, Number(row.targetQty))) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 border-y border-slate-100">
                                    {row.logStatus === 'APPROVED' ? (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            <CheckCircle size={12} />
                                            Approved
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100">
                                            <AlertTriangle size={12} />
                                            Rejected
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 rounded-r-2xl border-y border-r border-slate-100">
                                    {row.logStatus === 'REJECTED' && row.supervisorComment ? (
                                        <p className="text-xs font-bold text-slate-600 max-w-xs">{row.supervisorComment}</p>
                                    ) : (
                                        <span className="text-slate-300 font-bold">-</span>
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
