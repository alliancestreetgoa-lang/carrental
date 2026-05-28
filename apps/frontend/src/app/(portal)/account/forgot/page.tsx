'use client';

import { useState } from 'react';
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devSecret, setDevSecret] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await useCustomerStore.getState().forgotPassword(email);
      if (process.env.NODE_ENV !== 'production' && result?.devSecret) {
        setDevSecret(result.devSecret);
      }
      setSubmitted(true);
    } catch (err) {
      const e = err as { response?: { status?: number } };
      const status = e.response?.status;
      toast.error(
        !e.response
          ? "Can't reach the server. Please try again."
          : status === 429
          ? 'Too many attempts, please wait a minute.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md rounded-2xl shadow-lg border border-gray-100">
        <CardHeader className="pb-2 pt-8 px-8">
          <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight">
            Forgot password
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8 pt-4">
          {submitted ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-700">
                If an account exists for that email, we&apos;ve sent a reset link.
              </p>
              {process.env.NODE_ENV !== 'production' && devSecret && (
                <p className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-2">
                  Dev:{' '}
                  <Link
                    href={`/account/reset?token=${devSecret}`}
                    className="font-medium text-red-600 hover:text-red-700 underline-offset-2 hover:underline cursor-pointer"
                  >
                    open reset link
                  </Link>
                </p>
              )}
              <Link
                href="/account/login"
                className="text-sm font-medium text-red-600 hover:text-red-700 underline-offset-2 hover:underline cursor-pointer"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="rounded-lg border-gray-200 focus:border-red-600 focus:ring-red-600 h-10"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg h-10 font-medium cursor-pointer transition-colors mt-1"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send reset link'
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
          )}
        </CardContent>
      </Card>
    </main>
  );
}
