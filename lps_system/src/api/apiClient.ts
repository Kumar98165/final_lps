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
        },
        getVehicleModels: async () => {
            const token = getToken();
            const response = await fetch(`${API_BASE}/manager/vehicle-models`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
        },
        getLines: async () => {
            const token = getToken();
            const res = await fetch(`${API_BASE}/admin/lines`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.json();
        },
        getAssignments: async () => {
            const token = getToken();
            const res = await fetch(`${API_BASE}/admin/assignments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.json();
        },
        getDemands: async () => {
            const token = getToken();
            const res = await fetch(`${API_BASE}/admin/demands`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.json();
        },
        getModels: async () => {
            const token = getToken();
            const res = await fetch(`${API_BASE}/admin/models`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.json();
        },
        getStaff: async (role?: string) => {
            const token = getToken();
            const url = role ? `${API_BASE}/admin/identity/staff?role=${role}` : `${API_BASE}/admin/identity/staff`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.json();
        },
        getVelocityTrend: async () => {
            const token = getToken();
            const res = await fetch(`${API_BASE}/admin/analytics/velocity`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.json();
        },
        recordProduction: async (lineName: string, increment: number = 1) => {
            const token = getToken();
            const res = await fetch(`${API_BASE}/admin/production/record`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lineName, increment })
            });
            return res.json();
        }
    }
};
