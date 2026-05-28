'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { ChevronRight, Calendar, Car } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { portalApi } from '@/lib/portalApi';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { PortalBookingRow } from '@/lib/portalTypes';

const STATUS_COLORS: Record<string, string> = {
  RESERVED: 'bg-blue-50 text-blue-700 border-blue-100',
  ACTIVE: 'bg-green-50 text-green-700 border-green-100',
  COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
};

function BookingRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white">
      <Skeleton className="size-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="hidden sm:flex flex-col items-end gap-1.5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: PortalBookingRow }) {
  const imgSrc = booking.car.images?.[0] ?? null;
  const paid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <Link
      href={`/account/bookings/${booking.id}`}
      className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-red-200 hover:shadow-sm transition-all cursor-pointer group"
    >
      {/* Car image */}
      <div className="size-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={`${booking.car.brand} ${booking.car.carName}`}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="size-full flex items-center justify-center">
            <Car className="size-7 text-slate-400" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">
          {booking.car.brand} {booking.car.carName}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <Calendar className="size-3 shrink-0" />
          {formatDate(booking.pickupDate)} – {formatDate(booking.returnDate)}
        </p>
        <div className="mt-1.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
              STATUS_COLORS[booking.bookingStatus] ?? 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {booking.bookingStatus}
          </span>
        </div>
      </div>

      {/* Amounts */}
      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-right">
        <p className="font-semibold text-slate-900 text-sm">{formatCurrency(booking.totalAmount)}</p>
        <p className="text-xs text-slate-400">Paid: {formatCurrency(paid)}</p>
        <ChevronRight className="size-4 text-slate-300 group-hover:text-red-500 transition-colors mt-0.5" />
      </div>
      <ChevronRight className="size-4 text-slate-300 group-hover:text-red-500 transition-colors sm:hidden shrink-0" />
    </Link>
  );
}

function Section({ title, bookings, empty }: { title: string; bookings: PortalBookingRow[]; empty: string }) {
  if (bookings.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{title}</h2>
      <div className="space-y-2.5">
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const [bookings, setBookings] = useState<PortalBookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi
      .get<{ success: boolean; data: PortalBookingRow[] }>('/bookings')
      .then((res) => {
        if (res.data.success) setBookings(res.data.data);
      })
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  const upcoming = bookings.filter((b) => {
    const active = b.bookingStatus === 'RESERVED' || b.bookingStatus === 'ACTIVE';
    return active && new Date(b.returnDate) >= now;
  });

  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <div className="space-y-10">
      {loading ? (
        <div className="space-y-10">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-2.5">
              <BookingRowSkeleton />
              <BookingRowSkeleton />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <div className="space-y-2.5">
              <BookingRowSkeleton />
            </div>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
          <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Car className="size-8 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-700 font-semibold text-lg">No bookings yet</p>
            <p className="text-slate-400 text-sm max-w-xs">
              Browse our fleet and book your next ride in minutes.
            </p>
          </div>
          <Link
            href="/cars"
            className="inline-flex items-center justify-center h-9 px-5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
          >
            Browse cars
          </Link>
        </div>
      ) : (
        <>
          <Section title="Upcoming" bookings={upcoming} empty="" />
          <Section title="Past" bookings={past} empty="" />
          {upcoming.length === 0 && past.length === 0 && (
            <p className="text-slate-400 text-sm">No bookings to display.</p>
          )}
        </>
      )}
    </div>
  );
}
