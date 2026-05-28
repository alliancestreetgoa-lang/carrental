'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import type { Booking } from '@/lib/types';

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';

export function RecordPaymentDialog({ onRecorded }: { onRecorded: () => void }) {
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingId, setBookingId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get('/bookings')
      .then((res) => setBookings((res.data.data as Booking[]).filter((b) => b.bookingStatus !== 'CANCELLED')))
      .catch(() => toast.error('Failed to load bookings'));
  }, [open]);

  const reset = () => { setBookingId(''); setAmount(''); setPaymentMethod('CASH'); setNotes(''); };

  const submit = async () => {
    if (!bookingId) { toast.error('Select a booking'); return; }
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await api.post('/payments', { bookingId, amount: Number(amount), paymentMethod, notes: notes || undefined });
      toast.success('Payment recorded');
      reset();
      setOpen(false);
      onRecorded();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1" /> Record Payment
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Log a payment received against a booking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="booking">Booking</Label>
              <select id="booking" className={selectClass} value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
                <option value="" disabled>Select booking</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.customer.fullName} · {b.car.brand} {b.car.carName} · {formatCurrency(b.totalAmount)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="method">Method</Label>
              <select id="method" className={selectClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'].map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={submit} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
