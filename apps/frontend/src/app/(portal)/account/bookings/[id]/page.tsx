'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Download, MapPin, Calendar, Clock, Car, CalendarPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/portal/StarRating';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { portalApi } from '@/lib/portalApi';
import { formatDate, formatCurrency, toDateInput } from '@/lib/utils';
import { useCustomerStore } from '@/stores/customer.store';

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
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
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

const APPROVAL_BADGE: Record<string, { cls: string; label: string }> = {
  PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Awaiting approval' },
  APPROVED: { cls: 'bg-green-50 text-green-700 border-green-100', label: 'Approved' },
  REJECTED: { cls: 'bg-red-50 text-red-600 border-red-100', label: 'Rejected' },
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
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Payment state
  const [paying, setPaying] = useState(false);

  // Cancel state
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Extend state
  const [extendDate, setExtendDate] = useState('');
  const [extending, setExtending] = useState(false);

  const { cancelBooking, extendBooking } = useCustomerStore();

  const fetchBooking = () => {
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
  };

  const submitReview = async () => {
    if (!id) return;
    setReviewSubmitting(true);
    try {
      await portalApi.post('/reviews', { bookingId: id, rating: reviewRating, comment: reviewComment || undefined });
      toast.success('Thanks for your review!');
      setReviewSubmitted(true);
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        toast.error("You've already reviewed this booking");
        setReviewSubmitted(true);
      } else if (status === 400) {
        toast.error('Reviews can only be submitted after the booking is completed.');
      } else {
        toast.error('Could not submit review. Please try again.');
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelBooking(id);
      toast.success('Booking cancelled');
      fetchBooking();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? 'Could not cancel booking');
    }
  };

  const handlePay = async (type: 'advance' | 'full') => {
    if (!id) return;
    setPaying(true);
    try {
      const res = await portalApi.post<{
        success: boolean;
        data: {
          invoice: BookingInvoice;
          mock: boolean;
        };
      }>(`/bookings/${id}/pay`, { type });
      toast.success('Payment successful' + (res.data.data.mock ? ' (demo mode)' : ''));
      fetchBooking();
    } catch (e) {
      const status = (e as { response?: { status?: number; data?: { message?: string } } }).response?.status;
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      if (status === 400) {
        toast.error(msg ?? 'Payment failed');
      } else {
        toast.error('Could not process payment. Please try again.');
      }
    } finally {
      setPaying(false);
    }
  };

  const handleExtend = async () => {
    if (!id || !extendDate) return;
    setExtending(true);
    try {
      await extendBooking(id, new Date(extendDate).toISOString());
      toast.success('Booking extended successfully');
      setExtendDate('');
      fetchBooking();
    } catch (e) {
      const status = (e as { response?: { status?: number; data?: { message?: string } } }).response?.status;
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      if (status === 409) {
        toast.error("Those extra dates aren't available");
      } else if (status === 400) {
        toast.error(msg ?? 'Invalid extension date');
      } else {
        toast.error('Could not extend booking. Please try again.');
      }
    } finally {
      setExtending(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <p className="text-slate-400 text-sm mt-1">{"This booking doesn't exist or you don't have access."}</p>
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
  const canCancel = booking.bookingStatus === 'RESERVED';
  const canExtend = booking.bookingStatus === 'RESERVED' || booking.bookingStatus === 'ACTIVE';

  // Min date for extend input: day after current returnDate
  const minExtendDate = (() => {
    const d = new Date(booking.returnDate);
    d.setDate(d.getDate() + 1);
    return toDateInput(d.toISOString());
  })();

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
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusClass}`}
            >
              {booking.bookingStatus}
            </span>
            {booking.approvalStatus && APPROVAL_BADGE[booking.approvalStatus] && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${APPROVAL_BADGE[booking.approvalStatus].cls}`}>
                {APPROVAL_BADGE[booking.approvalStatus].label}
              </span>
            )}
          </div>
        </div>
        {booking.approvalStatus === 'REJECTED' && booking.rejectionReason && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-0.5">Rejection reason</p>
            <p className="text-sm text-red-700">{booking.rejectionReason}</p>
          </div>
        )}

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

      {/* Payment card */}
      {booking.bookingStatus !== 'CANCELLED' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Payment</h3>
          {parseFloat(booking.invoice.balanceDue) > 0 ? (
            <>
              <p className="text-xs text-slate-400">
                Online payments are in demo mode — no real charge is made.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  disabled={paying}
                  onClick={() => handlePay('advance')}
                  className="rounded-xl border-slate-200 hover:border-red-200 hover:text-red-600 cursor-pointer"
                >
                  {paying ? 'Processing…' : 'Pay 25% advance'}
                </Button>
                <Button
                  disabled={paying}
                  onClick={() => handlePay('full')}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer"
                >
                  {paying ? 'Processing…' : `Pay full balance (${formatCurrency(booking.invoice.balanceDue)})`}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">&#10003;</span>
              Paid in full
            </div>
          )}
        </div>
      )}

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

      {/* Extend rental */}
      {canExtend && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarPlus className="size-5 text-red-600" />
            <h3 className="text-base font-semibold text-slate-800">Extend rental</h3>
          </div>
          <p className="text-sm text-slate-400">
            Choose a new return date (must be after {formatDate(booking.returnDate)}).
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="date"
              min={minExtendDate}
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              className="rounded-xl border-slate-200 focus:border-red-400 focus:ring-red-500/40 cursor-pointer sm:max-w-xs"
            />
            <Button
              onClick={handleExtend}
              disabled={extending || !extendDate}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer"
            >
              {extending ? 'Extending…' : 'Extend'}
            </Button>
          </div>
        </div>
      )}

      {/* Cancel booking */}
      {canCancel && (
        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Cancel this booking</p>
            <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
          </div>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl cursor-pointer self-start sm:self-auto"
            onClick={() => setShowCancelDialog(true)}
          >
            Cancel booking
          </Button>
        </div>
      )}

      {/* Leave a review — only for completed bookings */}
      {booking.bookingStatus === 'COMPLETED' && !reviewSubmitted && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Leave a review</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Share your experience with this rental.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StarRating value={reviewRating} onChange={setReviewRating} size={22} />
            <span className="text-sm text-slate-600 font-medium">
              {reviewRating} / 5
            </span>
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Tell us what you thought (optional)…"
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 resize-none transition"
          />
          <Button
            onClick={submitReview}
            disabled={reviewSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer"
          >
            {reviewSubmitting ? 'Submitting…' : 'Submit review'}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Cancel booking?"
        description="This action cannot be undone. The booking will be permanently cancelled."
        confirmText="Cancel booking"
        onConfirm={handleCancel}
      />
    </div>
  );
}
