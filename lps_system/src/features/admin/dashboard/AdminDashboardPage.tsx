import { Activity } from 'lucide-react';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

// Custom Components
import { AdminIndustrialDashboard } from './industrial/AdminIndustrialDashboard';

const AdminDashboardPage = () => {
    const { summary, loading, error } = useAdminDashboard();

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#FAFBFC] min-h-screen font-outfit">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                    <span className="text-slate-400 font-black uppercase tracking-[0.4em] animate-pulse">Initializing Dashboard Core...</span>
                </div>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#FAFBFC] min-h-screen font-outfit">
                <div className="bg-white border border-slate-200 rounded-[3rem] p-12 text-center space-y-6 max-w-md shadow-xl">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto">
                        <Activity size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 uppercase">System Error</h3>
                        <p className="text-slate-400 font-bold">{error?.message || 'Failed to load system metrics'}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full h-14 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
                    >
                        Re-initialize System
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AdminIndustrialDashboard />
    );
};

export default AdminDashboardPage;
