import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken, getUser } from '../../lib/storage';
import { AUTH_LOGIN } from '../../config/routePaths';

interface AuthGuardProps {
    allowedRoles?: string[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ allowedRoles }) => {
    const token = getAccessToken();
    const user = getUser();

    if (!token || !user) {
        return <Navigate to={AUTH_LOGIN} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(user.role)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8 text-center">
                    <div className="card-premium max-w-md">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Unauthorized Access</h1>
                        <p className="text-slate-500 mb-4">Your role ({user.role}) does not have permission to view this page.</p>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">Required: {allowedRoles.join(', ')}</p>
                        <button
                            onClick={() => window.history.back()}
                            className="mt-6 px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            );
        }
    }

    return <Outlet />;
};

export default AuthGuard;
