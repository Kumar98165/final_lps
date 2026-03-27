import type { User } from "../../lib/storage";
import { API_BASE } from "../../lib/apiConfig";

interface LoginResponse {
    success: boolean;
    data: {
        access_token: string;
        user: User;
    };
    message: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return {
                success: true,
                data: data.data,
                message: data.message
            };
        }

        return {
            success: false,
            data: {} as any,
            message: data.message || 'Invalid username or password'
        };
    } catch (error) {
        console.error('Login error:', error);
        // No local fallback – backend must be running
        return {
            success: false,
            data: {} as any,
            message: 'Backend server is not running. Please start the backend first.'
        };
    }
}
