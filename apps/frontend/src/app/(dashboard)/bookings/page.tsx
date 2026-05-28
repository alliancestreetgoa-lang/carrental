'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { BookingFormDialog } from '@/components/bookings/BookingFormDialog';
import { useRealtime, BOOKING_EVENTS } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { Booking } from '@/lib/types';

const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    api.get(`/bookings?${params.toString()}`)
      .then((res) => setBookings(res.data.data))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { load(); }, [load]);
  useRealtime(BOOKING_EVENTS, load);

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="View and manage all rental bookings"
        action={<Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Booking</Button>}
      />

      <div className="flex items-center gap-3 mb-4">
        <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No bookings match your filter.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id} className={cn('cursor-pointer', b.bookingStatus === 'CANCELLED' && 'opacity-60')} onClick={() => router.push(`/bookings/${b.id}`)}>
                    <TableCell className="pl-6 font-medium text-foreground">{b.customer.fullName}</TableCell>
                    <TableCell>
                      <div className="text-sm">{b.car.brand} {b.car.carName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{b.car.registrationNumber}</div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(b.pickupDate)}</TableCell>
                    <TableCell className="text-sm">{formatDate(b.returnDate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(b.totalAmount)}</TableCell>
                    <TableCell className="pr-6"><StatusBadge status={b.bookingStatus} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BookingFormDialog open={formOpen} onOpenChange={setFormOpen} onSaved={load} />
    </div>
  );
}
