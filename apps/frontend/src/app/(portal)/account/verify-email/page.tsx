'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle } from 'lucide-react';

import { useCustomerStore } from '@/stores/customer.store';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

type Status = 'verifying' | 'ok' | 'error';

function VerifyInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error');
  const called = useRef(false);

  useEffect(() => {
    if (called.current || !token) return;
    called.current = true;

    useCustomerStore
      .getState()
      .verifyEmail(token)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md rounded-2xl shadow-lg border border-gray-100">
        <CardHeader className="pb-2 pt-8 px-8">
          <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight">
            {status === 'verifying' && 'Verifying your email'}
            {status === 'ok' && 'Email verified'}
            {status === 'error' && 'Verification failed'}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-8 pb-8 pt-4 flex flex-col gap-4">
          {status === 'verifying' && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin text-red-600 shrink-0" />
              Verifying your email...
            </div>
          )}

          {status === 'ok' && (
            <>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                Your email has been successfully verified.
              </div>
              <Link
                href="/account"
                className="text-sm font-medium text-red-600 hover:text-red-700 underline-offset-2 hover:underline cursor-pointer"
              >
                Go to my account
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="text-sm text-gray-600">
                This link is invalid or has expired.
              </p>
              <Link
                href="/account"
                className="text-sm font-medium text-red-600 hover:text-red-700 underline-offset-2 hover:underline cursor-pointer"
              >
                Back to account
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
