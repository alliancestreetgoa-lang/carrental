'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, Menu, X } from 'lucide-react';
import { useCustomerStore } from '@/stores/customer.store';

export function PortalNavbar() {
  const customer = useCustomerStore((s) => s.customer);
  const logout = useCustomerStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  const firstName = customer?.fullName?.split(' ')[0] ?? '';
  const initials = customer?.fullName
    ? customer.fullName
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '';

  function close() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded-lg"
          onClick={close}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
            <Car className="size-4" strokeWidth={2.5} />
          </span>
          <span className="font-semibold text-slate-900 text-sm sm:text-base leading-none">
            Alliance Car Rental
          </span>
        </Link>

        {/* Desktop nav links + auth (sm and up) */}
        <nav className="hidden sm:flex items-center gap-2 sm:gap-4">
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

        {/* Mobile hamburger button (below sm) */}
        <button
          className="sm:hidden flex items-center justify-center size-9 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="sm:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-lg">
          <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            <Link
              href="/cars"
              onClick={close}
              className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              Browse cars
            </Link>

            {customer ? (
              <>
                <Link
                  href="/account"
                  onClick={close}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold select-none">
                    {initials}
                  </div>
                  My account
                </Link>
                <button
                  onClick={() => { close(); logout(); }}
                  className="flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 text-left w-full"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/account/login"
                  onClick={close}
                  className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  Sign in
                </Link>
                <Link
                  href="/account/register"
                  onClick={close}
                  className="flex items-center px-3 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
