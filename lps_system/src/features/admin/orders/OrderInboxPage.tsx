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
    User,
    FileText,
    Inbox,
    CheckSquare,
    Square
} from 'lucide-react';
import DemandFormModal from '../demand/DemandFormModal';
import { API_BASE } from '../../../lib/apiConfig';
import { getToken } from '../../../lib/storage';

interface OrderEmail {
    id: number;
    imap_uid: string;
    sender: string;
    sender_email: string;
    subject: string;
    body: string;
    received_date: string;
    status: 'UNREAD' | 'READ' | 'REJECTED' | 'PROCESSED';
    is_read: boolean;
    // UI Helpers extra
    parsed_model?: string;
    parsed_quantity?: number;
}

const OrderInboxPage = () => {
    const [emails, setEmails] = useState<OrderEmail[]>([]);
    const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'REJECTED'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadEmails = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/orders/fetch-emails`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    processEmails(result.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch emails:', error);
        }
    };

    const syncEmails = async () => {
        setIsSyncing(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/orders/sync-emails`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    processEmails(result.data);
                }
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const processEmails = (data: any[]) => {
        const fetchedEmails = data.map((e: any) => {
            const bodyLower = e.body.toLowerCase();
            let parsedModel = 'Unknown';
            let parsedQuantity = 1;

            const modelList = ["TML_WINGER", "XUV", "CURVV", "MPV", "MTBL", "U301", "U202", "KUV", "ARJUN", "H3", "ALFA", "BOLERO", "THAR", "EV", "SCORPIO"];
            for (const m of modelList) {
                if (bodyLower.includes(m.toLowerCase()) || (e.subject && e.subject.toLowerCase().includes(m.toLowerCase()))) {
                    parsedModel = m;
                    break;
                }
            }

            const quantMatch = bodyLower.match(/(\d+)\s*units?/) ||
                bodyLower.match(/(\d+)\s*order/) ||
                (e.subject && e.subject.toLowerCase().match(/(\d+)\s*units?/));

            if (quantMatch) {
                parsedQuantity = parseInt(quantMatch[1]);
            }

            return {
                ...e,
                parsed_model: parsedModel,
                parsed_quantity: parsedQuantity
            };
        });

        setEmails(fetchedEmails);
        if (fetchedEmails.length > 0 && !selectedEmailId) {
            setSelectedEmailId(fetchedEmails[0].id);
        }
    };

    useEffect(() => {
        loadEmails();
        // Background sync every 10 minutes to avoid IMAP hammer
        const timer = setInterval(() => {
            syncEmails();
        }, 600000);
        return () => clearInterval(timer);
    }, []);

    const selectedEmail = emails.find(e => e.id === selectedEmailId);

    const filteredEmails = emails.filter(email => {
        const matchesSearch = email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.subject.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = true;
        if (filter === 'UNREAD') {
            matchesFilter = email.status === 'UNREAD';
        } else if (filter === 'READ') {
            matchesFilter = email.status === 'READ' || email.status === 'PROCESSED';
        } else if (filter === 'REJECTED') {
            matchesFilter = email.status === 'REJECTED';
        }

        return matchesSearch && matchesFilter;
    });

    const handleEmailClick = async (id: number) => {
        setSelectedEmailId(id);
        const email = emails.find(e => e.id === id);
        // Automatically mark as READ (persistent) if it was UNREAD
        if (email && email.status === 'UNREAD') {
            try {
                const token = getToken();
                const res = await fetch(`${API_BASE}/admin/orders/emails/${id}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: 'READ' })
                });
                if (res.ok) {
                    setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'READ' } : e));
                }
            } catch (err) {
                console.error("Failed to update read status", err);
            }
        }
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return "Just now";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [showRejectSuccess, setShowRejectSuccess] = useState(false);
    const [showAuthSuccess, setShowAuthSuccess] = useState(false);
    const [isConfirmAuthOpen, setIsConfirmAuthOpen] = useState(false);
    const [isAuthorizing, setIsAuthorizing] = useState(false);

    const handleRejectSubmit = async () => {
        if (!selectedEmailId || !selectedEmail) return;
        setIsRejecting(true);

        try {
            const token = getToken();
            const rejectionBody = `Dear Customer,\n\nWe regret to inform you that your request for ${selectedEmail.parsed_model || 'the model'} has been declined.\nReason: ${rejectionReason}`;

            const response = await fetch(`${API_BASE}/orders/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: selectedEmail.sender_email,
                    subject: `Update: ${selectedEmail.subject}`,
                    body: rejectionBody
                })
            });

            if (response.ok) {
                await fetch(`${API_BASE}/admin/orders/emails/${selectedEmailId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: 'REJECTED' })
                });

                setEmails(prev => prev.map(e => e.id === selectedEmailId ? { ...e, status: 'REJECTED' } : e));
                setIsRejecting(false);
                setShowRejectSuccess(true);
            }
        } catch (error) {
            console.error('Error rejecting email:', error);
            setIsRejecting(false);
        }
    };

    const handleAuthorize = async (formData: any) => {
        if (!selectedEmailId || isAuthorizing) return; // Block duplicate calls
        setIsAuthorizing(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/admin/orders/emails/${selectedEmailId}/authorize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                // Auto-reply logic
                if (selectedEmail?.sender_email) {
                    const subject = `Order Authorized: ${selectedEmail.subject}`;
                    const formattedEndDate = new Date(formData.end_date || formData.start_date || new Date().toISOString()).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
                    const body = `Dear Customer,\n\nWe are pleased to inform you that your request for ${formData.model_name || 'the model'} (Quantity: ${formData.quantity || 1}) has been successfully AUTHORIZED for production.\n\n### 📦 Order Details:\n* Model: ${formData.model_name || 'Confirmed'}\n* Quantity: ${formData.quantity || 1} Units\n* Expected Completion: ${formattedEndDate}\n\nOur team has initiated the manufacturing process. You will receive further updates as production progresses.\n\nThank you for choosing LPS.\n\nBest regards,\nLPS Production Team\nThank you from LPS`;
                    
                    try {
                        await fetch(`${API_BASE}/orders/send-email`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                to: formData.customer_email || selectedEmail.sender_email,
                                subject,
                                body
                            })
                        });
                    } catch (err) {
                        console.error('Failed to send confirmation email', err);
                    }
                }

                setEmails(prev => prev.map(e => e.id === selectedEmailId ? { ...e, status: 'PROCESSED' } : e));
                setIsDemandModalOpen(false);
                setShowAuthSuccess(true);
            }
        } catch (error) {
            console.error("Authorization failed", error);
        } finally {
            setIsAuthorizing(false);
        }
    };

    const handleDeleteEmail = async (id: number) => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/orders/emails/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setEmails(prev => prev.filter(e => e.id !== id));
                if (selectedEmailId === id) setSelectedEmailId(null);
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
            await fetch(`${API_BASE}/orders/bulk-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email_ids: Array.from(selectedIds) })
            });
            setEmails(prev => prev.filter(e => !selectedIds.has(e.id)));
            setSelectedIds(new Set());
            setSelectedEmailId(null);
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredEmails.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredEmails.map(e => e.id)));
    };

    const toggleSelectOne = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-ind-bg flex flex-col font-sans">
            {/* Authorization Confirmation Modal */}
            <AnimatePresence>
                {isConfirmAuthOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" onClick={() => setIsConfirmAuthOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-ind-border p-8 text-center space-y-6">
                                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-ind-primary mx-auto border border-orange-100">
                                    <Zap size={32} fill="#F37021" strokeWidth={0} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Confirm Authorization?</h3>
                                    <p className="text-ind-text2 font-bold text-sm leading-relaxed px-4">
                                        Are you sure you want to authorize this order? This will create a binding production demand and notify the customer.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setIsConfirmAuthOpen(false)}
                                        className="flex-1 bg-ind-bg text-ind-text3 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-ind-border/30 transition-all border border-ind-border"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsConfirmAuthOpen(false);
                                            setIsDemandModalOpen(true);
                                        }}
                                        disabled={isAuthorizing}
                                        className="flex-1 bg-[#F37021] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#d9621a] transition-all shadow-xl shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        YES, AUTHORIZE
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <DemandFormModal
                isOpen={isDemandModalOpen}
                onClose={() => setIsDemandModalOpen(false)}
                onSuccess={(data: any) => {
                    handleAuthorize(data);
                }}
                initialData={selectedEmail ? {
                    model_name: selectedEmail.parsed_model,
                    quantity: selectedEmail.parsed_quantity,
                    customer: selectedEmail.sender,
                    customer_email: selectedEmail.sender_email,
                    subject: selectedEmail.subject
                } : undefined}
            />

            {/* Authorization Success Modal */}
            <AnimatePresence>
                {showAuthSuccess && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]" onClick={() => setShowAuthSuccess(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-ind-border/50 p-8 text-center space-y-6">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-100 italic">
                                    <CheckCircle2 size={40} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Order Authorized!</h3>
                                    <p className="text-ind-text2 font-bold text-sm leading-relaxed">
                                        Your model order has been successfully <span className="text-emerald-500 italic">authorized</span> and registered in the production system.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAuthSuccess(false)}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                >
                                    GREAT, THANKS!
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Rejection Modal */}
            <AnimatePresence>
                {isRejectModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]" onClick={() => setIsRejectModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-ind-border">
                                {showRejectSuccess ? (
                                    <div className="p-10 text-center space-y-6">
                                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto"><CheckCircle2 size={32} /></div>
                                        <div>
                                            <h3 className="text-xl font-bold text-ind-text">Rejection Processed</h3>
                                            <p className="text-ind-text2 text-sm mt-2">The request has been moved to Rejected storage.</p>
                                        </div>
                                        <button onClick={() => { setIsRejectModalOpen(false); setShowRejectSuccess(false); }} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm">Close</button>
                                    </div>
                                ) : (
                                    <div className="p-8 space-y-6">
                                        <div className="flex items-center justify-between border-b border-ind-border/50 pb-4">
                                            <h3 className="text-lg font-bold text-ind-text flex items-center gap-2"><X size={20} className="text-red-500" /> Reject Mail Request</h3>
                                            <button onClick={() => setIsRejectModalOpen(false)}><X size={20} /></button>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-ind-text2 uppercase">Rejection Reason</label>
                                            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Operational reason..." className="w-full h-32 bg-ind-bg border border-ind-border rounded-lg p-3 text-sm" />
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-3 border border-ind-border rounded-lg font-bold">Cancel</button>
                                            <button onClick={handleRejectSubmit} disabled={isRejecting || !rejectionReason.trim()} className="flex-1 bg-red-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                                {isRejecting ? <Activity size={16} className="animate-spin" /> : 'Confirm Rejection'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="bg-white border-b border-ind-border px-8 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-ind-border/30 p-2.5 rounded-lg border border-ind-border"><Inbox size={24} className="text-ind-text2" /></div>
                    <div>
                        <h1 className="text-xl font-bold text-ind-text tracking-tight">Order Requests inbox</h1>
                        <p className="text-sm font-medium text-ind-text2">Persistent mail tracking and sections</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-ind-border/50/50 p-1 rounded-[1.2rem] border border-ind-border/60 shadow-inner">
                        {['All', 'Unread', 'Read', 'Rejected'].map((f) => (
                            <button key={f} onClick={() => setFilter(f.toUpperCase() as any)} className={`px-6 py-2 rounded-[0.8rem] text-[11px] font-black tracking-tight transition-all ${filter === f.toUpperCase() ? 'bg-[#F37021] text-white shadow-lg' : 'text-ind-text2 hover:text-slate-700'}`}>{f}</button>
                        ))}
                    </div>
                    {selectedIds.size > 0 && <button onClick={handleBulkDelete} disabled={isBulkDeleting} className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-bold text-red-600 flex items-center gap-2">{isBulkDeleting ? <Activity size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete ({selectedIds.size})</button>}
                    <button onClick={syncEmails} disabled={isSyncing} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 flex items-center gap-2">
                        {isSyncing ? <Activity size={16} className="animate-spin" /> : <Zap size={16} className="text-ind-primary" />}
                        {isSyncing ? 'Syncing...' : 'Sync'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex bg-ind-bg">
                <div className="w-[400px] bg-white border-r border-ind-border flex flex-col shrink-0">
                    <div className="p-4 border-b border-ind-border/50 flex items-center gap-3">
                        <button onClick={toggleSelectAll} className={`p-1.5 rounded-md ${selectedIds.size === filteredEmails.length && filteredEmails.length > 0 ? 'text-ind-primary' : 'text-ind-text3'}`}>
                            {selectedIds.size === filteredEmails.length && filteredEmails.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ind-text3" size={18} />
                            <input type="text" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-ind-border/30 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#F37021]/20 outline-none" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredEmails.length > 0 ? filteredEmails.map(email => (
                            <div key={email.id} onClick={() => handleEmailClick(email.id)} className={`p-4 border-b border-ind-border/50 cursor-pointer transition-colors relative flex gap-3 ${selectedEmailId === email.id ? 'bg-[#F37021]/5' : 'hover:bg-ind-bg'}`}>
                                {email.status === 'UNREAD' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F37021]" />}
                                <button onClick={(e) => toggleSelectOne(e, email.id)} className={`mt-1 shrink-0 ${selectedIds.has(email.id) ? 'text-ind-primary' : 'text-ind-text3'}`}>{selectedIds.has(email.id) ? <CheckSquare size={18} /> : <Square size={18} />}</button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`text-sm truncate pr-2 ${email.status === 'UNREAD' ? 'font-bold text-ind-text' : 'text-slate-700'}`}>{email.sender}</h3>
                                        <span className="text-xs text-ind-text3 whitespace-nowrap">{formatTime(email.received_date).split(',')[0]}</span>
                                    </div>
                                    <h4 className={`text-sm truncate mb-1 ${email.status === 'UNREAD' ? 'font-bold' : 'text-ind-text2'}`}>{email.subject}</h4>
                                    <p className="text-xs text-ind-text2 truncate">{email.body}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${email.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : email.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-ind-border/30 text-ind-text2 border-ind-border'}`}>{email.status}</span>
                                    </div>
                                </div>
                            </div>
                        )) : <div className="p-8 text-center text-ind-text3 flex flex-col items-center gap-2"><Inbox size={32} className="text-slate-200" /><p className="text-sm">Empty section</p></div>}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-white m-4 rounded-xl border border-ind-border shadow-sm overflow-hidden">
                    {selectedEmail ? (
                        <>
                            <div className="p-6 border-b border-ind-border/50 bg-ind-bg/50">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-12 h-12 rounded-full bg-ind-border/50 flex items-center justify-center text-ind-text2"><User size={24} /></div>
                                        <div>
                                            <h2 className="text-lg font-bold text-ind-text leading-tight">{selectedEmail.subject}</h2>
                                            <div className="flex items-center gap-3 mt-2 text-sm text-ind-text2"><span className="font-semibold text-slate-800">{selectedEmail.sender}</span><span className="text-ind-text3">&lt;{selectedEmail.sender_email}&gt;</span></div>
                                            <div className="text-xs text-ind-text2 mt-1">UID: {selectedEmail.imap_uid} • {formatTime(selectedEmail.received_date)}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteEmail(selectedEmail.id)} className="p-2 text-ind-text3 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                </div>
                                <div className="mt-6 bg-white rounded-lg p-5 border border-ind-border shadow-sm">
                                    <div className="grid grid-cols-3 gap-6 divide-x divide-slate-100">
                                        <div className="pl-2 flex flex-col gap-1"><span className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest">Model Detected</span><span className="text-sm font-bold text-ind-text">{selectedEmail.parsed_model}</span></div>
                                        <div className="pl-6 flex flex-col gap-1"><span className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest">Quantity</span><span className="text-sm font-bold text-ind-text">{selectedEmail.parsed_quantity} Units</span></div>
                                        <div className="pl-6 flex flex-col gap-1"><span className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest">Current Storage</span><span className={`text-sm font-bold ${selectedEmail.status === 'UNREAD' ? 'text-amber-600' : selectedEmail.status === 'PROCESSED' ? 'text-emerald-600' : 'text-red-600'}`}>{selectedEmail.status}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 p-8 overflow-y-auto font-medium text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{selectedEmail.body}</div>
                            <div className="p-5 bg-ind-bg border-t border-ind-border flex justify-end gap-3">
                                <button onClick={() => setIsRejectModalOpen(true)} disabled={selectedEmail.status === 'PROCESSED' || selectedEmail.status === 'REJECTED'} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-lg hover:bg-ind-border/30 disabled:opacity-30">Reject Mail</button>
                                <button
                                    onClick={() => setIsConfirmAuthOpen(true)}
                                    disabled={selectedEmail.status === 'PROCESSED' || selectedEmail.status === 'REJECTED'}
                                    className={`px-6 py-2.5 font-bold text-sm rounded-lg flex items-center gap-2 shadow-md transition-all ${selectedEmail.status === 'REJECTED' ? 'bg-ind-border/30 text-ind-text3 border border-ind-border cursor-not-allowed' : 'bg-[#F37021] text-white hover:bg-[#d9621a] disabled:opacity-30'}`}
                                >
                                    {selectedEmail.status === 'PROCESSED' ? 'Order Processed' : selectedEmail.status === 'REJECTED' ? 'Request Rejected' : 'Authorize Production'} <ArrowRight size={16} />
                                </button>
                            </div>
                        </>
                    ) : <div className="flex-1 flex flex-col items-center justify-center text-ind-text3"><FileText size={48} className="mb-4 text-slate-200" /><h2 className="text-lg font-bold text-slate-700">No Request Selected</h2></div>}
                </div>
            </div>
        </div>
    );
};

export default OrderInboxPage;
