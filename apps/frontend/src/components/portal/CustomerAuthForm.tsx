'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

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

interface Props {
  mode: 'login' | 'register';
}

export default function CustomerAuthForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/account';

  const { login, register } = useCustomerStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const switchHref =
    mode === 'login'
      ? `/account/register${nextUrl !== '/account' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`
      : `/account/login${nextUrl !== '/account' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError('');

    // Basic client validation
    if (!email || !password) {
      setFieldError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setFieldError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'register') {
      if (!fullName || !mobile) {
        setFieldError('Full name and mobile number are required.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await register({
          fullName,
          email,
          mobile,
          password,
          ...(licenseNumber ? { licenseNumber } : {}),
        });
        toast.success('Account created!');
      }
      router.push(nextUrl);
    } catch (err) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e.response?.status;
      toast.error(
        !e.response
          ? "Can't reach the server. Please try again."
          : status === 429
          ? 'Too many attempts. Please wait a minute and try again.'
          : status === 409
          ? 'An account with this email already exists'
          : status === 400 || status === 401
          ? 'Invalid email or password'
          : e.response.data?.message ?? 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md rounded-2xl shadow-lg border border-gray-100">
      <CardHeader className="pb-2 pt-8 px-8">
        <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight">
          {mode === 'login' ? 'Sign in' : 'Create your account'}
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          {mode === 'login'
            ? 'Welcome back. Sign in to manage your bookings.'
            : 'Get started with Alliance Car Rental today.'}
        </p>
      </CardHeader>

      <CardContent className="px-8 pb-8 pt-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Full name
              </Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
                className="rounded-lg border-gray-200 focus:border-red-600 focus:ring-red-600 h-10"
              />
            </div>
          )}

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

          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                Mobile number
              </Label>
              <Input
                id="mobile"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                disabled={submitting}
                className="rounded-lg border-gray-200 focus:border-red-600 focus:ring-red-600 h-10"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="rounded-lg border-gray-200 focus:border-red-600 focus:ring-red-600 h-10"
            />
          </div>

          {mode === 'login' && (
            <Link href="/account/forgot" className="self-end -mt-2 text-sm font-medium text-red-600 hover:text-red-700">
              Forgot password?
            </Link>
          )}

          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="licenseNumber" className="text-sm font-medium text-gray-700">
                Driving license no. (optional)
              </Label>
              <Input
                id="licenseNumber"
                type="text"
                placeholder="DL-XXXXXXXXXX"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                disabled={submitting}
                className="rounded-lg border-gray-200 focus:border-red-600 focus:ring-red-600 h-10"
              />
            </div>
          )}

          {fieldError && (
            <p className="text-sm text-red-600">{fieldError}</p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg h-10 font-medium cursor-pointer transition-colors mt-1"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : mode === 'login' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </Button>

          <p className="text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <Link
                  href={switchHref}
                  className="font-medium text-red-600 hover:text-red-700 underline-offset-2 hover:underline"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link
                  href={switchHref}
                  className="font-medium text-red-600 hover:text-red-700 underline-offset-2 hover:underline"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
