import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Edit2, 
    Shield, 
    AlertCircle, 
    CheckCircle2,
    Calendar,
    Table,
    Package,
    Database
} from 'lucide-react';

interface DEOStockEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedRow: any) => void;
    row: any;
    viewMode: 'all' | 'g-chart';
}

const DEOStockEditModal: React.FC<DEOStockEditModalProps> = ({
    isOpen,
    onClose,
    onSave,
    row,
    viewMode
}) => {
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        if (isOpen && row) {
            setFormData({ ...row });
        }
    }, [isOpen, row]);

    if (!isOpen || !formData) return null;

    const handleChange = (key: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const renderReadOnlyField = (label: string, value: any, showErrorBadge: boolean = false) => (
        <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-wider">
                    {label}
                </label>
            </div>
            <div className="w-full bg-[#F7FAFC] border border-[#EDF2F7] rounded-[1.5rem] py-4 px-6 text-[#718096] font-extrabold text-sm shadow-sm">
                {value || '—'}
            </div>
        </div>
    );

    const renderInputField = (label: string, key: string, placeholder: string = "", type: string = "text", isFocused: boolean = false) => (
        <div className="space-y-2 flex-1">
            <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-wider px-1">
                {label}
            </label>
            <input
                type={type}
                value={formData[key] || ''}
                readOnly={formData.row_status === 'VERIFIED'}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-white border-2 ${isFocused ? 'border-ind-primary ring-4 ring-[#F37021]/5' : 'border-[#F1F5F9]'} rounded-[1.5rem] py-4 px-6 text-[#1A202C] font-black text-sm outline-none transition-all placeholder:text-[#CBD5E0] shadow-sm`}
            />
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#1A202C]/40 backdrop-blur-[2px]"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-6xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-[#F1F5F9] flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-[#0F172A] rounded-full flex items-center justify-center text-white shadow-xl">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight">
                                    {viewMode === 'g-chart' ? 'G-Chart Logistics View' : 'Inventory Stock Update'}
                                </h3>
                                <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] mt-1 italic">
                                    PART: {formData["SAP PART NUMBER"] || formData["SAP PART #"]} &bull; {formData["PART DESCRIPTION"]}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 bg-ind-bg hover:bg-[#F1F5F9] rounded-full flex items-center justify-center text-[#94A3B8] transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar flex-1 bg-white">
                        
                        {/* 1. Identification Section */}
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-6 py-2.5 rounded-full shadow-lg">
                                <Database size={14} className="text-ind-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Identification</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {renderReadOnlyField("SAP Part Number", formData["SAP PART NUMBER"] || formData["SAP PART #"])}
                                {renderReadOnlyField("Remain Qty", formData["Remain Qty"])}
                                {renderReadOnlyField("Assembly #", formData["ASSEMBLY NUMBER"])}
                                {renderReadOnlyField("PER DAY Target", formData["PER DAY"])}
                            </div>
                        </div>

                        {/* 2. Stock Inputs Section */}
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-6 py-2.5 rounded-full shadow-lg">
                                <Table size={14} className="text-ind-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Core stock Inventory</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {renderInputField("SAP Stock", "SAP Stock", "Enter SAP stock...", "number", false)}
                                {renderInputField("Opening Stock", "Opening Stock", "Enter opening stock...", "number", false)}
                                {renderInputField("Todays Manual Count", "Todays Stock", "Enter counted value...", "number", true)}
                            </div>
                        </div>

                        {/* 3. G-Chart Projections (Only if G-mode) */}
                        {viewMode === 'g-chart' && (
                            <div className="space-y-8 pt-10 border-t border-[#F1F5F9]">
                                <div className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-6 py-2.5 rounded-full shadow-lg">
                                    <Calendar size={14} className="text-ind-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">31-Day Projection Matrix</span>
                                </div>

                                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-[repeat(16,minmax(0,1fr))] gap-3">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                        <div key={day} className="space-y-2">
                                            <label className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest text-center block">Day {day}</label>
                                            <input
                                                type="text"
                                                value={formData[String(day)] || ''}
                                                onChange={(e) => handleChange(String(day), e.target.value)}
                                                className="w-full bg-[#FAFAFA] border-2 border-[#F1F5F9] focus:bg-white focus:border-ind-primary rounded-xl py-2 px-1 text-[#1A202C] font-black text-[11px] text-center outline-none transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 4. Remarks (Consistent with design) */}
                        <div className="space-y-6 pt-10 border-t border-[#F1F5F9]">
                            <div className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-6 py-2.5 rounded-full shadow-lg">
                                <Edit2 size={14} className="text-ind-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Stock Remarks / Issue report</span>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-extrabold text-[#A0AEC0] uppercase tracking-wider px-1">
                                    Describe any inventory anomalies or discrepencies found
                                </label>
                                <textarea
                                    value={formData["Remarks"] || ''}
                                    onChange={(e) => handleChange("Remarks", e.target.value)}
                                    placeholder="Enter shift notes here..."
                                    className="w-full bg-ind-bg border-2 border-[#F1F5F9] focus:bg-white focus:border-ind-primary rounded-[2rem] p-8 text-sm font-bold text-[#4A5568] outline-none transition-all min-h-[120px] resize-none shadow-inner italic"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-white border-t border-[#F1F5F9] flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-5 bg-white border-2 border-[#EDF2F7] text-[#718096] rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-[#F7FAFC] transition-colors"
                        >
                            Cancel operation
                        </button>
                        <button
                            onClick={() => onSave(formData)}
                            className="flex-[2] py-5 bg-[#F37021] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#F37021]/20 hover:bg-[#E66010] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            <CheckCircle2 size={18} />
                            Submitted final log
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DEOStockEditModal;
