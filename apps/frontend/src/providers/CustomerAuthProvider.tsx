'use client';
import { useEffect } from 'react';
import { useCustomerStore } from '@/stores/customer.store';

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const fetchMe = useCustomerStore((s) => s.fetchMe);
  useEffect(() => { fetchMe(); }, [fetchMe]);
  return <>{children}</>;
}
