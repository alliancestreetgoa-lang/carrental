'use client';

import { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { ChevronRight, Calendar, Car, CalendarCheck, IndianRupee, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { portalApi } from '@/lib/portalApi';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { PortalBookingRow } from '@/lib/portalTypes';
import VerifyBanners from '@/components/portal/VerifyBanners';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useCustomerStore } from '@/stores/customer.store';

const STATUS_COLORS: Record<string, string> = {
  RESERVED: 'bg-blue-50 text-blue-700 border-blue-100',
  ACTIVE: 'bg-green-50 text-green-700 border-green-100',
  COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
};

const APPROVAL_BADGE: Record<string, { cls: string; label: string }> = {
  PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Awaiting approval' },
  APPROVED: { cls: 'bg-green-50 text-green-700 border-green-100', label: 'Approved' },
  REJECTED: { cls: 'bg-red-50 text-red-600 border-red-100', label: 'Rejected' },
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

function SummaryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-4">
      <Skeleton className="size-10 rounded-xl shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function SummaryCard({ icon, label, value }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 text-red-600">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-bold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function BookingCard({ booking, onCancel }: { booking: PortalBookingRow; onCancel: (id: string) => void }) {
  const imgSrc = booking.car.images?.[0] ?? null;
  const paid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-red-200 hover:shadow-sm transition-all group">
      {/* Car image */}
      <Link href={`/account/bookings/${booking.id}`} className="size-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative cursor-pointer">
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
      </Link>

      {/* Details */}
      <Link href={`/account/bookings/${booking.id}`} className="flex-1 min-w-0 cursor-pointer">
        <p className="font-semibold text-slate-900 truncate">
          {booking.car.brand} {booking.car.carName}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <Calendar className="size-3 shrink-0" />
          {formatDate(booking.pickupDate)} – {formatDate(booking.returnDate)}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
              STATUS_COLORS[booking.bookingStatus] ?? 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {booking.bookingStatus}
          </span>
          {booking.approvalStatus && APPROVAL_BADGE[booking.approvalStatus] && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${APPROVAL_BADGE[booking.approvalStatus].cls}`}>
              {APPROVAL_BADGE[booking.approvalStatus].label}
            </span>
          )}
        </div>
      </Link>

      {/* Amounts + actions */}
      <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
        <p className="font-semibold text-slate-900 text-sm hidden sm:block">{formatCurrency(booking.totalAmount)}</p>
        <p className="text-xs text-slate-400 hidden sm:block">Paid: {formatCurrency(paid)}</p>
        {booking.bookingStatus === 'RESERVED' && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl text-xs cursor-pointer"
            onClick={(e) => { e.preventDefault(); onCancel(booking.id); }}
          >
            Cancel
          </Button>
        )}
        <Link href={`/account/bookings/${booking.id}`}>
          <ChevronRight className="size-4 text-slate-300 group-hover:text-red-500 transition-colors mt-0.5 cursor-pointer" />
        </Link>
      </div>
    </div>
  );
}

function Section({ title, bookings, onCancel }: { title: string; bookings: PortalBookingRow[]; onCancel: (id: string) => void }) {
  if (bookings.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{title}</h2>
      <div className="space-y-2.5">
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} onCancel={onCancel} />
        ))}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const [cancelId, setCancelId] = useState<string | null>(null);
  const { cancelBooking } = useCustomerStore();

  const { data: bookings, loading, refetch } = useFetch<PortalBookingRow[]>(
    () => portalApi
      .get<{ success: boolean; data: PortalBookingRow[] }>('/bookings')
      .then((r) => (r.data.success ? r.data.data : [])),
    [],
    [],
    () => toast.error('Failed to load bookings'),
  );

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await cancelBooking(cancelId);
      toast.success('Booking cancelled');
      refetch();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? 'Could not cancel booking');
    }
  };

  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcoming = bookings.filter((b) => {
    const active = b.bookingStatus === 'RESERVED' || b.bookingStatus === 'ACTIVE';
    return active && new Date(b.returnDate) >= now;
  });

  const past = bookings.filter((b) => !upcoming.includes(b));

  // Summary stats
  const activeCount = bookings.filter((b) => b.bookingStatus === 'ACTIVE').length;
  const pendingPayments = bookings
    .filter((b) => b.bookingStatus !== 'CANCELLED')
    .reduce((sum, b) => {
      const paid = b.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + Math.max(0, Number(b.totalAmount) - paid);
    }, 0);
  const upcomingReturns = bookings.filter(
    (b) => b.bookingStatus === 'ACTIVE' && new Date(b.returnDate) >= now && new Date(b.returnDate) <= sevenDaysOut
  ).length;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            icon={<CalendarCheck className="size-5" />}
            label="Active rentals"
            value={String(activeCount)}
          />
          <SummaryCard
            icon={<IndianRupee className="size-5" />}
            label="Pending payments"
            value={formatCurrency(pendingPayments)}
          />
          <SummaryCard
            icon={<Clock className="size-5" />}
            label="Upcoming returns"
            value={String(upcomingReturns)}
          />
        </div>
      )}

      <VerifyBanners />

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
          <Section title="Upcoming" bookings={upcoming} onCancel={setCancelId} />
          <Section title="Past" bookings={past} onCancel={setCancelId} />
          {upcoming.length === 0 && past.length === 0 && (
            <p className="text-slate-400 text-sm">No bookings to display.</p>
          )}
        </>
      )}

      <ConfirmDialog
        open={cancelId !== null}
        onOpenChange={(open) => { if (!open) setCancelId(null); }}
        title="Cancel booking?"
        description="This action cannot be undone. The booking will be permanently cancelled."
        confirmText="Cancel booking"
        onConfirm={handleCancel}
      />
    </div>
  );
}
