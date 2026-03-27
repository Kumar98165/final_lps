export const UserRole = {
    SUPERVISOR: 'Supervisor',
    MANAGER: 'Manager',
    ADMIN: 'Admin',
    DEO: 'DEO',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
