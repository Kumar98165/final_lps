import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Plus,
    Search,
    Settings2,
    Trash2,
    X,
    CheckCircle2,
    Info,
    Layout
} from 'lucide-react';
import { API_BASE } from '../../../lib/apiConfig';
import { getToken } from '../../../lib/storage';

interface ProductionLine {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
}

const ProductionLinesPage = () => {
    const [lines, setLines] = useState<ProductionLine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true
    });

    const fetchLines = async () => {
        setIsLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/admin/lines`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success) setLines(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch lines:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLines();
    }, []);

    const handleOpenAddModal = (line?: ProductionLine) => {
        if (line) {
            setSelectedLine(line);
            setFormData({
                name: line.name,
                description: line.description,
                isActive: line.isActive
            });
            setIsEditing(true);
        } else {
            setSelectedLine(null);
            setFormData({ name: '', description: '', isActive: true });
            setIsEditing(false);
        }
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setIsEditing(false);
        setSelectedLine(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getToken();
            const url = isEditing ? `${API_BASE}/admin/lines/${selectedLine?.id}` : `${API_BASE}/admin/lines`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchLines();
                handleCloseModal();
            }
        } catch (error) {
            console.error('Failed to save line:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this production line?')) return;
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/admin/lines/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) fetchLines();
        } catch (error) {
            console.error('Failed to delete line:', error);
        }
    };

    const filteredLines = lines.filter(line =>
        line.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        line.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F37021] to-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
                        <Activity size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Production lines</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-ind-text3 uppercase tracking-[0.2em]">{lines.length} active units</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ind-text3 group-focus-within:text-ind-primary transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search active lines..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-ind-border/60 focus:border-ind-primary rounded-full h-[42px] pl-12 pr-6 text-slate-700 font-bold text-[11px] tracking-wide placeholder:text-ind-text3/60 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenAddModal()}
                        className="w-full md:w-auto bg-gradient-to-r from-[#F37021] to-orange-600 text-white px-8 h-[42px] rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Add new line
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-ind-border/30 animate-pulse rounded-[2rem]" />
                    ))}
                </div>
            ) : filteredLines.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredLines.map((line) => (
                            <motion.div
                                key={line.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-[2.5rem] border border-ind-border/50 p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] transition-all group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br transition-opacity duration-500 ${line.isActive ? 'from-emerald-50 to-transparent opacity-60' : 'from-slate-50 to-transparent opacity-100'}`} />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`p-4 rounded-2xl transition-all duration-500 ${line.isActive ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                                <Layout size={24} className={line.isActive ? '' : 'opacity-60'} />
                                            </div>
                                            <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest transition-all duration-500 ${line.isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 text-slate-500'}`}>
                                                {line.isActive ? 'Active' : 'Offline'}
                                            </div>
                                        </div>

                                        <h3 className={`text-xl font-black mb-2 uppercase tracking-tight transition-colors ${line.isActive ? 'text-slate-800' : 'text-slate-400'}`}>{line.name}</h3>
                                        <p className="text-sm font-bold text-ind-text3 leading-relaxed mb-8 line-clamp-2">
                                            {line.description || 'No description provided for this production area.'}
                                        </p>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleOpenAddModal(line)}
                                                className="flex-1 bg-ind-bg hover:bg-[#F37021] hover:text-white text-ind-text2 py-3 rounded-xl font-bold text-[11px] tracking-wide transition-all flex items-center justify-center gap-2 group/btn"
                                            >
                                                <Settings2 size={14} className="group-hover/btn:rotate-90 transition-transform duration-500" /> 
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(line.id)}
                                                className="p-3 bg-red-50 text-red-300 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-ind-border/50 border-spacing-4">
                    <div className="w-20 h-20 bg-ind-bg rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <Activity size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">No Lines Registered</h3>
                    <p className="text-ind-text3 font-bold max-w-xs mx-auto mb-8 leading-relaxed">
                        Start by creating your first production line to begin model assignments.
                    </p>
                    <button
                        onClick={() => handleOpenAddModal()}
                        className="bg-white border-2 border-ind-primary text-ind-primary px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#F37021] hover:text-white transition-all shadow-xl shadow-orange-500/5 focus:ring-4 focus:ring-orange-500/20"
                    >
                        Create Your First Line
                    </button>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
                            onClick={handleCloseModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl pointer-events-auto overflow-hidden">
                                <form onSubmit={handleSubmit}>
                                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-ind-bg/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#F37021] rounded-lg text-white shadow-lg shadow-orange-500/10">
                                                <Plus size={18} strokeWidth={3} />
                                            </div>
                                            <h2 className="text-lg font-black text-slate-800 tracking-tight">
                                                {isEditing ? 'Update line' : 'Register new line'}
                                            </h2>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="p-2 text-ind-text3 hover:text-ind-text transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="p-10 space-y-8">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-ind-text3 tracking-wide ml-1">Line name</label>
                                            <input
                                                autoFocus
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. ALPHA LINE 01"
                                                className="w-full bg-ind-bg border border-ind-border/50 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:bg-white focus:border-ind-primary focus:ring-4 focus:ring-orange-500/5 transition-all outline-none uppercase"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-ind-text3 tracking-wide ml-1">Description (Optional)</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Brief description of line capabilities..."
                                                className="w-full h-32 bg-ind-bg border border-ind-border/50 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:bg-white focus:border-ind-primary focus:ring-4 focus:ring-orange-500/5 transition-all outline-none resize-none"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-ind-bg rounded-2xl border border-ind-border/50/50">
                                            <div className="flex items-center gap-3">
                                                <Info size={16} className="text-ind-primary" />
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-ind-text2 tracking-wide text-slate-400">Line status</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${formData.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                        {formData.isActive ? 'Active' : 'Offline'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                                className={`w-14 h-8 rounded-full p-1 transition-all duration-500 ${formData.isActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-500 ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-ind-bg/50 border-t border-slate-50 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="flex-1 px-8 py-4 text-ind-text3 font-bold text-[11px] hover:text-ind-text2 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-[2] bg-gradient-to-r from-[#F37021] to-orange-600 text-white px-8 py-4 rounded-xl font-extrabold text-[11px] shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <CheckCircle2 size={16} className="text-white group-hover:scale-110 transition-transform" />
                                            {isEditing ? 'Save changes' : 'Create line'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductionLinesPage;
