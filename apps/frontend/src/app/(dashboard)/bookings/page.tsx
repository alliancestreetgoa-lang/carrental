'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Booking } from '@/lib/types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings')
      .then((res) => setBookings(res.data.data))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Bookings" description="View and manage all rental bookings" />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No bookings yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer">
                    <TableCell className="font-medium text-foreground">{b.customer.fullName}</TableCell>
                    <TableCell>
                      <div className="text-sm">{b.car.brand} {b.car.carName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{b.car.registrationNumber}</div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(b.pickupDate)}</TableCell>
                    <TableCell className="text-sm">{formatDate(b.returnDate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(b.totalAmount)}</TableCell>
                    <TableCell><StatusBadge status={b.bookingStatus} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
