import { useState, useEffect } from 'react';
import { getAccessToken } from '../../../lib/storage';
import { API_BASE } from '../../../lib/apiConfig';
import { Car, User as UserIcon, Shield, ChevronRight, ChevronDown, X, UserCog, UserCheck, Save, Loader2, Search, Hash, LayoutGrid, CheckCircle2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CarModel {
    id: number;
    name: string;
    model_code: string;
    type: string;
    line_id: number | null;
    line_name: string | null;
    supervisor_id: number | null;
    supervisor_name: string | null;
    assigned_deo_id: number | null;
    assigned_deo_name: string | null;
    status: string;
}

interface Staff {
    id: number;
    username: string;
    name: string;
    role: string;
}

interface ProductionLine {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
}

const AssignmentPage = () => {
    const [models, setModels] = useState<CarModel[]>([]);
    const [supervisors, setSupervisors] = useState<Staff[]>([]);
    const [deos, setDeos] = useState<Staff[]>([]);
    const [lines, setLines] = useState<ProductionLine[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [selectedDate, setSelectedDate] = useState('');

    // Modal state
    const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
    const [tempSupervisorId, setTempSupervisorId] = useState<number | ''>('');
    const [tempDeoId, setTempDeoId] = useState<number | ''>('');
    const [tempLineId, setTempLineId] = useState<number | ''>('');
    const [tempName, setTempName] = useState('');
    const [tempCode, setTempCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = getAccessToken();
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch assignments (car models)
            const modelsRes = await fetch(`${API_BASE}/admin/assignments`, { headers });
            const modelsData = await modelsRes.json();

            // Fetch supervisors
            const supRes = await fetch(`${API_BASE}/admin/identity/staff?role=Supervisor`, { headers });
            const supData = await supRes.json();

            // Fetch DEOs
            const deoRes = await fetch(`${API_BASE}/admin/identity/staff?role=DEO`, { headers });
            const deoData = await deoRes.json();

            // Fetch Lines
            const linesRes = await fetch(`${API_BASE}/admin/lines`, { headers });
            const linesData = await linesRes.json();

            if (modelsData.success) {
                console.log("MODELS DATA RCVD: ", modelsData.data);
                setModels(modelsData.data);
            } else {
                console.error("Models fetch failed:", modelsData);
            }
            if (supData.success) setSupervisors(supData.data);
            if (deoData.success) setDeos(deoData.data);
            if (linesData.success) setLines(linesData.data);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (model: CarModel) => {
        setSelectedModel(model);
        setTempSupervisorId(model.supervisor_id || '');
        setTempDeoId(model.assigned_deo_id || '');
        setTempLineId(model.line_id || '');
        setTempName(model.name);
        setTempCode(model.model_code);
    };

    const handleCloseModal = () => {
        setSelectedModel(null);
    };

    const handleSaveAssignment = async () => {
        if (!selectedModel) return;
        setSaving(true);
        try {
            const token = getAccessToken();
            const res = await fetch(`${API_BASE}/admin/assignments/${selectedModel.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    supervisor_id: tempSupervisorId || null,
                    assigned_deo_id: tempDeoId || null,
                    line_id: tempLineId || null,
                    name: tempName,
                    model_code: tempCode
                })
            });
            const data = await res.json();
            if (data.success) {
                // Update local state
                setModels(models.map(m => m.id === selectedModel.id ? data.data : m));

                // Show success pop!
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    handleCloseModal();
                }, 1500);
            } else {
                alert('Failed to update assignment: ' + data.message);
            }
        } catch (error) {
            console.error('Error saving assignment', error);
        } finally {
            setSaving(false);
        }
    };


    const filteredModels = models.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.model_code.toLowerCase().includes(searchTerm.toLowerCase());

        const hasSupervisor = !!m.supervisor_id;
        const hasDeo = !!m.assigned_deo_id;
        const hasLine = !!m.line_id;
        const allAssigned = hasSupervisor && hasDeo && hasLine;

        let matchesTab = true;
        if (activeTab === 'PENDING') {
            matchesTab = !allAssigned;
        } else if (activeTab === 'IN PROGRESS') {
            matchesTab = allAssigned && m.status !== 'COMPLETED';
        } else if (activeTab === 'COMPLETED') {
            matchesTab = allAssigned && m.status === 'COMPLETED';
        }

        // Date Filtering
        let matchesDate = true;
        if (selectedDate) {
            // Check for available date fields in the data
            const modelDate = (m as any).createdAt || (m as any).date || (m as any).assignment_date;
            if (modelDate) {
                const formattedModelDate = new Date(modelDate).toISOString().split('T')[0];
                matchesDate = formattedModelDate === selectedDate;
            } else {
                // If it's a specific date search and no date is on the model, it's not a match
                matchesDate = false;
            }
        }

        return matchesSearch && matchesTab && matchesDate;
    });

    return (
        <div className="max-w-[1800px] mx-auto min-h-screen font-sans bg-ind-bg/50">
            {/* Sticky Header Container matched to generic pages */}
            <div className="sticky top-0 z-30 bg-ind-bg/95 backdrop-blur-xl border-b border-ind-border/60 shadow-sm transition-all pb-4">
                <div className="px-8 pt-5 pb-3 space-y-4">
                    {/* Header Section */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-8">
                        <div className="flex items-center gap-4 min-w-max">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F37021] to-orange-600 flex items-center justify-center text-white shadow-lg transform transition-transform hover:scale-105">
                                <Car size={24} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-0.5">
                                <h1 className="text-lg font-black text-slate-800 tracking-tight">
                                    MODEL ASSIGNMENT
                                </h1>
                                <p className="text-[10px] font-bold text-ind-text3 max-w-md leading-none">
                                    Map Supervisors, DEOs and Production Lines.
                                </p>
                            </div>
                        </div>

                        {/* Controls Section: Single Line on Desktop */}
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 xl:ml-auto">
                            {/* Status Filter */}
                            <div className="relative group flex-shrink-0 w-full md:w-44">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-orange-50/50 rounded text-ind-primary/80 group-focus-within:text-orange-600 transition-colors pointer-events-none">
                                    <LayoutGrid size={11} />
                                </div>
                                <select
                                    value={activeTab}
                                    onChange={(e) => setActiveTab(e.target.value)}
                                    className="w-full bg-white border border-ind-border/50 hover:border-ind-primary/20 focus:border-ind-primary/50 focus:bg-orange-50/5 rounded-full py-2 pl-12 pr-10 text-slate-700 font-bold text-[11px] tracking-wide outline-none transition-all shadow-sm cursor-pointer appearance-none"
                                >
                                    {[
                                        { value: 'ALL', label: 'All' },
                                        { value: 'PENDING', label: 'Pending' },
                                        { value: 'IN PROGRESS', label: 'In progress' },
                                        { value: 'COMPLETED', label: 'Completed' }
                                    ].map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ind-text3 opacity-60">
                                    <ChevronDown size={14} />
                                </div>
                            </div>

                            {/* Date Picker */}
                            <div className="relative group flex-shrink-0 hidden md:block">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-indigo-50/50 rounded text-indigo-400 group-focus-within:text-ind-primary transition-colors pointer-events-none">
                                    <Calendar size={11} />
                                </div>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-white border border-ind-border/50 hover:border-ind-primary/20 focus:border-ind-primary/50 focus:bg-orange-50/5 rounded-full py-2 pl-12 pr-5 text-slate-700 font-bold text-[11px] tracking-wide outline-none transition-all shadow-sm h-[38px] w-[180px]"
                                />
                            </div>

                            {/* Search */}
                            <div className="relative group w-full md:w-56">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-ind-text3 opacity-60 group-focus-within:text-ind-primary transition-colors" size={13} />
                                <input
                                    type="text"
                                    placeholder="Search model/ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-ind-border/50 hover:border-ind-primary/20 focus:border-ind-primary/50 focus:bg-orange-50/5 rounded-full py-2 pl-14 pr-6 text-slate-700 font-bold text-[11px] tracking-wide placeholder:text-ind-text3/60 outline-none transition-all shadow-sm h-[38px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8 w-full mx-auto relative z-10">

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 relative z-10">
                        <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                            <div className="absolute inset-0 border-4 border-ind-border/50 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                            <Car className="text-orange-500 w-6 h-6 animate-pulse" />
                        </div>
                        <p className="text-xs font-black text-ind-text3 uppercase tracking-[0.2em]">Synchronizing Data...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                        {filteredModels.map(model => {
                            const hasSupervisor = !!model.supervisor_id;
                            const hasDeo = !!model.assigned_deo_id;
                            const hasLine = !!model.line_id;
                            const isFullyAssigned = hasSupervisor && hasDeo && hasLine;

                            // Visual isCompleted state for coloring (only when assigned)
                            const isCompleted = isFullyAssigned;
                            return (
                                <div
                                    key={model.id}
                                    onClick={() => handleOpenModal(model)}
                                    className={`
                                        relative rounded-3xl p-5 border transition-all cursor-pointer group flex flex-col h-full active:scale-[0.98] overflow-hidden
                                        ${isCompleted
                                            ? 'bg-emerald-50/60 backdrop-blur-md border-emerald-100 hover:border-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,0.05)]'
                                            : 'bg-white border-ind-border/50/80 hover:border-ind-primary/30 shadow-sm'}
                                    `}
                                >
                                    {/* Top accent bar */}
                                    {!isCompleted && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-[#F37021]" />}

                                    {isCompleted && (
                                        <div className="absolute -top-1 -right-1 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full" />
                                    )}

                                    <div className="flex items-start justify-between mb-5 relative">
                                        <div className="flex items-center gap-3.5">
                                            <div className={`
                                                w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-2 transition-transform duration-500
                                                ${isCompleted ? 'bg-emerald-100/50 text-emerald-600' : 'bg-orange-50 text-ind-primary'}
                                            `}>
                                                <Car size={24} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 className={`text-xl font-black tracking-tight leading-none uppercase mb-1.5 ${isCompleted ? 'text-emerald-900' : 'text-slate-800'}`}>
                                                    {model.name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest ${isCompleted ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-ind-bg border-ind-border/50 text-ind-text3'
                                                        }`}>
                                                        {model.model_code}
                                                    </span>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md text-white uppercase tracking-widest ${isCompleted ? 'bg-emerald-400/80' : 'bg-orange-500'
                                                        }`}>
                                                        {model.status || 'PENDING'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-xl transition-all ${isCompleted ? 'bg-emerald-100/40 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-ind-bg text-ind-text3 group-hover:bg-[#F37021] group-hover:text-white'}`}>
                                            <ChevronRight size={16} strokeWidth={3} />
                                        </div>
                                    </div>

                                    {/* Assignment Boxes */}
                                    <div className={`rounded-2xl p-4 grid grid-cols-1 gap-3 mb-2 transition-colors relative ${isCompleted ? 'bg-white/40' : 'bg-ind-bg/60 group-hover:bg-orange-50/30'
                                        }`}>
                                        {/* Line Box */}
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl shrink-0 ${model.line_id ? (isCompleted ? 'bg-white/60 text-emerald-600 shadow-sm border border-emerald-100/50' : 'bg-white text-orange-600 shadow-sm border border-orange-100') : 'bg-white/30 text-ind-text3'}`}>
                                                <Hash size={15} strokeWidth={2.5} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-[8px] font-black uppercase tracking-[0.1em] mb-0.5 ${isCompleted ? 'text-emerald-600/60' : 'text-ind-text3'}`}>Line</p>
                                                <p className={`text-xs font-black truncate leading-tight ${model.line_id ? (isCompleted ? 'text-emerald-900' : 'text-slate-800') : 'text-ind-text3 italic'}`}>
                                                    {model.line_name || 'No Line Assigned'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`h-px w-full ${isCompleted ? 'bg-emerald-500/10' : 'bg-ind-border/50/50'}`} />

                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl shrink-0 ${model.supervisor_id ? (isCompleted ? 'bg-white/60 text-emerald-600 shadow-sm border border-emerald-100/50' : 'bg-white text-blue-600 shadow-sm border border-blue-100') : 'bg-white/30 text-ind-text3'}`}>
                                                <Shield size={15} strokeWidth={2.5} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-[8px] font-black uppercase tracking-[0.1em] mb-0.5 ${isCompleted ? 'text-emerald-600/60' : 'text-ind-text3'}`}>Supervisor</p>
                                                <p className={`text-xs font-black truncate leading-tight ${model.supervisor_id ? (isCompleted ? 'text-emerald-900' : 'text-slate-800') : 'text-ind-text3 italic'}`}>
                                                    {model.supervisor_name || 'No Supervisor Assigned'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`h-px w-full ${isCompleted ? 'bg-emerald-500/10' : 'bg-ind-border/50/50'}`} />

                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl shrink-0 ${model.assigned_deo_id ? (isCompleted ? 'bg-white/60 text-emerald-600 shadow-sm border border-emerald-100/50' : 'bg-white text-emerald-600 shadow-sm border border-emerald-100') : 'bg-white/30 text-ind-text3'}`}>
                                                <UserIcon size={15} strokeWidth={2.5} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-[8px] font-black uppercase tracking-[0.1em] mb-0.5 ${isCompleted ? 'text-emerald-600/60' : 'text-ind-text3'}`}>DEO</p>
                                                <p className={`text-xs font-black truncate leading-tight ${model.assigned_deo_id ? (isCompleted ? 'text-emerald-900' : 'text-slate-800') : 'text-ind-text3 italic'}`}>
                                                    {model.assigned_deo_name || 'No DEO Assigned'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex justify-end pt-1">
                                        <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0 ${isCompleted ? 'text-emerald-600' : 'text-ind-primary'}`}>
                                            {isCompleted ? 'View Info' : 'Assign Details'} <ChevronRight size={10} strokeWidth={3} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredModels.length === 0 && (
                            <div className="col-span-full py-20 text-center flex flex-col items-center">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-ind-border/50 mb-4">
                                    <Search size={32} className="text-ind-text3" />
                                </div>
                                <h3 className="text-lg font-black text-slate-700">No Models Found</h3>
                                <p className="text-sm font-medium text-ind-text2 mt-1 max-w-sm">
                                    We couldn't find any car models matching your criteria
                                    {selectedDate ? ` for ${selectedDate}` : searchTerm ? ` matching "${searchTerm}"` : ''}.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedDate('');
                                    }}
                                    className="mt-6 text-sm font-black text-orange-600 hover:text-orange-700 hover:underline"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Professional Assignment Modal */}
            {selectedModel && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 overflow-hidden">
                    {/* Vibrant Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-all duration-500 animate-in fade-in"
                        onClick={handleCloseModal}
                    ></div>

                    {/* Premium Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-[2.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] w-full max-w-lg max-h-full overflow-hidden border border-ind-border/50/50 flex flex-col"
                    >
                        {/* Success Pop Overlay */}
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                                    animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                                    exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                                    className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-white/60"
                                >
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                                        className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)] mb-4"
                                    >
                                        <CheckCircle2 size={32} strokeWidth={3} />
                                    </motion.div>
                                    <motion.h3
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-xl font-black text-ind-text tracking-tight"
                                    >
                                        Assign Successfully!
                                    </motion.h3>
                                    <motion.p
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 0.6 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-sm font-bold text-ind-text2 mt-2"
                                    >
                                        Roster updated for {tempName}
                                    </motion.p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative px-8 py-6 overflow-hidden bg-ind-bg/30 shrink-0">
                            {/* Animated Background Accents */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

                            <div className="relative flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-[1rem] bg-gradient-to-br from-[#F37021] to-[#ff8c42] text-white shadow-[0_8px_16px_-4px_rgba(243,112,33,0.4)] flex items-center justify-center">
                                        <UserCog size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex items-center">
                                        <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                                            Model assignment
                                        </h2>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2.5 text-ind-text3 hover:text-ind-text2 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-ind-border/40 group"
                                >
                                    <X size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body: Focus-Rich Form - Scrollable */}
                        <div className="px-8 py-8 space-y-6 bg-white relative overflow-y-auto flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 gap-6">
                                {/* Model Name */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-ind-text3 px-1">
                                        <Car size={13} className="text-orange-500" />
                                        Model name
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            className="w-full bg-ind-bg/50 border border-ind-border text-slate-700 text-sm font-bold rounded-2xl focus:bg-white focus:ring-[6px] focus:ring-orange-500/5 focus:border-orange-500 block px-5 py-4 outline-none transition-all shadow-sm hover:border-slate-300 group-hover:shadow-md"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section Divider */}
                            <div className="flex items-center gap-4 py-2">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
                                <span className="text-[10px] font-black text-ind-text3 uppercase tracking-[0.2em] whitespace-nowrap">Assignments</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
                            </div>

                            {/* Line Selection */}
                            <div className="space-y-3">
                                <label className="flex items-center justify-between px-1">
                                    <span className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-ind-text3">
                                        <LayoutGrid size={13} className="text-ind-primary" />
                                        Assign production line
                                    </span>
                                </label>
                                <div className="relative group">
                                    <select
                                        className="w-full bg-white border border-ind-border text-slate-700 text-sm font-bold rounded-2xl focus:ring-[6px] focus:ring-orange-500/5 focus:border-orange-500 block px-5 py-4 outline-none transition-all cursor-pointer appearance-none shadow-sm hover:border-slate-300 group-hover:shadow-md"
                                        value={tempLineId}
                                        onChange={(e) => setTempLineId(e.target.value ? Number(e.target.value) : '')}
                                    >
                                        <option value="" className="text-ind-text3">-- Select line --</option>
                                        {lines.filter(l => l.isActive).map(line => (
                                            <option key={line.id} value={line.id}>{line.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-ind-text3 group-hover:text-orange-500 transition-colors">
                                        <ChevronRight size={18} strokeWidth={3} className="rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Supervisor Selection */}
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between px-1">
                                        <span className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-ind-text3">
                                            <Shield size={13} className="text-blue-500" />
                                            Assign supervisor
                                        </span>
                                    </label>
                                    <div className="relative group">
                                        <select
                                            className="w-full bg-white border border-ind-border text-slate-700 text-sm font-bold rounded-2xl focus:ring-[6px] focus:ring-blue-500/5 focus:border-blue-500 block px-5 py-4 outline-none transition-all cursor-pointer appearance-none shadow-sm hover:border-slate-300 group-hover:shadow-md"
                                            value={tempSupervisorId}
                                            onChange={(e) => setTempSupervisorId(e.target.value ? Number(e.target.value) : '')}
                                        >
                                            <option value="" className="text-ind-text3">-- Select Supervisor --</option>
                                            {supervisors.map(sup => (
                                                <option key={sup.id} value={sup.id}>{sup.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-ind-text3 group-hover:text-blue-500 transition-colors">
                                            <ChevronRight size={18} strokeWidth={3} className="rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* DEO Selection */}
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between px-1">
                                        <span className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-ind-text3">
                                            <UserCheck size={13} className="text-emerald-500" />
                                            Assign deo
                                        </span>
                                    </label>
                                    <div className="relative group">
                                        <select
                                            className="w-full bg-white border border-ind-border text-slate-700 text-sm font-bold rounded-2xl focus:ring-[6px] focus:ring-emerald-500/5 focus:border-emerald-500 block px-5 py-4 outline-none transition-all cursor-pointer appearance-none shadow-sm hover:border-slate-300 group-hover:shadow-md"
                                            value={tempDeoId}
                                            onChange={(e) => setTempDeoId(e.target.value ? Number(e.target.value) : '')}
                                        >
                                            <option value="" className="text-ind-text3">-- Select DEO --</option>
                                            {deos.map(deo => (
                                                <option key={deo.id} value={deo.id}>{deo.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-ind-text3 group-hover:text-emerald-500 transition-colors">
                                            <ChevronRight size={18} strokeWidth={3} className="rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer: Soft Glass Actions - Sticky */}
                        <div className="px-8 py-6 bg-ind-bg/80 backdrop-blur-xl border-t border-ind-border/50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
                            <button
                                onClick={handleCloseModal}
                                disabled={saving}
                                className="px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-ind-text3 hover:text-slate-700 hover:bg-white hover:shadow-sm transition-all active:scale-95 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAssignment}
                                disabled={saving}
                                className="group relative flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] text-white bg-[#ff6900]   shadow-[0_15px_35px_-12px_rgba(0,0,0,0.4)] transition-all active:scale-[0.97] disabled:opacity-70"
                            >
                                {saving ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <Save size={16} className="group-hover:scale-110 transition-transform" />
                                        <span>Confirm assignment</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AssignmentPage;
