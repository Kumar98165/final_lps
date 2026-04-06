import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CheckCircle,
    Car,
    Database,
    Users,
    Activity
} from 'lucide-react';

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (val: string) => void;
    title: string;
    message?: string;
    defaultValue?: string;
    type?: 'input' | 'confirm' | 'alert';
}

export const CustomModal: React.FC<CustomModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    defaultValue = '',
    type = 'input'
}) => {
    const [val, setVal] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) setVal(defaultValue);
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div

                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"

            />
            <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8"
            >
                <div className="flex justify-between mb-6">
                    <h3 className="text-xl font-black uppercase text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-ind-text3 hover:text-rose-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                {type === 'input' && (
                    <input
                        autoFocus
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        className="w-full bg-ind-bg border-2 rounded-2xl py-4 px-6 mb-8 font-bold outline-none focus:border-orange-200"
                        onKeyDown={(e) => e.key === 'Enter' && onConfirm(val)}
                    />
                )}
                {(type === 'confirm' || type === 'alert') && (
                    <p className="mb-8 text-ind-text2 font-bold leading-relaxed whitespace-pre-line">
                        {message || "Are you sure you want to proceed?"}
                    </p>
                )}
                <div className="flex gap-3">
                    {type !== 'alert' && (
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-ind-border/30 text-ind-text2 hover:bg-ind-border/50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={() => onConfirm(val)}
                        className="flex-1 py-4 bg-[#F37021] text-white hover:bg-orange-600 shadow-xl shadow-orange-500/20 active:scale-95 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                        {type === 'alert' ? 'OK' : 'Confirm'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

interface RejectionModalProps {
    data: { part: string; reason: string } | null;
    onClose: () => void;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({ data, onClose }) => {
    return (

        <AnimatePresence>
            {data && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.3, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.3, y: 20, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-ind-border/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-rose-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                                    <X size={24} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-rose-600 uppercase tracking-tight">Part Rejected</h3>
                                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{data.part}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 hover:bg-rose-100/50 rounded-2xl text-rose-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-10">
                            <span className="text-[10px] font-black text-ind-text3 uppercase tracking-[0.2em] mb-4 block">Supervisor Feedback</span>
                            <div className="bg-ind-bg rounded-3xl p-8 border border-ind-border/50">
                                <p className="text-slate-700 font-bold leading-relaxed italic text-lg text-center">
                                    "{data.reason}"
                                </p>
                            </div>
                            <div className="mt-10 flex flex-col gap-4">
                                <p className="text-[9px] font-black text-ind-text3 uppercase tracking-widest text-center leading-loose px-8">
                                    Please correct the <span className="text-ind-text">Today Produced</span> quantity and set the status to <span className="text-emerald-500 font-black">SUBMITTED</span> to resend for verification.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F37021] transition-all active:scale-95 mt-4"
                                >
                                    I Understand, Let me Fix it
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

interface ModelDetailModalProps {
    model: any;
    onClose: () => void;
}

export const ModelDetailModal: React.FC<ModelDetailModalProps> = ({ model, onClose }) => {
    if (!model) return null;

    const isCompleted = model.status?.toUpperCase() === 'COMPLETED' || model.status?.toUpperCase() === 'VERIFIED';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.3, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.3, y: 40, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border border-ind-border/50/50"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Close Button */}
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-[#F37021] flex items-center justify-center text-white shadow-xl shadow-orange-100">
                                <Car size={32} strokeWidth={1.5} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-ind-text3 uppercase tracking-[0.2em] mb-1 block">Assignment Details</span>
                                <div className="flex items-center gap-4">
                                    <h2 className="text-3xl font-black text-ind-text uppercase tracking-tighter">{model.name}</h2>
                                    <span className="px-3 py-1 bg-ind-bg text-ind-text2 rounded-lg text-[9px] font-black tracking-widest border border-ind-border/50">
                                        {model.model_code}
                                    </span>
                                    {isCompleted && (
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black tracking-widest border border-emerald-100">
                                            COMPLETED
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-4 hover:bg-ind-bg rounded-full text-ind-text3 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content Grid */}
                    <div className="p-10 space-y-10">
                        <div className="grid grid-cols-2 gap-10">
                            {/* Production Context */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-ind-primary">
                                    <Database size={16} />
                                    <h4 className="text-[11px] font-black uppercase tracking-widest">Production Context</h4>
                                </div>
                                <div className="bg-ind-bg/50 rounded-2xl p-6 border border-ind-border/50/50">
                                    <div className="mb-4">
                                        <span className="text-[8px] font-black text-ind-text3 uppercase tracking-widest block mb-1">Production Line</span>
                                        <p className="text-sm font-black text-ind-text uppercase tracking-widest italic">{model.line_name || 'NOT ASSIGNED'}</p>
                                    </div>
                                    <div className="w-full h-px bg-ind-border/30/50 mb-4" />
                                    <div>
                                        <span className="text-[8px] font-black text-ind-text3 uppercase tracking-widest block mb-1">Customer / Division</span>
                                        <p className="text-sm font-black text-ind-text uppercase tracking-widest italic">{model.customer_name || 'INTERNAL'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Personnel */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-ind-primary">
                                    <CheckCircle size={16} />
                                    <h4 className="text-[11px] font-black uppercase tracking-widest">Assigned Personnel</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-ind-border/50 shadow-sm transition-all hover:border-ind-primary/20 group/person">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-400 group-hover/person:bg-[#F37021] group-hover/person:text-white transition-colors">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-ind-text3 uppercase tracking-widest block mb-0.5">Supervisor</span>
                                            <p className="text-[11px] font-black text-ind-text uppercase tracking-tight">{model.supervisor_name || 'PENDING'}</p>
                                            {model.supervisor_email && <p className="text-[9px] font-bold text-ind-text3 lowercase">{model.supervisor_email}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-ind-border/50 shadow-sm transition-all hover:border-ind-primary/20 group/person">
                                        <div className="w-10 h-10 rounded-xl bg-ind-bg flex items-center justify-center text-ind-text3 group-hover/person:bg-slate-900 group-hover/person:text-white transition-colors">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-ind-text3 uppercase tracking-widest block mb-0.5">Data Entry Operator</span>
                                            <p className="text-[11px] font-black text-ind-text uppercase tracking-tight">MANOJ</p>
                                            <p className="text-[9px] font-bold text-ind-text3 lowercase">deo@gmail.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Details */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-ind-primary">
                                <Activity size={16} />
                                <h4 className="text-[11px] font-black uppercase tracking-widest">Timeline Details</h4>
                            </div>
                            <div className="bg-ind-bg/50 rounded-3xl p-8 border border-ind-border/50/50 flex items-center justify-between relative overflow-hidden">
                                <div>
                                    <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest block mb-1.5">Start Date</span>
                                    <p className="text-2xl font-black text-ind-text tracking-tighter uppercase">{new Date().toISOString().split('T')[0]}</p>
                                </div>
                                <div className="w-px h-12 bg-ind-border/30" />
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-ind-text3 uppercase tracking-widest block mb-1.5">Target Quantity</span>
                                    <div className="flex items-baseline gap-2 justify-end">
                                        <p className="text-3xl font-black text-ind-primary tracking-tighter">{model.target_quantity || '100'}</p>
                                        <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">Units</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#F37021] transition-all active:scale-95 shadow-xl shadow-slate-200 mt-6"
                        >
                            Close Detailed View
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
