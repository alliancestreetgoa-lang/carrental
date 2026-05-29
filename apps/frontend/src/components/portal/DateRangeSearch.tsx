'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toDateInput, selectClass, cn } from '@/lib/utils';

const CAR_TYPE_OPTIONS = [
  { label: 'Any car type', value: '' },
  { label: 'Compact (5 seats)', value: '5' },
  { label: 'SUV / MUV (7+ seats)', value: '7' },
];

const inputClass =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:border-transparent transition';

export function DateRangeSearch() {
  const router = useRouter();
  const [today] = useState(() => toDateInput());
  const [tomorrow] = useState(() =>
    toDateInput(new Date(Date.now() + 86_400_000).toISOString())
  );

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(tomorrow);
  const [pickupLocation, setPickupLocation] = useState('');
  const [seats, setSeats] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pickupDate = new Date(from);
    const returnDate = new Date(to);

    if (returnDate <= pickupDate) {
      const msg = 'Return date must be after pickup date.';
      setError(msg);
      toast.error(msg);
      return;
    }

    const params = new URLSearchParams({
      from: pickupDate.toISOString(),
      to: returnDate.toISOString(),
    });
    if (seats) params.set('seats', seats);
    if (pickupLocation.trim()) params.set('pickupLocation', pickupLocation.trim());

    router.push(`/cars?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 sm:items-end w-full flex-wrap"
      noValidate
    >
      {/* Pickup location */}
      <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
        <label htmlFor="pickup-location" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Pickup location
        </label>
        <Input
          id="pickup-location"
          type="text"
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          placeholder="Goa — airport, city…"
          className={inputClass}
        />
      </div>

      {/* Car type */}
      <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
        <label htmlFor="car-type" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Car type
        </label>
        <select
          id="car-type"
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
          className={cn(
            selectClass,
            'h-10 border-slate-200 focus-visible:ring-red-600 w-full text-slate-900'
          )}
        >
          {CAR_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pickup date */}
      <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
        <label htmlFor="pickup-date" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Pickup date
        </label>
        <input
          id="pickup-date"
          type="date"
          value={from}
          min={today}
          onChange={(e) => {
            setFrom(e.target.value);
            setError(null);
          }}
          required
          className={cn(inputClass, 'cursor-pointer')}
        />
      </div>

      {/* Return date */}
      <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
        <label htmlFor="return-date" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Return date
        </label>
        <input
          id="return-date"
          type="date"
          value={to}
          min={from || today}
          onChange={(e) => {
            setTo(e.target.value);
            setError(null);
          }}
          required
          className={cn(inputClass, 'cursor-pointer')}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="acr-liquid h-10 px-6 shrink-0 cursor-pointer"
      >
        Search cars
      </Button>

      {error && (
        <p role="alert" className="text-xs text-red-600 sm:hidden mt-1 w-full">
          {error}
        </p>
      )}
    </form>
  );
}
