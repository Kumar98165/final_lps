import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Calendar, Briefcase, Car, CheckCircle2, X } from 'lucide-react';
import { getToken } from '../../../lib/storage';
import { API_BASE } from '../../../lib/apiConfig';

const ModelRegisterPage = () => {
    const navigate = useNavigate();
    // Model Fields
    const [name, setName] = useState('');

    // Demand Fields
    const [quantity, setQuantity] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customer, setCustomer] = useState('');

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = getToken();

            // 1. Create Model
            const modelResponse = await fetch(`${API_BASE}/production/car-models`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    model_code: name.substring(0, 3).toUpperCase() + '-' + Date.now().toString().slice(-3),
                    type: 'SUV'
                })
            });

            if (!modelResponse.ok) throw new Error('Failed to create vehicle model');
            const modelData = await modelResponse.json();
            const newModel = modelData.data;

            // 2. Create Demand using the new Model
            const demandResponse = await fetch(`${API_BASE}/production/demands`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    model_id: newModel.id,
                    model_name: newModel.name,
                    quantity: Number(quantity),
                    start_date: startDate,
                    end_date: startDate, // Sync with start date initially
                    customer,
                    status: 'PENDING'
                })
            });

            if (!demandResponse.ok) throw new Error('Failed to create production demand');

            setLoading(false);
            setShowSuccess(true);
            // navigate('/admin/demand'); // Will be handled by the success view button
        } catch (error) {
            console.error('Registration failed:', error);
            setLoading(false);
            alert('Failed to register model and demand. Please check backend connection.');
        }
    };

    return (
        <div className="w-full min-h-[calc(100vh-4rem)] flex items-start justify-center pt-24 pb-12 p-4 font-sans bg-[#F8FAFC]/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] w-full max-w-xl text-left overflow-hidden relative border border-slate-100/60"
            >
                {showSuccess ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-14 flex flex-col items-center text-center space-y-8"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                            className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 shadow-[inset_0_2px_10px_rgba(34,197,94,0.1)] border border-green-100/50"
                        >
                            <CheckCircle2 size={48} strokeWidth={2.5} />
                        </motion.div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Model Registered</h2>
                            <p className="text-slate-500 font-bold text-sm max-w-[280px] leading-relaxed">
                                <span className="text-[#F37021]">{name}</span> has been initialized with a target of <span className="text-slate-800">{quantity} units</span>.
                            </p>
                        </div>

                        <div className="w-full bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/60 flex flex-col items-center justify-center text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Quantity</span>
                            <div className="text-xl font-black text-[#F37021] uppercase tracking-tight">{quantity} Units</div>
                        </div>

                        <button
                            onClick={() => {
                                const user = JSON.parse(localStorage.getItem('user_data') || '{}');
                                if (user.role === 'Manager') {
                                    navigate('/manager/demand');
                                } else {
                                    navigate('/admin/demand');
                                }
                            }}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-[#F37021] hover:shadow-orange-500/30 transition-all hover:-translate-y-1 active:scale-[0.98]"
                        >
                            GO TO DEMAND LIST
                        </button>
                    </motion.div>
                ) : (
                    <>
                        {/* Header Section - Industrial Style */}
                        <div className="p-8 pb-7 border-b border-slate-50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 -mr-4 -mt-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none">
                                <Target size={120} strokeWidth={1} />
                            </div>

                            <div className="relative z-10 flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-[#F37021] p-1.5 rounded-lg shadow-md shadow-orange-500/10">
                                            <Target size={16} className="text-white" strokeWidth={3} />
                                        </div>
                                        <span className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">Production Setup</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                                        REGISTER MODEL
                                    </h2>
                                    <p className="text-slate-400 font-bold text-xs">Initialize a new vehicle model with an immediate production target.</p>
                                </div>

                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-10 h-10 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            {/* SECTION 1: CORE DEFINITION */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-4 bg-[#F37021] rounded-full" />
                                    <span className="text-[10px] font-black text-slate-400 tracking-[0.15em] uppercase">Core Model Definition</span>
                                </div>

                                {/* Vehicle Model Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">VEHICLE MODEL NAME</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#F37021] transition-all duration-300">
                                            <Car size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="e.g. Scorpio N v2.0"
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-4.5 pl-14 pr-6 text-slate-800 font-bold text-sm outline-none focus:border-[#F37021] focus:bg-white focus:ring-8 focus:ring-orange-500/[0.03] transition-all placeholder:text-slate-300 shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: LINE ASSIGNMENT & TARGETS */}
                            <div className="space-y-6 pt-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-4 bg-[#F37021] rounded-full" />
                                    <span className="text-[10px] font-black text-slate-400 tracking-[0.15em] uppercase">Line & Production Targets</span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">PRODUCTION TARGET QUANTITY</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            placeholder="Enter total units"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-5 px-6 text-slate-800 font-black text-center text-xl outline-none focus:border-[#F37021] focus:bg-white focus:ring-8 focus:ring-orange-500/[0.03] transition-all placeholder:text-slate-200 shadow-sm"
                                            required
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-200 group-focus-within:text-emerald-500 transition-all">
                                            <CheckCircle2 size={24} strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>

                                {/* Removed Production Manager Assignment */}

                                {/* Row: Date & Customer */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">MONTH (START)</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-focus-within:text-[#F37021] transition-all">
                                                <Calendar size={18} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-4.5 pl-14 pr-6 text-slate-800 font-bold text-sm outline-none focus:border-[#F37021] focus:bg-white focus:ring-8 focus:ring-orange-500/[0.03] transition-all uppercase tracking-tight shadow-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-sans">CUSTOMER / CLIENT</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-focus-within:text-[#F37021] transition-all">
                                                <Briefcase size={18} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="e.g. Export Div"
                                                value={customer}
                                                onChange={(e) => setCustomer(e.target.value)}
                                                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-4.5 pl-14 pr-6 text-slate-800 font-bold text-sm outline-none focus:border-[#F37021] focus:bg-white focus:ring-8 focus:ring-orange-500/[0.03] transition-all placeholder:text-slate-300 shadow-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="px-8 py-5 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-slate-200 hover:text-slate-500 transition-all flex items-center justify-center shrink-0"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-[#F37021] to-[#e65a00] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-70 disabled:translate-y-0"
                                >
                                    {loading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Target size={20} className="opacity-50" />
                                        </motion.div>
                                    ) : (
                                        <>
                                            REGISTER NEW MODEL
                                            <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ModelRegisterPage;
