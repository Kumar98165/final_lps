import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ClipboardCheck, ArrowLeft, Clock, Shield, ShieldAlert,
    CheckCircle2, XCircle, MessageSquare
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

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
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [selectedRowDetail, setSelectedRowDetail] = useState<any>(null);
    const [rowDetailReason, setRowDetailReason] = useState("");

    if (!selectedLog) return null;

    const logData: any[] = selectedLog.log_data || [];

    // Count statuses
    const verifiedCount = logData.filter(r => r.row_status === 'VERIFIED').length;
    const rejectedCount = logData.filter(r => r.row_status === 'REJECTED').length;
    const pendingCount = logData.length - verifiedCount - rejectedCount;

    const handleApproveAll = async () => {
        setIsApproving(true);
        await onBulkVerify();
        setIsApproving(false);
    };

    const handleRejectSubmit = async () => {
        if (!rejectReason.trim()) return;
        setIsRejecting(true);
        await onRejectLog(rejectReason.trim());
        setIsRejecting(false);
        setShowRejectModal(false);
        setRejectReason('');
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
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                            <ClipboardCheck size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-0.5">
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedLog.model_name}</h1>
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">
                                DEO Submission • ORDER ID: <span className="text-[#F37021] font-black">{selectedLog.formatted_id || `DEM-${selectedLog.id?.toString().padStart(3, '0')}`}</span>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedLog(null)} 
                        className="h-10 px-6 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                        <ArrowLeft size={14} /> Back to List
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target</span>
                        <span className="text-xl font-black text-slate-900">{selectedLog.target_vehicles || 0}</span>
                        <span className="text-[9px] font-black text-slate-400 ml-1">VEH</span>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Parts</span>
                        <span className="text-xl font-black text-slate-900">{logData.length}</span>
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
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Customer: <span className="text-slate-900">{selectedLog.customer_name || 'CIE AUTOMOTIVE'}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Operator: <span className="text-slate-900">{selectedLog.deo_name || 'N/A'}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F37021]" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Line: <span className="text-slate-900">{selectedLog.line_name || 'N/A'}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Submission Date: <span className="text-slate-900">{selectedLog.date}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Data Table — Read Only */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar" style={{ maxHeight: '550px' }}>
                    <table className="w-full min-w-[1200px] border-separate border-spacing-0">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-slate-50">
                                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-left border-b border-slate-100 sticky left-0 bg-slate-50/50 z-30">S.</th>
                                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-left border-b border-slate-100 sticky left-[40px] bg-slate-50/50 z-30 min-w-[160px]">SAP Part Number</th>
                                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-left border-b border-slate-100 min-w-[160px]">Part Number</th>
                                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-left border-b border-slate-100 min-w-[200px]">Description</th>
                                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center border-b border-slate-100 min-w-[80px]">Per Day</th>
                                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#F37021] text-center border-b border-orange-100 bg-orange-50/50 min-w-[100px]">SAP Stock</th>
                                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#F37021] text-center border-b border-orange-100 bg-orange-50/50 min-w-[110px]">Opening Stock</th>
                                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#F37021] text-center border-b border-orange-100 bg-orange-50/50 min-w-[110px]">Todays Stock</th>
                                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 text-center border-b border-emerald-100 bg-emerald-50/50 min-w-[110px]">Today Produced</th>
                                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center border-b border-slate-100 min-w-[110px]">Coverage Days</th>
                                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center border-b border-slate-100 min-w-[150px] sticky right-0 bg-slate-50/50 z-30">Vetting Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logData.map((row: any, index: number) => {
                                const coverage = parseFloat(row['Coverage Days'] || '0');
                                const isLowCoverage = coverage > 0 && coverage < 5;
                                const rowStatus = row.row_status;

                                return (
                                    <tr 
                                        key={row.id || index} 
                                        onClick={() => setSelectedRowDetail({ ...row, index })}
                                        className={cn(
                                            "border-b border-slate-50 transition-colors cursor-pointer group",
                                            rowStatus === 'VERIFIED' && "bg-emerald-50/30 hover:bg-emerald-50/50",
                                            rowStatus === 'REJECTED' && "bg-red-50/30 hover:bg-red-50/50",
                                            !rowStatus && "hover:bg-slate-50/50"
                                        )}
                                    >
                                        <td className="p-2 border-b border-slate-50 sticky left-0 bg-inherit z-10 text-center">
                                            <div className="w-full rounded-2xl p-4 flex items-center justify-center border border-slate-100 shadow-sm bg-white min-h-[60px]">
                                                <span className="text-sm font-black text-slate-900">{index + 1}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 sticky left-[40px] bg-inherit z-10 border-b border-slate-50">
                                            <div className="w-full rounded-2xl p-4 flex items-center justify-center border border-slate-100 shadow-sm bg-white min-h-[60px] min-w-[140px]">
                                                <span className="text-[10px] font-black text-[#F37021] uppercase tracking-tight text-center leading-tight">
                                                    {row["SAP PART NUMBER"] || row["SAP PART #"] || row["SAP Part Number"] || "—"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-2 border-b border-slate-50">
                                            <div className="w-full rounded-2xl p-4 flex items-center justify-center border border-slate-100 shadow-sm bg-white min-h-[60px] min-w-[140px]">
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight text-center leading-tight">
                                                    {row["PART NUMBER"] || row["Part Number"] || "—"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-2 border-b border-slate-50">
                                            <div className="w-full rounded-2xl p-4 flex items-center justify-start px-6 border border-slate-100 shadow-sm bg-white min-h-[60px] min-w-[250px]">
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-tight" title={row["PART DESCRIPTION"] || row["Description"]}>
                                                    {row["PART DESCRIPTION"] || row["Description"] || "—"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-2 border-b border-slate-50">
                                            <div className="w-full rounded-2xl p-4 flex items-center justify-center border border-slate-100 shadow-sm bg-white min-h-[60px]">
                                                <span className="text-sm font-black text-slate-500">{row["PER DAY"] || row["Per Day"] || "0"}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 border-b border-slate-50">
                                            <div className="w-full rounded-2xl p-4 flex items-center justify-center border border-slate-100 shadow-sm bg-orange-50/30 min-h-[60px]">
                                                <span className="text-sm font-black text-slate-900">{row["SAP Stock"] || "—"}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 border-b border-slate-50">
                                            <div className="w-full rounded-2xl p-4 flex items-center justify-center border border-slate-100 shadow-sm bg-orange-50/30 min-h-[60px]">
                                                <span className="text-sm font-black text-slate-900">{row["Opening Stock"] || "—"}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 border-b border-slate-50">
                                            <div className="w-full rounded-2xl p-4 flex items-center justify-center border border-slate-100 shadow-sm bg-orange-50/30 min-h-[60px]">
                                                <span className="text-sm font-black text-slate-900">{row["Todays Stock"] || "—"}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 border-b border-slate-50">
                                            <div className="w-full rounded-2xl p-4 flex items-center justify-center border border-emerald-100 shadow-sm bg-emerald-50/30 min-h-[60px]">
                                                <span className="text-sm font-black text-emerald-600">{row["Today Produced"] || "0"}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 border-b border-slate-50">
                                            <div className={cn(
                                                "w-full rounded-2xl p-4 flex items-center justify-center border shadow-sm min-h-[60px]",
                                                isLowCoverage ? "bg-red-500 border-red-600 shadow-red-500/20" : "bg-white border-slate-100"
                                            )}>
                                                <span className={cn(
                                                    "text-sm font-black",
                                                    isLowCoverage ? "text-white" : "text-slate-900"
                                                )}>
                                                    {row["Coverage Days"] || "0.0"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-2 border-b border-slate-50 sticky right-0 bg-inherit z-10 text-center">
                                            <div className="w-full rounded-2xl p-4 flex items-center justify-center border border-slate-100 shadow-sm bg-white min-h-[60px] min-w-[140px]">
                                                {rowStatus === 'VERIFIED' ? (
                                                    <div className="px-4 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                                                        VERIFIED
                                                    </div>
                                                ) : rowStatus === 'REJECTED' ? (
                                                    <div className="px-4 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-[9px] font-black uppercase tracking-widest">
                                                        REJECTED
                                                    </div>
                                                ) : (
                                                    <div className="px-6 py-2 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-md group-hover:bg-black transition-all">
                                                        REVIEW
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

            {/* Action Buttons — Approve / Reject — always visible unless already APPROVED */}
            {selectedLog.status !== 'APPROVED' && (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield size={20} className="text-slate-400" />
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Verification Decision</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Review the DEO's data above and approve or reject
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    if (rejectedCount > 0) {
                                        onRejectLog("Correction required for multiple items.");
                                    } else {
                                        setShowRejectModal(true);
                                    }
                                }}
                                disabled={isRejecting}
                                className="group flex items-center gap-3 bg-red-50 text-red-600 border-2 border-red-200 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 hover:border-red-300 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <ShieldAlert size={16} className="group-hover:scale-110 transition-transform" />
                                {isRejecting ? 'Rejecting...' : 'Not Verified — Send Back'}
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

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                                <ShieldAlert size={24} className="text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Reject Submission</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    This will be sent back to DEO for correction
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                <MessageSquare size={12} className="inline mr-1" />
                                What needs to be corrected?
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Describe what's wrong with the data (e.g., 'SAP Stock value for part PMAM0101BAN04040-I seems incorrect, please re-check')"
                                rows={4}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-red-300 focus:ring-0 outline-none resize-none transition-all"
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={!rejectReason.trim() || isRejecting}
                                className="px-8 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <ShieldAlert size={14} />
                                {isRejecting ? 'Sending...' : 'Send Back to DEO'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Row Detail Modal */}
            <AnimatePresence>
                {selectedRowDetail && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-100 flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-50 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">Verification Detail</h2>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                                            Vetting Item S.: <span className="text-[#F37021]">{selectedRowDetail.index + 1}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSelectedRowDetail(null); setRowDetailReason(""); }}
                                    className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors"
                                >
                                    <XCircle size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-8 py-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                                <div className="grid grid-cols-12 gap-x-6 gap-y-5 font-bold uppercase tracking-tight">
                                    <div className="col-span-12 md:col-span-2 space-y-1.5">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">SN. NO</label>
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-black text-slate-900 flex items-center shadow-sm h-[44px] justify-center">
                                            {selectedRowDetail.index + 1}
                                        </div>
                                    </div>
                                    <div className="col-span-12 md:col-span-5 space-y-1.5">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">SAP Part Number</label>
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-black text-slate-900 break-all min-h-[44px] flex items-center shadow-sm text-center justify-center">
                                            {selectedRowDetail["SAP PART NUMBER"] || selectedRowDetail["SAP PART #"] || selectedRowDetail["SAP Part Number"] || "—"}
                                        </div>
                                    </div>
                                    <div className="col-span-12 md:col-span-5 space-y-1.5">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">PART NUMBER</label>
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-black text-slate-900 break-all min-h-[44px] flex items-center shadow-sm text-center justify-center">
                                            {selectedRowDetail["PART NUMBER"] || selectedRowDetail["Part Number"] || "—"}
                                        </div>
                                    </div>
                                    <div className="col-span-12 space-y-1.5">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">PART DESCRIPTION</label>
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-[11px] font-black text-slate-900 min-h-[44px] flex items-center shadow-sm">
                                            {selectedRowDetail["PART DESCRIPTION"] || selectedRowDetail["Description"] || "—"}
                                        </div>
                                    </div>

                                    {/* Stats Group 1: Per Day & Stocks */}
                                    <div className="col-span-12 grid grid-cols-4 gap-4 pt-2">
                                        <div className="space-y-1.5">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">PER DAY</label>
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-black text-slate-900 flex items-center shadow-sm h-[44px] justify-center">
                                                {selectedRowDetail["PER DAY"] || selectedRowDetail["Per Day"] || "0"}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">SAP Stock</label>
                                            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 text-center shadow-sm">
                                                <span className="text-lg font-black text-slate-900">{selectedRowDetail["SAP Stock"] || "0"}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Opening Stock</label>
                                            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 text-center shadow-sm">
                                                <span className="text-lg font-black text-slate-900">{selectedRowDetail["Opening Stock"] || "0"}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Todays Stock</label>
                                            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 text-center shadow-sm">
                                                <span className="text-lg font-black text-slate-900">{selectedRowDetail["Todays Stock"] || "0"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Group 2: Production & Status */}
                                    <div className="col-span-12 grid grid-cols-3 gap-4 pt-2">
                                        <div className="space-y-1.5">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Today Produced</label>
                                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center shadow-sm border-2">
                                                <span className="text-xl font-black text-emerald-600">{selectedRowDetail["Today Produced"] || "0"}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Coverage Days</label>
                                            <div className={cn(
                                                "border rounded-xl px-4 py-2.5 text-[11px] font-black shadow-sm h-[44px] flex items-center justify-center",
                                                parseFloat(selectedRowDetail["Coverage Days"] || "0") < 5 
                                                    ? "bg-red-50 text-red-600 border-red-200" 
                                                    : "bg-emerald-50 text-emerald-900 border-emerald-100"
                                            )}>
                                                {selectedRowDetail["Coverage Days"] || "0.0"} DAYS
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Production Status</label>
                                            <div className={cn(
                                                "rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-sm h-[44px] flex items-center justify-center border-2",
                                                (selectedRowDetail["Production Status"] || 'PENDING') === 'COMPLETE' ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                : (selectedRowDetail["Production Status"] || 'PENDING') === 'IN PROGRESS' ? "bg-amber-50 border-amber-200 text-amber-700"
                                                : "bg-slate-50 border-slate-200 text-slate-600"
                                            )}>
                                                {selectedRowDetail["Production Status"] || 'PENDING'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Issue / Remark Section */}
                                    <div className="col-span-12 mt-2 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                                                <MessageSquare size={12} className="text-orange-600" />
                                            </div>
                                            <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Supervisor Issue / Remark</h3>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Previous DEO Reply if exists */}
                                            {selectedRowDetail.deo_reply && (
                                                <div className="bg-emerald-50/50 border border-emerald-100 rounded-[1.25rem] p-3 animate-in slide-in-from-left-4 duration-500">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
                                                            <CheckCircle2 size={10} className="text-emerald-600" />
                                                        </div>
                                                        <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest leading-none">DEO Reply</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-emerald-800 leading-relaxed italic ml-7">
                                                        "{selectedRowDetail.deo_reply}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Supervisor Comment Input */}
                                            <div className="relative group">
                                                <textarea
                                                    value={rowDetailReason}
                                                    onChange={(e) => setRowDetailReason(e.target.value)}
                                                    placeholder={selectedRowDetail.row_status === 'VERIFIED' ? "Verification remarks (optional)" : "Describe the problem if rejecting this item..."}
                                                    rows={2}
                                                    className={cn(
                                                        "w-full bg-slate-50 border-2 rounded-[1.25rem] p-4 text-[11px] font-bold text-slate-900 placeholder:text-slate-300 outline-none transition-all resize-none shadow-sm",
                                                        selectedRowDetail.row_status === 'REJECTED' ? "border-red-100 focus:border-red-300" : "border-slate-100 focus:border-[#F37021]/30"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-5 border-t border-slate-50 flex gap-4 shrink-0 bg-slate-50/50">
                                <button
                                    onClick={() => { setSelectedRowDetail(null); setRowDetailReason(""); }}
                                    className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
                                >
                                    CLOSE VIEW
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { handleSingleRowVerify(selectedRowDetail.index, 'VERIFIED', rowDetailReason); setSelectedRowDetail(null); setRowDetailReason(""); }}
                                        className="px-8 py-3.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                    >
                                        <CheckCircle2 size={14} /> VERIFY ITEM
                                    </button>
                                    <button
                                        onClick={() => { 
                                            handleSingleRowVerify(selectedRowDetail.index, 'REJECTED', rowDetailReason); 
                                            setSelectedRowDetail(null); 
                                            setRowDetailReason("");
                                        }}
                                        disabled={!rowDetailReason.trim()}
                                        className={cn(
                                            "px-8 py-3.5 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-lg shadow-red-500/20",
                                            !rowDetailReason.trim() ? "opacity-30 cursor-not-allowed grayscale" : "hover:bg-red-700 active:scale-95"
                                        )}
                                    >
                                        <XCircle size={14} /> REJECT ITEM
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
