import { useState, useMemo, useEffect, useCallback } from 'react';
import { apiClient } from '../../../api/apiClient';

export interface Line {
    id: string;
    name: string;
    target: number;
    completed: number;
    model: string;
}

export interface Assignment {
    id: number | string;
    model: string;
    lineId: string;
    deo: string;
    supervisor: string;
}

export interface Rejection {
    id: number | string;
    lineId: string;
    model: string;
    part: string;
    reason: string;
    date: string;
    rejectedBy: string;
    deo: string;
}

export interface MailOrder {
    id: string;
    company: string;
    customer: string;
    email: string;
    model: string;
    qty: number;
    status: 'pending' | 'accepted' | 'approved' | 'rejected' | 'completed' | 'done';
    date: string;
    msg: string;
    produced: number;
    transferred: number;
}

export interface Material {
    name: string;
    icon: string;
    unit: string;
    used: number;
    total: number;
    color: string;
    cost: number;
}

const MATERIALS_DB: Record<string, Material[]> = {
    "EV-S186": [
        { name: "Li-Ion Cells", icon: "🔋", unit: "pcs", used: 2480, total: 3000, color: "#F37021", cost: 45 },
        { name: "Copper Wire", icon: "🔌", unit: "m", used: 1200, total: 1500, color: "#facc15", cost: 12 },
        { name: "Steel Frame", icon: "⚙️", unit: "kg", used: 860, total: 1000, color: "#60a5fa", cost: 8 },
        { name: "BMS Units", icon: "💡", unit: "pcs", used: 78, total: 90, color: "#a78bfa", cost: 120 },
        { name: "Cooling Fluid", icon: "💧", unit: "L", used: 340, total: 400, color: "#f37021cc", cost: 5 },
        { name: "Motor Coils", icon: "🔧", unit: "pcs", used: 156, total: 200, color: "#fb923c", cost: 65 },
    ],
    "EV-X90": [
        { name: "Li-Ion Cells", icon: "🔋", unit: "pcs", used: 1920, total: 2500, color: "#F37021", cost: 45 },
        { name: "Aluminium Body", icon: "🏗️", unit: "kg", used: 640, total: 800, color: "#60a5fa", cost: 15 },
        { name: "Copper Wire", icon: "🔌", unit: "m", used: 980, total: 1200, color: "#facc15", cost: 12 },
        { name: "Inverter PCB", icon: "🖥️", unit: "pcs", used: 44, total: 60, color: "#f43f5e", cost: 220 },
        { name: "Brake Pads", icon: "🛞", unit: "sets", used: 88, total: 120, color: "#f37021cc", cost: 35 },
        { name: "Seat Foam", icon: "🪑", unit: "kg", used: 290, total: 350, color: "#fb923c", cost: 9 },
    ],
    "ICE-2000": [
        { name: "Engine Block", icon: "⚙️", unit: "pcs", used: 90, total: 100, color: "#fb923c", cost: 1800 },
        { name: "Exhaust Pipe", icon: "💨", unit: "pcs", used: 88, total: 100, color: "#60a5fa", cost: 85 },
        { name: "Fuel Injector", icon: "⛽", unit: "pcs", used: 360, total: 400, color: "#facc15", cost: 45 },
        { name: "Steel Sheet", icon: "🏗️", unit: "kg", used: 1100, total: 1300, color: "#F37021", cost: 7 },
        { name: "Gasket Kit", icon: "🔧", unit: "sets", used: 90, total: 100, color: "#a78bfa", cost: 28 },
        { name: "Coolant", icon: "💧", unit: "L", used: 280, total: 320, color: "#f37021cc", cost: 4 },
    ]
};

export const useIndustrialState = () => {
    // Basic Data State
    const [lines, setLines] = useState<Line[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [rejections, setRejections] = useState<Rejection[]>([]);
    const [mailOrders, setMailOrders] = useState<MailOrder[]>([]);
    const [summaryStats, setSummaryStats] = useState<any>(null);
    const [allModels, setAllModels] = useState<string[]>([]);
    const [allDEOs, setAllDEOs] = useState<string[]>([]);
    const [allSupervisors, setAllSupervisors] = useState<string[]>([]);
    const [productionEvents, setProductionEvents] = useState<any[]>([]);
    const [velocityData, setVelocityData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI Configuration State
    const [curLine, setCurLine] = useState("all");
    const [curModel, setCurModel] = useState("all");
    const [curTime, setCurTime] = useState("day");
    const [curDate, setCurDate] = useState<string | null>(null);
    const [curStartDate, setCurStartDate] = useState<string | null>(null);
    const [curEndDate, setCurEndDate] = useState<string | null>(null);
    const [curDEO, setCurDEO] = useState("all");
    const [curSupervisor, setCurSupervisor] = useState("all");
    const [curYear, setCurYear] = useState("all");
    const [activeMaterialModel, setActiveMaterialModel] = useState("EV-S186");

    // Fetch live data from backend
    const syncWithBackend = useCallback(async () => {
        try {
            const [linesRes, demandsRes, assignmentsRes, summaryRes, modelsRes, staffRes, masterModelsRes, velocityRes] = await Promise.all([
                apiClient.admin.getLines(),
                apiClient.admin.getDemands(),
                apiClient.admin.getAssignments(),
                apiClient.admin.getSummary(),
                apiClient.admin.getModels(),
                apiClient.admin.getStaff(),
                apiClient.manager.getVehicleModels(),
                apiClient.admin.getVelocityTrend()
            ]);

            if (linesRes.success) {
                setLines(linesRes.data.map((l: any) => ({
                    id: l.name,
                    name: l.name,
                    target: 100, 
                    completed: 0,
                    model: l.model || "N/A"
                })));
            }

            if (demandsRes.success) {
                setMailOrders(demandsRes.data.map((d: any) => ({
                    id: d.formatted_id || `MO-${d.id}`,
                    company: d.company || d.manager || "Internal",
                    customer: d.customer || "N/A",
                    email: d.deo_email || "orders@cie-automotive.in",
                    model: d.model_name,
                    qty: d.quantity,
                    status: (d.status?.toLowerCase() || "pending") as any,
                    date: d.start_date || d.createdAt?.split('T')[0] || "2026-03-31",
                    msg: d.comments || "Production demand registered.",
                    produced: 0,
                    transferred: d.status === 'COMPLETED' ? d.quantity : 0
                })));
            }

            if (assignmentsRes.success) {
                setAssignments(assignmentsRes.data.map((a: any) => ({
                    id: a.id,
                    model: a.name,
                    lineId: a.line_name || "L01",
                    deo: a.assigned_deo_name || "—",
                    supervisor: a.supervisor_name || "—"
                })));
            }
            
            if (velocityRes.success && Array.isArray(velocityRes.data)) {
                setVelocityData(velocityRes.data);
            }
            
            // 4. Update KPI Summary
            if (summaryRes.success) setSummaryStats(summaryRes);

            // 5. Robust Master List Aggregation (Union of all sources)
            const registryModels = modelsRes.success ? modelsRes.data.map((m: any) => m.name) : [];
            const masterRegistry = masterModelsRes.success ? masterModelsRes.data.map((m: any) => m.name) : [];
            const demandModels = demandsRes.success ? demandsRes.data.map((d: any) => d.model_name) : [];
            const assignmentModels = assignmentsRes.success ? assignmentsRes.data.map((a: any) => a.name) : [];
            
            const uniqueModels = Array.from(new Set([...registryModels, ...masterRegistry, ...demandModels, ...assignmentModels]))
                .filter(Boolean)
                .sort();
            setAllModels(uniqueAll => uniqueModels.length > 0 ? uniqueModels as string[] : uniqueAll);

            const staffList = staffRes.success ? staffRes.data : [];
            const deoStaff = staffList.filter((s: any) => s.role === 'DEO').map((s: any) => s.name);
            const supStaff = staffList.filter((s: any) => s.role === 'Supervisor' || s.role === 'Admin').map((s: any) => s.name);
            
            const assigntDeos = assignmentsRes.success ? assignmentsRes.data.map((a: any) => a.assigned_deo_name) : [];
            const assigntSups = assignmentsRes.success ? assignmentsRes.data.map((a: any) => a.supervisor_name) : [];

            const uniqueDEOs = Array.from(new Set([...deoStaff, ...assigntDeos])).filter(Boolean).sort();
            const uniqueSups = Array.from(new Set([...supStaff, ...assigntSups])).filter(Boolean).sort();

            setAllDEOs(prev => uniqueDEOs.length > 0 ? uniqueDEOs as string[] : prev);
            setAllSupervisors(prev => uniqueSups.length > 0 ? uniqueSups as string[] : prev);

            setIsLoading(false);
        } catch (err) {
            console.error("Backend Sync Error:", err);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        syncWithBackend();
        // Potential polling every 30 seconds for "Live" feel
        const timer = setInterval(syncWithBackend, 30000);
        return () => clearInterval(timer);
    }, [syncWithBackend]);

    // Filtered data calculation
    const filteredProduction = useMemo(() => {
        let f = [...productionEvents];
        const now = new Date();
        const today = now.toISOString().slice(0, 10);

        if (curLine !== "all") f = f.filter(e => e.lineId === curLine);
        if (curModel !== "all") f = f.filter(e => e.model === curModel);
        
        if (curDEO !== "all") {
            const deoLines = assignments.filter(a => a.deo === curDEO).map(a => a.lineId);
            f = f.filter(e => deoLines.includes(e.lineId));
        }
        if (curSupervisor !== "all") {
            const supLines = assignments.filter(a => a.supervisor === curSupervisor).map(a => a.lineId);
            f = f.filter(e => supLines.includes(e.lineId));
        }
        
        if (curTime === "now" || curTime === "day") {
            f = f.filter(e => e.date === today);
        } else if (curTime === "week") {
            const ws = new Date(now);
            ws.setDate(now.getDate() - now.getDay());
            f = f.filter(e => e.date >= ws.toISOString().slice(0, 10));
        } else if (curTime === "month") {
            const ms = new Date(now.getFullYear(), now.getMonth(), 1);
            f = f.filter(e => e.date >= ms.toISOString().slice(0, 10));
        } else if (curTime === "custom" && curDate) {
            f = f.filter(e => e.date === curDate);
        }

        if (curStartDate && curEndDate) {
            f = f.filter(e => e.date >= curStartDate && e.date <= curEndDate);
        }
        if (curYear !== "all") {
            f = f.filter(e => e.date.startsWith(curYear));
        }
        return f;
    }, [productionEvents, curLine, curModel, curTime, curDate, curStartDate, curEndDate, curYear]);

    const filteredRejections = useMemo(() => {
        let f = [...rejections];
        const now = new Date();
        const today = now.toISOString().slice(0, 10);

        if (curLine !== "all") f = f.filter(r => r.lineId === curLine);
        if (curModel !== "all") f = f.filter(r => r.model === curModel);
        if (curDEO !== "all") f = f.filter(r => r.deo === curDEO);
        if (curSupervisor !== "all") f = f.filter(r => r.rejectedBy === curSupervisor);

        if (curTime === "now" || curTime === "day") {
            f = f.filter(r => r.date === today);
        } else if (curTime === "week") {
            const ws = new Date(now);
            ws.setDate(now.getDate() - now.getDay());
            f = f.filter(r => r.date >= ws.toISOString().slice(0, 10));
        } else if (curTime === "month") {
            const ms = new Date(now.getFullYear(), now.getMonth(), 1);
            f = f.filter(r => r.date >= ms.toISOString().slice(0, 10));
        } else if (curTime === "custom" && curDate) {
            f = f.filter(r => r.date === curDate);
        }

        if (curStartDate && curEndDate) {
            f = f.filter(r => r.date >= curStartDate && r.date <= curEndDate);
        }
        if (curYear !== "all") {
            f = f.filter(r => r.date.startsWith(curYear));
        }
        return f;
    }, [rejections, curLine, curModel, curTime, curDate, curStartDate, curEndDate, curYear]);

    // Data Mutations (Simulations)
    const acceptOrder = (id: string) => {
        setMailOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'accepted' } : o));
    };

    const rejectOrder = (id: string) => {
        setMailOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'rejected' } : o));
    };

    const markTransferred = (id: string) => {
        setMailOrders(prev => prev.map(o => o.id === id ? { ...o, transferred: o.qty } : o));
    };

    const recordProduction = async (lineId: string) => {
        const line = lines.find(l => l.id === lineId);
        if (!line) return;

        // Use a realistic increment or 1
        const inc = Math.floor(Math.random() * 5) + 1;
        
        try {
            const res = await apiClient.admin.recordProduction(line.name, inc);
            if (res.success) {
                // Trigger a full sync so all charts (including Velocity) update
                await syncWithBackend();
            }
        } catch (err) {
            console.error("Failed to record live production:", err);
        }
    };

    const simulateMailOrder = () => {
        const companies = [
            { name: 'SkyAuto Ltd', email: 'orders@skyauto.in', customer: 'Rohit Mehta' },
            { name: 'BoltEV Corp', email: 'buy@boltev.com', customer: 'Ananya Singh' },
            { name: 'FleetMaster', email: 'fleet@fmaster.co', customer: 'Suresh Rao' },
            { name: 'NexaDrive', email: 'nexadrive@bd.in', customer: 'Pooja Nair' },
            { name: 'VoltWheels', email: 'vw@voltwheels.io', customer: 'Kartik Joshi' },
        ];
        const msgs = [
            'Please confirm production schedule.',
            'Urgent delivery needed this month.',
            'First order — please prioritize.',
            'Can you accommodate partial delivery?',
            'Requesting quality certification along with units.',
        ];
        
        const co = companies[Math.floor(Math.random() * companies.length)];
        const model = lines[Math.floor(Math.random() * lines.length)].model;
        const qty = Math.floor(Math.random() * 25) + 5;

        const newOrder: MailOrder = {
            id: 'MO' + String(Date.now()).slice(-5),
            company: co.name,
            customer: co.customer,
            email: co.email,
            model,
            qty,
            status: 'pending',
            date: new Date().toISOString().slice(0, 10),
            msg: msgs[Math.floor(Math.random() * msgs.length)],
            produced: 0,
            transferred: 0
        };

        setMailOrders(prev => [...prev, newOrder]);
    };

    const simulateRejection = () => {
        const rl = lines[Math.floor(Math.random() * lines.length)];
        const parts = ['Battery Pack', 'Motor Controller', 'Chassis', 'Electronics', 'Cooling System', 'Exhaust', 'Wiring'];
        const reasons = ['Voltage issue', 'Weld defect', 'Crack', 'Firmware mismatch', 'Leak', 'Calibration error'];
        const asgn = assignments.find(a => a.lineId === rl.id);

        const newRej: Rejection = {
            id: Date.now(),
            lineId: rl.id,
            model: rl.model,
            part: parts[Math.floor(Math.random() * parts.length)],
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            date: new Date().toISOString().slice(0, 10),
            rejectedBy: asgn?.supervisor || 'Admin',
            deo: asgn?.deo || '—'
        };

        setRejections(prev => [...prev, newRej]);
    };

    const addLine = () => {
        setLines(prev => {
            const n = prev.length + 1;
            return [...prev, {
                id: `L${String(n).padStart(2, '0')}`,
                name: `LINE ${String(n).padStart(2, '0')}`,
                target: 100,
                completed: 0,
                model: prev[0].model
            }];
        });
    };

    const addAssignment = (data: { model: string, lineId: string, deo: string, supervisor: string }) => {
        setAssignments(prev => [...prev, { id: Date.now(), ...data }]);
    };

    // Derived Statistics for KPIs
    const stats = useMemo(() => {
        const filteredOrders = mailOrders.filter(o => (curModel === 'all' || o.model === curModel));
        
        const totalProduction = summaryStats?.production_units ? parseInt(summaryStats.production_units) : filteredProduction.reduce((s, e) => s + e.quantity, 0);
        const totalRejections = filteredRejections.length;
        const avgOEE = summaryStats?.oee ? parseFloat(summaryStats.oee.replace('%', '')) : (lines.length ? (lines.reduce((s, l) => s + (l.completed / l.target), 0) / lines.length * 100) : 0);
        
        const pendingOrdersCount = filteredOrders.filter(o => o.status === "pending").length;
        const processingOrdersCount = filteredOrders.filter(o => o.status === "accepted" || o.status === "approved").length;
        const completedOrdersCount = filteredOrders.filter(o => o.status === "completed" || o.status === "done").length;
        const readyForTransferCount = filteredOrders.filter(o => (o.status === "accepted" || o.status === "approved") && o.produced >= o.qty && o.transferred < o.qty).length;

        return {
            totalProduction,
            totalRejections,
            avgOEE,
            acceptedOrdersCount: processingOrdersCount,
            pendingOrdersCount,
            completedOrdersCount,
            readyForTransferCount,
            totalOrders: filteredOrders.length,
            activeLines: summaryStats?.stats?.active_lines || lines.filter(l => l.completed > 0).length,
            pendingReviews: summaryStats?.stats?.pending_reviews || 0
        };
    }, [filteredProduction, filteredRejections, lines, mailOrders, summaryStats, curModel]);

    return {
        // State
        lines,
        assignments,
        rejections,
        mailOrders,
        activeMaterialModel,
        materials: MATERIALS_DB[activeMaterialModel] || [],
        
        // Filters
        filters: {
            curLine, setCurLine,
            curModel, setCurModel,
            curTime, setCurTime,
            curDate, setCurDate,
            curStartDate, setCurStartDate,
            curEndDate, setCurEndDate,
            curDEO, setCurDEO,
            curSupervisor, setCurSupervisor,
            curYear, setCurYear
        },
        
        // Derived
        filteredProduction,
        filteredRejections,
        stats,
        velocityData,
        isLoading,
        allModels,
        allDEOs,
        allSupervisors,
        
        // Actions
        syncWithBackend,
        setActiveMaterialModel,
        acceptOrder,
        rejectOrder,
        markTransferred,
        recordProduction,
        simulateMailOrder,
        simulateRejection,
        addLine,
        addAssignment
    };
};
