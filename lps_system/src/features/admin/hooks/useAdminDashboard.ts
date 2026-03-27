import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/apiClient';
import type { AdminSummary } from '../../../types/dashboard';

/**
 * Industry-level custom hook for the Admin Dashboard.
 * Encapsulates system-wide metrics and administrative state.
 */
export const useAdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<AdminSummary | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await apiClient.admin.getSummary();
                setSummary(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to retrieve system core metrics'));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return {
        summary,
        loading,
        error
    };
};
