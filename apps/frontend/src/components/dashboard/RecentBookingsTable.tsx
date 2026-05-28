'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { DashboardBookingRow } from '@/lib/types';

export function RecentBookingsTable({ bookings }: { bookings: DashboardBookingRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No bookings yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id} className="cursor-pointer">
                  <TableCell className="pl-6 font-medium text-foreground">{b.customer.fullName}</TableCell>
                  <TableCell>
                    <div className="text-sm">{b.car.brand} {b.car.carName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{b.car.registrationNumber}</div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(b.pickupDate)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(b.totalAmount)}</TableCell>
                  <TableCell className="pr-6"><StatusBadge status={b.bookingStatus} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
