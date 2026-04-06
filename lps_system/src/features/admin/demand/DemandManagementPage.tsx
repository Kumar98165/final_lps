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
    Clock,
    LayoutGrid,
    ChevronDown
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
        const interval = setInterval(loadData, 60000); // 1 minute
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/admin/demands`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const result = await response.json();
                const data = result.data || [];
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
                const response = await fetch(`${API_BASE}/admin/demands/${demandToDelete.id}`, {
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
        <div className="max-w-[1800px] mx-auto min-h-screen font-sans bg-ind-bg/50">
            {/* Sticky Header Container */}
            <div className="sticky top-0 z-30 bg-ind-bg/95 backdrop-blur-xl border-b border-ind-border/60 shadow-sm transition-all pb-4">
                <div className="px-8 pt-5 pb-3 space-y-5">
                    {/* Header Row: Title & Stats */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F37021] to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/10">
                                <Car size={24} strokeWidth={2.5} />
                            </div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">Demand Management</h1>
                        </div>

                        {/* Stats Box - Compact & Premium */}
                        <div className="flex items-center bg-white/80 backdrop-blur-md rounded-2xl border border-ind-border/50 p-1 shadow-sm overflow-hidden scale-90 origin-right">
                            <div className="px-4 py-1 text-center border-r border-ind-border/50">
                                <span className="block text-[8px] font-bold text-ind-text3 uppercase tracking-wider">TOTAL</span>
                                <span className="block text-lg font-black text-slate-800 leading-none">{stats.total}</span>
                            </div>
                            <div className="px-4 py-1 text-center border-r border-ind-border/50 text-amber-500">
                                <span className="block text-[8px] font-bold uppercase tracking-wider opacity-60">PENDING</span>
                                <span className="block text-lg font-black leading-none">{stats.pending}</span>
                            </div>
                            <div className="px-4 py-1 text-center border-r border-ind-border/50 text-blue-500">
                                <span className="block text-[8px] font-bold uppercase tracking-wider opacity-60">IN PROGRESS</span>
                                <span className="block text-lg font-black leading-none">{stats.inProgress}</span>
                            </div>
                            <div className="px-4 py-1 text-center text-emerald-500">
                                <span className="block text-[8px] font-bold uppercase tracking-wider opacity-60">COMPLETED</span>
                                <span className="block text-lg font-black leading-none">{stats.completed}</span>
                            </div>
                        </div>
                    </div>

                    {/* Controls Row: Single Line on Desktop */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Status Dropdown */}
                            <div className="relative group w-full md:w-48">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-orange-50 rounded text-ind-primary group-focus-within:text-orange-600 transition-colors pointer-events-none">
                                    <LayoutGrid size={11} />
                                </div>
                                <select
                                    value={activeTab}
                                    onChange={(e) => setActiveTab(e.target.value)}
                                    className="w-full bg-white border border-ind-border/60 focus:border-ind-primary rounded-full h-[42px] pl-12 pr-10 text-slate-700 font-bold text-[11px] tracking-wide outline-none transition-all shadow-sm cursor-pointer appearance-none"
                                >
                                    {[
                                        { value: 'ALL', label: 'All Status' },
                                        { value: 'PENDING', label: 'Pending' },
                                        { value: 'IN_PROGRESS', label: 'In progress' },
                                        { value: 'COMPLETED', label: 'Completed' }
                                    ].map((tab) => (
                                        <option key={tab.value} value={tab.value}>{tab.label}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ind-text3">
                                    <ChevronDown size={14} />
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative group w-full md:w-64">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-ind-text3 group-focus-within:text-ind-primary transition-colors" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search demands..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-ind-border/60 focus:border-ind-primary rounded-full h-[42px] pl-14 pr-6 text-slate-700 font-bold text-[11px] tracking-wide placeholder:text-ind-text3/60 outline-none transition-all shadow-sm"
                                />
                            </div>

                            {/* Date Filter */}
                            <div className="relative group flex-shrink-0 hidden md:block">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-indigo-50/50 rounded text-indigo-400 group-focus-within:text-ind-primary transition-colors pointer-events-none">
                                    <Calendar size={12} />
                                </div>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-white border border-ind-border/60 focus:border-ind-primary rounded-full h-[42px] pl-12 pr-5 text-slate-700 font-bold text-[11px] tracking-wide outline-none transition-all shadow-sm w-[180px]"
                                />
                                {selectedDate && (
                                    <button 
                                        onClick={() => setSelectedDate('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500 font-black text-[9px] bg-white px-1 hover:underline"
                                    >
                                        CLEAR
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Primary Action Button */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full md:w-auto bg-gradient-to-r from-[#F37021] to-orange-600 text-white px-8 h-[42px] rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            New Demand
                        </button>
                    </div>
                </div>

                <div className="hidden md:grid grid-cols-12 gap-4 px-16 pb-2 text-[10px] font-black text-ind-text3 uppercase tracking-widest pt-4 border-t border-ind-border/50/50">
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
                                className="bg-white rounded-[1.5rem] p-5 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-ind-border/50 hover:border-ind-primary/30 transition-all group relative overflow-hidden md:grid md:grid-cols-12 md:gap-4 md:items-center"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-ind-border/30 group-hover:bg-[#F37021] transition-colors" />

                                {/* Demand Details */}
                                <div className="col-span-4 pl-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-ind-primary shadow-sm group-hover:scale-110 transition-transform duration-500">
                                            <Car size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-800 tracking-tight mb-0.5">{demand.model_name}</h3>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-ind-text3 uppercase tracking-wider">
                                                <span className="bg-ind-border/30 px-2 py-0.5 rounded-md text-ind-text2">{demand.formatted_id || `DEM-${demand.id}`}</span>
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
                                                        'bg-ind-bg text-ind-text2 border-ind-border'}
                                    `}>
                                            {demand.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-[9px] font-bold text-ind-text3 flex flex-col items-center gap-0.5">
                                            <div className="flex items-center gap-1">
                                                <User size={10} className="text-ind-primary" />
                                                <span className="text-ind-text2">DEO:</span>
                                                <span className="text-ind-text font-black uppercase">{demand.assigned_deo_name || 'Unassigned'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-ind-text3 ml-3.5 select-none">•</span>
                                                <span className="text-ind-text2">SV:</span>
                                                <span className="text-ind-text font-black uppercase text-[8px]">{demand.supervisor_name || 'Unassigned'}</span>
                                            </div>
                                        </span>
                                    </div>
                                </div>

                                {/* Target */}
                                <div className="col-span-2 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xl font-black text-slate-800 tracking-tight">{demand.quantity.toLocaleString()}</span>
                                        <span className="text-[9px] font-bold text-ind-text3 uppercase tracking-wider">Target Units</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-3 flex justify-end items-center gap-1 pr-2">
                                    <button
                                        onClick={() => navigate(`/manager/planning/${demand.id}`)}
                                        className="px-2 py-1.5 bg-ind-bg text-ind-text2 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold lowercase transition-colors border border-ind-border hover:border-emerald-200 flex items-center gap-1 whitespace-nowrap"
                                        title="View Details"
                                    >
                                        <Eye size={14} />
                                        view details
                                    </button>
                                    <button
                                        onClick={() => setSelectedInfoDemand(demand)}
                                        className="p-2 bg-ind-bg text-ind-text3 hover:text-ind-primary hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-100"
                                        title="Assignment Info"
                                    >
                                        <Info size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(demand)}
                                        className="p-2 bg-ind-bg text-ind-text3 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                        title="Edit Demand"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRequest(demand)}
                                        className="p-2 bg-ind-bg text-ind-text3 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
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
                            <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden pointer-events-auto border border-ind-border/50 relative group/modal">
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
                                                <span className="text-[10px] font-black text-ind-text3 uppercase tracking-[0.2em] mb-1 block">Assignment Details</span>
                                                <h3 className="text-3xl font-black text-ind-text uppercase tracking-tight leading-none">
                                                    {selectedInfoDemand.model_name}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[10px] font-black bg-ind-border/30 text-ind-text2 px-3 py-1 rounded-full">{selectedInfoDemand.formatted_id}</span>
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                                                        selectedInfoDemand.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                    }`}>{selectedInfoDemand.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedInfoDemand(null)}
                                            className="w-10 h-10 bg-ind-bg rounded-full flex items-center justify-center text-ind-text3 hover:bg-rose-50 hover:text-rose-500 transition-all border border-ind-border/50"
                                        >
                                            <Plus size={20} className="rotate-45" />
                                        </button>
                                    </div>

                                    {/* Main Content Grid */}
                                    <div className="grid grid-cols-2 gap-8 mb-4">
                                        {/* Left Side: General Info */}
                                        <div className="space-y-6">
                                            <div className="bg-ind-bg/50 rounded-3xl p-6 border border-ind-border/50/50">
                                                <h4 className="text-[10px] font-black text-ind-text3 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <MapPin size={12} className="text-ind-primary" /> Production Context
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <span className="text-[8px] font-black text-ind-text3 uppercase tracking-widest block mb-1">Production Line</span>
                                                        <span className="text-xs font-black text-slate-800 uppercase italic underline decoration-orange-200">{selectedInfoDemand.line || 'No Line Assigned'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-ind-text3 uppercase tracking-widest block mb-1">Customer / Division</span>
                                                        <span className="text-xs font-black text-slate-800 uppercase italic underline decoration-blue-200">{selectedInfoDemand.customer || 'CIE AUTOMOTIVE'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-ind-bg/50 rounded-3xl p-6 border border-ind-border/50/50">
                                                <h4 className="text-[10px] font-black text-ind-text3 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <Clock size={12} className="text-ind-primary" /> Timeline Details
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center group/item">
                                                        <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest">Start Date</span>
                                                        <span className="text-xs font-black text-ind-text group-hover:text-ind-primary transition-colors tabular-nums">{selectedInfoDemand.start_date || '—'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center group/item">
                                                        <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest">Target End</span>
                                                        <span className="text-xs font-black text-ind-text group-hover:text-ind-primary transition-colors tabular-nums">{selectedInfoDemand.end_date || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Assignment Info */}
                                        <div className="space-y-6">
                                            <div className="bg-orange-50/30 rounded-3xl p-6 border border-orange-100/50">
                                                <h4 className="text-[10px] font-black text-ind-text3 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <UserCheck size={12} className="text-ind-primary" /> Assigned Personnel
                                                </h4>
                                                
                                                {/* Supervisor */}
                                                <div className="mb-6 pb-6 border-b border-orange-100/50">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-ind-primary shadow-sm border border-orange-100">
                                                            <User size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] font-black text-ind-primary uppercase tracking-widest block mb-0.5 italic">Supervisor</span>
                                                            <span className="text-sm font-black text-ind-text uppercase block">{selectedInfoDemand.supervisor_name || 'Unassigned'}</span>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <Mail size={10} className="text-ind-text3" />
                                                                <span className="text-[10px] font-bold text-ind-text2 lowercase">{selectedInfoDemand.supervisor_email || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* DEO */}
                                                <div>
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-ind-primary shadow-sm border border-orange-100">
                                                            <User size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] font-black text-ind-primary uppercase tracking-widest block mb-0.5 italic">Data Entry Operator</span>
                                                            <span className="text-sm font-black text-ind-text uppercase block">{selectedInfoDemand.assigned_deo_name || 'Unassigned'}</span>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <Mail size={10} className="text-ind-text3" />
                                                                <span className="text-[10px] font-bold text-ind-text2 lowercase">{selectedInfoDemand.deo_email || '—'}</span>
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
                            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto border border-ind-border/50">
                                <div className="p-8 text-center space-y-6">
                                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto border border-rose-100 shadow-inner">
                                        <AlertTriangle size={36} />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Confirm Deletion</h3>
                                        <p className="text-ind-text2 text-sm font-bold leading-relaxed px-4">
                                            Are you sure you want to delete the demand for <span className="text-ind-text font-extrabold underline decoration-rose-200 underline-offset-2">{demandToDelete?.model_name}</span>? This action cannot be undone.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <button
                                            onClick={() => setIsDeleteModalOpen(false)}
                                            className="py-4 bg-ind-bg text-ind-text3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-ind-border/30 hover:text-ind-text2 transition-all border border-ind-border/50"
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
