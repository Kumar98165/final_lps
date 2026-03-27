// api/apiClient.ts – Industry-standard API client (using backend fetch)
import type { ManagerSummary, GChartData, AdminSummary } from '../types/dashboard';
import { API_BASE } from '../lib/apiConfig';
import { getToken } from '../lib/storage';

/**
 * Industry-standard API client pattern.
 * Data now comes from the backend where available.
 */
export const apiClient = {
    manager: {
        getSummary: async (): Promise<ManagerSummary> => {
            const token = getToken();
            const response = await fetch(`${API_BASE}/manager/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Summary fetch failed');
            return response.json();
        },
        getGChartData: async (): Promise<GChartData[]> => {
            const token = getToken();
            const response = await fetch(`${API_BASE}/manager/g-chart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('G-Chart fetch failed');
            return response.json();
        }
    },
    admin: {
        getSummary: async (): Promise<AdminSummary> => {
            const token = getToken();
            try {
                const response = await fetch(`${API_BASE}/summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    return data;
                }
            } catch (err) {
                console.error("Failed to fetch admin summary", err);
            }
            // Fallback mock if backend is down or fails
            return {
                oee: '84.5%',
                node_efficiency: '98.2%',
                production_units: '1,248',
                security_status: 'Verified'
            };
        }
    }
};
