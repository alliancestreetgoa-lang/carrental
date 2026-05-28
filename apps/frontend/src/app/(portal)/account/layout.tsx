'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { useCustomerStore } from '@/stores/customer.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Bookings', href: '/account' },
  { label: 'Profile', href: '/account/profile' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { customer, hydrated, logout } = useCustomerStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !customer) {
      router.replace('/account/login?next=' + encodeURIComponent(pathname));
    }
  }, [hydrated, customer, pathname, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-red-600" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium text-red-600 uppercase tracking-widest mb-1">My Account</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {customer.fullName}
          </h1>
          {customer.email && (
            <p className="text-sm text-slate-500 mt-0.5">{customer.email}</p>
          )}
        </div>
        <Button
          variant="outline"
          className="self-start sm:self-auto flex items-center gap-2 rounded-xl border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-200 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-1 mb-8 border-b border-slate-200">
        {NAV_LINKS.map(({ label, href }) => {
          const isActive =
            href === '/account'
              ? pathname === '/account'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors cursor-pointer',
                isActive
                  ? 'text-red-600 border-b-2 border-red-600 -mb-px bg-red-50/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Page content */}
      {children}
    </div>
  );
}
