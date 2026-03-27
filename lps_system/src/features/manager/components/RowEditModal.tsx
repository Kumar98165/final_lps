import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, ClipboardList } from 'lucide-react';

interface RowEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedRow: any) => void;
    onDelete: (id: number) => void;
    row: any;
    commonHeaders: string[];
    materialHeaders: string[];
}

const RowEditModal: React.FC<RowEditModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    row,
    commonHeaders,
    materialHeaders
}) => {
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        if (isOpen && row) {
            setFormData({ ...row });
        }
    }, [isOpen, row]);

    if (!isOpen || !formData) return null;

    const handleChange = (key: string, value: string) => {
        setFormData((prev: any) => {
            const newData = { ...prev, [key]: value };

            // Auto-calculate RM SIZE if dimensions are edited
            if (['RM Thk mm', 'Sheet Width', 'Sheet Length'].includes(key)) {
                const thk = key === 'RM Thk mm' ? value : (prev['RM Thk mm'] || '');
                const width = key === 'Sheet Width' ? value : (prev['Sheet Width'] || '');
                const length = key === 'Sheet Length' ? value : (prev['Sheet Length'] || '');

                if (thk || width || length) {
                    newData['RM SIZE'] = `${thk}X${width}X${length}`.replace(/XX/g, 'X').replace(/^X|X$/g, '');
                }
            }

            return newData;
        });
    };

    const renderInput = (label: string, icon?: any) => (
        <div className="space-y-1.5 group">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                {icon && React.createElement(icon, { size: 12, className: "text-[#F37021]" })}
                {label}
            </label>
            <input
                type="text"
                value={formData[label] || ''}
                onChange={(e) => handleChange(label, e.target.value.toUpperCase())}
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#F37021]/30 focus:bg-white rounded-xl py-2.5 px-4 text-slate-900 font-extrabold text-xs outline-none transition-all placeholder:text-slate-200 shadow-sm"
                placeholder={`Enter ${label.toLowerCase()}...`}
            />
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#F37021] shadow-sm border border-orange-100/50">
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                    Edit Component Row
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                    <span>Part #{formData["PART NUMBER"] || 'NEW'}</span>
                                    <span className="text-slate-200 tracking-normal">•</span>
                                    <span className="text-[#F37021]">Master Data Entry</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900 group"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                        {/* Section 1: Identification */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-100" />
                                <span className="text-[10px] font-black text-[#F37021] uppercase tracking-[0.3em]">Identification</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {commonHeaders.filter(h => h.toUpperCase() !== 'S.').map(h => (
                                    <div key={h}>
                                        {renderInput(h)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: G-Chart View Data */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-100" />
                                <span className="text-[10px] font-black text-[#F37021] uppercase tracking-[0.3em]">Operational Targets & Stock</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {["TOTAL SCHEDULE QTY", "PER DAY", "SAP Stock", "Opening Stock", "Todays Stock", "Coverage Days"].map(h => (
                                    <div key={h}>
                                        {renderInput(h)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 3: Material Data */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-100" />
                                <span className="text-[10px] font-black text-[#F37021] uppercase tracking-[0.3em]">Material Data</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {materialHeaders.filter(h => !["TOTAL SCHEDULE QTY", "PER DAY"].includes(h)).map(h => (
                                    <div key={h}>
                                        {renderInput(h)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between sticky bottom-0 z-10">
                        <button
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete part ${formData["SAP PART NUMBER"] || 'this row'}?`)) {
                                    onDelete(formData.id);
                                }
                            }}
                            className="px-6 py-4 flex items-center gap-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                        >
                            <Trash2 size={16} />
                            Delete Row
                        </button>

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="px-8 py-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onSave(formData)}
                                className="px-10 py-4 bg-[#F37021] hover:bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-orange-500/30 active:scale-95 flex items-center gap-2"
                            >
                                <Save size={16} />
                                Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Decorative Background Accents */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10 opacity-50" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-50 rounded-full translate-y-1/2 -translate-x-1/2 -z-10 opacity-30" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RowEditModal;
