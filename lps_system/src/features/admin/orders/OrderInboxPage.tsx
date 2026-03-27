import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    CheckCircle2,
    ArrowRight,
    Zap,
    X,
    Trash2,
    Activity,
    ShieldCheck,
    Cpu,
    Database,
    User,
    FileText,
    Inbox,
    CheckSquare,
    Square
} from 'lucide-react';
import { type OrderEmail } from '../../../lib/staticData';
import DemandFormModal from '../demand/DemandFormModal';
import { API_BASE } from '../../../lib/apiConfig';
import { getToken } from '../../../lib/storage';

const OrderInboxPage = () => {
    const [emails, setEmails] = useState<OrderEmail[]>([]);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'REJECTED'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const loadEmails = async () => {
        setIsLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/orders/fetch-emails`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    const fetchedEmails = result.data.map((e: any) => {
                        const bodyLower = e.body.toLowerCase();
                        let parsedModel = 'Unknown';
                        let parsedQuantity = 0;
                        let parsedPriority: 'NORMAL' | 'HIGH' = 'NORMAL';

                        const modelList = ["TML_WINGER", "XUV", "CURVV", "MPV", "MTBL", "U301", "U202", "KUV", "ARJUN", "H3", "ALFA", "BOLERO", "THAR", "EV", "SCORPIO"];
                        for (const m of modelList) {
                            if (bodyLower.includes(m.toLowerCase()) || (e.subject && e.subject.toLowerCase().includes(m.toLowerCase()))) {
                                parsedModel = m;
                                break;
                            }
                        }

                        if (bodyLower.includes('urgent') || e.subject?.toLowerCase().includes('urgent')) {
                            parsedPriority = 'HIGH';
                        }

                        const quantMatch = bodyLower.match(/(\d+)\s*units?/) || 
                                           bodyLower.match(/(\d+)\s*order/) ||
                                           bodyLower.match(/(\d+)\s*qty/) ||
                                           (e.subject && e.subject.toLowerCase().match(/(\d+)\s*units?/));
                        
                        if (quantMatch) {
                            parsedQuantity = parseInt(quantMatch[1]);
                        } else {
                            const qMatch2 = bodyLower.match(/quantity.*?(\d+)/);
                            if (qMatch2) parsedQuantity = parseInt(qMatch2[1]);
                        }

                        const senderMatch = e.sender.match(/(.*?)\s*<(.*?)>/);
                        const senderName = senderMatch ? senderMatch[1].replace(/"/g, '').trim() : e.sender;
                        const senderEmail = senderMatch ? senderMatch[2] : e.sender;

                        return {
                            id: e.id,
                            sender: senderName || 'External Customer',
                            sender_email: senderEmail,
                            subject: e.subject || 'New Order Request',
                            body: e.body || '',
                            received_date: e.date || new Date().toISOString(),
                            status: 'PENDING' as const,
                            parsed_model: parsedModel,
                            parsed_quantity: parsedQuantity || 1,
                            parsed_priority: parsedPriority,
                            is_read: false
                        };
                    });

                    setEmails(fetchedEmails);
                    if (fetchedEmails.length > 0) {
                        setSelectedEmailId(fetchedEmails[0].id);
                    } else {
                        setSelectedEmailId(null);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch emails:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEmails();
    }, []);

    useEffect(() => {
        if (emails.length > 0 && !selectedEmailId) {
            handleEmailClick(emails[0].id);
        }
    }, [emails, selectedEmailId]);

    const selectedEmail = emails.find(e => e.id === selectedEmailId);

    // Filter Logic
    const filteredEmails = emails.filter(email => {
        const matchesSearch = email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.subject.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = true;
        if (filter === 'UNREAD') matchesFilter = !email.is_read && email.status !== 'REJECTED' && email.status !== 'PROCESSED';
        else if (filter === 'READ') matchesFilter = (email.is_read || email.status === 'PROCESSED') && email.status !== 'REJECTED';
        else if (filter === 'REJECTED') matchesFilter = email.status === 'REJECTED';

        return matchesSearch && matchesFilter;
    });

    const handleEmailClick = (id: string) => {
        setSelectedEmailId(id);
        const email = emails.find(e => e.id === id);
        if (email && !email.is_read) {
            setEmails(prev => prev.map(e => e.id === id ? { ...e, is_read: true } : e));
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [showRejectSuccess, setShowRejectSuccess] = useState(false);

    const handleRejectSubmit = async () => {
        if (!selectedEmailId || !selectedEmail) return;
        setIsRejecting(true);

        try {
            const token = getToken();
            
            // 1. Send Rejection Email
            const rejectionBody = `Dear Customer,\n\nThank you for choosing LPS.\n\nWe regret to inform you that your production request for ${selectedEmail.parsed_model || 'selected model'} has been declined for the following reason:\n\n"${rejectionReason}"\n\nIf you have any questions regarding this decision, please feel free to contact us.\n\nThank you for trusting LPS.\n\nWarm regards,\nLPS Production Team\nThank you from LPS`;

            const response = await fetch(`${API_BASE}/orders/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: selectedEmail.sender_email,
                    subject: `Re: ${selectedEmail.subject} - Order Rejected`,
                    body: rejectionBody
                })
            });

            if (response.ok) {
                // 2. Move to Trash on server
                await fetch(`${API_BASE}/orders/emails/${selectedEmailId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // 3. Update local state
                setEmails(prev => prev.map(e => e.id === selectedEmailId ? { ...e, status: 'REJECTED' as const, is_read: true } : e));
                setIsRejecting(false);
                setShowRejectSuccess(true);
            } else {
                const errData = await response.json();
                console.error('Failed to send rejection email:', errData.message);
                setIsRejecting(false);
                alert(`Error: ${errData.message}`);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            setIsRejecting(false);
        }
    };

    const handleRejectModalClose = () => {
        setIsRejectModalOpen(false);
        setRejectionReason('');
        setShowRejectSuccess(false);
        // Clear selection to move out of unread if processed
        setSelectedEmailId(null);
    };

    const handleDeleteEmail = async (id: string) => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/orders/emails/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                setEmails(prev => prev.filter(e => e.id !== id));
                if (selectedEmailId === id) {
                    setSelectedEmailId(null);
                }
                const newSelected = new Set(selectedIds);
                newSelected.delete(id);
                setSelectedIds(newSelected);
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkDeleting(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/orders/bulk-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email_ids: Array.from(selectedIds) })
            });
            if (response.ok) {
                setEmails(prev => prev.filter(e => !selectedIds.has(e.id)));
                setSelectedIds(new Set());
                if (selectedEmailId && selectedIds.has(selectedEmailId)) {
                    setSelectedEmailId(null);
                }
            }
        } catch (error) {
            console.error('Bulk delete failed:', error);
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredEmails.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredEmails.map(e => e.id)));
        }
    };

    const toggleSelectOne = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-slate-50 flex flex-col font-sans">
            <DemandFormModal
                isOpen={isDemandModalOpen}
                onClose={() => setIsDemandModalOpen(false)}
                onSuccess={() => {
                    if (selectedEmailId) {
                        setEmails(prev => prev.map(e => e.id === selectedEmailId ? { ...e, status: 'PROCESSED' as const } : e));
                    }
                    setIsDemandModalOpen(false);
                }}
                initialData={selectedEmail ? {
                    model_name: selectedEmail.parsed_model,
                    quantity: selectedEmail.parsed_quantity,
                    start_date: selectedEmail.parsed_date ? new Date(selectedEmail.parsed_date).toISOString().split('T')[0] : undefined,
                    customer: selectedEmail.sender,
                    customer_email: selectedEmail.sender_email,
                    subject: selectedEmail.subject
                } : undefined}
            />

            {/* Rejection Modal */}
            <AnimatePresence>
                {isRejectModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
                            onClick={handleRejectModalClose}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
                                {showRejectSuccess ? (
                                    <div className="p-10 text-center space-y-6">
                                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">Rejection Sent</h3>
                                            <p className="text-slate-500 text-sm mt-2">
                                                An automated rejection email has been sent to<br />
                                                <span className="font-semibold text-slate-700">{selectedEmail?.sender_email}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleRejectModalClose}
                                            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-8 space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <X size={20} className="text-red-500" /> Reject Order Request
                                            </h3>
                                            <button onClick={handleRejectModalClose} className="text-slate-400 hover:text-slate-600">
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">To Participant</label>
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700">
                                                    {selectedEmail?.sender_email}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Rejection Reason</label>
                                                <textarea
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    placeholder="State the operational reason for rejecting this request..."
                                                    className="w-full h-32 bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#F37021] focus:ring-1 focus:ring-[#F37021] transition-all resize-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={handleRejectModalClose}
                                                className="flex-1 px-4 py-3 border border-slate-300 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleRejectSubmit}
                                                disabled={isRejecting || !rejectionReason.trim()}
                                                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-bold text-sm shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isRejecting ? <Activity size={16} className="animate-spin" /> : 'Send Rejection'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                        <Inbox size={24} className="text-slate-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Order Requests inbox</h1>
                        <p className="text-sm font-medium text-slate-500">Manage incoming production requests</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-200/50 p-1 rounded-[1.2rem] border border-slate-200/60 shadow-inner">
                        {['All', 'Unread', 'Read', 'Rejected'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f.toUpperCase() as any)}
                                className={`px-6 py-2 rounded-[0.8rem] text-[11px] font-black tracking-tight transition-all duration-500 ${filter === f.toUpperCase()
                                    ? 'bg-[#F37021] text-white shadow-lg scale-105 active:scale-95'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    
                    <div className="h-8 w-px bg-slate-200 mx-1" />

                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-bold text-red-600 shadow-sm hover:bg-red-100 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isBulkDeleting ? <Activity size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            Delete ({selectedIds.size})
                        </button>
                    )}

                    <button
                        onClick={loadEmails}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Activity size={16} className="animate-spin text-slate-400" /> : <Zap size={16} className="text-[#F37021]" />}
                        Sync
                    </button>
                </div>
            </div>

            {/* Content Split Pane */}
            <div className="flex-1 overflow-hidden flex bg-[#F8FAFC]">

                {/* Left Panel: Email List */}
                <div className="w-[400px] bg-white border-r border-slate-200 flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                        <button 
                            onClick={toggleSelectAll}
                            className={`p-1.5 rounded-md transition-colors ${selectedIds.size === filteredEmails.length && filteredEmails.length > 0 ? 'text-[#F37021] bg-[#F37021]/10' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                            {selectedIds.size === filteredEmails.length && filteredEmails.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-100 border-none outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-[#F37021]/20"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredEmails.length > 0 ? filteredEmails.map(email => (
                            <div
                                key={email.id}
                                onClick={() => handleEmailClick(email.id)}
                                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors relative flex gap-3 ${selectedEmailId === email.id
                                    ? 'bg-[#F37021]/5'
                                    : 'hover:bg-slate-50'
                                    }`}
                            >
                                {/* Unread Indicator */}
                                {!email.is_read && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F37021]" />
                                )}

                                <button 
                                    onClick={(e) => toggleSelectOne(e, email.id)}
                                    className={`mt-1 shrink-0 p-1 rounded-md transition-colors ${selectedIds.has(email.id) ? 'text-[#F37021]' : 'text-slate-300 hover:text-slate-400'}`}
                                >
                                    {selectedIds.has(email.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`text-sm truncate pr-2 ${!email.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                            {email.sender}
                                        </h3>
                                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                                            {formatTime(email.received_date).split(',')[0]}
                                        </span>
                                    </div>
                                    <h4 className={`text-sm truncate mb-1 ${!email.is_read ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                                        {email.subject}
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate">
                                        {email.body}
                                    </p>

                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${email.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            email.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {email.status}
                                        </span>
                                        {email.parsed_priority === 'HIGH' && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                                <Zap size={10} /> Priority
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-slate-500">
                                <Inbox size={32} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-sm font-medium">No order requests found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Detail View */}
                <div className="flex-1 flex flex-col bg-white m-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {selectedEmail ? (
                        <>
                            {/* Detail Header */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 border border-slate-300">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                                {selectedEmail.subject}
                                            </h2>
                                            <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                                                <span className="font-semibold text-slate-800">{selectedEmail.sender}</span>
                                                <span className="text-slate-400">&lt;{selectedEmail.sender_email}&gt;</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 font-medium">
                                                Received: {formatTime(selectedEmail.received_date)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDeleteEmail(selectedEmail.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            title="Delete Request"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Extracted Details Bar */}
                                <div className="mt-6 bg-slate-100/50 rounded-lg p-5 border border-slate-200">
                                    <div className="grid grid-cols-3 gap-6 divide-x divide-slate-200/60">
                                        <div className="pl-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Cpu size={12} className="text-[#F37021]" /> MODEL DETECTED</span>
                                            <span className="text-sm font-bold text-slate-900">{selectedEmail.parsed_model}</span>
                                        </div>
                                        <div className="pl-6">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Database size={12} className="text-emerald-500" /> REQUIRED QUANTITY</span>
                                            <span className="text-sm font-bold text-slate-900">{selectedEmail.parsed_quantity} Units</span>
                                        </div>
                                        <div className="pl-6">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><ShieldCheck size={12} className="text-blue-500" /> SYSTEM STATUS</span>
                                            <span className={`text-sm font-bold ${selectedEmail.status === 'PENDING' ? 'text-amber-600' : selectedEmail.status === 'PROCESSED' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {selectedEmail.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Email Body */}
                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="max-w-3xl font-medium text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                                    {selectedEmail.body}
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsRejectModalOpen(true)}
                                    className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
                                >
                                    Reject Order
                                </button>
                                <button
                                    onClick={() => setIsDemandModalOpen(true)}
                                    className="px-6 py-2.5 bg-[#F37021] text-white font-bold text-sm rounded-lg hover:bg-[#d9621a] transition-colors shadow-md flex items-center gap-2"
                                >
                                    Authorize Production <ArrowRight size={16} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <FileText size={48} className="mb-4 text-slate-200" />
                            <h2 className="text-lg font-bold text-slate-700 mb-1">No Request Selected</h2>
                            <p className="text-sm font-medium">Select an order request from the list to view details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderInboxPage;
