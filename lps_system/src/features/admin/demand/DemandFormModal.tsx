import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    X,
    CheckCircle2,
    Truck,
    Send,
    Zap,
    ChevronDown,
    AlertTriangle,
    Package,
    Search
} from 'lucide-react';
import { getToken } from '../../../lib/storage';
import { API_BASE } from '../../../lib/apiConfig';

interface DemandFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data?: any) => void;
    initialData?: {
        model_name?: string;
        quantity?: number;
        start_date?: string;
        customer?: string;
        customer_email?: string;
        requested_date?: string;
        subject?: string;
    };
    editingDemand?: any;
}

const DemandFormModal: React.FC<DemandFormModalProps> = ({ isOpen, onClose, onSuccess, initialData, editingDemand }) => {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [models, setModels] = useState<any[]>([]);
    const [lastSubmittedData, setLastSubmittedData] = useState<any>(null);

    const [masterDataPreview, setMasterDataPreview] = useState<any[]>([]);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Form State
    const [selectedModel, setSelectedModel] = useState('');
    const [quantity, setQuantity] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [line, setLine] = useState('');
    const [manager, setManager] = useState('');
    const [supervisorId, setSupervisorId] = useState<number | ''>('');
    const [customer, setCustomer] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [companyName, setCompanyName] = useState('');

    const fetchInitialData = async () => {
        const token = getToken();
        try {
            // Always load from MasterData rather than CarModel so all vehicle models are available even
            // after demand deletions cycle (CarModel records get cleaned up but MasterData is the 
            // permanent source of truth for all vehicle models).
            const modelsRes = await fetch(`${API_BASE}/manager/vehicle-models`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (modelsRes.ok) {
        const data = await modelsRes.json();
        if (data.success) setModels(data.data);
    }
        } catch (err) {
            console.error('Failed to fetch modal data', err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setShowSuccess(false);
            fetchInitialData();

            if (editingDemand) {
                setQuantity(String(editingDemand.quantity));
                setStartDate(editingDemand.start_date);
                setEndDate(editingDemand.end_date);
                setLine(editingDemand.line || '');
                setManager(editingDemand.manager || '');
                setCustomer(editingDemand.customer || '');
                setCompanyName(editingDemand.company || '');
                // supervisorId might not be returned in demand, we can try to find it by name or model assignment
                const assignedModel = models.find(m => m.name === editingDemand.model_name);
                if (assignedModel?.supervisor_id) setSupervisorId(assignedModel.supervisor_id);
            } else if (initialData) {
                if (initialData.model_name) {
                    // Auto-select model by name if it exists in our master list
                    const match = models.find(m => m.name.toLowerCase() === initialData.model_name?.toLowerCase());
                    if (match) setSelectedModel(String(match.id));
                }
                if (initialData.quantity) setQuantity(String(initialData.quantity));
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                const end = new Date();
                end.setDate(end.getDate() + 14);
                setEndDate(end.toISOString().split('T')[0]);
                if (initialData.customer) {
                    const cleanCustomer = initialData.customer.split(' <')[0];
                    setCustomer(cleanCustomer);
                }
                if (initialData.customer_email) {
                    setCustomerEmail(initialData.customer_email);
                }
            } else {
                resetForm();
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                const end = new Date();
                end.setDate(end.getDate() + 14);
                setEndDate(end.toISOString().split('T')[0]);
            }
        }
    }, [isOpen]);

    // Fetch master data preview when model changes
    useEffect(() => {
        if (selectedModel) {
            const model = models.find(m => String(m.id) === selectedModel);
            if (model) {
                // Ensure new demands start unassigned - removed old auto-fill logic
                fetchMasterDataPreview(model.name);
            }
        } else {
            setMasterDataPreview([]);
        }
    }, [selectedModel, models]);

    const fetchMasterDataPreview = async (modelName: string) => {
        setIsPreviewLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/manager/master-data?model=${modelName}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMasterDataPreview(data || []);
            }
        } catch (err) {
            console.error('Failed to fetch preview data', err);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedModel('');
        setQuantity('');
        setManager('');
        setSupervisorId('');
        setStartDate('');
        setEndDate('');
        setCustomer('');
        setCustomerEmail('');
        setCompanyName('');
        setLine('');
    };

    const handleFinalClose = () => {
        if (showSuccess) {
            onSuccess(lastSubmittedData);
        } else {
            onClose();
        }
        resetForm();
        setLastSubmittedData(null);
        setShowSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return; // Guard against double-submit
        setLoading(true);
        setErrorMessage('');

        try {
            const token = getToken();

            const model = models.find(m => String(m.id) === selectedModel);
            
            // Allow name-only fallback for Gmail requests (backend will create fresh model)
            const finalModelName = model ? model.name : (initialData?.model_name || '');
            const finalModelId = model ? Number(model.id) : 0;

            if (!finalModelName) {
                setErrorMessage('Please select a valid model');
                setLoading(false);
                return;
            }

            const demandData = {
                model_id: finalModelId,
                model_name: finalModelName,
                quantity: Number(quantity),
                line,
                manager,
                supervisor_id: supervisorId,
                start_date: startDate,
                end_date: endDate || startDate,
                customer,
                company: companyName,
                status: editingDemand ? editingDemand.status : 'PENDING',
            };

            // --- KEY FIX ---
            // If this modal was opened from an email (initialData present), 
            // do NOT create a demand here. The /authorize endpoint in OrderInboxPage
            // will create the demand. Just mark success and pass data up.
            if (initialData && !editingDemand) {
                setLastSubmittedData({
                    ...demandData,
                    customer_email: customerEmail // Ensure email is passed back
                });
                setErrorMessage('');
                setShowSuccess(true);
                return;
            }

            // For standalone demand creation (no email), POST directly
            const url = editingDemand
                ? `${API_BASE}/admin/demands/${editingDemand.id}`
                : `${API_BASE}/admin/demands`;

            const method = editingDemand ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(demandData)
            });

            if (response.ok) {
                // Automated Email trigger to Customer
                if (customerEmail) {
                    try {
                        const originalSubject = initialData?.subject || 'Order';
                        const subject = `Re: ${originalSubject} - Authorized Successfully`;
                        const formattedEndDate = new Date(endDate || startDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
                        const body = `Dear Customer,\n\nThank you for choosing LPS.\n\nWe are pleased to inform you that your model order has been successfully received and approved by our team.\n\n### 📦 Order Details:\n\n* Model: ${finalModelName}\n* Quantity: ${quantity}\n* Expected Completion Date: ${formattedEndDate}\n\nYour order is now under process, and our production team has already initiated the work to ensure timely completion and delivery.\n\nIf you have any questions or require further assistance, please feel free to contact us at any time.\n\nThank you for trusting LPS.\n\nWarm regards,\nLPS Production Team\nThank you from LPS`;

                        await fetch(`${API_BASE}/orders/send-email`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                email: customerEmail,
                                subject,
                                body
                            })
                        });
                    } catch (err) {
                        console.error('Failed to send confirmation email', err);
                    }
                }

                setLastSubmittedData(demandData);
                setErrorMessage(''); // Clear error on success
                setShowSuccess(true);
                // Wait for user to click OK to call onSuccess and close
            } else {
                const errorData = await response.json();
                setErrorMessage(errorData.message || 'Failed to save demand');
            }
        } catch (error) {
            console.error('Failed to save demand', error);
            setErrorMessage('Network error while saving demand');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                        onClick={handleFinalClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
                    >
                        <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden font-sans pointer-events-auto flex flex-col max-h-[90vh]">
                            {/* Error Banner */}
                            <AnimatePresence>
                                {errorMessage && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="bg-rose-50 border-b border-rose-100 px-8 py-3 flex items-center gap-3 overflow-hidden"
                                    >
                                        <AlertTriangle size={14} className="text-rose-500" />
                                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{errorMessage}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {showSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-8 max-w-sm mx-auto flex flex-col items-center text-center space-y-6 w-full"
                                >
                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                                        <CheckCircle2 size={32} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-1 pb-2">
                                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Model Authorized Successfully!</h2>
                                        <p className="text-slate-500 font-bold text-xs underline underline-offset-4 decoration-emerald-500/30">
                                            {initialData ? "Parameters confirmed & ready for system authorization." : "Target registered & Confirmation sent to customer."}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleFinalClose}
                                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md mt-2"
                                    >
                                        OK, CLOSE
                                    </button>
                                </motion.div>
                            ) : (
                                <>
                                    {/* Header Section */}
                                    <div className="p-8 pb-6 flex items-start justify-between bg-white border-b border-slate-50 shrink-0">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                                {editingDemand ? 'EDIT PRODUCTION TARGET' : 'REGISTER NEW PRODUCTION'}
                                            </h2>
                                            <p className="text-slate-400 font-bold text-xs mt-1">
                                                {editingDemand ? 'Modify production parameters for this order.' : 'Define production parameters and assign a manager.'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleFinalClose}
                                            className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                                        <form onSubmit={handleSubmit} className="space-y-6">

                                            {/* 1. DETECTED ORDER DETAILS (Image 2 Style) */}
                                            {initialData && (
                                                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/60 transition-all">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="bg-indigo-50 text-[#F37021] p-2 rounded-xl">
                                                            <Truck size={16} strokeWidth={3} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-indigo-900/40 tracking-[0.2em] uppercase">Detected Order Details</span>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4">
                                                        {/* Model Card */}
                                                        <div className="bg-white rounded-2xl p-5 border border-slate-50 shadow-sm">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Model</span>
                                                            <span className="text-sm font-black text-slate-800 tracking-tight">{initialData.model_name}</span>
                                                        </div>

                                                        {/* Quantity Card */}
                                                        <div className="bg-white rounded-2xl p-5 border border-slate-50 shadow-sm">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Quantity</span>
                                                            <span className="text-sm font-black text-slate-800 tracking-tight">
                                                                {initialData.quantity} Units
                                                            </span>
                                                        </div>

                                                        {/* Customer Card */}
                                                        <div className="bg-white rounded-2xl p-5 border border-slate-50 shadow-sm">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Customer</span>
                                                            <span className="text-sm font-black text-slate-800 tracking-tight leading-tight truncate">
                                                                {initialData.customer?.split(' <')[0] || 'Client'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 2. PRODUCTION SCHEDULE (Image 3 Style) */}
                                            <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/60 space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-400">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Production Schedule</h3>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Demand From (Start Date)</label>
                                                        <div className="relative group">
                                                            <input
                                                                type="date"
                                                                value={startDate}
                                                                onChange={(e) => setStartDate(e.target.value)}
                                                                className="w-full bg-white border border-slate-100 rounded-xl py-4 px-5 text-slate-700 font-bold text-sm outline-none focus:border-[#F37021] focus:ring-4 focus:ring-orange-500/5 transition-all"
                                                                required
                                                            />
                                                            <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheduled Finish Date</label>
                                                        <div className="relative group">
                                                            <input
                                                                type="date"
                                                                value={endDate}
                                                                onChange={(e) => setEndDate(e.target.value)}
                                                                className="w-full bg-white border border-slate-100 rounded-xl py-4 px-5 text-slate-700 font-bold text-sm outline-none focus:border-[#F37021] focus:ring-4 focus:ring-orange-500/5 transition-all"
                                                                required
                                                            />
                                                            <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Automated Reply Banner */}
                                                <div className="bg-indigo-50/40 rounded-2xl p-4 flex items-center gap-3 border border-indigo-100/30">
                                                    <Send size={14} className="text-indigo-400" />
                                                    <p className="text-[11px] font-bold text-indigo-900/60">
                                                        Automated reply with these dates will be sent to customer upon acceptance.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 3. REFINED FORM FIELDS (Image 4 Style) */}
                                            <div className="space-y-6 pt-2">

                                                {/* Model Select (Wide) */}
                                                <div className="relative group">
                                                    <select
                                                        value={selectedModel}
                                                        onChange={(e) => setSelectedModel(e.target.value)}
                                                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-slate-700 font-black text-sm outline-none focus:border-[#F37021] transition-all appearance-none cursor-pointer"
                                                        required
                                                    >
                                                        <option value="">{initialData?.model_name || 'Select a vehicle model'}</option>
                                                        {models.map(m => (
                                                            <option key={m.id} value={m.id}>{m.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                                </div>

                                                {/* 4. MASTER DATA PREVIEW (NEW) */}
                                                {(selectedModel || editingDemand) && (
                                                    <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/60 transition-all space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
                                                                    <Package size={18} />
                                                                </div>
                                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Master Data Components</h3>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-100 italic">
                                                                {masterDataPreview.length} items detected
                                                            </span>
                                                        </div>

                                                        <div className="relative bg-white rounded-2xl border border-slate-100 overflow-hidden min-h-[150px] max-h-[300px] flex flex-col shadow-inner">
                                                            {isPreviewLoading ? (
                                                                <div className="flex-1 flex flex-col items-center justify-center gap-2 p-10">
                                                                    <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identifying Parts...</span>
                                                                </div>
                                                            ) : masterDataPreview.length > 0 ? (
                                                                <div className="overflow-auto custom-scrollbar flex-1">
                                                                    <table className="w-full border-collapse">
                                                                        <thead className="sticky top-0 bg-slate-50 z-10">
                                                                            <tr>
                                                                                <th className="px-4 py-2.5 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Part Number</th>
                                                                                <th className="px-4 py-2.5 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">SAP #</th>
                                                                                <th className="px-4 py-2.5 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Description</th>
                                                                                <th className="px-4 py-2.5 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Assembly</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {masterDataPreview.map((item, idx) => (
                                                                                <tr key={idx} className="border-b border-slate-50 hover:bg-orange-50/30 transition-colors">
                                                                                    <td className="px-4 py-2 text-[9px] font-bold text-slate-600 font-mono">{item.common.part_number}</td>
                                                                                    <td className="px-4 py-2 text-[9px] font-black text-slate-900">{item.common.sap_part_number}</td>
                                                                                    <td className="px-4 py-2 text-[9px] font-medium text-slate-400 truncate max-w-[150px]">{item.common.description}</td>
                                                                                    <td className="px-4 py-2 text-[9px] font-bold text-indigo-500 italic">{item.common.assembly_number || '-'}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10 text-center">
                                                                    <Search size={24} className="text-slate-200" />
                                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No master data found for this model</p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => fetchMasterDataPreview(models.find(m => String(m.id) === selectedModel)?.name || '')}
                                                                        className="text-[9px] font-black text-[#F37021] hover:underline"
                                                                    >
                                                                        RETRY DISCOVERY
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 pl-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#F37021]" />
                                                            Parts and sub-assemblies will be automatically mapped to this production order.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Target Quantity (Full Width) */}
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">TARGET QUANTITY</label>
                                                    <div className="relative group">
                                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-200">
                                                            <CheckCircle2 size={18} />
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={quantity}
                                                            onChange={(e) => setQuantity(e.target.value)}
                                                            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-14 pr-4 text-slate-700 font-black text-sm outline-none focus:border-[#F37021] transition-all font-sans"
                                                            placeholder="Enter target quantity (e.g. 50)"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {/* Customer & Company Details */}
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">COMPANY NAME</label>
                                                        <input
                                                            type="text"
                                                            value={companyName}
                                                            onChange={(e) => setCompanyName(e.target.value)}
                                                            className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-slate-700 font-black text-sm outline-none focus:border-[#F37021] transition-all"
                                                            placeholder="e.g. Mahindra, Tesla"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CUSTOMER NAME</label>
                                                        <input
                                                            type="text"
                                                            value={customer}
                                                            onChange={(e) => setCustomer(e.target.value)}
                                                            className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-slate-700 font-black text-sm outline-none focus:border-[#F37021] transition-all"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CUSTOMER EMAIL</label>
                                                    <input
                                                        type="email"
                                                        value={customerEmail}
                                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-slate-700 font-black text-sm outline-none focus:border-[#F37021] transition-all"
                                                        placeholder="for automated notifications"
                                                    />
                                                </div>



                                            </div>
                                        </form>
                                    </div>

                                    {/* Actions Section (Image 4 Style) */}
                                    <div className="p-8 border-t border-slate-50 bg-white grid grid-cols-2 gap-6 shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleFinalClose}
                                            className="bg-white border border-slate-100 text-slate-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-slate-300 hover:text-slate-600 transition-all"
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="bg-[#F37021] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 overflow-hidden group"
                                        >
                                            {loading ? (
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                                                    <Send size={18} />
                                                </motion.div>
                                            ) : (
                                                <>
                                                    <Zap size={18} fill="white" strokeWidth={0} />
                                                    AUTHORIZE PRODUCTION
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DemandFormModal;
