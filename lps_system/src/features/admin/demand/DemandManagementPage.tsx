import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car,
    Plus,
    Search,
    User,
    Edit2,
    Trash2,
    AlertTriangle,
    Eye,
    Calendar,
    Info,
    Mail,
    UserCheck,
    MapPin,
    Clock
} from 'lucide-react';
import { getToken } from '../../../lib/storage';
import DemandFormModal from './DemandFormModal';
import { API_BASE } from '../../../lib/apiConfig';

// Type Definitions
interface Demand {
    id: number;
    formatted_id?: string;
    model_id: string;
    model_name: string;
    quantity: number;
    start_date: string;
    end_date: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    line?: string;
    manager?: string;
    assigned_deo_name?: string;
    deo_email?: string;
    supervisor_name?: string;
    supervisor_email?: string;
    customer?: string;
    createdAt: string;
}

const DemandManagementPage = () => {
    const navigate = useNavigate();
    // Data State
    const [demands, setDemands] = useState<Demand[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
    const user = getUser();
    const isManager = user?.role === 'Manager';

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [demandToDelete, setDemandToDelete] = useState<Demand | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [selectedInfoDemand, setSelectedInfoDemand] = useState<Demand | null>(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/production/demands`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setDemands(data);
                calculateStats(data);
            }
        } catch (error) {
            console.error('Failed to load demands:', error);
        }
    };

    const handleEdit = (demand: Demand) => {
        setEditingDemand(demand);
        setIsModalOpen(true);
    };

    const handleDeleteRequest = (demand: Demand) => {
        setDemandToDelete(demand);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (demandToDelete) {
            try {
                const token = getToken();
                const response = await fetch(`${API_BASE}/production/demands/${demandToDelete.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    loadData();
                    setIsDeleteModalOpen(false);
                    setDemandToDelete(null);
                }
            } catch (error) {
                console.error('Failed to delete demand:', error);
            }
        }
    };

    const calculateStats = (data: Demand[]) => {
        const stats = {
            total: data.length,
            pending: data.filter(d => d.status === 'PENDING').length,
            inProgress: data.filter(d => d.status === 'IN_PROGRESS').length,
            completed: data.filter(d => d.status === 'COMPLETED').length,
        };
        setStats(stats);
    };

    // Filter Logic
    const filteredDemands = demands.filter(demand => {
        const matchesSearch =
            demand.model_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            demand.manager?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            demand.supervisor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            demand.assigned_deo_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            demand.formatted_id?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDate = !selectedDate || demand.start_date === selectedDate;

        let matchesTab = true;
        if (activeTab !== 'ALL') {
            matchesTab = demand.status === activeTab;
        }

        return matchesSearch && matchesTab && matchesDate;
    });

    if (isManager) return null;

    return (
        <div className="max-w-[1800px] mx-auto min-h-screen font-sans bg-slate-50/50">
            {/* Sticky Header Container */}
            <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all">
                <div className="px-10 pt-8 pb-6 space-y-8">
                    {/* Header Section with Stats */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Demand Management</h1>
                        </div>

                        {/* Stats Box */}
                        <div className="hidden lg:flex items-center bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/50 p-1 shadow-sm overflow-hidden">
                            <div className="px-5 py-1.5 text-center min-w-[70px] border-r border-slate-100">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">TOTAL</span>
                                <span className="block text-xl font-black text-slate-800 leading-none tracking-tight">{stats.total}</span>
                            </div>
                            <div className="px-5 py-1.5 text-center min-w-[70px]">
                                <span className="block text-[9px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">PENDING</span>
                                <span className="block text-xl font-black text-amber-500 leading-none tracking-tight">{stats.pending}</span>
                            </div>
                            <div className="px-5 py-1.5 text-center min-w-[70px]">
                                <span className="block text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">IN PROGRESS</span>
                                <span className="block text-xl font-black text-blue-500 leading-none tracking-tight">{stats.inProgress}</span>
                            </div>
                            <div className="px-5 py-1.5 text-center min-w-[70px]">
                                <span className="block text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">COMPLETED</span>
                                <span className="block text-xl font-black text-emerald-500 leading-none tracking-tight">{stats.completed}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-10">
                    {/* Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                        {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                        text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap px-6 py-3 rounded-full
                                        ${activeTab === tab
                                        ? 'bg-[#F37021] text-white shadow-lg shadow-orange-500/20'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white'}
                                    `}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative group w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#F37021] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search demands..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-[#F37021] rounded-full py-3.5 pl-12 pr-4 text-slate-600 font-bold text-xs tracking-wide placeholder:text-slate-300 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="relative group w-full md:w-56">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#F37021] transition-colors pointer-events-none" size={16} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-[#F37021] rounded-full py-3.5 pl-12 pr-4 text-slate-600 font-black text-[10px] uppercase tracking-widest outline-none transition-all shadow-sm cursor-pointer"
                            />
                            {selectedDate && (
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedDate('');
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 font-black text-[10px] bg-white px-1"
                                >
                                    CLEAR
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#F37021] text-white px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-1 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus size={18} className="stroke-[3px]" />
                            New Demand
                        </button>
                    </div>
                </div>

                <div className="hidden md:grid grid-cols-12 gap-4 px-16 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100/50">
                    <div className="col-span-4">Demand Details</div>
                    <div className="col-span-3 text-center">Production Status</div>
                    <div className="col-span-2 text-right">Target</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>
            </div>


            {/* Scrollable Content Area */}
            <div className="px-10 py-8 space-y-6">
                {/* List Section */}
                <div className="space-y-3 pb-20">
                    <AnimatePresence>
                        {filteredDemands.map((demand) => (
                            <motion.div
                                key={demand.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[1.5rem] p-5 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-[#F37021]/30 transition-all group relative overflow-hidden md:grid md:grid-cols-12 md:gap-4 md:items-center"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-[#F37021] transition-colors" />

                                {/* Demand Details */}
                                <div className="col-span-4 pl-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#F37021] shadow-sm group-hover:scale-110 transition-transform duration-500">
                                            <Car size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-800 tracking-tight mb-0.5">{demand.model_name}</h3>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">{demand.formatted_id || `DEM-${demand.id}`}</span>
                                                <span>•</span>
                                                <span>{demand.line}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Production Status */}
                                <div className="col-span-3">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <span className={`
                                        px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm
                                        ${demand.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                demand.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    demand.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-200'}
                                    `}>
                                            {demand.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 flex flex-col items-center gap-0.5">
                                            <div className="flex items-center gap-1">
                                                <User size={10} className="text-[#F37021]" />
                                                <span className="text-slate-500">DEO:</span>
                                                <span className="text-slate-900 font-black uppercase">{demand.assigned_deo_name || 'Unassigned'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-slate-400 ml-3.5 select-none">•</span>
                                                <span className="text-slate-500">SV:</span>
                                                <span className="text-slate-900 font-black uppercase text-[8px]">{demand.supervisor_name || 'Unassigned'}</span>
                                            </div>
                                        </span>
                                    </div>
                                </div>

                                {/* Target */}
                                <div className="col-span-2 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xl font-black text-slate-800 tracking-tight">{demand.quantity.toLocaleString()}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target Units</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-3 flex justify-end items-center gap-1 pr-2">
                                    <button
                                        onClick={() => navigate(`/manager/planning/${demand.id}`)}
                                        className="px-2 py-1.5 bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold lowercase transition-colors border border-slate-200 hover:border-emerald-200 flex items-center gap-1 whitespace-nowrap"
                                        title="View Details"
                                    >
                                        <Eye size={14} />
                                        view details
                                    </button>
                                    <button
                                        onClick={() => setSelectedInfoDemand(demand)}
                                        className="p-2 bg-slate-50 text-slate-400 hover:text-[#F37021] hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-100"
                                        title="Assignment Info"
                                    >
                                        <Info size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(demand)}
                                        className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                        title="Edit Demand"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRequest(demand)}
                                        className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                        title="Delete Demand"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Assignment Details Modal */}
            <AnimatePresence>
                {selectedInfoDemand && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80]"
                            onClick={() => setSelectedInfoDemand(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none p-4"
                        >
                            <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden pointer-events-auto border border-slate-100 relative group/modal">
                                {/* Header Decorative Elements */}
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
                                
                                <div className="p-10 relative">
                                    {/* Modal Header */}
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-[#F37021] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
                                                <Car size={32} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Assignment Details</span>
                                                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
                                                    {selectedInfoDemand.model_name}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{selectedInfoDemand.formatted_id}</span>
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                                                        selectedInfoDemand.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                    }`}>{selectedInfoDemand.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedInfoDemand(null)}
                                            className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100"
                                        >
                                            <Plus size={20} className="rotate-45" />
                                        </button>
                                    </div>

                                    {/* Main Content Grid */}
                                    <div className="grid grid-cols-2 gap-8 mb-4">
                                        {/* Left Side: General Info */}
                                        <div className="space-y-6">
                                            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100/50">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <MapPin size={12} className="text-[#F37021]" /> Production Context
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Production Line</span>
                                                        <span className="text-xs font-black text-slate-800 uppercase italic underline decoration-orange-200">{selectedInfoDemand.line || 'No Line Assigned'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Customer / Division</span>
                                                        <span className="text-xs font-black text-slate-800 uppercase italic underline decoration-blue-200">{selectedInfoDemand.customer || 'CIE AUTOMOTIVE'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100/50">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <Clock size={12} className="text-[#F37021]" /> Timeline Details
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center group/item">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start Date</span>
                                                        <span className="text-xs font-black text-slate-900 group-hover:text-[#F37021] transition-colors tabular-nums">{selectedInfoDemand.start_date || '—'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center group/item">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target End</span>
                                                        <span className="text-xs font-black text-slate-900 group-hover:text-[#F37021] transition-colors tabular-nums">{selectedInfoDemand.end_date || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Assignment Info */}
                                        <div className="space-y-6">
                                            <div className="bg-orange-50/30 rounded-3xl p-6 border border-orange-100/50">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <UserCheck size={12} className="text-[#F37021]" /> Assigned Personnel
                                                </h4>
                                                
                                                {/* Supervisor */}
                                                <div className="mb-6 pb-6 border-b border-orange-100/50">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#F37021] shadow-sm border border-orange-100">
                                                            <User size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] font-black text-[#F37021] uppercase tracking-widest block mb-0.5 italic">Supervisor</span>
                                                            <span className="text-sm font-black text-slate-900 uppercase block">{selectedInfoDemand.supervisor_name || 'Unassigned'}</span>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <Mail size={10} className="text-slate-400" />
                                                                <span className="text-[10px] font-bold text-slate-500 lowercase">{selectedInfoDemand.supervisor_email || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* DEO */}
                                                <div>
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#F37021] shadow-sm border border-orange-100">
                                                            <User size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] font-black text-[#F37021] uppercase tracking-widest block mb-0.5 italic">Data Entry Operator</span>
                                                            <span className="text-sm font-black text-slate-900 uppercase block">{selectedInfoDemand.assigned_deo_name || 'Unassigned'}</span>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <Mail size={10} className="text-slate-400" />
                                                                <span className="text-[10px] font-bold text-slate-500 lowercase">{selectedInfoDemand.deo_email || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedInfoDemand(null)}
                                        className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all text-center"
                                    >
                                        Close Detailed View
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Demand Form Modal (Add/Edit) */}
            <DemandFormModal
                isOpen={isModalOpen}
                editingDemand={editingDemand}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDemand(null);
                }}
                onSuccess={() => {
                    loadData();
                    setIsModalOpen(false);
                    setEditingDemand(null);
                }}
            />



            {/* Delete Confirmation Modal (System Pop) */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
                            onClick={() => setIsDeleteModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none p-4"
                        >
                            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto border border-slate-100">
                                <div className="p-8 text-center space-y-6">
                                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto border border-rose-100 shadow-inner">
                                        <AlertTriangle size={36} />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Confirm Deletion</h3>
                                        <p className="text-slate-500 text-sm font-bold leading-relaxed px-4">
                                            Are you sure you want to delete the demand for <span className="text-slate-900 font-extrabold underline decoration-rose-200 underline-offset-2">{demandToDelete?.model_name}</span>? This action cannot be undone.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <button
                                            onClick={() => setIsDeleteModalOpen(false)}
                                            className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100"
                                        >
                                            Never Mind
                                        </button>
                                        <button
                                            onClick={confirmDelete}
                                            className="py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={14} />
                                            Yes, Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DemandManagementPage;
