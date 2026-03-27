import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={onClose} 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8"
            >
                <div className="flex justify-between mb-6">
                    <h3 className="text-xl font-black uppercase text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                {type === 'input' && (
                    <input 
                        autoFocus 
                        value={val} 
                        onChange={(e) => setVal(e.target.value)} 
                        className="w-full bg-slate-50 border-2 rounded-2xl py-4 px-6 mb-8 font-bold outline-none focus:border-orange-200" 
                        onKeyDown={(e) => e.key === 'Enter' && onConfirm(val)} 
                    />
                )}
                {(type === 'confirm' || type === 'alert') && (
                    <p className="mb-8 text-slate-500 font-bold leading-relaxed whitespace-pre-line">
                        {message || "Are you sure you want to proceed?"}
                    </p>
                )}
                <div className="flex gap-3">
                    {type !== 'alert' && (
                        <button 
                            onClick={onClose} 
                            className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
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
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100"
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
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Supervisor Feedback</span>
                            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                                <p className="text-slate-700 font-bold leading-relaxed italic text-lg text-center">
                                    "{data.reason}"
                                </p>
                            </div>
                            <div className="mt-10 flex flex-col gap-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-loose px-8">
                                    Please correct the <span className="text-slate-900">Today Produced</span> quantity and set the status to <span className="text-emerald-500 font-black">SUBMITTED</span> to resend for verification.
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
