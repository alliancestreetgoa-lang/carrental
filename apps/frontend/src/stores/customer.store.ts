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
  forgotPassword: (email: string) => Promise<{ devSecret?: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  sendMobileOtp: () => Promise<void>;
  verifyMobileOtp: (code: string) => Promise<void>;
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
  forgotPassword: async (email) => { const { data } = await portalApi.post('/auth/forgot-password', { email }); return { devSecret: data.devSecret }; },
  resetPassword: async (token, password) => { await portalApi.post('/auth/reset-password', { token, password }); },
  verifyEmail: async (token) => { await portalApi.post('/auth/verify-email', { token }); },
  resendVerification: async () => { await portalApi.post('/auth/resend-verification'); },
  sendMobileOtp: async () => { await portalApi.post('/auth/send-mobile-otp'); },
  verifyMobileOtp: async (code) => { await portalApi.post('/auth/verify-mobile-otp', { code }); await useCustomerStore.getState().fetchMe(); },
}));
