'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { DashboardBookingRow } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  icon: LucideIcon;
  bookings: DashboardBookingRow[];
  emptyText: string;
  showOverdue?: boolean;
}

export function BookingListCard({ title, icon: Icon, bookings, emptyText, showOverdue }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {title}
          {bookings.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">{bookings.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{emptyText}</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{b.customer.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {b.car.brand} {b.car.carName} · {b.car.registrationNumber}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-xs font-medium', showOverdue && b.overdue ? 'text-red-600' : 'text-muted-foreground')}>
                    {formatDate(b.returnDate)}
                  </p>
                  {showOverdue && b.overdue && (
                    <Badge className="mt-0.5 text-[10px] px-1.5 py-0 rounded bg-red-100 text-red-700 border-0 dark:bg-red-900/30 dark:text-red-400">Overdue</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
