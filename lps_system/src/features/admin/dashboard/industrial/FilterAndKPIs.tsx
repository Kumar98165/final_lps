import React, { useState, useRef, useEffect } from 'react';
import { 
    LayoutGrid, User, UserCheck, Factory, Calendar, 
    Clock, PlayCircle, CheckCircle2, Package, 
    MailOpen, ThumbsUp, ThumbsDown, ClipboardList, Zap, ChevronDown, Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { Line } from '../../hooks/useIndustrialState';

interface FilterProps {
    filters: any;
    lines: Line[];
    allModels: string[];
    allDEOs: string[];
    allSupervisors: string[];
}

interface CustomDropdownProps {
    label: string;
    current: string;
    set: (val: string) => void;
    options: string[];
    icon: React.ReactNode;
    color: 'blue' | 'teal' | 'indigo' | 'slate';
}

const CustomFilterDropdown: React.FC<CustomDropdownProps> = ({ label, current, set, options, icon, color }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = options.filter(opt => 
        opt.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getColorClasses = () => {
        const maps = {
            blue: { bg: 'bg-blue-50/50', text: 'text-ind-blue', ring: 'focus:ring-blue-500/20', hover: 'hover:bg-blue-50' },
            teal: { bg: 'bg-teal-50/50', text: 'text-ind-teal', ring: 'focus:ring-teal-500/20', hover: 'hover:bg-teal-50' },
            indigo: { bg: 'bg-indigo-50/50', text: 'text-ind-indigo', ring: 'focus:ring-indigo-500/20', hover: 'hover:bg-indigo-50' },
            slate: { bg: 'bg-slate-50', text: 'text-ind-text3', ring: 'focus:ring-slate-500/20', hover: 'hover:bg-slate-50' }
        };
        return maps[color] || maps.slate;
    };

    const classes = getColorClasses();

    return (
        <div className="relative h-full" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`h-full bg-white border border-ind-border rounded-[1.25rem] p-4 flex flex-col justify-between shadow-sm cursor-pointer hover:border-ind-border2 transition-all group ${isOpen ? 'ring-2 ring-ind-blue/10 border-ind-blue' : ''}`}
            >
                <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${classes.bg} ${classes.text}`}>
                        {icon}
                    </div>
                    <span className="font-black text-[0.55rem] text-ind-text3 [font-variant:small-caps] tracking-[0.15em]">{label}</span>
                </div>
                
                <div className="flex items-center justify-between">
                    <span className="text-[0.8rem] font-black text-ind-text tracking-tight uppercase truncate max-w-[85%]">
                        {current === 'all' ? `ALL ${label.split(' ')[0]}S` : current}
                    </span>
                    <ChevronDown size={14} className={`text-ind-text3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-ind-border rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                        {options.length > 5 && (
                            <div className="p-2 border-b border-ind-border bg-slate-50/50">
                                <div className="relative">
                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ind-text3" />
                                    <input 
                                        autoFocus
                                        placeholder={`Search ${label}...`}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-white border border-ind-border rounded-md py-1.5 pl-8 pr-3 text-[0.7rem] font-bold text-ind-text focus:ring-2 focus:ring-ind-blue/20 focus:border-ind-blue outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="max-h-[12rem] overflow-y-auto custom-scrollbar p-1">
                            {filtered.length === 0 ? (
                                <div className="px-3 py-4 text-center text-ind-text3 italic text-[0.65rem]">No results found</div>
                            ) : (
                                filtered.map(opt => (
                                    <div 
                                        key={opt}
                                        onClick={() => {
                                            set(opt);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={`px-3 py-2 rounded-lg text-[0.7rem] font-bold cursor-pointer transition-all flex items-center justify-center relative group ${
                                            current === opt ? 'bg-ind-blue/5 text-ind-blue' : 'text-ind-text2 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className="uppercase text-center">{opt === 'all' ? `ALL ${label.split(' ')[0]}S` : opt}</span>
                                        {current === opt && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-ind-blue" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const AdminFilterBar: React.FC<FilterProps> = ({ filters, lines, allModels, allDEOs, allSupervisors }) => {
    const models = ['all', ...allModels];
    const deos = ['all', ...allDEOs];
    const supervisors = ['all', ...allSupervisors];
    const lineNames = ['all', ...lines.map(l => l.name)];


    const filterItems = [
        { label: 'Vehicle Model', current: filters.curModel, set: filters.setCurModel, options: models, icon: <LayoutGrid size={16} />, color: 'blue' as const },
        { label: 'Operators (DEO)', current: filters.curDEO, set: filters.setCurDEO, options: deos, icon: <User size={16} />, color: 'teal' as const },
        { label: 'Supervisors', current: filters.curSupervisor, set: filters.setCurSupervisor, options: supervisors, icon: <UserCheck size={16} />, color: 'indigo' as const },
        { label: 'Production Line', current: filters.curLine, set: filters.setCurLine, options: lineNames, icon: <Factory size={16} />, color: 'slate' as const },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            {filterItems.map((item, i) => (
                <CustomFilterDropdown 
                    key={i}
                    label={item.label}
                    current={item.current}
                    set={item.set}
                    options={item.options}
                    icon={item.icon}
                    color={item.color}
                />
            ))}

            <div className="relative group h-full">
                <div className="h-full bg-white border border-ind-border rounded-[1.25rem] p-4 flex flex-col justify-between shadow-sm hover:border-ind-border2 transition-all">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50/50 text-[#F37021] flex items-center justify-center transition-all">
                            <Calendar size={16} />
                        </div>
                        <span className="font-black text-[0.55rem] text-ind-text3 [font-variant:small-caps] tracking-[0.15em] text-nowrap">Time Period</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-1 mt-auto">
                        <div className="relative flex-1">
                            <select 
                                value={filters.curTime}
                                onChange={(e) => filters.setCurTime(e.target.value)}
                                className="w-full bg-slate-50 border border-ind-border/40 rounded-lg py-1 px-2 text-[0.7rem] font-bold text-ind-text uppercase outline-none focus:ring-2 focus:ring-ind-blue/10 appearance-none cursor-pointer pr-6"
                            >
                                <option value="day">Daily</option>
                                <option value="week">Weekly</option>
                                <option value="month">Monthly</option>
                                <option value="year">Yearly</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-ind-text3 pointer-events-none" />
                        </div>
                        
                        <div className="relative flex items-center group/cal">
                            <input 
                                type="date"
                                value={filters.curDate || ''}
                                onChange={(e) => {
                                    filters.setCurDate(e.target.value);
                                    filters.setCurTime('custom');
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-8"
                                title="Pick Custom Date"
                            />
                            <div className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
                                filters.curTime === 'custom' ? 'bg-ind-blue text-white border-ind-blue shadow-md' : 'bg-white text-ind-text3 border-ind-border hover:border-ind-border2 group-hover/cal:border-ind-blue'
                            }`}>
                                <Calendar size={13} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const IndustrialKPICards: React.FC<{ stats: any }> = ({ stats }) => {
    const kpiData = [
        { label: 'ORDERS RECEIVED', value: stats.totalOrders.toLocaleString(), subText: 'MONTHLY', color: 'blue', icon: <MailOpen size={16} /> },
        { label: 'PENDING ORDERS', value: stats.pendingOrdersCount.toLocaleString(), subText: 'ACTION NEEDED', color: 'amber', icon: <Clock size={16} /> },
        { label: 'PROCESSING', value: stats.acceptedOrdersCount.toLocaleString(), subText: 'LIVE NOW', color: 'emerald', icon: <PlayCircle size={16} /> },
        { label: 'COMPLETED', value: (stats.completedOrdersCount || 0).toLocaleString(), subText: 'THIS WEEK', color: 'indigo', icon: <CheckCircle2 size={16} /> },
        { label: 'TOTAL PRODUCTION', value: stats.totalProduction.toLocaleString(), subText: '+12.5%', color: 'blue', icon: <Package size={16} /> },
        
        { label: 'OEE PERFORMANCE', value: stats.avgOEE ? `${stats.avgOEE.toFixed(1)}%` : '0%', subText: '+2.1%', color: 'blue', icon: <Zap size={16} /> },
        { label: 'APPROVED PARTS', value: stats.totalProduction.toLocaleString(), subText: '98.5%', color: 'emerald', icon: <ThumbsUp size={16} /> },
        { label: 'REJECTED PARTS', value: stats.totalRejections.toLocaleString(), subText: '1.5%', color: 'red', icon: <ThumbsDown size={16} /> },
        { label: 'PENDING REVIEWS', value: stats.pendingReviews.toLocaleString(), subText: 'NEEDS ACTION', color: 'amber', icon: <ClipboardList size={16} /> },
        { label: 'ACTIVE LINES', value: stats.activeLines.toLocaleString(), subText: 'STABLE', color: 'emerald', icon: <Zap size={16} /> },
    ];

    const getColors = (color: string) => {
        const maps: Record<string, any> = {
            blue: { border: 'border-t-blue-500', icon: 'bg-blue-50 text-blue-500', badge: 'bg-blue-50 text-blue-600' },
            amber: { border: 'border-t-amber-500', icon: 'bg-amber-50 text-amber-500', badge: 'bg-amber-50 text-amber-600' },
            emerald: { border: 'border-t-emerald-500', icon: 'bg-emerald-50 text-emerald-500', badge: 'bg-emerald-50 text-emerald-600' },
            indigo: { border: 'border-t-indigo-500', icon: 'bg-indigo-50 text-indigo-500', badge: 'bg-indigo-50 text-indigo-600' },
            red: { border: 'border-t-red-500', icon: 'bg-red-50 text-red-500', badge: 'bg-red-50 text-red-600' },
        };
        return maps[color] || maps.blue;
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-10">
            {kpiData.map((kpi, i) => {
                const colors = getColors(kpi.color);
                return (
                    <div
                        key={i}
                        className={`bg-white border-t-[4px] ${colors.border} rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between h-32`}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-[0.6rem] font-black text-slate-400 [font-variant:small-caps] tracking-[0.1em]">{kpi.label}</span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.icon}`}>
                                {kpi.icon}
                            </div>
                        </div>

                        <div className="mt-1">
                            <div className="text-2xl font-black text-ind-text tracking-tight">{kpi.value}</div>
                        </div>

                        <div className="mt-2">
                            <span className={`inline-block px-3 py-0.5 rounded-lg text-[0.55rem] font-black [font-variant:small-caps] tracking-widest ${colors.badge}`}>
                                {kpi.subText}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
