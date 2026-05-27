'use client';
import { useState } from 'react';
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

const emptyToUndef = (v: unknown) => (v === '' || v === null ? undefined : v);
const optionalNumber = z.preprocess(emptyToUndef, z.coerce.number().nonnegative().optional());
const optionalDate = z.preprocess(emptyToUndef, z.string().optional());

const schema = z.object({
  carName: z.string().min(1, 'Required'),
  brand: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  registrationNumber: z.string().min(1, 'Required'),
  chassisNumber: z.string().min(1, 'Required'),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG', 'LPG']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  seatingCapacity: z.coerce.number().int().min(1).max(50),
  dailyRent: z.coerce.number().nonnegative(),
  weeklyRent: optionalNumber,
  monthlyRent: optionalNumber,
  securityDeposit: optionalNumber,
  insuranceExpiry: optionalDate,
  pollutionExpiry: optionalDate,
  rcExpiry: optionalDate,
});

type FormData = z.input<typeof schema>;

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';

const toIso = (v?: string) => (v ? new Date(v).toISOString() : undefined);

export function AddCarDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fuelType: 'PETROL', transmission: 'MANUAL', seatingCapacity: 5 },
  });

  const onSubmit = handleSubmit(async (raw) => {
    const data = schema.parse(raw);
    try {
      await api.post('/cars', {
        ...data,
        insuranceExpiry: toIso(data.insuranceExpiry),
        pollutionExpiry: toIso(data.pollutionExpiry),
        rcExpiry: toIso(data.rcExpiry),
      });
      toast.success('Vehicle added');
      reset({ fuelType: 'PETROL', transmission: 'MANUAL', seatingCapacity: 5 });
      setOpen(false);
      onCreated();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to add vehicle');
    }
  });

  const Err = ({ name }: { name: keyof FormData }) =>
    errors[name] ? <p className="text-xs text-destructive mt-1">{String(errors[name]?.message)}</p> : null;

  return (
    <>
      <Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1" /> Add Vehicle
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
            <DialogDescription>Register a new car in the fleet.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="carName">Car Name</Label>
              <Input id="carName" placeholder="Maruti Swift VXi" {...register('carName')} />
              <Err name="carName" />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" placeholder="Maruti Suzuki" {...register('brand')} />
              <Err name="brand" />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input id="model" placeholder="Swift" {...register('model')} />
              <Err name="model" />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" {...register('year')} />
              <Err name="year" />
            </div>
            <div>
              <Label htmlFor="registrationNumber">Registration No.</Label>
              <Input id="registrationNumber" placeholder="GA-01-AB-1234" {...register('registrationNumber')} />
              <Err name="registrationNumber" />
            </div>
            <div>
              <Label htmlFor="chassisNumber">Chassis No.</Label>
              <Input id="chassisNumber" {...register('chassisNumber')} />
              <Err name="chassisNumber" />
            </div>
            <div>
              <Label htmlFor="fuelType">Fuel Type</Label>
              <select id="fuelType" className={selectClass} {...register('fuelType')}>
                {['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG', 'LPG'].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="transmission">Transmission</Label>
              <select id="transmission" className={selectClass} {...register('transmission')}>
                {['MANUAL', 'AUTOMATIC'].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="seatingCapacity">Seating Capacity</Label>
              <Input id="seatingCapacity" type="number" {...register('seatingCapacity')} />
              <Err name="seatingCapacity" />
            </div>
            <div>
              <Label htmlFor="dailyRent">Daily Rent</Label>
              <Input id="dailyRent" type="number" {...register('dailyRent')} />
              <Err name="dailyRent" />
            </div>
            <div>
              <Label htmlFor="weeklyRent">Weekly Rent</Label>
              <Input id="weeklyRent" type="number" {...register('weeklyRent')} />
            </div>
            <div>
              <Label htmlFor="monthlyRent">Monthly Rent</Label>
              <Input id="monthlyRent" type="number" {...register('monthlyRent')} />
            </div>
            <div>
              <Label htmlFor="securityDeposit">Security Deposit</Label>
              <Input id="securityDeposit" type="number" {...register('securityDeposit')} />
            </div>
            <div>
              <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
              <Input id="insuranceExpiry" type="date" {...register('insuranceExpiry')} />
            </div>
            <div>
              <Label htmlFor="pollutionExpiry">Pollution Expiry</Label>
              <Input id="pollutionExpiry" type="date" {...register('pollutionExpiry')} />
            </div>
            <div>
              <Label htmlFor="rcExpiry">RC Expiry</Label>
              <Input id="rcExpiry" type="date" {...register('rcExpiry')} />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
