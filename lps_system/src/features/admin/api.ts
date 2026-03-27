// features/admin/api.ts – static data (localDB removed)

export async function getPlantSummary(_range?: any) {
    return {
        total_vehicles_completed: 1248,
        efficiency: 98.2,
        active_lines: 4,
        total_issues: 4,
        average_cycle_time: 42,
        overall_oee: 84.5
    };
}

export async function getProductionTrend(_range?: any) {
    return [
        { date: '2024-02-01', actual: 42, planned: 45 },
        { date: '2024-02-02', actual: 38, planned: 40 },
        { date: '2024-02-03', actual: 45, planned: 45 },
    ];
}

export async function getShops() {
    return [
        { id: 1, name: 'PRESS SHOP', code: 'PS-01' },
        { id: 2, name: 'BODY SHOP', code: 'BS-01' },
        { id: 3, name: 'PAINT SHOP', code: 'PT-01' },
        { id: 4, name: 'TCF SHOP', code: 'TC-01' },
        { id: 5, name: 'ASSEMBLY', code: 'AS-01' },
    ];
}
