// features/manager/api.ts – mock data (localDB removed)

export async function getGChartData() {
    return [
        {
            model_name: 'XUV',
            days: Array.from({ length: 31 }, (_, i) => ({ plan: 4, actual: i < 15 ? (Math.random() > 0.3 ? 4 : 3) : 0 }))
        }
    ];
}

export async function getManagerSummary() {
    return {
        total_output: 840,
        plan_adherence: 94.5,
        daily_target: 45,
        active_shop: 'ASSEMBLY-01'
    };
}
