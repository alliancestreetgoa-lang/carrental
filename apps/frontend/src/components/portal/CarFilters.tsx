'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { selectClass, cn } from '@/lib/utils';

const FUEL_TYPES = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG', 'LPG'] as const;
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC'] as const;
const SEAT_OPTIONS = [2, 4, 5, 6, 7, 8] as const;
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const;

export function CarFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const q = params.get('q') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const fuelType = params.get('fuelType') ?? '';
  const transmission = params.get('transmission') ?? '';
  const seats = params.get('seats') ?? '';
  const sort = params.get('sort') ?? '';

  const push = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      router.push('/cars?' + next.toString());
    },
    [params, router]
  );

  // Debounce the free-text search so we don't re-navigate (and refetch +
  // lose input focus) on every keystroke; keep the input locally controlled.
  const [qInput, setQInput] = useState(q);
  useEffect(() => { setQInput(q); }, [q]);
  const qTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchChange = (value: string) => {
    setQInput(value);
    if (qTimer.current) clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => push({ q: value }), 400);
  };

  const hasFilters = !!(q || from || to || fuelType || transmission || seats || sort);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 sm:px-6 sm:py-5">
      {/* Row 1: text search + dates */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex flex-col gap-1 min-w-[180px] flex-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Search</label>
          <Input
            type="search"
            placeholder="Brand, model…"
            value={qInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 rounded-lg text-sm"
          />
        </div>

        {/* Pickup date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pickup date</label>
          <input
            type="date"
            value={from}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => push({ from: e.target.value })}
            className={cn(selectClass, 'w-38')}
          />
        </div>

        {/* Return date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Return date</label>
          <input
            type="date"
            value={to}
            min={from || new Date().toISOString().slice(0, 10)}
            onChange={(e) => push({ to: e.target.value })}
            className={cn(selectClass, 'w-38')}
          />
        </div>
      </div>

      {/* Row 2: selects + clear */}
      <div className="flex flex-wrap gap-3 items-end mt-3">
        {/* Fuel type */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Fuel</label>
          <select
            value={fuelType}
            onChange={(e) => push({ fuelType: e.target.value })}
            className={selectClass}
          >
            <option value="">All fuels</option>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Transmission */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Transmission</label>
          <select
            value={transmission}
            onChange={(e) => push({ transmission: e.target.value })}
            className={selectClass}
          >
            <option value="">All</option>
            {TRANSMISSIONS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Min seats */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Min seats</label>
          <select
            value={seats}
            onChange={(e) => push({ seats: e.target.value })}
            className={selectClass}
          >
            <option value="">Any</option>
            {SEAT_OPTIONS.map((s) => (
              <option key={s} value={String(s)}>
                {s}+
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sort by</label>
          <select
            value={sort}
            onChange={(e) => push({ sort: e.target.value })}
            className={selectClass}
          >
            <option value="">Default</option>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear */}
        {hasFilters && (
          <div className="flex flex-col justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/cars')}
              className="h-9 gap-1.5 text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <X className="size-3.5" />
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
