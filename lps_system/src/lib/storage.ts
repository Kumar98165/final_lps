const STORAGE_KEY_USER = 'lps_user';
const STORAGE_KEY_TOKEN = 'lps_token';

export interface User {
    id: number;
    username: string;
    name?: string;
    role: string;
    shop?: string;
}

export const getUser = () => {
    const userStr = sessionStorage.getItem(STORAGE_KEY_USER);
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (error) {
        console.error('Error parsing user from storage', error);
        return null;
    }
};

export const setUser = (user: any) => {
    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
};

export const getToken = () => {
    return sessionStorage.getItem(STORAGE_KEY_TOKEN);
};

export const getAccessToken = getToken;

export const setToken = (token: string) => {
    sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
};

export const clearTokens = () => {
    sessionStorage.removeItem(STORAGE_KEY_USER);
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
};
