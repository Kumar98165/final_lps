import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Building2, ArrowLeft } from 'lucide-react';

interface Order {
    id: string;
    company: string;
    customer: string;
    model: string;
    status: string;
    qty: number;
    produced: number;
    date: string;
}

interface Props {
    orders: Order[];
}

export const OrderAnalyticsHub: React.FC<Props> = ({ orders }) => {
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

    // 1. Orders by Model (Target vs Produced)
    const modelStats = orders.reduce((acc: any, order) => {
        if (!acc[order.model]) {
            acc[order.model] = { target: 0, produced: 0 };
        }
        acc[order.model].target += order.qty;
        acc[order.model].produced += (order.produced || 0);
        return acc;
    }, {});

    const modelData = Object.keys(modelStats).map(key => ({
        name: key,
        target: modelStats[key].target,
        completed: modelStats[key].produced
    })).sort((a, b) => b.target - a.target).slice(0, 5);

    // 2. Orders by Company (Sum of Qty + Model Breakdown)
    const companyStats = orders.reduce((acc: any, order) => {
        if (!acc[order.company]) {
            acc[order.company] = { total: 0, models: {} as Record<string, number> };
        }
        acc[order.company].total += order.qty;
        acc[order.company].models[order.model] = (acc[order.company].models[order.model] || 0) + order.qty;
        return acc;
    }, {});

    const companyData = Object.keys(companyStats).map(key => ({
        name: key,
        value: companyStats[key].total,
        models: companyStats[key].models
    })).sort((a, b) => b.value - a.value).slice(0, 8);

    const activeCompany = companyData.find(d => d.name === selectedCompany);
    const companyColors = ['#60A5FA', '#FBBF24', '#F43F5E', '#FB923C', '#A78BFA', '#34D399', '#818CF8', '#2DD4BF'];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const companyDetails = companyData.find(d => d.name === label);

            return (
                <div className="bg-[#0B0F1e] border border-emerald-900/40 p-4 rounded-xl shadow-2xl min-w-[200px]">
                    <p className="text-[0.6rem] font-bold text-emerald-500/60 uppercase mb-3 tracking-widest border-b border-white/5 pb-2">
                        {label} -- Click to Detail
                    </p>

                    {/* Model Breakdown Details */}
                    {companyDetails?.models && (
                        <div className="space-y-2 mb-3">
                            {Object.entries(companyDetails.models).slice(0, 3).map(([model, qty]: [string, any]) => (
                                <div key={model} className="flex justify-between items-center gap-4">
                                    <span className="text-[0.65rem] font-black text-ind-text3 uppercase tracking-tight">{model}</span>
                                    <span className="text-[0.7rem] font-black text-white">{qty.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[0.6rem] font-black text-emerald-500 uppercase">Total Volume</span>
                        <span className="text-[0.8rem] font-black text-emerald-400">{payload[0].value.toLocaleString()}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const cardClass = "bg-white/90 backdrop-blur-xl border border-ind-border rounded-[2.5rem] p-10 h-[480px] shadow-sm flex flex-col mb-6 relative overflow-hidden";
    const titleClass = "flex items-center gap-3 text-[0.8rem] font-black text-ind-text uppercase tracking-[0.25em] mb-10";

    return (
        <>

            {/* SECTION 1: Strategic Demand Distribution */}
            <div className="grid grid-cols-1 gap-8">
                {/* 1. Orders by Model */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
                    <div className={titleClass}>
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
                            <LayoutGrid size={20} strokeWidth={2.5} />
                        </div>
                        Orders by Model
                    </div>
                    <div className="flex-1 w-full translate-x-[-20px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <BarChart data={modelData} margin={{ left: 0, right: 20 }}>
                                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800, letterSpacing: '0.1em' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                                <Bar dataKey="target" name="Total Order" fill="#34D399" radius={[6, 6, 0, 0]} barSize={40} />
                                <Bar dataKey="completed" name="Ready / Progress" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* SECTION 2: Client Intelligence */}
            <div className="grid grid-cols-1 gap-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cardClass}>
                    <AnimatePresence mode="wait">
                        {!selectedCompany ? (
                            <motion.div key="chart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full">
                                <div className={titleClass}>
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
                                        <Building2 size={20} strokeWidth={2.5} />
                                    </div>
                                    Orders by Company
                                </div>
                                <div className="flex-1 w-full translate-x-[-20px]">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <BarChart
                                            data={companyData}
                                            margin={{ left: 0, right: 20 }}
                                            onClick={(data) => {
                                                if (data && typeof data.activeLabel === 'string') {
                                                    setSelectedCompany(data.activeLabel);
                                                }
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 900, letterSpacing: '0.02em' }} interval={0} angle={-25} textAnchor="end" height={60} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)', cursor: 'pointer' }} />
                                            <Bar dataKey="value" name="Total Units" radius={[6, 6, 0, 0]} barSize={60} style={{ cursor: 'pointer' }}>
                                                {companyData.map((_, i) => (
                                                    <Cell key={i} fill={companyColors[i % companyColors.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <button onClick={() => setSelectedCompany(null)} className="flex items-center gap-2 px-6 py-2.5 bg-ind-border/30 hover:bg-ind-border/50 text-slate-800 rounded-2xl transition-all font-black text-[0.65rem] uppercase tracking-widest border border-slate-300">
                                        <ArrowLeft size={14} /> Back to Overview
                                    </button>
                                    <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                                        <span className="text-[0.6rem] font-black text-ind-text3 uppercase tracking-widest">Total Volume:</span>
                                        <span className="text-sm font-black text-blue-600">{activeCompany?.value.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 mb-10">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
                                        <Building2 size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-ind-text tracking-tighter uppercase leading-none mb-1">{selectedCompany}</h3>
                                        <p className="text-[0.7rem] font-bold text-ind-text3 uppercase tracking-[0.2em] leading-none">Intelligence Drill-Down by Car Design</p>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeCompany?.models && Object.entries(activeCompany.models).map(([model, qty]: [string, any]) => (
                                            <div key={model} className="bg-ind-bg border border-ind-border rounded-3xl p-6 flex items-center justify-between group hover:border-blue-400 hover:bg-white transition-all duration-300">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-ind-border flex items-center justify-center text-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                        <LayoutGrid size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[0.65rem] font-black text-ind-text3 uppercase tracking-widest mb-0.5">Asset Design</div>
                                                        <div className="text-lg font-black text-ind-text uppercase tracking-tight">{model}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[0.65rem] font-black text-ind-text3 uppercase tracking-widest mb-0.5">Order Quantity</div>
                                                    <div className="text-2xl font-black text-blue-600 tracking-tighter">{qty.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

        </>
    );
};
