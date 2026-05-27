'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import type { Customer, Car } from '@/lib/types';

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
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';

export function AddBookingDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cars, setCars] = useState<Car[]>([]);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { customerId: '', carId: '', fuelLevel: '' },
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([api.get('/customers'), api.get('/cars?status=AVAILABLE&pageSize=100')])
      .then(([c, k]) => {
        setCustomers(c.data.data);
        setCars(k.data.data as Car[]);
      })
      .catch(() => toast.error('Failed to load customers or cars'));
  }, [open]);

  const carId = watch('carId');
  const pickup = watch('pickupDate');
  const ret = watch('returnDate');
  const selectedCar = cars.find((c) => c.id === carId);
  const days =
    pickup && ret && new Date(ret) > new Date(pickup)
      ? Math.max(1, Math.ceil((new Date(ret).getTime() - new Date(pickup).getTime()) / 86400000))
      : 0;
  const estTotal = selectedCar && days ? Number(selectedCar.dailyRent) * days : 0;

  const onSubmit = handleSubmit(async (raw) => {
    const data = schema.parse(raw);
    try {
      await api.post('/bookings', {
        ...data,
        pickupDate: new Date(data.pickupDate).toISOString(),
        returnDate: new Date(data.returnDate).toISOString(),
        totalAmount: estTotal || undefined,
      });
      toast.success('Booking created');
      reset({ customerId: '', carId: '', fuelLevel: '' });
      setOpen(false);
      onCreated();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create booking');
    }
  });

  const Err = ({ name }: { name: keyof FormData }) =>
    errors[name] ? <p className="text-xs text-destructive mt-1">{String(errors[name]?.message)}</p> : null;

  return (
    <>
      <Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1" /> New Booking
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
            <DialogDescription>Reserve an available vehicle for a customer.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label htmlFor="customerId">Customer</Label>
              <select id="customerId" className={selectClass} {...register('customerId')}>
                <option value="" disabled>Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.fullName} · {c.mobile}</option>)}
              </select>
              <Err name="customerId" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="carId">Vehicle (available only)</Label>
              <select id="carId" className={selectClass} {...register('carId')}>
                <option value="" disabled>Select car</option>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand} {c.carName} · {c.registrationNumber} · {formatCurrency(c.dailyRent)}/day
                  </option>
                ))}
              </select>
              {cars.length === 0 && <p className="text-xs text-muted-foreground mt-1">No available cars.</p>}
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
              <Label htmlFor="fuelLevel">Fuel Level</Label>
              <select id="fuelLevel" className={selectClass} {...register('fuelLevel')}>
                <option value="">—</option>
                {['FULL', 'THREE_QUARTER', 'HALF', 'QUARTER', 'EMPTY'].map((o) => (
                  <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
                ))}
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
              <Input
                id="securityDeposit"
                type="number"
                placeholder={selectedCar ? String(selectedCar.securityDeposit) : ''}
                {...register('securityDeposit')}
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Estimated total {days > 0 && `(${days} day${days === 1 ? '' : 's'})`}
              </span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(estTotal)}</span>
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Booking'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
