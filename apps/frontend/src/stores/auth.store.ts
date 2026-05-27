import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setHasHydrated: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ user: data.data.user, token: data.data.token });
        } finally {
          set({ isLoading: false });
        }
      },
      logout: async () => {
        await api.post('/auth/logout');
        set({ user: null, token: null });
      },
      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data });
        } catch {
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
