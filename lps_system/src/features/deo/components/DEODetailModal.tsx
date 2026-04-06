import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Car, MapPin, Users, Clock, Mail, User } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface AssignedModel {
    id: number;
    name: string;
    model_code: string;
    line_name: string;
    customer_name: string;
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
}

interface DEODetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    model: AssignedModel | null;
}

export const DEODetailModal: React.FC<DEODetailModalProps> = ({ isOpen, onClose, model }) => {
    if (!model) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.3, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.3, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
                    >
                        {/* Header Section */}
                        <div className="p-8 pb-4 border-b border-slate-50 flex justify-between items-start">
                            <div className="flex gap-6 items-center">
                                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
                                    <Car size={28} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-ind-text3 uppercase tracking-[0.2em]">Assignment Details</span>
                                    <h2 className="text-2xl font-black text-ind-text uppercase tracking-tight">{model.name}</h2>
                                    <div className="flex gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-ind-border/30 rounded-full text-[8px] font-bold text-ind-text2 uppercase tracking-widest leading-none flex items-center">
                                            {model.model_code || 'NFD-BATCH'}
                                        </span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest leading-none flex items-center border",
                                            model.status === 'COMPLETED' || model.status === 'VERIFIED'
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : "bg-blue-50 text-blue-600 border-blue-100"
                                        )}>
                                            {model.status || 'ACTIVE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 bg-ind-bg rounded-xl flex items-center justify-center text-ind-text3 hover:bg-ind-border/30 hover:text-ind-text2 transition-all border border-ind-border/50 shadow-sm group"
                            >
                                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="p-8 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Production Context */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-orange-500">
                                    <MapPin size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ind-text">Production Context</span>
                                </div>
                                <div className="space-y-4 bg-ind-bg/50 p-6 rounded-2xl border border-ind-border/50/50">
                                    <div>
                                        <p className="text-[8px] font-black text-ind-text3 uppercase tracking-widest mb-1">Production Line</p>
                                        <p className="text-base font-black text-ind-text uppercase italic tracking-tight">{model.line_name || 'NOT ASSIGNED'}</p>
                                    </div>
                                    <div className="h-px bg-ind-border/30 w-full" />
                                    <div>
                                        <p className="text-[8px] font-black text-ind-text3 uppercase tracking-widest mb-1">Customer / Division</p>
                                        <p className="text-base font-black text-ind-text uppercase italic tracking-tight">{model.customer_name || 'STANDARD'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Personnel */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-orange-500">
                                    <Users size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ind-text">Assigned Personnel</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-ind-border/50 shadow-sm">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                            <User size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[7px] font-black text-orange-400 uppercase tracking-widest mb-0.5">Supervisor</p>
                                            <p className="text-xs font-black text-ind-text uppercase truncate">{model.supervisor_name || 'NOT ASSIGNED'}</p>
                                            <div className="flex items-center gap-1 text-[8px] text-ind-text3 mt-0.5 font-medium truncate">
                                                <Mail size={8} />
                                                <span className="truncate">{model.supervisor_email || 'supervisor@lps.com'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-ind-border/50 shadow-sm">
                                        <div className="w-10 h-10 rounded-xl bg-ind-bg flex items-center justify-center text-ind-text3">
                                            <User size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[7px] font-black text-ind-text3 uppercase tracking-widest mb-0.5">Data Entry Operator</p>
                                            <p className="text-xs font-black text-ind-text uppercase truncate">{model.assigned_deo_name || 'MANOJ'}</p>
                                            <div className="flex items-center gap-1 text-[8px] text-ind-text3 mt-0.5 font-medium truncate">
                                                <Mail size={8} />
                                                <span className="truncate">{model.deo_email || 'deo@lps.com'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Details */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="flex items-center gap-2 text-orange-500 pt-2">
                                    <Clock size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ind-text">Timeline Details</span>
                                </div>
                                <div className="bg-ind-bg/50 p-6 rounded-2xl border border-ind-border/50/50 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-[8px] font-black text-ind-text3 uppercase tracking-widest mb-1">Start Date</p>
                                        <p className="text-sm font-black text-ind-text tracking-tight">{model.start_date || '2026-03-27'}</p>
                                    </div>
                                    <div className="h-px md:h-full md:w-px bg-ind-border/50 w-full" />
                                    <div>
                                        <p className="text-[8px] font-black text-ind-text3 uppercase tracking-widest mb-1">Target Quantity</p>
                                        <p className="text-xl font-black text-orange-500 tracking-tighter italic">{model.target_quantity || '1000'} <span className="text-[10px] uppercase not-italic ml-1">Units</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Button */}
                        <div className="p-8 pt-2 pb-8">
                            <button 
                                onClick={onClose}
                                className="w-full py-4 bg-[#0F172A] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                            >
                                Close Detailed View
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
