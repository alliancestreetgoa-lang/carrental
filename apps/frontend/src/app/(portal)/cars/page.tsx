'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CarCard } from '@/components/portal/CarCard';
import { CarFilters } from '@/components/portal/CarFilters';
import { Reveal } from '@/components/portal/Reveal';
import { portalApi } from '@/lib/portalApi';
import { formatDate, cn } from '@/lib/utils';
import type { PortalCar } from '@/lib/portalTypes';
import { useFetch } from '@/hooks/useFetch';
import { useRealtime, CAR_EVENTS, BOOKING_EVENTS } from '@/hooks/useRealtime';

const PAGE_SIZE = 9;

/* ── Skeleton grid shown during load ────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <Skeleton className="w-full" style={{ paddingBottom: '56.25%' }} />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Main browser component (uses useSearchParams) ───────────────────── */
function CarsBrowser() {
  const params = useSearchParams();

  const qs = useMemo(() => {
    const next = new URLSearchParams();
    const forward = ['q', 'from', 'to', 'fuelType', 'transmission', 'seats', 'sort', 'brand', 'minPrice', 'maxPrice'];
    forward.forEach((k) => {
      const v = params.get(k);
      if (v) next.set(k, v);
    });
    return next.toString();
  }, [params]);

  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  useEffect(() => {
    document.title = 'Browse cars | Alliance Car Rental';
  }, []);

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the result set changes (folded into the fetch
  // so there is no synchronous setState in an effect).
  const { data: cars, loading, refetch } = useFetch<PortalCar[]>(
    () => portalApi
      .get<{ success: boolean; data: PortalCar[] }>('/cars' + (qs ? '?' + qs : ''))
      .then((r) => {
        setPage(1);
        return r.data.success ? r.data.data : [];
      }),
    [qs],
    [],
    () => toast.error('Failed to load cars'),
  );

  useRealtime([...CAR_EVENTS, ...BOOKING_EVENTS], refetch);

  const totalPages = Math.max(1, Math.ceil(cars.length / PAGE_SIZE));
  const pagedCars = cars.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasDateRange = !!(from && to);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Browse cars</h1>
        <p className="mt-1.5 text-slate-500 text-base">
          Find the perfect car for your trip — filter by date, fuel, seats, and more.
        </p>
      </div>

      {/* Filters */}
      <CarFilters />

      {/* Availability banner */}
      {hasDateRange && (
        <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <span className="size-2 rounded-full bg-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            Showing cars available {formatDate(from)} – {formatDate(to)}
          </p>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <GridSkeleton />
      ) : cars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
          <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 9.75L14.25 14.25M14.25 9.75L9.75 14.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-slate-700 font-semibold text-lg">No cars match your filters</p>
            <p className="text-slate-400 text-sm max-w-xs">
              Try adjusting your dates, fuel type, or other filters to see more options.
            </p>
          </div>
          <Link
            href="/cars"
            className="inline-flex items-center justify-center h-9 px-5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          {/* View toggle + result count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {cars.length} car{cars.length !== 1 ? 's' : ''} found
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => setView('grid')}
                aria-label="Grid view"
                className={cn(
                  'flex items-center justify-center rounded-md p-1.5 transition-colors cursor-pointer',
                  view === 'grid'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setView('list')}
                aria-label="List view"
                className={cn(
                  'flex items-center justify-center rounded-md p-1.5 transition-colors cursor-pointer',
                  view === 'list'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>

          {/* Car grid/list */}
          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'flex flex-col gap-4'
            }
          >
            {pagedCars.map((car, i) => (
              <Reveal key={car.id} delay={(i % 3) * 70} className="h-full">
                <CarCard car={car} query={qs} />
              </Reveal>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm text-slate-600 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Page export: wraps CarsBrowser in Suspense ──────────────────────── */
export default function CarsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>
          <Skeleton className="h-28 w-full rounded-2xl" />
          <GridSkeleton />
        </div>
      }
    >
      <CarsBrowser />
    </Suspense>
  );
}
