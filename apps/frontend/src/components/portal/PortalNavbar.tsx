'use client';

import Link from 'next/link';
import { Car } from 'lucide-react';
import { useCustomerStore } from '@/stores/customer.store';

export function PortalNavbar() {
  const customer = useCustomerStore((s) => s.customer);

  const firstName = customer?.fullName?.split(' ')[0] ?? '';
  const initials = customer?.fullName
    ? customer.fullName
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded-lg"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
            <Car className="size-4" strokeWidth={2.5} />
          </span>
          <span className="font-semibold text-slate-900 text-sm sm:text-base leading-none">
            Alliance Car Rental
          </span>
        </Link>

        {/* Nav links + auth */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/cars"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            Browse cars
          </Link>

          {customer ? (
            <Link
              href="/account"
              className="flex items-center gap-2 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded-lg p-1"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold select-none group-hover:bg-red-200 transition-colors">
                {initials}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                {firstName}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
                  <Link
                href="/account/login"
                className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-[min(var(--radius-md),12px)] hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                Sign in
              </Link>
              <Link
                href="/account/register"
                className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-[min(var(--radius-md),12px)] bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
