import { useState, useEffect } from 'react';
import { getAccessToken } from '../../lib/storage';
import { API_BASE } from '../../lib/apiConfig';
import { Car, User as UserIcon, ChevronRight, X, UserCog, UserCheck, Save, Loader2, Search, Zap } from 'lucide-react';
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
    deo_accepted: boolean;
}

interface Staff {
    id: number;
    username: string;
    name: string;
    role: string;
}

const TeamManagementPage = () => {
    const [models, setModels] = useState<CarModel[]>([]);
    const [deos, setDeos] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
    const [tempDeoId, setTempDeoId] = useState<number | ''>('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = getAccessToken();
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch assigned work (car models assigned to this supervisor)
            const modelsRes = await fetch(`${API_BASE}/deo/assigned-work`, { headers });
            const modelsData = await modelsRes.json();

            // Fetch DEOs
            const deoRes = await fetch(`${API_BASE}/admin/identity/staff?role=DEO`, { headers });
            const deoData = await deoRes.json();

            if (modelsData.success) {
                setModels(modelsData.data);
            }
            if (deoData.success) setDeos(deoData.data);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (model: CarModel) => {
        setSelectedModel(model);
        setTempDeoId(model.assigned_deo_id || '');
    };

    const handleCloseModal = () => {
        setSelectedModel(null);
    };

    const handleSaveAssignment = async () => {
        if (!selectedModel) return;
        setSaving(true);
        try {
            const token = getAccessToken();
            const res = await fetch(`${API_BASE}/supervisor/assign-deo`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model_id: selectedModel.id,
                    deo_id: tempDeoId || null
                })
            });
            const data = await res.json();
            if (data.success) {
                const refreshedRes = await fetch(`${API_BASE}/deo/assigned-work`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const refreshedModels = await refreshedRes.json();
                if (refreshedModels.success) {
                    setModels(refreshedModels.data);
                }
                handleCloseModal();
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
        return matchesSearch;
    });

    return (
        <div className="max-w-[1800px] mx-auto min-h-screen font-sans bg-slate-50/50">
            {/* Sticky Header Container */}
            <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all pb-4">
                <div className="px-8 pt-5 pb-3">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-[#F37021] flex items-center justify-center text-white shadow-lg shadow-orange-500/10 mt-0.5">
                                <UserCog size={22} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Oversight & Verification</span>
                                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex flex-col">
                                    TEAM MANAGEMENT
                                </h1>
                                <p className="text-[11px] font-bold text-slate-400 max-w-lg leading-relaxed">
                                    Assign your Data Entry Operators to your managed production lines.
                                </p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                            <div className="relative group w-full md:w-80">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#F37021] transition-colors" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search your assigned models..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-[#F37021] rounded-full py-2.5 pl-14 pr-6 text-slate-600 font-bold text-xs tracking-wide placeholder:text-slate-300 outline-none transition-all shadow-sm"
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
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                            <Car className="text-orange-500 w-6 h-6 animate-pulse" />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Loading Assignments...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                        {filteredModels.map(model => (
                            <div
                                key={model.id}
                                onClick={() => handleOpenModal(model)}
                                className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-[#F37021]/30 transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden active:scale-[0.98]"
                            >
                                {/* Top accent bar */}
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-[#F37021]" />

                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 flex items-center justify-center text-[#F37021] shadow-sm group-hover:rotate-2 transition-transform duration-500">
                                            <Car size={32} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none uppercase mb-2">
                                                {model.name}
                                            </h3>
                                            <span className="text-[11px] font-black text-slate-400 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 uppercase tracking-widest block mb-2 max-w-fit">
                                                {model.model_code}
                                            </span>
                                            {model.line_name && (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1.5">
                                                    Line: <span className="text-orange-600 font-black">{model.line_name}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Assignment Boxes */}
                                <div className="rounded-[2.4rem] p-7 mb-4 bg-slate-50/60 transition-colors group-hover:bg-orange-50/30">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-3xl shrink-0 ${model.assigned_deo_id ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'bg-white/50 text-slate-300'}`}>
                                            <UserIcon size={24} strokeWidth={2.5} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Data Entry Operator</p>
                                            <p className={`text-base font-black truncate leading-tight ${model.assigned_deo_id ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                                                {model.assigned_deo_name || 'Unassigned'}
                                            </p>
                                            {model.assigned_deo_id && (
                                                <p className={`text-[10px] font-bold mt-1 uppercase ${model.deo_accepted ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                    Status: {model.deo_accepted ? 'Accepted' : 'Pending Accept'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex justify-end pt-2">
                                    <span className="text-[10px] font-black text-[#F37021] uppercase tracking-widest flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
                                        Manage DEO <ChevronRight size={12} strokeWidth={3} />
                                    </span>
                                </div>
                            </div>
                        ))}

                        {filteredModels.length === 0 && (
                            <div className="col-span-full py-20 text-center flex flex-col items-center">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4">
                                    <Search size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-lg font-black text-slate-700">No Models Found</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">
                                    We couldn't find any car models assigned to you. Contact the admin if this is unexpected.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Assignment Modal UI */}
            <AnimatePresence>
                {selectedModel && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                            onClick={handleCloseModal}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative bg-white rounded-3xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden z-10"
                        >
                            {/* Modal Header */}
                            <div className="relative px-8 py-8 overflow-hidden bg-slate-50/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white text-orange-500 mb-4 shadow-sm border border-orange-100/50">
                                            <UserCheck size={24} strokeWidth={2.5} />
                                        </div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                            Assign DEO
                                        </h2>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-sm font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100/50">{selectedModel.name}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCloseModal}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-sm rounded-full transition-all"
                                    >
                                        <X size={20} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 bg-white relative">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        Select Data Entry Operator
                                    </label>
                                    <div className="relative group">
                                        <select
                                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 block px-4 py-4 outline-none transition-all cursor-pointer appearance-none shadow-sm"
                                            value={tempDeoId}
                                            onChange={(e) => setTempDeoId(e.target.value ? Number(e.target.value) : '')}
                                        >
                                            <option value="" className="text-slate-400">--- Unassigned ---</option>
                                            {deos.map(deo => (
                                                <option key={deo.id} value={deo.id}>{deo.name} ({deo.username})</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={16} />
                                    </div>

                                    <div className="bg-indigo-50/50 rounded-xl p-4 mt-6 flex items-start gap-3 border border-indigo-100/30">
                                        <Zap size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] leading-relaxed font-bold text-indigo-900/60 uppercase tracking-wide">
                                            The assigned DEO will immediately see this model in their queue and will be responsible for stock and target data entry.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={handleCloseModal}
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveAssignment}
                                    disabled={saving}
                                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-slate-900 hover:bg-black transition-all active:scale-95 disabled:opacity-70"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Confirm Staff
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamManagementPage;
