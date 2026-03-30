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
            const response = await fetch(`${API_BASE}/admin/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'System core metrics retrieve failed');
            }
            return response.json();
        }
    }
};
