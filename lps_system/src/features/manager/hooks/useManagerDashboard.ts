import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/apiClient';
import type { ManagerSummary, GChartData } from '../../../types/dashboard';

/**
 * Industry-level custom hook pattern.
 * Encapsulates data fetching, state management, and side effects.
 */
export const useManagerDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [summary, setSummary] = useState<ManagerSummary | null>(null);
    const [gChartData, setGChartData] = useState<GChartData[]>([]);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [sum, chart] = await Promise.all([
                apiClient.manager.getSummary(),
                apiClient.manager.getGChartData()
            ]);
            setSummary(sum);
            setGChartData(chart);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to synchronize production data'));
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 60000); // 1 minute
        return () => clearInterval(interval);
    }, []);

    return {
        summary,
        gChartData,
        loading,
        error,
        refresh: fetchData
    };
};
