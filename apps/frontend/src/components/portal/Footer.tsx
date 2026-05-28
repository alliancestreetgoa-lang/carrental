import Link from 'next/link';
import { Car } from 'lucide-react';

const LINKS = {
  Company: [
    { label: 'About us', href: '/about' },
    { label: 'Browse cars', href: '/cars' },
    { label: 'Contact', href: '/contact' },
  ],
  Support: [
    { label: 'Help center', href: '/help' },
    { label: 'My bookings', href: '/account/bookings' },
    { label: 'My account', href: '/account' },
  ],
  Legal: [
    { label: 'Terms of service', href: '/terms' },
    { label: 'Privacy policy', href: '/privacy' },
    { label: 'Cancellation policy', href: '/cancellation' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 w-fit mb-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
                <Car className="size-4" strokeWidth={2.5} />
              </span>
              <span className="font-semibold text-slate-900 text-sm">Alliance Car Rental</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Premium car rentals across Goa. Verified fleet, instant booking, transparent INR pricing.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                {heading}
              </h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Alliance Car Rental. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
