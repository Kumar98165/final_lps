export interface ManagerSummary {
    total_output: number;
    plan_adherence: number;
    daily_target: number;
    active_shop: string;
}

export interface SystemHealthMetric {
    label: string;
    val: string;
    perc: number;
}

export interface GChartDay {
    plan: number;
    actual: number;
}

export interface GChartData {
    model_name: string;
    days: GChartDay[];
}

export interface AdminSummary {
    success?: boolean;
    oee: string;
    production_units: string;
    stats: {
        active_lines: number;
        pending_reviews: number;
        total_models: number;
        active_deos: number;
    };
}
