import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Car, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { DEODetailModal } from './DEODetailModal';

interface AssignedModel {
    id: number;
    name: string;
    model_code: string;
    line_name: string;
    customer_name: string;
    deo_accepted: boolean;
    status?: string;
    supervisor_name?: string;
    supervisor_email?: string;
    manager_name?: string;
    manager_email?: string;
    customer_email?: string;
    assigned_deo_name?: string;
    deo_email?: string;
    target_quantity?: number;
    start_date?: string;
    end_date?: string;
    verified_at?: string;
    supervisor_comment?: string;
}

interface DEOModelListProps {
    assignedModels: AssignedModel[];
    submissionHistory: any[];
    modelFilter: 'ALL' | 'NEW' | 'ACCEPTED' | 'READY' | 'REJECTED';
    selectedModelId: number | null;
    setSelectedModelId: (id: number) => void;
    setModelFilter: (filter: 'ALL' | 'NEW' | 'ACCEPTED' | 'READY' | 'REJECTED') => void;
    setActiveTab: (tab: string) => void;
    handleAccept: (id: number) => void;
}

export const DEOModelList: React.FC<DEOModelListProps> = ({
    assignedModels,
    submissionHistory,
    modelFilter,
    selectedModelId,
    setSelectedModelId,
    setModelFilter,
    setActiveTab,
    handleAccept
}) => {
    const [detailModel, setDetailModel] = useState<AssignedModel | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const openDetails = (model: AssignedModel) => {
        setDetailModel(model);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <DEODetailModal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)} 
                model={detailModel} 
            />

            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#F37021] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
                        <Database size={32} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Data Entry Management</span>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">My Assigned Models</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-xl">
                            Review and manage production assignments for vehicle models.
                        </p>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                    {(['ALL', 'NEW', 'ACCEPTED', 'READY', 'REJECTED'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setModelFilter(filter)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${modelFilter === filter ? 'bg-white text-[#F37021] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedModels
                    .filter(m => {
                        const isRejected = submissionHistory.some(s => 
                            (s.car_model_id === m.id || s.model_name === m.name) && s.status === 'REJECTED'
                        );

                        if (modelFilter === 'ALL') return true;
                        if (modelFilter === 'NEW' && !m.deo_accepted && (m.status === 'READY' || m.status === 'PENDING')) return true;
                        if (modelFilter === 'ACCEPTED' && m.deo_accepted && !isRejected && (m.status === 'READY' || m.status === 'IN_PROGRESS' || m.status === 'WORKING' || m.status === 'PENDING')) return true;
                        if (modelFilter === 'READY' && (m.status === 'COMPLETED' || m.status === 'VERIFIED')) return true;
                        if (modelFilter === 'REJECTED' && isRejected) return true;
                        return false;
                    })
                    .map((model) => {
                        const isRejected = submissionHistory.some(s => (s.car_model_id === model.id || s.model_name === model.name) && s.status === 'REJECTED');
                        const isCompleted = model.status === 'COMPLETED' || model.status === 'VERIFIED';

                        return (
                            <motion.div
                                key={model.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                    "group relative bg-white rounded-[3rem] border-2 p-8 transition-all hover:shadow-2xl hover:shadow-orange-500/10",
                                    selectedModelId === model.id ? 'border-[#F37021]' : 
                                    isRejected ? 'border-red-200 bg-red-50/10' :
                                    'border-slate-50'
                                )}
                            >
                                <div className="flex justify-between items-start mb-10">
                                    <div className={cn(
                                        "p-4 rounded-3xl transition-all duration-500",
                                        isCompleted 
                                            ? "bg-emerald-500/10 text-emerald-600 backdrop-blur-sm border border-emerald-500/10 shadow-inner" 
                                            : model.deo_accepted ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-[#F37021]'
                                    )}>
                                        <Car size={32} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            {isCompleted && (
                                                <button 
                                                    onClick={() => openDetails(model)}
                                                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-slate-100 shadow-sm"
                                                >
                                                    <Info size={16} />
                                                </button>
                                            )}
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                isRejected
                                                    ? 'bg-red-500 text-white border-red-400 animate-pulse'
                                                    : (model.status === 'COMPLETED' || model.status === 'VERIFIED') 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                    : model.deo_accepted ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100' : 'bg-orange-50/50 text-[#F37021] border-orange-100'
                                            )}>
                                                {isRejected ? 'Rejected' : isCompleted ? 'Completed' : model.deo_accepted ? 'Working' : 'Review Needed'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-10 text-left">
                                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#F37021] transition-colors uppercase leading-none">{model.name}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{model.customer_name || 'Standard Division'}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {!model.deo_accepted ? (
                                        <button
                                            onClick={() => handleAccept(model.id)}
                                            className="col-span-2 py-4 bg-[#F37021] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            Accept & Start
                                        </button>
                                    ) : isCompleted ? (
                                        <button
                                            onClick={() => openDetails(model)}
                                            className="col-span-2 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        >
                                            <CheckCircle2 size={16} />
                                            Log Finalized
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSelectedModelId(model.id);
                                                setActiveTab('ENTRY');
                                            }}
                                            className={cn(
                                                "col-span-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2",
                                                isRejected ? "bg-red-600 text-white shadow-red-500/20" : "bg-slate-900 text-white shadow-slate-900/10"
                                            )}
                                        >
                                            {isRejected ? "Re-do Entry" : "Update Log"}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
            </div>
        </div>
    );
};
