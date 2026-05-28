'use client';

import { useEffect, useState } from 'react';
import { portalApi } from '@/lib/portalApi';
import { Skeleton } from '@/components/ui/skeleton';
import type { Availability } from '@/lib/portalTypes';

interface AvailabilityCalendarProps {
  carId: string;
}

interface ConflictRange {
  pickupDate: string;   // yyyy-mm-dd
  returnDate: string;   // yyyy-mm-dd
}

/* ── Date helpers (yyyy-mm-dd strings, no TZ issues) ─────────────────────── */
function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** 0 = Sun … 6 = Sat */
function firstWeekday(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * A day is "booked" if it falls within [pickupDate, returnDate).
 * We compare using yyyy-mm-dd strings to avoid TZ ambiguity.
 */
function isBooked(ymd: string, conflicts: ConflictRange[]): boolean {
  for (const c of conflicts) {
    if (ymd >= c.pickupDate && ymd < c.returnDate) return true;
  }
  return false;
}

/* ── Single month grid ───────────────────────────────────────────────────── */
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function MonthGrid({
  year,
  month,
  todayYMD,
  conflicts,
}: {
  year: number;
  month: number;
  todayYMD: string;
  conflicts: ConflictRange[];
}) {
  const totalDays = daysInMonth(year, month);
  const startOffset = firstWeekday(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div className="flex-1 min-w-0">
      {/* Month heading */}
      <p className="text-sm font-semibold text-slate-800 mb-3 text-center">
        {MONTH_NAMES[month]} {year}
      </p>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }
          const m = String(month + 1).padStart(2, '0');
          const d = String(day).padStart(2, '0');
          const ymd = `${year}-${m}-${d}`;
          const isPast = ymd < todayYMD;
          const booked = !isPast && isBooked(ymd, conflicts);
          const isToday = ymd === todayYMD;

          return (
            <div
              key={ymd}
              className={[
                'flex items-center justify-center rounded-md text-xs font-medium h-7',
                isPast
                  ? 'text-slate-300'
                  : booked
                  ? 'bg-red-100 text-red-700'
                  : isToday
                  ? 'bg-red-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export function AvailabilityCalendar({ carId }: AvailabilityCalendarProps) {
  const [conflicts, setConflicts] = useState<ConflictRange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!carId) return;

    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + 90);

    portalApi
      .get<{ success: boolean; data: Availability }>(`/cars/${carId}/availability`, {
        params: {
          from: today.toISOString(),
          to: future.toISOString(),
        },
      })
      .then((res) => {
        if (res.data.success && res.data.data?.conflicts) {
          setConflicts(res.data.data.conflicts);
        }
      })
      .catch(() => {
        // silently fail — availability is supplementary
      })
      .finally(() => setLoading(false));
  }, [carId]);

  const today = new Date();
  const todayYMD = toYMD(today);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-6">
        <MonthGrid
          year={currentYear}
          month={currentMonth}
          todayYMD={todayYMD}
          conflicts={conflicts}
        />
        <div className="hidden sm:block w-px bg-slate-100 self-stretch" />
        <MonthGrid
          year={nextYear}
          month={nextMonth}
          todayYMD={todayYMD}
          conflicts={conflicts}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-red-100 border border-red-200 inline-block" />
          <span className="text-xs text-slate-500">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-white border border-slate-200 inline-block" />
          <span className="text-xs text-slate-500">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-slate-100 border border-slate-200 inline-block" />
          <span className="text-xs text-slate-500">Past</span>
        </div>
      </div>
    </div>
  );
}
