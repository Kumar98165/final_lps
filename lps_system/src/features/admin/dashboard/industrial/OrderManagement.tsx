import React from 'react';
import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend, 
    CategoryScale, 
    LinearScale, 
    BarElement,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { MailOpen, Eye, ChevronDown, Search, Calendar, MessageSquare, User, Cpu, ClipboardCheck } from 'lucide-react';
import type { MailOrder } from '../../hooks/useIndustrialState';

// Register ChartJS
ChartJS.register(
    ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, 
    PointElement, LineElement, RadialLinearScale, Filler
);

interface MailOrderProps {
    orders: MailOrder[];
    onViewDetail: (id: string) => void;
}

const OrderCard: React.FC<{ order: MailOrder }> = ({ order: o }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
        <div className="bg-white border border-slate-200/50 rounded-[2rem] p-8 transition-all hover:shadow-xl hover:border-blue-200 group relative shadow-xs">
            {/* Entity Header */}
            <div className="flex items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 flex items-center justify-center shadow-inner border border-slate-100 ring-4 ring-slate-50/50">
                        <User size={28} className="text-slate-300" strokeWidth={1.5} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight mb-1">To car model</div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-slate-800">{o.customer || o.company}</span>
                            <span className="text-sm font-bold text-slate-400">&lt;{o.email}&gt;</span>
                        </div>
                        <div className="text-[0.7rem] font-bold text-slate-400 mt-2">Received: {o.date}, 03:26 PM</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-[0.7rem] font-black tracking-widest px-4 py-2 rounded-xl border-2 transition-colors ${
                        o.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                        o.status === 'accepted' || o.status === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                        {o.status.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-3 gap-0 border border-blue-100/50 rounded-[1.5rem] overflow-hidden bg-blue-50/20 mb-6 shadow-xs">
                <div className="p-6 border-r border-blue-100/30 flex flex-col items-center justify-center gap-3 group/item">
                    <div className="flex items-center gap-2 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">
                        <Cpu size={14} className="text-orange-500" />
                        Model detected
                    </div>
                    <div className="text-xl font-black text-slate-800">{o.model}</div>
                </div>
                <div className="p-6 border-r border-blue-100/30 flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center gap-2 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">
                        <ClipboardCheck size={14} className="text-emerald-500" />
                        Required quantity
                    </div>
                    <div className="text-xl font-black text-slate-800">{o.qty} Units</div>
                </div>
                <div className="p-6 flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center gap-2 text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-500" />
                        System status
                    </div>
                    <div className={`text-xl font-black ${
                        o.status === 'pending' ? 'text-orange-500' : 'text-blue-500'
                    }`}>{o.status.toUpperCase()}</div>
                </div>
            </div>

            {/* Expandable Mail Content Area */}
            {isExpanded && (
                <div className="relative pt-6 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="absolute -top-3 left-8 px-4 bg-white text-[0.65rem] font-black text-blue-500 tracking-widest uppercase border border-slate-100 rounded-full flex items-center gap-2">
                        <MessageSquare size={12} />
                        Message body
                    </div>
                    <div className="text-[0.9rem] text-slate-600 leading-[1.8] font-medium pt-4 px-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {o.msg}
                    </div>
                </div>
            )}

            <div className="mt-6 flex justify-end">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-8 py-3 rounded-[1.25rem] bg-white border border-slate-200 text-slate-600 font-bold text-sm tracking-tight hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-3 shadow-xs active:scale-95"
                >
                    <Eye size={18} strokeWidth={2.5} />
                    {isExpanded ? 'Hide message details' : 'View full order intelligence'}
                    <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : '-rotate-90'}`} />
                </button>
            </div>
        </div>
    );
};

export const MailOrderSection: React.FC<Pick<MailOrderProps, 'orders'>> = ({ orders }) => {
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [dateFilter, setDateFilter] = React.useState('');
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    // Filter Logic
    const filteredOrders = orders.filter(o => {
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchesSearch = o.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             o.model.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDate = !dateFilter || o.date === dateFilter;
        return matchesStatus && matchesSearch && matchesDate;
    });

    // Stats for Chart
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const acceptedCount = orders.filter(o => o.status === 'accepted' || o.status === 'approved').length;
    const rejectedCount = orders.filter(o => o.status === 'rejected').length;

    const chartData = {
        labels: ['Pending', 'Accepted', 'Rejected'],
        datasets: [{
            data: [pendingCount, acceptedCount, rejectedCount],
            backgroundColor: ['#F37021', '#4285F4', '#94A3B8'],
            borderWidth: 0,
            hoverOffset: 4,
            cutout: '78%',
            borderRadius: 8
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        maintainAspectRatio: false
    };

    const filterOptions = [
        { id: 'all', label: 'All Statuses' },
        { id: 'pending', label: 'Pending' },
        { id: 'accepted', label: 'Accepted' },
        { id: 'rejected', label: 'Rejected' }
    ];

    return (
        <div className="bg-white border border-slate-200/60 rounded-[1.5rem] overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-500 min-h-[850px] flex flex-col">
            {/* Header */}
            <div className="p-8 border-b border-slate-100 bg-white space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50">
                            <MailOpen size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Mail order requests</h2>
                            <p className="text-[0.7rem] font-bold text-slate-400 mt-0.5">Real-time production demand monitoring</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[0.75rem] font-bold text-slate-600 hover:border-blue-400 transition-all shadow-xs"
                            >
                                {filterOptions.find(o => o.id === statusFilter)?.label}
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isFilterOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
                                    {filterOptions.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                setStatusFilter(opt.id as any);
                                                setIsFilterOpen(false);
                                            }}
                                            className={`w-full px-5 py-3 text-left text-[0.75rem] font-bold transition-colors ${
                                                statusFilter === opt.id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-orange-50 text-orange-600 border border-orange-100 px-5 py-2.5 rounded-xl text-[0.75rem] font-black tracking-wider shadow-xs">
                            {pendingCount} Pending
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search by company, customer or model..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl py-3.5 pl-12 pr-4 text-[0.75rem] font-bold text-slate-700 placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-xs"
                        />
                    </div>
                    <div className="relative group md:w-64">
                        <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl py-3.5 pl-12 pr-4 text-[0.75rem] font-bold text-slate-700 focus:border-blue-500 outline-none transition-all shadow-xs"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden bg-[#F8FAFC]">
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar border-r border-slate-100 scroll-smooth">
                    <div className="space-y-8">
                        {filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-40 opacity-40">
                                <MailOpen size={64} className="text-slate-300 mb-6" />
                                <div className="font-black text-[0.8rem] text-slate-400 tracking-widest uppercase">No records found</div>
                            </div>
                        ) : (
                            filteredOrders.map((o) => (
                                <OrderCard key={o.id} order={o} />
                            ))
                        )}
                    </div>
                </div>

                {/* Right Analytics Sidebar */}
                <div className="w-[380px] p-10 hidden xl:flex flex-col gap-12 bg-white">
                    <div className="space-y-5">
                        <div className="text-[0.65rem] font-black text-blue-500 uppercase tracking-[0.4em] flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            Live monitoring
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Demand intelligence</h3>
                    </div>

                    <div className="relative h-64 w-64 mx-auto group">
                        <Doughnut data={chartData} options={chartOptions} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[0.7rem] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total</span>
                            <span className="text-4xl font-black text-slate-800 leading-none">{orders.length}</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {[
                            { label: 'Accepted orders', val: acceptedCount, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500' },
                            { label: 'Pending requests', val: pendingCount, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', dot: 'bg-orange-500' },
                            { label: 'Rejected archive', val: rejectedCount, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100', dot: 'bg-slate-300' }
                        ].map((s, i) => (
                            <div key={i} className={`flex items-center justify-between p-7 rounded-[1.5rem] border ${s.border} ${s.bg} shadow-xs`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                                    <div className={`text-[0.85rem] font-black tracking-wide ${s.color}`}>{s.label}</div>
                                </div>
                                <div className="text-3xl font-black text-slate-800">{s.val}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto p-6 rounded-[1.5rem] border-2 border-dashed border-slate-100 bg-slate-50/50">
                        <div className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Operational note</div>
                        <p className="text-[0.75rem] text-slate-500 leading-relaxed font-medium">
                            The demand intelligence engine synthesizes incoming mail requests to predict procurement bottlenecks.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
