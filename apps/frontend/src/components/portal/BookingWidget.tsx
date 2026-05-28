'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { portalApi } from '@/lib/portalApi';
import { useCustomerStore } from '@/stores/customer.store';
import { formatCurrency, formatDate, toDateInput } from '@/lib/utils';
import type { PortalCar, Availability } from '@/lib/portalTypes';

interface BookingWidgetProps {
  car: PortalCar;
}

export function BookingWidget({ car }: BookingWidgetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customer, hydrated } = useCustomerStore();

  const [todayStr] = useState(() => toDateInput());
  const [tomorrowStr] = useState(() =>
    toDateInput(new Date(Date.now() + 86400000).toISOString())
  );

  const [from, setFrom] = useState<string>(() => {
    const p = searchParams.get('from');
    return p ? toDateInput(p) : todayStr;
  });
  const [to, setTo] = useState<string>(() => {
    const p = searchParams.get('to');
    return p ? toDateInput(p) : tomorrowStr;
  });

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validRange = !!from && !!to && new Date(to) > new Date(from);

  useEffect(() => {
    if (!validRange) {
      // Clear stale availability when the date range becomes invalid.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailability(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await portalApi.get<{ success: boolean; data: Availability }>(
          `/cars/${car.id}/availability`,
          {
            params: {
              from: new Date(from).toISOString(),
              to: new Date(to).toISOString(),
            },
          }
        );
        setAvailability(res.data.data);
      } catch {
        setAvailability(null);
      } finally {
        setChecking(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [from, to, car.id, validRange]);

  const days = validRange
    ? Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000))
    : 1;
  const total = days * Number(car.dailyRent);

  const handleBook = async () => {
    if (hydrated && !customer) {
      router.push('/account/login?next=' + encodeURIComponent('/cars/' + car.id));
      return;
    }

    setSubmitting(true);
    try {
      const res = await portalApi.post<{ success: boolean; data: { id: string } }>('/bookings', {
        carId: car.id,
        pickupDate: new Date(from).toISOString(),
        returnDate: new Date(to).toISOString(),
      });
      toast.success('Booking confirmed!');
      router.push('/account/bookings/' + res.data.data.id);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 409) {
        toast.error('That car is no longer available for those dates');
        // Re-fetch availability to reflect current conflicts
        try {
          const res = await portalApi.get<{ success: boolean; data: Availability }>(
            `/cars/${car.id}/availability`,
            {
              params: {
                from: new Date(from).toISOString(),
                to: new Date(to).toISOString(),
              },
            }
          );
          setAvailability(res.data.data);
        } catch {
          setAvailability(null);
        }
      } else {
        toast.error(axiosErr.response?.data?.message ?? 'Could not complete booking');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const bookDisabled =
    !validRange ||
    !availability?.available ||
    checking ||
    submitting;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md p-6 space-y-6 lg:sticky lg:top-24">
      {/* Header */}
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-0.5">
          Daily rate
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900">
            {formatCurrency(car.dailyRent)}
          </span>
          <span className="text-slate-500 text-sm">/day</span>
        </div>
      </div>

      {/* Date inputs */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label
            htmlFor="bw-pickup"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
          >
            Pickup date
          </label>
          <Input
            id="bw-pickup"
            type="date"
            value={from}
            min={todayStr}
            onChange={(e) => setFrom(e.target.value)}
            className="cursor-pointer"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="bw-return"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
          >
            Return date
          </label>
          <Input
            id="bw-return"
            type="date"
            value={to}
            min={from || todayStr}
            onChange={(e) => setTo(e.target.value)}
            className="cursor-pointer"
          />
        </div>
      </div>

      {/* Availability status */}
      {validRange && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
            checking
              ? 'bg-slate-50 border border-slate-200 text-slate-500'
              : availability?.available
              ? 'bg-green-50 border border-green-200 text-green-700'
              : availability && !availability.available
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-slate-50 border border-slate-200 text-slate-500'
          }`}
        >
          {checking ? (
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-slate-400 animate-pulse" />
              Checking availability...
            </span>
          ) : availability?.available ? (
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500 shrink-0" />
              Available for these dates
            </span>
          ) : availability && !availability.available ? (
            <div className="space-y-1.5">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-red-500 shrink-0" />
                Not available for these dates
              </span>
              {availability.conflicts.length > 0 && (
                <ul className="pl-4 space-y-0.5 text-xs text-red-600">
                  {availability.conflicts.map((c, i) => (
                    <li key={i}>
                      Booked {formatDate(c.pickupDate)} – {formatDate(c.returnDate)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Price summary */}
      {validRange && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>
              {formatCurrency(car.dailyRent)} &times; {days} day{days !== 1 ? 's' : ''}
            </span>
            <span className="font-medium text-slate-800">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Security deposit (refundable)</span>
            <span>{formatCurrency(car.securityDeposit)}</span>
          </div>
          <div className="border-t border-slate-200 pt-2.5 flex justify-between font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* Book now button */}
      <Button
        onClick={handleBook}
        disabled={bookDisabled}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl h-11 cursor-pointer transition-colors motion-safe:active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Booking...' : 'Book now'}
      </Button>

      {/* Sign-in nudge for guests */}
      {hydrated && !customer && (
        <p className="text-center text-xs text-slate-500">
          You&apos;ll be asked to sign in before confirming.
        </p>
      )}
    </div>
  );
}
