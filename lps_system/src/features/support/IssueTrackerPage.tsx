import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Send, X, Clock, CheckCircle2, 
    AlertTriangle, User, Car, Loader2, ArrowUpRight, 
    Shield, MessageSquare, History,
    Flag, Image as ImageIcon, Trash2, Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { getAccessToken, getUser } from '../../lib/storage';
import { API_BASE } from '../../lib/apiConfig';

interface Issue {
    id: number;
    user_id: number;
    reporter_name: string;
    reporter_role: string;
    model_id: number | null;
    model_name: string;
    title: string;
    description: string;
    status: string;
    urgency: string;
    admin_comment: string | null;
    supervisor_comment: string | null;
    image_url: string | null;
    createdAt: string;
    updatedAt: string;
}

interface CarModel {
    id: number;
    name: string;
    model_code: string;
    is_submitted_today?: boolean;
}

const IssueTrackerPage = () => {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReportModal, setShowReportModal] = useState(false);
    const [models, setModels] = useState<CarModel[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fullImage, setFullImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('ALL');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const user = getUser();
    const isDEO = user?.role === 'DEO';
    const isSupervisor = user?.role === 'Supervisor' || user?.role === 'Manager';
    const isAdmin = user?.role === 'Admin';

    const [newIssue, setNewIssue] = useState({
        title: '',
        description: '',
        model_id: '',
        urgency: 'MEDIUM'
    });
    const [submitting, setSubmitting] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [comment, setComment] = useState('');

    useEffect(() => {
        fetchIssues();
        if (isDEO) fetchModels();
    }, []);

    const fetchIssues = async () => {
        setLoading(true);
        try {
            const token = getAccessToken();
            const res = await fetch(`${API_BASE}/production/issues`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setIssues(data.data);
        } catch (err) {
            console.error('Error fetching issues:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchModels = async () => {
        try {
            const token = getAccessToken();
            const res = await fetch(`${API_BASE}/production/assigned-work`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                // Only show models that are assigned to the DEO and NOT yet submitted/ready today
                const activeUnits = data.data.filter((m: any) => !m.is_submitted_today);
                setModels(activeUnits);
            }
        } catch (err) {
            console.error('Error fetching models:', err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleReportIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = getAccessToken();
            const formData = new FormData();
            formData.append('title', newIssue.title);
            formData.append('description', newIssue.description);
            formData.append('urgency', newIssue.urgency);
            if (newIssue.model_id && newIssue.model_id !== 'Other') {
                formData.append('model_id', newIssue.model_id);
            }
            if (selectedFile) formData.append('image', selectedFile);

            const res = await fetch(`${API_BASE}/production/issues`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setIssues([data.data, ...issues]);
                setShowReportModal(false);
                setNewIssue({ title: '', description: '', model_id: '', urgency: 'MEDIUM' });
                setSelectedFile(null);
            }
        } catch (err) {
            console.error('Error reporting issue:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditIssue = (e: React.MouseEvent, issue: Issue) => {
        e.stopPropagation();
        setNewIssue({
            title: issue.title,
            description: issue.description,
            model_id: issue.model_id?.toString() || '',
            urgency: issue.urgency
        });
        setSelectedIssue(issue);
        setIsEditing(true);
        setShowReportModal(true);
    };

    const handleUpdateIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIssue) return;
        setSubmitting(true);
        try {
            const token = getAccessToken();
            const res = await fetch(`${API_BASE}/production/issues/${selectedIssue.id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: newIssue.title,
                    description: newIssue.description,
                    urgency: newIssue.urgency,
                    model_id: newIssue.model_id === 'Other' ? null : newIssue.model_id
                })
            });
            const data = await res.json();
            if (data.success) {
                setIssues(issues.map(i => i.id === selectedIssue.id ? data.data : i));
                setShowReportModal(false);
                setIsEditing(false);
                setNewIssue({ title: '', description: '', model_id: '', urgency: 'MEDIUM' });
                setSelectedIssue(null);
            }
        } catch (err) {
            console.error('Error updating issue:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteIssue = async (e: React.MouseEvent, issueId: number) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this issue?')) return;
        
        setDeletingId(issueId);
        try {
            const token = getAccessToken();
            const res = await fetch(`${API_BASE}/production/issues/${issueId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setIssues(issues.filter(i => i.id !== issueId));
            } else {
                alert(data.message || 'Error deleting issue');
            }
        } catch (err) {
            console.error('Error deleting issue:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleUpdateStatus = async (issueId: number, status: string, escalade: boolean = false) => {
        try {
            const token = getAccessToken();
            const payload: any = { status: escalade ? 'ESCALATED' : status };
            if (comment) payload.comment = comment;

            const res = await fetch(`${API_BASE}/production/issues/${issueId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setIssues(issues.map(i => i.id === issueId ? data.data : i));
                setSelectedIssue(null);
                setComment('');
            }
        } catch (err) {
            console.error('Error updating issue:', err);
        }
    };

    const getUrgencyStyles = (urgency: string) => {
        switch (urgency) {
            case 'HIGH': return 'bg-rose-50 text-rose-600 border-rose-100 ring-rose-500/10 shadow-sm shadow-rose-100/50';
            case 'MEDIUM': return 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/10 shadow-sm shadow-amber-100/50';
            case 'LOW': return 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/10 shadow-sm shadow-emerald-100/50';
            default: return 'bg-slate-50 text-slate-600 border-slate-100 ring-slate-500/10';
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-100/50';
            case 'ESCALATED': return 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse-slow shadow-lg shadow-rose-200/20';
            case 'RESOLVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-100/50';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#F37021]/10 selection:text-[#F37021]">
            {/* STICKY HEADER SYSTEM */}
            <div className="sticky top-0 z-[100] bg-[#F8FAFC]/80 backdrop-blur-2xl border-b border-slate-200/40 px-4 lg:px-10 py-4 mb-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header Controls */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                {isAdmin ? 'System Oversight' : isSupervisor ? 'Control Center' : 'Support Portal'}
                                {loading && <Loader2 className="animate-spin text-slate-300" size={20} />}
                            </h1>
                        </div>

                        {isDEO && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowReportModal(true)}
                                className="group relative px-6 py-3.5 bg-[#F37021] text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_8px_20px_-5px_rgba(243,112,33,0.4)] flex items-center gap-3 overflow-hidden border border-white/10"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#F37021] to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Plus size={16} strokeWidth={3} className="relative z-10" />
                                <span className="relative z-10">Add Report</span>
                            </motion.button>
                        )}
                    </div>

                    {/* Compact Filter Navigation */}
                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/30 rounded-[1.2rem] w-fit border border-slate-200/50">
                        {['ALL', 'OPEN', 'URGENT', 'RESOLVED'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab === 'URGENT' ? 'ESCALATED' : tab)}
                                className={`
                                    px-6 py-2 rounded-[0.8rem] text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-500
                                    ${(activeTab === tab || (activeTab === 'ESCALATED' && tab === 'URGENT'))
                                        ? 'bg-[#F37021] text-white shadow-xl scale-105 active:scale-95' 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white'}
                                `}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List & Content Layer (Now with padding for the main area) */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 bg-white/50 rounded-[3rem] border border-slate-100 backdrop-blur-sm">
                        <div className="relative w-24 h-24 mb-8">
                            <div className="absolute inset-0 border-8 border-slate-100/50 rounded-full" />
                            <div className="absolute inset-0 border-8 border-[#F37021] border-t-transparent rounded-full animate-spin" />
                            <Shield className="absolute inset-0 m-auto text-slate-200 animate-pulse" size={32} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em] animate-pulse">Syncing Infrastructure Status...</p>
                    </div>
                ) : issues.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[4rem] p-32 border border-slate-100 shadow-2xl shadow-slate-200/50 text-center flex flex-col items-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] -mr-48 -mt-48 opacity-40 animate-pulse" />
                        <div className="relative w-40 h-40 bg-emerald-50 rounded-[3rem] flex items-center justify-center mb-10 rotate-12 shadow-lg shadow-emerald-100">
                            <CheckCircle2 size={72} className="text-emerald-500" strokeWidth={1.2} />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Optimal Parameters</h2>
                        <p className="text-slate-400 font-bold max-w-sm leading-relaxed text-base">
                            Zero active incidents detected. All manufacturing and data systems are performing within defined thresholds.
                        </p>
                    </motion.div>
                ) : (
                    <div className="bg-white rounded-[3rem] border border-slate-200/50 shadow-sm overflow-hidden mb-32">
                        <div className="divide-y divide-slate-100">
                            <AnimatePresence mode="popLayout">
                                {issues
                                    .filter(issue => activeTab === 'ALL' || issue.status === activeTab)
                                    .map((issue, idx) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={issue.id}
                                            onClick={() => setSelectedIssue(issue)}
                                            className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between group hover:bg-slate-50 transition-all duration-300 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-8 w-full md:w-auto">
                                                {/* Status Box */}
                                                <div className={`
                                                    w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:scale-110 border shadow-sm
                                                    ${issue.status === 'RESOLVED' ? "bg-emerald-50 text-emerald-500 border-emerald-100" :
                                                      issue.status === 'ESCALATED' ? "bg-rose-50 text-rose-500 border-rose-100" :
                                                      "bg-blue-50 text-blue-500 border-blue-100"}
                                                `}>
                                                    {issue.status === 'RESOLVED' ? <CheckCircle2 size={32} /> : 
                                                     issue.status === 'ESCALATED' ? <AlertTriangle size={32} /> : 
                                                     <Clock size={32} />}
                                                </div>

                                                <div className="space-y-1.5 min-w-0">
                                                    <div className="flex items-center gap-4 flex-wrap">
                                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase group-hover:text-[#F37021] transition-colors">
                                                            {issue.title}
                                                        </h3>
                                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200/50 ${getStatusStyles(issue.status)}`}>
                                            {issue.status === 'ESCALATED' ? 'URGENT' : issue.status}
                                        </span>
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getUrgencyStyles(issue.urgency)}`}>
                                                            {issue.urgency}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-tight line-clamp-1 max-w-2xl">
                                                        {issue.description}
                                                    </p>
                                                    <div className="flex items-center gap-6 pt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <User size={12} className="text-slate-300" />
                                                            <span>By: <span className="text-slate-700">{issue.reporter_name}</span></span>
                                                        </div>
                                                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                                        <div className="flex items-center gap-2">
                                                            <Car size={12} className="text-slate-300" />
                                                            <span>Asset: <span className="text-slate-700">{issue.model_name || 'Generic'}</span></span>
                                                        </div>
                                                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                                        <div className="flex items-center gap-2">
                                                            <History size={12} className="text-slate-300" />
                                                            <span>{format(new Date(issue.createdAt), 'MMM dd, HH:mm')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mt-6 md:mt-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                {(isAdmin || (isDEO && issue.status === 'OPEN')) && (
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={(e) => handleEditIssue(e, issue)}
                                                            className="w-11 h-11 rounded-xl bg-white text-slate-400 hover:text-blue-500 border border-slate-100 shadow-sm flex items-center justify-center transition-all hover:scale-110"
                                                        >
                                                            <Edit3 size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => handleDeleteIssue(e, issue.id)}
                                                            disabled={deletingId === issue.id}
                                                            className="w-11 h-11 rounded-xl bg-white text-slate-400 hover:text-rose-500 border border-slate-100 shadow-sm flex items-center justify-center transition-all hover:scale-110"
                                                        >
                                                            {deletingId === issue.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block" />
                                                <button className="px-8 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#F37021] shadow-lg hover:shadow-orange-200 transition-all flex items-center gap-3">
                                                    Review Report
                                                    <ArrowUpRight size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Full-Screen Viewer */}
            <AnimatePresence>
                {fullImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-8 lg:p-20"
                    >
                        <motion.button 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={() => setFullImage(null)}
                            className="absolute top-10 right-10 w-16 h-16 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-[1001]"
                        >
                            <X size={32} strokeWidth={3} />
                        </motion.button>
                        <motion.img 
                            layoutId={fullImage || undefined}
                            src={fullImage}
                            className="max-w-full max-h-full rounded-3xl shadow-2xl border-4 border-white/5 object-contain"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Incident Initialization Modal (DEO) */}
            <AnimatePresence>
                {showReportModal && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
                            onClick={() => setShowReportModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200"
                        >
                            <div className="p-8 pb-6 flex justify-between items-start border-b border-slate-100">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#F37021] p-1.5 rounded-lg text-white">
                                            <Flag size={18} fill="currentColor" strokeWidth={0} />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{isEditing ? 'Modify Report' : 'Incident Report'}</h2>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-11">{isEditing ? 'Update existing entry' : 'Initialize system log'}</p>
                                </div>
                                <button onClick={() => { setShowReportModal(false); setIsEditing(false); }} className="p-2 text-slate-300 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all">
                                    <X size={24} strokeWidth={2.5} />
                                </button>
                            </div>

                            <form onSubmit={isEditing ? handleUpdateIssue : handleReportIssue} className="p-8 grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title & Summary</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Briefly describe the issue..."
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-[#F37021] transition-all"
                                        value={newIssue.title}
                                        onChange={(e) => setNewIssue({...newIssue, title: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Reference</label>
                                    <select
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-[#F37021] transition-all appearance-none cursor-pointer"
                                        value={newIssue.model_id}
                                        onChange={(e) => setNewIssue({...newIssue, model_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Asset / Unit</option>
                                        <option value="Other">Other / Miscellaneous Issue</option>
                                        {isEditing && selectedIssue?.model_id && !models.find(m => m.id === selectedIssue.model_id) && (
                                            <option value={selectedIssue.model_id}>{selectedIssue.model_name} (Origin Asset)</option>
                                        )}
                                        {models.map(m => <option key={m.id} value={m.id}>{m.name} | {m.model_code}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Level</label>
                                    <select
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-[#F37021] transition-all appearance-none cursor-pointer"
                                        value={newIssue.urgency}
                                        onChange={(e) => setNewIssue({...newIssue, urgency: e.target.value})}
                                    >
                                        <option value="LOW">Routine (Low)</option>
                                        <option value="MEDIUM">Important (Medium)</option>
                                        <option value="HIGH">Critical (High)</option>
                                    </select>
                                </div>

                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Description</label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="Provide full technical context of the event..."
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-sm outline-none focus:border-[#F37021] transition-all resize-none"
                                        value={newIssue.description}
                                        onChange={(e) => setNewIssue({...newIssue, description: e.target.value})}
                                    />
                                </div>

                                {!isEditing && (
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supporting Media (Optional)</label>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-full bg-white border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-between group-hover:border-[#F37021] group-hover:bg-orange-50/10 transition-all duration-300">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#F37021] transition-colors border border-slate-100">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest truncate max-w-[240px]">
                                                            {selectedFile ? selectedFile.name : 'Select Image'}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">PNG, JPG formats supported</p>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-1.5 bg-slate-900 group-hover:bg-[#F37021] text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all">
                                                    Browse
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="col-span-2 relative group bg-[#F37021] h-14 rounded-xl flex items-center justify-center gap-3 overflow-hidden disabled:opacity-50 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#F37021] to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    {submitting ? (
                                        <Loader2 className="animate-spin text-white relative z-10" size={20} />
                                    ) : (
                                        <>
                                            <Send size={18} className="text-white relative z-10" strokeWidth={3} />
                                            <span className="text-white font-black text-[11px] uppercase tracking-[0.2em] relative z-10">{isEditing ? 'Update Entry' : 'Submit Entry'}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Verification & Resolution Workspace (Supervisor/Admin) */}
            <AnimatePresence>
                {selectedIssue && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/75 backdrop-blur-2xl"
                            onClick={() => setSelectedIssue(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200"
                        >
                            <div className="p-8 pb-6 bg-slate-50/30 flex justify-between items-start border-b border-slate-100">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-900 p-1.5 rounded-lg text-[#F37021]">
                                            <Shield size={18} fill="currentColor" strokeWidth={0} />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Resolution Hub</h2>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-11">Incident: #{selectedIssue.id.toString().padStart(4, '0')}</p>
                                </div>
                                <button onClick={() => setSelectedIssue(null)} className="p-2 text-slate-300 hover:text-slate-600 rounded-xl hover:bg-white transition-all">
                                    <X size={24} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="relative p-5 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                                    <MessageSquare className="absolute -right-2 -bottom-2 text-slate-100" size={40} />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Clock size={12} /> Reporter's Summary:
                                    </p>
                                    <p className="text-sm font-bold text-slate-600 pr-8 relative z-10 leading-relaxed">
                                        "{selectedIssue?.description}"
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        Disposition & Commentary
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Add resolution steps or authoritative notes..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold text-sm outline-none focus:border-[#F37021] transition-all resize-none shadow-inner"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {isSupervisor && selectedIssue?.status === 'OPEN' && (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedIssue.id, 'ESCALATED', true)}
                                            className="group px-4 py-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <AlertTriangle size={16} />
                                            Mark Urgent
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleUpdateStatus(selectedIssue.id, 'RESOLVED')}
                                        className="relative group h-14 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-emerald-500/20 overflow-hidden active:scale-95 transition-all flex items-center justify-center gap-2 col-span-1"
                                        style={{ gridColumn: (isSupervisor && selectedIssue?.status === 'OPEN') ? 'span 1' : 'span 2' }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CheckCircle2 size={16} strokeWidth={3} className="relative z-10" />
                                        <span className="relative z-10">Accept & Resolve</span>
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

export default IssueTrackerPage;
