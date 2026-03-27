import React from 'react';
import { motion } from 'framer-motion';
import { 
    Database, 
    Bell, 
    ClipboardList, 
    Activity, 
    Car
} from 'lucide-react';

interface AssignedModel {
    id: number;
    name: string;
    model_code: string;
    line_name: string;
    customer_name: string;
    deo_accepted: boolean;
}

interface DEOStatsProps {
    assignedModels: AssignedModel[];
    submissionHistory: any[];
    selectedModelId: number | null;
    setActiveTab: (tab: string) => void;
}

export const DEOStats: React.FC<DEOStatsProps> = ({ 
    assignedModels, 
    submissionHistory, 
    selectedModelId,
    setActiveTab
}) => {
    const selectedModel = assignedModels.find(m => m.id === selectedModelId);
    const latestSubmission = submissionHistory.find(s => s.model_name === selectedModel?.name);

    // Calculate progress if we have the latest submission
    let totalTarget = 0;
    let totalActual = 0;
    if (latestSubmission && latestSubmission.log_data) {
        latestSubmission.log_data.forEach((row: any) => {
            totalTarget += parseFloat(row["Target Qty"]) || 0;
            totalActual += parseFloat(row["Today Produced"]) || 0;
        });
    }
    const progressPercent = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;


    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-[#F37021]/20">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Assigned</span>
                    <div className="flex items-center gap-4">
                        <Database className="text-[#F37021]" size={24} />
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{assignedModels.length}</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-[#F37021]/20">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Awaiting Accept</span>
                    <div className="flex items-center gap-4">
                        <Bell className="text-orange-500" size={24} />
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{assignedModels.filter(m => !m.deo_accepted).length}</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-[#F37021]/20">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Logs Submitted</span>
                    <div className="flex items-center gap-4">
                        <ClipboardList className="text-emerald-500" size={24} />
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{submissionHistory.length}</span>
                    </div>
                </div>
                <div className="bg-[#F37021] p-8 rounded-[2.5rem] text-white shadow-xl shadow-orange-500/20 flex flex-col justify-center">
                    <span className="block text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-2">Live Production</span>
                    <div className="flex items-center gap-4">
                        <Activity className="animate-pulse" size={24} />
                        <span className="text-2xl font-black tracking-tighter uppercase whitespace-nowrap">Active Shift</span>
                    </div>
                </div>
            </div>

            {/* Model Specific Pulse */}
            {selectedModel ? (
                <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-24 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl group-hover:rotate-6 transition-transform">
                                <Car size={48} strokeWidth={1.5} />
                            </div>
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">{selectedModel.name}</h2>
                                    <span className="px-4 py-1.5 bg-orange-50 text-[#F37021] rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
                                        {selectedModel.model_code}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                    Line: {selectedModel.line_name || 'Main Conveyor'}
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Operations
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 max-w-2xl w-full">
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Shift Completion Target</span>
                                <span className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{progressPercent}%</span>
                            </div>
                            <div className="h-6 bg-slate-50 border border-slate-100 rounded-full overflow-hidden p-1.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    className="h-full bg-gradient-to-r from-[#F37021] to-orange-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(243,112,33,0.3)]"
                                />
                            </div>
                            <div className="flex justify-between mt-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actual: <span className="text-slate-900">{totalActual}</span></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target: <span className="text-slate-900">{totalTarget}</span></span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setActiveTab('ENTRY')}
                                className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-[#F37021] transition-all active:scale-95 shadow-xl flex items-center gap-3"
                            >
                                <ClipboardList size={18} /> Enter Daily Work
                            </button>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
                </div>
            ) : (
                <div className="bg-white rounded-[3.5rem] p-16 border border-slate-100 shadow-sm text-center group hover:border-[#F37021]/20 transition-all">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-200 group-hover:bg-orange-50 group-hover:text-orange-200 transition-all">
                        <Car size={48} strokeWidth={1} />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-4">No Model Selected for Tracking</h3>
                    <p className="text-xs font-bold text-slate-300 max-w-sm mx-auto uppercase tracking-widest leading-loose">
                        Select an assigned model from the <span className="text-slate-400">Models</span> tab or pick one from your assignments to see live production pulse data.
                    </p>
                    <button
                        onClick={() => setActiveTab('MODELS')}
                        className="mt-10 px-10 py-4 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                    >
                        Browse My Models →
                    </button>
                </div>
            )}
        </div>
    );
};
