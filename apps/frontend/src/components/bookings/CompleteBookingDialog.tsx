'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { BookingDetail } from '@/lib/types';

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';

const nowLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function CompleteBookingDialog({
  open, onOpenChange, booking, onCompleted,
}: { open: boolean; onOpenChange: (o: boolean) => void; booking: BookingDetail; onCompleted: () => void }) {
  const [actualReturnDate, setActualReturnDate] = useState(nowLocal());
  const [endKilometer, setEndKilometer] = useState('');
  const [returnFuelLevel, setReturnFuelLevel] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.patch(`/bookings/${booking.id}/complete`, {
        actualReturnDate: actualReturnDate ? new Date(actualReturnDate).toISOString() : undefined,
        endKilometer: endKilometer === '' ? undefined : Number(endKilometer),
        returnFuelLevel: returnFuelLevel || undefined,
      });
      toast.success('Booking completed');
      onOpenChange(false);
      onCompleted();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to complete booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Booking</DialogTitle>
          <DialogDescription>Record the return details. Late fees apply automatically if returned after the scheduled date.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="actualReturnDate">Actual Return Date</Label>
            <Input id="actualReturnDate" type="datetime-local" value={actualReturnDate} onChange={(e) => setActualReturnDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="endKilometer">End Odometer{booking.startKilometer != null ? ` (start: ${booking.startKilometer.toLocaleString()} km)` : ''}</Label>
            <Input id="endKilometer" type="number" value={endKilometer} onChange={(e) => setEndKilometer(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="returnFuelLevel">Return Fuel Level</Label>
            <select id="returnFuelLevel" className={selectClass} value={returnFuelLevel} onChange={(e) => setReturnFuelLevel(e.target.value)}>
              <option value="">—</option>
              {['FULL', 'THREE_QUARTER', 'HALF', 'QUARTER', 'EMPTY'].map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button className="cursor-pointer acr-liquid" onClick={submit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Completing...</> : 'Complete Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
