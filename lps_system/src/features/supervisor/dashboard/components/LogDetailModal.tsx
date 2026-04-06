import { useState, useMemo } from 'react';
import {
    ClipboardCheck, ArrowLeft, Clock, Shield, ShieldAlert, AlertCircle
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { SupervisorRowVerifyModal } from './SupervisorRowVerifyModal';

interface LogDetailViewProps {
    selectedLog: any;
    setSelectedLog: (log: any) => void;
    onBulkVerify: () => Promise<void>;
    onRejectLog: (reason: string) => Promise<void>;
    onRowVerify?: (rowIndex: number, status: 'VERIFIED' | 'REJECTED', reason?: string) => Promise<void>;
}

export const LogDetailView = ({
    selectedLog,
    setSelectedLog,
    onBulkVerify,
    onRejectLog,
    onRowVerify
}: LogDetailViewProps) => {
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [selectedRowDetail, setSelectedRowDetail] = useState<any>(null);

    if (!selectedLog) return null;

    const logData: any[] = selectedLog.log_data || [];

    // Count statuses
    const verifiedCount = logData.filter(r => r.row_status === 'VERIFIED').length;
    const rejectedCount = logData.filter(r => r.row_status === 'REJECTED').length;
    const pendingCount = logData.length - verifiedCount - rejectedCount;

    // Dynamic Columns Logic
    const labelMap: Record<string, string> = {
        "SN. NO": "Sn.",
        "SAP PART NUMBER": "Sap part number",
        "PART NUMBER": "Part number",
        "PART DESCRIPTION": "Part description",
        "ASSEMBLY NUMBER": "Assembly number",
        "PER DAY": "Per day",
        "SAP Stock": "Sap stock",
        "Opening Stock": "Opening stock",
        "Todays Stock": "Todays stock",
        "Coverage Days": "Coverage days"
    };

    const displayColumns = useMemo(() => {
        const base = ["SN. NO", "SAP PART NUMBER", "PART NUMBER", "PART DESCRIPTION"];
        const hasAssembly = logData.some(r => r["ASSEMBLY NUMBER"] && r["ASSEMBLY NUMBER"] !== "—");
        if (hasAssembly) base.push("ASSEMBLY NUMBER");
        base.push("PER DAY", "SAP Stock", "Opening Stock", "Todays Stock", "Coverage Days");
        return base;
    }, [logData]);

    const handleApproveAll = async () => {
        setIsApproving(true);
        await onBulkVerify();
        setIsApproving(false);
    };

    const handleRejectSubmit = async () => {
        setIsRejecting(true);
        await onRejectLog("Log rejected for correction by Supervisor");
        setIsRejecting(false);
    };

    const handleSingleRowVerify = async (rowIndex: number, status: 'VERIFIED' | 'REJECTED', reason: string = "") => {
        if (!onRowVerify) return;
        try {
            await onRowVerify(rowIndex, status, reason);
        } catch (error) {
            console.error('Error verifying row:', error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="bg-white rounded-[2rem] border border-ind-border/50 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-ind-text text-white flex items-center justify-center shadow-lg">
                            <ClipboardCheck size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-0.5">
                                <h1 className="text-2xl font-black text-ind-text uppercase tracking-tight">{selectedLog.model_name}</h1>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                    selectedLog.status === 'VERIFIED' || selectedLog.status === 'APPROVED'
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        : selectedLog.status === 'REJECTED'
                                            ? "bg-red-50 text-red-600 border-red-100"
                                            : "bg-amber-50 text-amber-600 border-amber-100"
                                )}>
                                    {selectedLog.status || 'SUBMITTED'}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-ind-text3 uppercase tracking-[0.15em] mt-1">
                                DEO Submission • ORDER ID: <span className="text-ind-primary font-black">{selectedLog.formatted_id || `DEM-${selectedLog.id?.toString().padStart(3, '0')}`}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedLog(null)}
                        className="h-10 px-6 bg-ind-border/30 text-ind-text2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-ind-border/50 transition-all flex items-center gap-2"
                    >
                        <ArrowLeft size={14} /> Back to List
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-ind-bg rounded-2xl p-4 border border-ind-border/50">
                        <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest block mb-1">Target</span>
                        <span className="text-xl font-black text-ind-text">{selectedLog.target_vehicles || 0}</span>
                        <span className="text-[9px] font-black text-ind-text3 ml-1">VEH</span>
                    </div>
                    <div className="bg-ind-bg rounded-2xl p-4 border border-ind-border/50">
                        <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest block mb-1">Parts</span>
                        <span className="text-xl font-black text-ind-text">{logData.length}</span>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-1">✓ Verified</span>
                        <span className="text-xl font-black text-emerald-600">{verifiedCount}</span>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-1">✗ Rejected</span>
                        <span className="text-xl font-black text-red-600">{rejectedCount}</span>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-1">⏳ Pending</span>
                        <span className="text-xl font-black text-amber-600">{pendingCount}</span>
                    </div>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-slate-50 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest">
                            Customer: <span className="text-ind-text">{selectedLog.customer_name || 'CIE AUTOMOTIVE'}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-ind-text3" />
                        <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest">
                            Operator: <span className="text-ind-text">{selectedLog.deo_name || 'N/A'}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-ind-primary" />
                        <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest">
                            Line: <span className="text-ind-text">{selectedLog.line_name || 'N/A'}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <Clock size={12} className="text-ind-text3" />
                        <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest">
                            Submission Date: <span className="text-ind-text">{selectedLog.date}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Data Table — Read Only */}
            <div className="bg-white rounded-[2rem] border border-ind-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar" style={{ maxHeight: '550px' }}>
                    <table className="w-full min-w-[1200px] border-separate border-spacing-0">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-ind-bg">
                                {displayColumns.map((h, i) => (
                                    <th
                                        key={h}
                                        className={cn(
                                            "px-3 py-4 text-[11px] font-bold text-ind-text3 text-center border-b border-ind-border/50 bg-ind-bg z-30 whitespace-nowrap",
                                            i === 0 && "sticky left-0 text-left z-40",
                                            i === 1 && "sticky left-[40px] text-left z-40",
                                            (h === "Sap stock" || h === "Opening stock" || h === "Todays stock") && "text-ind-primary bg-orange-50 border-orange-100"
                                        )}
                                    >
                                        {labelMap[h] || h}
                                    </th>
                                ))}
                                <th className="px-3 py-4 text-[11px] font-bold text-ind-text3 text-center border-b border-ind-border/50 min-w-[150px] sticky right-0 bg-ind-bg z-30">Vetting action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logData.map((row: any, index: number) => {
                                const coverage = parseFloat(row['Coverage Days'] || '0');
                                const isLowCoverage = coverage > 0 && coverage < 5;

                                const prodStatus = row['Production Status'];
                                const rowStatus = prodStatus === 'VERIFIED'
                                    ? 'VERIFIED'
                                    : prodStatus === 'REJECTED'
                                        ? 'REJECTED'
                                        : null;

                                return (
                                    <tr
                                        key={row.id || index}
                                        onClick={() => setSelectedRowDetail({ ...row, index })}
                                        className={cn(
                                            "border-b border-slate-50 transition-colors cursor-pointer group",
                                            rowStatus === 'VERIFIED' && "bg-emerald-50/30 hover:bg-emerald-50/50",
                                            rowStatus === 'REJECTED' && "bg-red-50/30 hover:bg-red-50/50",
                                            !rowStatus && "hover:bg-ind-bg/50"
                                        )}
                                    >
                                        {displayColumns.map((h, i) => {
                                            const val = h === "SN. NO" ? (index + 1).toString() : (row[h] || "—");
                                            const isLeft = i < 2 || h === "PART NUMBER" || h === "PART DESCRIPTION" || h === "ASSEMBLY NUMBER";
                                            const isIdentity = i < 5 && h !== "PER DAY";
                                            const isStock = h.includes("Stock");

                                            return (
                                                <td
                                                    key={h}
                                                    className={cn(
                                                        "p-2 border-b border-slate-50 sticky bg-inherit z-10",
                                                        i === 0 && "left-0",
                                                        i === 1 && "left-[40px]"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-full rounded-2xl p-4 flex items-center shadow-sm min-h-[60px] border border-ind-border/50",
                                                        isLeft ? "justify-start px-6" : "justify-center",
                                                        isStock ? "bg-orange-50/40" : "bg-white",
                                                        h === "PART DESCRIPTION" && "min-w-[280px]",
                                                        h === "ASSEMBLY NUMBER" && "min-w-[180px]",
                                                        h === "SAP PART NUMBER" && "min-w-[160px]",
                                                        h === "PART NUMBER" && "min-w-[160px]",
                                                        h === "Coverage Days" && isLowCoverage && "bg-red-500 border-red-600 shadow-red-500/20"
                                                    )}>
                                                        <span className={cn(
                                                            "font-black tracking-tight",
                                                            isLeft ? "text-left" : "text-center",
                                                            isIdentity ? "text-[10px] uppercase text-ind-text" : "text-sm text-ind-text2",
                                                            h === "SAP PART NUMBER" && "text-ind-primary",
                                                            h === "PART DESCRIPTION" && "leading-[1.4]",
                                                            h === "Coverage Days" && isLowCoverage ? "text-white" : "",
                                                            h === "Coverage Days" && !isLowCoverage ? "text-ind-text" : ""
                                                        )}>
                                                            {val}
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="p-2 border-b border-slate-50 sticky right-0 bg-inherit z-10 text-center">
                                            <div className="w-full rounded-2xl p-4 flex items-center justify-center border border-ind-border/50 shadow-sm bg-white min-h-[60px] min-w-[140px]">
                                                {rowStatus === 'VERIFIED' ? (
                                                    <div className="px-6 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-bold tracking-wide shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in-95 duration-300">
                                                        Verified
                                                    </div>
                                                ) : rowStatus === 'REJECTED' ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="px-6 py-2 rounded-xl bg-red-500 text-white text-[10px] font-bold tracking-wide shadow-lg shadow-red-500/20 animate-in fade-in zoom-in-95 duration-300">
                                                            Rejected
                                                        </div>
                                                        {row.rejection_reason && (
                                                            <div className="flex items-center gap-1 text-red-500 animate-pulse">
                                                                <AlertCircle size={10} />
                                                                <span className="text-[8px] font-black uppercase tracking-tighter truncate max-w-[120px]" title={row.rejection_reason}>
                                                                    {row.rejection_reason}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="px-6 py-2 rounded-xl bg-ind-text text-white text-[10px] font-bold tracking-wide shadow-md group-hover:bg-ind-primary group-hover:scale-105 transition-all">
                                                        Review for verify
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Buttons */}
            {selectedLog.status !== 'APPROVED' && (
                <div className="bg-white rounded-[2rem] border border-ind-border/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield size={20} className="text-ind-text3" />
                            <div>
                                <h3 className="text-sm font-black text-ind-text uppercase tracking-tight">Verification Decision</h3>
                                <p className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest">
                                    Review the DEO's data above and approve or reject
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleRejectSubmit}
                                disabled={isRejecting}
                                className="group flex items-center gap-3 bg-red-50 text-red-600 border-2 border-red-200 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 hover:border-red-300 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <ShieldAlert size={16} className="group-hover:scale-110 transition-transform" />
                                {isRejecting ? 'Sending Back...' : 'Not Verified — Send Back'}
                            </button>
                            <button
                                onClick={handleApproveAll}
                                disabled={isApproving}
                                className="group flex items-center gap-3 bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Shield size={16} className="group-hover:rotate-12 transition-transform" />
                                {isApproving ? 'Approving...' : 'Approve & Verify All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Row Detail View Modal - Using Centralized Component */}
            <SupervisorRowVerifyModal
                isOpen={!!selectedRowDetail}
                onClose={() => { setSelectedRowDetail(null); }}
                onVerify={async (status, reason) => {
                    if (selectedRowDetail) {
                        await handleSingleRowVerify(selectedRowDetail.index, status, reason);
                        setSelectedRowDetail(null);
                    }
                }}
                row={selectedRowDetail}
            />
        </div>
    );
};
