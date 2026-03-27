// lib/staticData.ts – Static/mock data that was previously in localDatabase.ts
// This file provides the same initial data but WITHOUT localStorage persistence.
// All real data should come from the PostgreSQL backend via API calls.

export interface OrderEmail {
    id: string;
    sender: string;
    sender_email: string;
    subject: string;
    body: string;
    received_date: string;
    is_read: boolean;
    is_starred: boolean;
    status: 'PENDING' | 'PROCESSED' | 'REJECTED';
    parsed_model?: string;
    parsed_quantity?: number;
    parsed_date?: string;
    parsed_priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const PRODUCTION_LINES = ['T4-LINE', 'Z101', 'BODY-SHOP', 'PAINT-SHOP', 'ASSEMBLY-1'];

export const INITIAL_DEMANDS = [
    {
        id: 2,
        formatted_id: 'DEM-002',
        model_id: '3',
        model_name: 'XUV',
        quantity: 1500,
        start_date: '2025-02-01',
        end_date: '2025-02-28',
        status: 'IN_PROGRESS' as const,
        line: 'Z101',
        manager: 'Rajesh Sharma',
        customer: 'Export Division',
        createdAt: new Date().toISOString()
    }
];

export const INITIAL_EMAILS: OrderEmail[] = [
    {
        id: 'MSG-TEST-001',
        sender: 'Test Caller',
        sender_email: '98165mkm@gmail.com',
        subject: 'New Car Design Request',
        body: 'Hello Admin,\n\nI want to place an order for a new car design model "LPS-Special".\nQuantity: 50 units.\n\nPlease confirm availability.',
        received_date: new Date().toISOString(),
        is_read: false,
        is_starred: true,
        status: 'PENDING',
        parsed_model: 'LPS-Special',
        parsed_quantity: 50,
        parsed_date: '2025-02-28',
        parsed_priority: 'HIGH'
    },
    {
        id: 'MSG-001',
        sender: 'Rajesh Kumar',
        sender_email: 'procurement@tatamotors.com',
        subject: 'Order for 500 XUVs - Feb Production',
        body: 'Dear Team, Please process an order for 500 units of XUV model.\nWe need delivery by end of February. Regards, Rajesh',
        received_date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        is_read: true,
        is_starred: false,
        status: 'PENDING',
        parsed_model: 'XUV',
        parsed_quantity: 500,
        parsed_date: '2025-02-28',
        parsed_priority: 'HIGH'
    }
];

export const CAR_MODELS = [
    { id: 3, name: 'XUV', model_code: 'XUV-003', type: 'SUV' },
    { id: 4, name: 'CURVV', model_code: 'CUR-001', type: 'Car' },
    { id: 5, name: 'TML-Winger', model_code: 'WIN-001', type: 'Van' }
];

export const MANAGERS = [
    { id: 1, name: 'Manoj Singh', role: 'Manager' },
    { id: 2, name: 'Rajesh Sharma', role: 'Manager' },
    { id: 3, name: 'Manager User', role: 'Manager' },
    { id: 4, name: 'Suresh Raina', role: 'Admin' },
];
