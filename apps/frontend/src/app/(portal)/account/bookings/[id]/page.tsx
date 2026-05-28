'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Download, MapPin, Calendar, Clock, Car } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { portalApi } from '@/lib/portalApi';
import { formatDate, formatCurrency } from '@/lib/utils';

interface BookingInvoice {
  rentTotal: string;
  lateFee: string;
  grandTotal: string;
  securityDeposit: string;
  advancePayment: string;
  paymentsReceived: string;
  balanceDue: string;
}

interface BookingDetail {
  id: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  dropLocation: string;
  bookingStatus: string;
  totalDays: number;
  car: { carName: string; brand: string; registrationNumber: string };
  customer: { fullName: string; mobile: string };
  payments: { amount: string }[];
  agreement: unknown | null;
  invoice: BookingInvoice;
}

const STATUS_COLORS: Record<string, string> = {
  RESERVED: 'bg-blue-50 text-blue-700 border-blue-100',
  ACTIVE: 'bg-green-50 text-green-700 border-green-100',
  COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-widest w-36 shrink-0">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value}</span>
    </div>
  );
}

function InvoiceRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${highlight ? 'border-t border-slate-200 mt-1' : ''}`}>
      <span className={`text-sm ${highlight ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm tabular-nums ${highlight ? 'font-bold text-red-600' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    portalApi
      .get<{ success: boolean; data: BookingDetail }>(`/bookings/${id}`)
      .then((res) => {
        if (res.data.success) setBooking(res.data.data);
        else setNotFound(true);
      })
      .catch((e) => {
        if (e?.response?.status === 404) setNotFound(true);
        else toast.error('Failed to load booking');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const download = async (kind: 'invoice' | 'agreement') => {
    try {
      const res = await portalApi.get(`/bookings/${id}/${kind}.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${kind}-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      toast.error(status === 404 ? `No ${kind} available yet` : `Couldn't download ${kind}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full max-w-sm" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
        <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Car className="size-7 text-slate-400" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-lg">Booking not found</p>
          <p className="text-slate-400 text-sm mt-1">This booking doesn't exist or you don't have access.</p>
        </div>
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Back to bookings
        </Link>
      </div>
    );
  }

  const statusClass = STATUS_COLORS[booking.bookingStatus] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="size-4" />
        Back to bookings
      </Link>

      {/* Rental details card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Booking</p>
            <h2 className="text-xl font-bold text-slate-900">
              {booking.car.brand} {booking.car.carName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{booking.car.registrationNumber}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusClass}`}
          >
            {booking.bookingStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-3">
            <DetailRow
              label="Pickup date"
              value={
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-slate-400" />
                  {formatDate(booking.pickupDate)}
                </span>
              }
            />
            <DetailRow
              label="Return date"
              value={
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-slate-400" />
                  {formatDate(booking.returnDate)}
                </span>
              }
            />
            <DetailRow
              label="Total days"
              value={
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-slate-400" />
                  {booking.totalDays} {booking.totalDays === 1 ? 'day' : 'days'}
                </span>
              }
            />
          </div>
          <div className="space-y-3">
            <DetailRow
              label="Pickup location"
              value={
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-slate-400" />
                  {booking.pickupLocation}
                </span>
              }
            />
            <DetailRow
              label="Drop location"
              value={
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-slate-400" />
                  {booking.dropLocation}
                </span>
              }
            />
          </div>
        </div>
      </div>

      {/* Invoice card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest mb-4">Invoice summary</h3>
        <div className="divide-y divide-slate-50">
          <InvoiceRow label="Rent total" value={formatCurrency(booking.invoice.rentTotal)} />
          <InvoiceRow label="Late fee" value={formatCurrency(booking.invoice.lateFee)} />
          <InvoiceRow label="Security deposit" value={formatCurrency(booking.invoice.securityDeposit)} />
          <InvoiceRow label="Advance payment" value={formatCurrency(booking.invoice.advancePayment)} />
          <InvoiceRow label="Payments received" value={formatCurrency(booking.invoice.paymentsReceived)} />
          <InvoiceRow label="Grand total" value={formatCurrency(booking.invoice.grandTotal)} highlight />
          <InvoiceRow label="Balance due" value={formatCurrency(booking.invoice.balanceDue)} />
        </div>
      </div>

      {/* Download buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-xl border-slate-200 hover:border-red-200 hover:text-red-600 cursor-pointer"
          onClick={() => download('invoice')}
        >
          <Download className="size-4" />
          Download invoice
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-xl border-slate-200 hover:border-red-200 hover:text-red-600 cursor-pointer"
          onClick={() => download('agreement')}
        >
          <Download className="size-4" />
          Download agreement
        </Button>
      </div>
    </div>
  );
}
