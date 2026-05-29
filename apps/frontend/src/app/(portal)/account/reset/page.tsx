'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useCustomerStore } from '@/stores/customer.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

function ResetInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState('');

  if (!token) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 bg-gray-50">
        <Card className="w-full max-w-md rounded-2xl shadow-lg border border-gray-100">
          <CardHeader className="pb-2 pt-8 px-8">
            <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight">
              Invalid link
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-4 flex flex-col gap-4">
            <p className="text-sm text-gray-600">Invalid or missing reset link.</p>
            <Link
              href="/account/forgot"
              className="text-sm font-medium text-red-600 hover:text-red-700 underline-offset-2 hover:underline cursor-pointer"
            >
              Request a new link
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError('');

    if (!password || !confirm) {
      setFieldError('Both fields are required.');
      return;
    }
    if (password.length < 6) {
      setFieldError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setFieldError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await useCustomerStore.getState().resetPassword(token!, password);
      toast.success('Password updated — please sign in');
      router.push('/account/login');
    } catch (err) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e.response?.status;
      if (!e.response) {
        toast.error("Can't reach the server. Please try again.");
      } else if (status === 400) {
        toast.error(
          'This link is invalid or has expired — request a new one.',
          {
            description: undefined,
            action: {
              label: 'Get new link',
              onClick: () => router.push('/account/forgot'),
            },
          }
        );
      } else if (status === 429) {
        toast.error('Too many attempts, please wait a minute.');
      } else {
        toast.error(e.response.data?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md rounded-2xl shadow-lg border border-gray-100">
        <CardHeader className="pb-2 pt-8 px-8">
          <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight">
            Set a new password
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Choose a new password for your account.
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                New password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="rounded-lg border-gray-200 focus:border-red-600 focus:ring-red-600 h-10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">
                Confirm password
              </Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={submitting}
                className="rounded-lg border-gray-200 focus:border-red-600 focus:ring-red-600 h-10"
              />
            </div>

            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full acr-liquid rounded-lg h-10 font-medium cursor-pointer transition-colors mt-1"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update password'
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              <Link
                href="/account/login"
                className="font-medium text-red-600 hover:text-red-700 underline-offset-2 hover:underline cursor-pointer"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
