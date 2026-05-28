'use client';

import { Suspense } from 'react';
import CustomerAuthForm from '@/components/portal/CustomerAuthForm';

export default function LoginPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 bg-gray-50">
      <Suspense fallback={null}>
        <CustomerAuthForm mode="login" />
      </Suspense>
    </main>
  );
}
