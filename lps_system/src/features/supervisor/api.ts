import { API_BASE } from '../../lib/apiConfig';
import { getToken } from '../../lib/storage';

export async function getPendingVerifications() {
    const token = getToken();
    const res = await fetch(`${API_BASE}/supervisor/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
}

export async function verifyDailyProductionLog(logId: number, status: 'APPROVED' | 'REJECTED', comment: string = "") {
    const token = getToken();
    const res = await fetch(`${API_BASE}/supervisor/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            log_id: logId,
            status,
            comment
        })
    });
    return res.ok;
}

export async function verifyDailyProductionRow(logId: number, rowIndex: number, status: 'VERIFIED' | 'REJECTED', reason: string = "", sap_part_number: string = "") {
    const token = getToken();
    const res = await fetch(`${API_BASE}/supervisor/verify-row`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            log_id: logId,
            row_index: rowIndex,
            status,
            reason,
            sap_part_number
        })
    });
    return res.ok;
}

export async function verifyProductionNode(id: string) {
    // Keep this for backward compatibility if needed, but we are moving to Daily log flow
    console.log('Verifying production node:', id);
    return { success: true };
}
