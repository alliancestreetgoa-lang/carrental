import { create } from 'zustand';
import { portalApi } from '@/lib/portalApi';
import type { PortalCustomer } from '@/lib/portalTypes';

interface CustomerStore {
  customer: PortalCustomer | null;
  loading: boolean;
  hydrated: boolean;
  setCustomer: (c: PortalCustomer | null) => void;
  fetchMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { fullName: string; email: string; mobile: string; password: string; licenseNumber?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>((set) => ({
  customer: null,
  loading: false,
  hydrated: false,
  setCustomer: (customer) => set({ customer }),
  fetchMe: async () => {
    try { const { data } = await portalApi.get('/auth/me'); set({ customer: data.data, hydrated: true }); }
    catch { set({ customer: null, hydrated: true }); }
  },
  login: async (email, password) => {
    const { data } = await portalApi.post('/auth/login', { email, password });
    set({ customer: data.data.customer });
  },
  register: async (payload) => {
    const { data } = await portalApi.post('/auth/register', payload);
    set({ customer: data.data.customer });
  },
  logout: async () => { await portalApi.post('/auth/logout'); set({ customer: null }); },
}));
