import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car,
    Search,
    User,
    Calendar,
    Loader2,
    ChevronRight,
    CheckCircle,
    Info,
    X,
    ArrowRight,
} from 'lucide-react';
import { getToken, getUser } from '../../lib/storage';
import { API_BASE } from '../../lib/apiConfig';

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
    customer?: string;
    createdAt: string;
}

// Sub-component: Demand Details Modal
const DemandDetailsModal = ({ demand, onClose }: { demand: Demand, onClose: () => void }) => {
    if (!demand) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-white mx-auto relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header: Clean & Bright */}
                <div className="relative p-8 pb-3 border-b border-slate-100/50 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#F37021] shadow-[0_8px_20px_rgba(243,112,33,0.15)] border border-orange-50">
                            <Car size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{demand.model_name}</h2>
                                <span className="px-2 py-0.5 bg-orange-50 text-[#F37021] text-[9px] font-black rounded uppercase tracking-widest border border-orange-100/50">
                                    Active Specification
                                </span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{demand.formatted_id || `DEM-${demand.id}`}</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-slate-100 hover:bg-orange-50 text-slate-400 hover:text-[#F37021] rounded-full flex items-center justify-center transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-10 pt-8 space-y-10">
                    {/* High-Level Info Cards */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100/50 space-y-4">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <User size={10} className="text-[#F37021]" />
                                    Customer / Division
                                </span>
                                <div className="text-lg font-black text-slate-800 leading-none">
                                    {demand.customer || 'Standard Production'}
                                </div>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-slate-100/50">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Info size={10} className="text-[#F37021]" />
                                    Assigned Manager
                                </span>
                                <div className="text-sm font-black text-slate-600">
                                    {demand.manager || 'Rajesh Sharma'}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100/50 space-y-4">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Loader2 size={10} className="text-[#F37021]" />
                                    Target Production Line
                                </span>
                                <div className="text-lg font-black text-slate-800 leading-none">
                                    {demand.line || 'T4-LINE'}
                                </div>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-slate-100/50">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <CheckCircle size={10} className="text-[#F37021]" />
                                    Quantity Target
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{demand.quantity.toLocaleString()}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Units</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Container: Sleeker Visuals */}
                    <div className="relative">
                        <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -translate-y-1/2" />
                        <div className="relative flex justify-between items-center bg-white px-2">
                            <div className="bg-white border-2 border-slate-100 rounded-3xl p-4 pr-8 shadow-sm group">
                                <span className="text-[8px] font-black text-[#F37021] uppercase tracking-[0.2em] block mb-1">Production Start</span>
                                <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                                    <Calendar size={14} className="text-slate-300" />
                                    {new Date(demand.start_date).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                                <ArrowRight className="text-slate-300" size={18} />
                            </div>

                            <div className="bg-white border-2 border-slate-100 rounded-3xl p-4 pl-8 shadow-sm text-right">
                                <span className="text-[8px] font-black text-[#F37021] uppercase tracking-[0.2em] block mb-1 text-right">Target Completion</span>
                                <div className="flex items-center gap-2 text-sm font-black text-slate-800 justify-end">
                                    {new Date(demand.end_date).toLocaleDateString()}
                                    <Calendar size={14} className="text-slate-300" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer: Clean & Professional */}
                <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Document Reference: <span className="text-slate-500 font-black">{demand.formatted_id || `DEM-${demand.id}`}</span>
                    </p>
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#F37021] transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                        Close Specification
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Sub-component: Grid Card (For Planning/Ready)
const DemandGridCard = ({ demand, onDetails }: { demand: Demand, onDetails: (demand: Demand) => void }) => {
    const navigate = useNavigate();
    const isReady = demand.status === 'COMPLETED';
    const isInPlanning = demand.status === 'IN_PROGRESS';

    // Formatting for Schedule (e.g., April 2025)
    const date = new Date(demand.start_date);
    const schedule = date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
                rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-all relative overflow-hidden group h-full flex flex-col backdrop-blur-md
                ${isReady
                    ? 'bg-gradient-to-br from-emerald-50/60 to-white border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.08)]'
                    : isInPlanning
                        ? 'bg-gradient-to-br from-amber-50/60 to-white border-amber-100 shadow-[0_20px_50px_rgba(245,158,11,0.08)]'
                        : 'bg-white border-slate-100 hover:border-orange-200'}
            `}
        >
            {/* Top accent bar with gradient */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${isReady ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : isInPlanning ? 'bg-gradient-to-r from-amber-300 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-blue-600'}`} />

            {/* Header: Icon, Name and Badge */}
            <div className="flex items-start justify-between mb-10">
                <div className="flex items-center gap-5">
                    <div className={`
                        w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all group-hover:rotate-3 duration-500 shadow-sm
                        ${isReady
                            ? 'bg-white text-emerald-600'
                            : isInPlanning
                                ? 'bg-white text-amber-600'
                                : 'bg-orange-50 text-[#F37021]'}
                    `}>
                        <Car size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none uppercase mb-2">
                            {demand.model_name}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-black text-slate-400 px-2.5 py-1 rounded-lg ${isReady ? 'bg-white/80' : 'bg-slate-50'}`}>
                                {demand.formatted_id || `DEM-${demand.id}`}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={`
                    px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border shadow-sm
                    ${isReady
                        ? 'bg-white text-emerald-600 border-emerald-100'
                        : isInPlanning
                            ? 'bg-white text-orange-600 border-orange-100'
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100'}
                `}>
                    {isReady ? 'APPROVED' : isInPlanning ? 'IN PLANNING' : 'IN PROGRESS'}
                </div>
            </div>

            {/* Details Box - Enhanced Spacing and Typography */}
            <div className={`rounded-[2rem] p-6 grid grid-cols-2 gap-6 mb-10 ${isReady ? 'bg-white/80' : isInPlanning ? 'bg-white/80' : 'bg-slate-50/60'}`}>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        <Loader2 size={12} className={isReady ? 'text-emerald-500' : isInPlanning ? 'text-amber-500' : 'text-indigo-400'} />
                        LINE NAME
                    </div>
                    <div className="text-lg font-black text-slate-700 uppercase pl-1">{demand.line || 'T4-LINE'}</div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        <Calendar size={12} className={isReady ? 'text-emerald-500' : isInPlanning ? 'text-amber-500' : 'text-indigo-400'} />
                        SCHEDULE
                    </div>
                    <div className="text-lg font-black text-slate-700 uppercase pl-1">{schedule}</div>
                </div>
            </div>

            {/* Footer: Quantity and Action */}
            <div className="mt-auto flex items-end justify-between">
                <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 pl-1">TARGET QUANTITY</span>
                    <div className="flex items-baseline gap-2 pl-1">
                        <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{demand.quantity.toLocaleString()}</span>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Units</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDetails(demand)}
                        className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-[#F37021] hover:border-orange-200 rounded-2xl transition-all shadow-sm"
                        title="View Details"
                    >
                        <Info size={20} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (isInPlanning || isReady) {
                                navigate(`/manager/planning/${demand.id}`);
                            }
                        }}
                        className={`
                        rounded-2xl px-7 py-4 flex items-center gap-3 group/btn transition-all shadow-lg
                        ${isReady
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
                                : isInPlanning
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-orange-500/30'
                                    : 'bg-slate-900 text-white hover:bg-black'}
                    `}>
                        <span className="text-[11px] font-black uppercase tracking-[0.1em]">{isReady ? 'VIEW RECORD' : 'OPEN PLAN'}</span>
                        <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

// Sub-component: List Row (For New Requests)
const DemandListRow = ({ demand, onAccept, onDetails }: { demand: Demand, onAccept: (id: number) => void, onDetails: (demand: Demand) => void }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 hover:border-[#F37021]/30 transition-all group relative overflow-hidden md:grid md:grid-cols-12 md:gap-4 md:items-center"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-[#F37021] transition-colors" />

            {/* Demand Details */}
            <div className="col-span-4 pl-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#F37021] shadow-sm group-hover:scale-105 transition-transform">
                        <Car size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 tracking-tight mb-0.5">{demand.model_name}</h3>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{demand.formatted_id || `DEM-${demand.id}`}</span>
                            <span>•</span>
                            <span>{demand.line || 'Line 1'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="col-span-3">
                <div className="flex flex-col items-center justify-center gap-1">
                    <span className={`
                        px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                        ${demand.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            demand.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                demand.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-slate-50 text-slate-600 border-slate-200'}
                    `}>
                        {demand.status.replace('_', ' ')}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1">
                        <User size={9} /> {demand.manager || 'System Admin'}
                    </span>
                </div>
            </div>

            {/* Target */}
            <div className="col-span-2 text-right">
                <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-slate-800 tracking-tight">{demand.quantity.toLocaleString()}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Units</span>
                </div>
            </div>

            {/* Actions */}
            <div className="col-span-3 flex justify-end gap-2 pr-2">
                {demand.status === 'PENDING' ? (
                    <button
                        onClick={() => onAccept(demand.id)}
                        className="px-4 py-1.5 bg-[#F37021] text-white hover:bg-orange-600 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider shadow-sm shadow-orange-500/10 hover:-translate-y-0.5"
                    >
                        Accept
                    </button>
                ) : (
                    <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <CheckCircle size={12} />
                        Accepted
                    </div>
                )}
                <button
                    onClick={() => onDetails(demand)}
                    className="px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-[#F37021] hover:bg-orange-50 rounded-lg text-[10px] font-black transition-colors uppercase tracking-wider border border-transparent hover:border-orange-100"
                >
                    Details
                </button>
            </div>
        </motion.div>
    );
};

const ManagerDemandPage = () => {
    // Data State
    const [demands, setDemands] = useState<Demand[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
    const [showSuccessPop, setShowSuccessPop] = useState(false);
    const [acceptedModelName, setAcceptedModelName] = useState('');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const token = getToken();
            const user = getUser();

            // Managers only see demands assigned to them
            const url = user?.role === 'Manager'
                ? `${API_BASE}/production/demands?manager=${encodeURIComponent(user.name)}`
                : `${API_BASE}/production/demands`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setDemands(data);
                calculateStats(data);
            }
        } catch (error) {
            console.error('Failed to load manager demands:', error);
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

    const handleAccept = async (id: number) => {
        const demand = demands.find(d => d.id === id);
        if (demand) {
            try {
                const token = getToken();
                const response = await fetch(`${API_BASE}/production/demands/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: 'IN_PROGRESS' })
                });

                if (response.ok) {
                    setAcceptedModelName(demand.model_name);
                    loadData();
                    setShowSuccessPop(true);
                    setTimeout(() => setShowSuccessPop(false), 4000);
                }
            } catch (error) {
                console.error('Failed to accept demand:', error);
            }
        }
    };

    // Filter Logic
    const filteredDemands = demands.filter(demand => {
        const matchesSearch =
            demand.model_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            demand.manager?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            demand.formatted_id?.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesTab = true;
        if (activeTab === 'NEW REQUESTS') {
            matchesTab = demand.status === 'PENDING' || demand.status === 'IN_PROGRESS';
        } else if (activeTab === 'IN PLANNING') {
            matchesTab = demand.status === 'IN_PROGRESS';
        } else if (activeTab === 'READY') {
            matchesTab = demand.status === 'COMPLETED';
        }

        return matchesSearch && matchesTab;
    });

    const isListView = activeTab === 'NEW REQUESTS' || activeTab === 'ALL';

    return (
        <div className="max-w-[1800px] mx-auto min-h-screen font-sans bg-slate-50/50">
            {/* Sticky Header Container */}
            <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all">
                <div className="px-8 pt-5 pb-3 space-y-4">
                    {/* Header Section with Stats */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-[#F37021] flex items-center justify-center text-white shadow-lg shadow-orange-500/10 mt-0.5">
                                <Car size={22} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Demand Management</span>
                                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex flex-col">
                                    NEW DEMAND CAR MODEL
                                </h1>
                                <p className="text-[11px] font-bold text-slate-400 max-w-lg leading-relaxed">
                                    Review and coordinate production designs for vehicle models assigned by Administration.
                                </p>
                            </div>
                        </div>

                        {/* Stats Box */}
                        <div className="flex bg-white rounded-2xl border border-slate-200/50 p-1 shadow-sm h-fit overflow-hidden">
                            <div className="px-5 py-1.5 text-center border-r border-slate-100 min-w-[70px]">
                                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">TOTAL</span>
                                <span className="block text-xl font-black text-slate-800 leading-none tracking-tight">{stats.total}</span>
                            </div>
                            <div className="px-5 py-1.5 text-center border-r border-slate-100 min-w-[70px]">
                                <span className="block text-[8px] font-bold text-orange-500 uppercase tracking-wider mb-0.5">PENDING</span>
                                <span className="block text-xl font-black text-orange-500 leading-none tracking-tight">{stats.pending}</span>
                            </div>
                            <div className="px-5 py-1.5 text-center border-r border-slate-100 min-w-[70px]">
                                <span className="block text-[8px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">IN PROGRESS</span>
                                <span className="block text-xl font-black text-blue-500 leading-none tracking-tight">{stats.inProgress}</span>
                            </div>
                            <div className="px-5 py-1.5 text-center min-w-[70px]">
                                <span className="block text-[8px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">COMPLETED</span>
                                <span className="block text-xl font-black text-emerald-500 leading-none tracking-tight">{stats.completed}</span>
                            </div>
                        </div>
                    </div>

                    {/* Controls Section */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4">
                        {/* Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                            {['ALL', 'NEW REQUESTS', 'IN PLANNING', 'READY'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap px-6 py-2.5 rounded-full
                                        ${activeTab === tab
                                            ? 'bg-[#F37021] text-white shadow-lg shadow-orange-500/20'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-white'}
                                    `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative group w-full md:w-96">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#F37021] transition-colors" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search models, lines or targets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-[#F37021] rounded-full py-2.5 pl-14 pr-6 text-slate-600 font-bold text-xs tracking-wide placeholder:text-slate-300 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* List Header (Only for List View) */}
                {isListView && (
                    <div className="hidden md:grid grid-cols-12 gap-4 px-8 pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-100/50">
                        <div className="col-span-4">Demand Details</div>
                        <div className="col-span-3 text-center">Production Status</div>
                        <div className="col-span-2 text-right">Target</div>
                        <div className="col-span-3 text-right">Actions</div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className={`px-8 py-6 ${isListView ? 'space-y-2.5' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'} pb-24`}>
                <AnimatePresence mode="popLayout">
                    {filteredDemands.map((demand) => (
                        isListView ? (
                            <DemandListRow
                                key={demand.id}
                                demand={demand}
                                onAccept={handleAccept}
                                onDetails={setSelectedDemand}
                            />
                        ) : (
                            <DemandGridCard
                                key={demand.id}
                                demand={demand}
                                onDetails={setSelectedDemand}
                            />
                        )
                    ))}
                </AnimatePresence>
            </div>

            {/* Success System Pop Overlay */}
            <AnimatePresence>
                {showSuccessPop && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]"
                    >
                        <div className="bg-slate-900 border border-slate-800 text-white rounded-[2rem] p-6 shadow-2xl flex items-center gap-6 min-w-[400px]">
                            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <CheckCircle size={32} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black uppercase tracking-tight">Demand Accepted</h3>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none">
                                    {acceptedModelName} moved to Planning
                                </p>
                            </div>
                            <div className="ml-auto pl-6 border-l border-slate-800">
                                <ChevronRight className="text-emerald-500" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedDemand && (
                    <DemandDetailsModal
                        demand={selectedDemand}
                        onClose={() => setSelectedDemand(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManagerDemandPage;
