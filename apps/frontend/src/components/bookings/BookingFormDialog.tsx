'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import type { Customer, Car, Booking } from '@/lib/types';

const emptyToUndef = (v: unknown) => (v === '' || v === null ? undefined : v);
const optionalNumber = z.preprocess(emptyToUndef, z.coerce.number().nonnegative().optional());

const schema = z
  .object({
    customerId: z.string().min(1, 'Select a customer'),
    carId: z.string().min(1, 'Select a car'),
    pickupDate: z.string().min(1, 'Required'),
    returnDate: z.string().min(1, 'Required'),
    pickupLocation: z.preprocess(emptyToUndef, z.string().optional()),
    dropLocation: z.preprocess(emptyToUndef, z.string().optional()),
    fuelLevel: z.preprocess(emptyToUndef, z.string().optional()),
    startKilometer: optionalNumber,
    advancePayment: optionalNumber,
    securityDeposit: optionalNumber,
  })
  .refine((d) => !d.pickupDate || !d.returnDate || new Date(d.returnDate) > new Date(d.pickupDate), {
    message: 'Return must be after pickup',
    path: ['returnDate'],
  });

type FormData = z.input<typeof schema>;

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed dark:bg-input/30';

const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: Booking | null;
  prefill?: { carId?: string; pickupDate?: string; returnDate?: string } | null;
  onSaved: () => void;
}

export function BookingFormDialog({ open, onOpenChange, booking, prefill, onSaved }: Props) {
  const isEdit = Boolean(booking);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cars, setCars] = useState<Car[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { customerId: '', carId: '', fuelLevel: '' },
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([api.get('/customers?pageSize=100'), api.get('/cars?pageSize=100')])
      .then(([c, k]) => {
        setCustomers(c.data.data);
        // Bookable cars exclude maintenance / out-of-service
        setCars((k.data.data as Car[]).filter((car) => car.status === 'AVAILABLE' || car.status === 'BOOKED'));
      })
      .catch(() => toast.error('Failed to load customers or cars'));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (booking) {
      reset({
        customerId: booking.customerId, carId: booking.carId,
        pickupDate: toLocalInput(booking.pickupDate), returnDate: toLocalInput(booking.returnDate),
        pickupLocation: booking.pickupLocation ?? '', dropLocation: booking.dropLocation ?? '',
        fuelLevel: booking.fuelLevel ?? '', startKilometer: booking.startKilometer ?? undefined,
        advancePayment: Number(booking.advancePayment), securityDeposit: Number(booking.securityDeposit),
      });
    } else {
      reset({
        customerId: '',
        carId: prefill?.carId ?? '',
        fuelLevel: '',
        pickupDate: prefill?.pickupDate ? toLocalInput(prefill.pickupDate) : '',
        returnDate: prefill?.returnDate ? toLocalInput(prefill.returnDate) : '',
      });
    }
  }, [open, booking, prefill, reset]);

  // Re-apply the selected car/customer once the <option>s have loaded, so the
  // native selects visually reflect the value set by reset()/prefill.
  useEffect(() => {
    if (!open) return;
    const desiredCar = booking?.carId ?? prefill?.carId;
    if (desiredCar && cars.some((c) => c.id === desiredCar)) setValue('carId', desiredCar);
    if (booking?.customerId && customers.some((c) => c.id === booking.customerId)) setValue('customerId', booking.customerId);
  }, [open, cars, customers, booking, prefill, setValue]);

  const carId = watch('carId');
  const pickup = watch('pickupDate');
  const ret = watch('returnDate');
  const selectedCar = cars.find((c) => c.id === carId);
  const days = pickup && ret && new Date(ret) > new Date(pickup)
    ? Math.max(1, Math.ceil((new Date(ret).getTime() - new Date(pickup).getTime()) / 86400000))
    : 0;
  // On edit keep the locked daily rate; on create use the selected car's rate
  const dailyRate = isEdit && booking && Number(booking.totalAmount) > 0
    ? Number(booking.totalAmount) / Math.max(1, Math.ceil((new Date(booking.returnDate).getTime() - new Date(booking.pickupDate).getTime()) / 86400000))
    : selectedCar ? Number(selectedCar.dailyRent) : 0;
  const estTotal = days ? Math.round(dailyRate * days * 100) / 100 : 0;

  const onSubmit = handleSubmit(async (raw) => {
    const data = schema.parse(raw);
    const payload = {
      ...data,
      pickupDate: new Date(data.pickupDate).toISOString(),
      returnDate: new Date(data.returnDate).toISOString(),
    };
    try {
      if (booking) {
        const { customerId: _c, carId: _k, ...editable } = payload;
        await api.patch(`/bookings/${booking.id}`, editable);
      } else {
        await api.post('/bookings', { ...payload, totalAmount: estTotal || undefined });
      }
      toast.success(isEdit ? 'Booking updated' : 'Booking created');
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to save booking');
    }
  });

  const Err = ({ name }: { name: keyof FormData }) =>
    errors[name] ? <p className="text-xs text-destructive mt-1">{String(errors[name]?.message)}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Booking' : 'New Booking'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update booking schedule and details.' : 'Reserve a vehicle for a customer.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label htmlFor="customerId">Customer</Label>
            <select id="customerId" className={selectClass} disabled={isEdit} {...register('customerId')}>
              <option value="" disabled>Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.fullName} · {c.mobile}{c.blacklisted ? ' (blacklisted)' : ''}</option>)}
            </select>
            <Err name="customerId" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="carId">Vehicle</Label>
            <select id="carId" className={selectClass} disabled={isEdit} {...register('carId')}>
              <option value="" disabled>Select car</option>
              {cars.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.carName} · {c.registrationNumber} · {formatCurrency(c.dailyRent)}/day</option>)}
            </select>
            {isEdit && <p className="text-xs text-muted-foreground mt-1">Customer &amp; vehicle can&apos;t be changed — cancel and rebook to switch.</p>}
            <Err name="carId" />
          </div>
          <div>
            <Label htmlFor="pickupDate">Pickup Date</Label>
            <Input id="pickupDate" type="datetime-local" {...register('pickupDate')} />
            <Err name="pickupDate" />
          </div>
          <div>
            <Label htmlFor="returnDate">Return Date</Label>
            <Input id="returnDate" type="datetime-local" {...register('returnDate')} />
            <Err name="returnDate" />
          </div>
          <div>
            <Label htmlFor="pickupLocation">Pickup Location</Label>
            <Input id="pickupLocation" {...register('pickupLocation')} />
          </div>
          <div>
            <Label htmlFor="dropLocation">Drop Location</Label>
            <Input id="dropLocation" {...register('dropLocation')} />
          </div>
          <div>
            <Label htmlFor="fuelLevel">Fuel Level (out)</Label>
            <select id="fuelLevel" className={selectClass} {...register('fuelLevel')}>
              <option value="">—</option>
              {['FULL', 'THREE_QUARTER', 'HALF', 'QUARTER', 'EMPTY'].map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="startKilometer">Start Odometer</Label>
            <Input id="startKilometer" type="number" {...register('startKilometer')} />
          </div>
          <div>
            <Label htmlFor="advancePayment">Advance Payment</Label>
            <Input id="advancePayment" type="number" {...register('advancePayment')} />
          </div>
          <div>
            <Label htmlFor="securityDeposit">Security Deposit</Label>
            <Input id="securityDeposit" type="number" placeholder={selectedCar ? String(selectedCar.securityDeposit) : ''} {...register('securityDeposit')} />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Estimated rent {days > 0 && `(${days} day${days === 1 ? '' : 's'})`}</span>
            <span className="text-lg font-bold text-foreground">{formatCurrency(estTotal)}</span>
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : isEdit ? 'Save Changes' : 'Create Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
