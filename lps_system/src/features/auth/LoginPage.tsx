import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Lock,
    User,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import logoLps from '../../assets/logo_lps.jpeg';

import { setToken, setUser } from '../../lib/storage';
import { login } from './api';
// localDB removed – all auth goes through backend API
import { UserRole } from '../../config/roles';
import {
    MANAGER_DASHBOARD,
    ADMIN_HOME,
    OPERATOR_HOME,
    SUPERVISOR_DASHBOARD,
    DEO_DASHBOARD
} from '../../config/routePaths';

const LoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await login(username, password);

            if (response.success) {
                setToken(response.data.access_token);
                setUser(response.data.user);

                const role = response.data.user.role;
                switch (role) {
                    case UserRole.ADMIN:
                        navigate(ADMIN_HOME);
                        break;
                    case UserRole.MANAGER:
                        navigate(MANAGER_DASHBOARD);
                        break;
                    case UserRole.SUPERVISOR:
                        navigate(SUPERVISOR_DASHBOARD);
                        break;
                    case UserRole.DEO:
                        navigate(DEO_DASHBOARD);
                        break;
                    default:
                        navigate(ADMIN_HOME);
                }
            } else {
                setError(response.message || 'Authentication failed');
            }
        } catch (err: any) {
            setError('System synchronization error. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ind-bg flex items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle Background Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] relative z-10"
            >
                <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden border border-ind-border/50">

                    {/* Branding */}
                    <div className="text-center mb-8">
                        <div className="w-64 mx-auto mb-6">
                            <img src={logoLps} alt="CIE Automotive" className="w-full h-auto object-contain" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase mb-2 font-sans">PRODUCTION SYSTEM</h1>
                        <p className="text-ind-text3 font-bold text-xs">Sign in to access your dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-ind-text3 uppercase tracking-widest ml-1">USERNAME</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-ind-text3 group-focus-within:text-ind-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="w-full bg-ind-bg border-2 border-ind-border/50/50 rounded-2xl py-3.5 pl-12 pr-4 text-slate-700 placeholder:text-ind-text3 focus:bg-white focus:border-ind-primary focus:ring-4 focus:ring-orange-500/10 transition-all font-bold outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-ind-text3 uppercase tracking-widest ml-1">PASSWORD</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ind-text3 group-focus-within:text-ind-primary transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-ind-bg border-2 border-ind-border/50/50 rounded-2xl py-3.5 pl-12 pr-4 text-slate-700 placeholder:text-ind-text3 focus:bg-white focus:border-ind-primary focus:ring-4 focus:ring-orange-500/10 transition-all font-bold outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-rose-50 border border-rose-100 text-rose-500 px-4 py-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2"
                            >
                                <ShieldCheck size={14} />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#F37021] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(243,112,33,0.3)] hover:shadow-[0_15px_35px_rgba(243,112,33,0.4)] hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group mt-6"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>SIGN IN</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center space-y-4">
                        <p className="text-[9px] font-black text-slate-200 uppercase tracking-widest">CIE AUTOMOTIVE PRODUCTION SYSTEM V3.0</p>

                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
