'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/lib/types';

export function RecentBookings({ bookings }: { bookings: DashboardStats['recentBookings'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No bookings yet</p>
          )}
          {bookings.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{b.customer.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {b.car.brand} {b.car.carName} · {b.car.registrationNumber}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(b.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(b.pickupDate)}</p>
              </div>
              <StatusBadge status={b.bookingStatus} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
