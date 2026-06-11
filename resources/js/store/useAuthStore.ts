import { create } from 'zustand';
import api from '@/lib/api';

interface User {
    id: number;
    name: string;
    email: string;
    pix_key: string | null;
    balance: string;
    balance_blocked: string;
    tax_id: string | null;
    phone: string | null;
    status: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { name: string; email: string; password: string; password_confirmation: string }) => Promise<void>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: JSON.parse(localStorage.getItem('fp_user') || 'null'),
    token: localStorage.getItem('fp_token'),
    isLoading: false,

    login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const { data } = await api.post('/login', { email, password });
            localStorage.setItem('fp_token', data.token);
            localStorage.setItem('fp_user', JSON.stringify(data.user));
            set({ user: data.user, token: data.token, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false });
            throw error;
        }
    },

    register: async (formData) => {
        set({ isLoading: true });
        try {
            const { data } = await api.post('/register', formData);
            localStorage.setItem('fp_token', data.token);
            localStorage.setItem('fp_user', JSON.stringify(data.user));
            set({ user: data.user, token: data.token, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        try {
            await api.post('/logout');
        } catch {}
        localStorage.removeItem('fp_token');
        localStorage.removeItem('fp_user');
        set({ user: null, token: null });
    },

    fetchUser: async () => {
        try {
            const { data } = await api.get('/me');
            localStorage.setItem('fp_user', JSON.stringify(data.user));
            set({ user: data.user });
        } catch {
            localStorage.removeItem('fp_token');
            localStorage.removeItem('fp_user');
            set({ user: null, token: null });
        }
    },

    setToken: (token: string) => {
        localStorage.setItem('fp_token', token);
        set({ token });
    },
}));
