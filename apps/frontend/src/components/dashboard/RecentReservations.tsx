'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  COMPLETED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

interface Reservation {
  id: string;
  customer: { firstName: string; lastName: string };
  car: { make: string; model: string; plate: string };
  startDate: string;
  totalAmount: number;
  status: string;
}

export function RecentReservations({ reservations }: { reservations: Reservation[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Reservations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reservations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No reservations yet</p>
          )}
          {reservations.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {r.customer.firstName} {r.customer.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.car.make} {r.car.model} · {r.car.plate}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(r.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(r.startDate)}</p>
              </div>
              <Badge className={cn('text-xs px-2 py-0.5 rounded-md border-0', statusColors[r.status] ?? '')}>
                {r.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
