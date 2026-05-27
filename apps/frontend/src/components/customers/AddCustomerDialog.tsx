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

const schema = z.object({
  fullName: z.string().min(1, 'Required'),
  mobile: z.string().min(7, 'Enter a valid number'),
  whatsapp: z.preprocess(emptyToUndef, z.string().min(7).optional()),
  email: z.preprocess(emptyToUndef, z.string().email('Invalid email').optional()),
  address: z.preprocess(emptyToUndef, z.string().optional()),
  licenseNumber: z.string().min(1, 'Required'),
  licenseExpiry: z.preprocess(emptyToUndef, z.string().optional()),
  aadhaarNumber: z.preprocess(emptyToUndef, z.string().optional()),
  emergencyContact: z.preprocess(emptyToUndef, z.string().optional()),
  notes: z.preprocess(emptyToUndef, z.string().optional()),
});

type FormData = z.input<typeof schema>;

const toIso = (v?: string) => (v ? new Date(v).toISOString() : undefined);

export function AddCustomerDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (raw) => {
    const data = schema.parse(raw);
    try {
      await api.post('/customers', { ...data, licenseExpiry: toIso(data.licenseExpiry) });
      toast.success('Customer added');
      reset();
      setOpen(false);
      onCreated();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to add customer');
    }
  });

  const Err = ({ name }: { name: keyof FormData }) =>
    errors[name] ? <p className="text-xs text-destructive mt-1">{String(errors[name]?.message)}</p> : null;

  return (
    <>
      <Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1" /> Add Customer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Create a new customer profile.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" {...register('fullName')} />
              <Err name="fullName" />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" placeholder="+9198..." {...register('mobile')} />
              <Err name="mobile" />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" {...register('whatsapp')} />
              <Err name="whatsapp" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              <Err name="email" />
            </div>
            <div>
              <Label htmlFor="licenseNumber">License No.</Label>
              <Input id="licenseNumber" {...register('licenseNumber')} />
              <Err name="licenseNumber" />
            </div>
            <div>
              <Label htmlFor="licenseExpiry">License Expiry</Label>
              <Input id="licenseExpiry" type="date" {...register('licenseExpiry')} />
            </div>
            <div>
              <Label htmlFor="aadhaarNumber">Aadhaar No.</Label>
              <Input id="aadhaarNumber" {...register('aadhaarNumber')} />
            </div>
            <div>
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input id="emergencyContact" {...register('emergencyContact')} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" {...register('notes')} />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
