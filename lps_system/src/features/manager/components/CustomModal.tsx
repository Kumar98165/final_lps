import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CheckCircle2, AlertCircle } from 'lucide-react';

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    description?: string;
    defaultValue?: string;
    placeholder?: string;
    type?: 'input' | 'confirm' | 'success' | 'error';
}

const CustomModal: React.FC<CustomModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    defaultValue = '',
    placeholder = 'Enter value...',
    type = 'input'
}) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-ind-border/50 p-8 overflow-hidden"
                >
                    {/* Content type icons for success/error */}
                    {type === 'success' && (
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 mx-auto">
                            <CheckCircle2 size={40} />
                        </div>
                    )}
                    {type === 'error' && (
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 mx-auto">
                            <AlertCircle size={40} />
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-ind-border/30 rounded-full transition-colors text-ind-text3"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {description && (
                        <p className="text-ind-text2 text-sm font-medium mb-8 leading-relaxed text-center">
                            {description}
                        </p>
                    )}

                    {/* Content */}
                    <div className="mb-8">
                        {type === 'input' && (
                            <div className="relative">
                                <input
                                    autoFocus
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full bg-ind-bg border-2 border-ind-border/50 focus:border-orange-500/30 focus:bg-white rounded-2xl py-4 px-6 text-slate-700 font-bold text-lg outline-none transition-all placeholder:text-ind-text3 shadow-inner"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') onConfirm(value);
                                        if (e.key === 'Escape') onClose();
                                    }}
                                />
                            </div>
                        )}
                        {type === 'confirm' && (
                           <p className="text-ind-text2 font-medium text-center">{description || "Are you sure you want to proceed with this action?"}</p>
                        )}
                    </div>

                    {/* Footer / Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 px-6 bg-ind-border/30 hover:bg-ind-border/50 text-ind-text2 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
                        >
                            {type === 'success' || type === 'error' ? 'Close' : 'Cancel'}
                        </button>
                        {(type === 'input' || type === 'confirm') && (
                            <button
                                onClick={() => onConfirm(value)}
                                className="flex-1 py-4 px-6 bg-[#F37021] hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Check size={16} strokeWidth={3} />
                                Confirm
                            </button>
                        )}
                    </div>

                    {/* Decorative accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 opacity-50" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CustomModal;
