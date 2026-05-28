'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { toDateInput } from '@/lib/utils';

export function DateRangeSearch() {
  const router = useRouter();
  const today = toDateInput();
  const tomorrow = toDateInput(
    new Date(Date.now() + 86_400_000).toISOString()
  );

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(tomorrow);
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

    router.push(`/cars?from=${pickupDate.toISOString()}&to=${returnDate.toISOString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 sm:items-end w-full"
      noValidate
    >
      <div className="flex flex-col gap-1 flex-1">
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
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:border-transparent transition cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1 flex-1">
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
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:border-transparent transition cursor-pointer"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="bg-red-600 hover:bg-red-700 text-white h-10 px-6 shrink-0 cursor-pointer"
      >
        Search cars
      </Button>

      {error && (
        <p role="alert" className="text-xs text-red-600 sm:hidden mt-1">
          {error}
        </p>
      )}
    </form>
  );
}
