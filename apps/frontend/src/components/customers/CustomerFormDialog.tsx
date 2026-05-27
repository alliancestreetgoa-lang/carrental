'use client';
import { useEffect } from 'react';
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
import type { Customer } from '@/lib/types';

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
  blacklisted: z.boolean().optional(),
  blacklistReason: z.preprocess(emptyToUndef, z.string().optional()),
});

type FormData = z.input<typeof schema>;

const toIso = (v?: string) => (v ? new Date(v).toISOString() : undefined);
const toDateInput = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSaved: () => void;
}

export function CustomerFormDialog({ open, onOpenChange, customer, onSaved }: Props) {
  const isEdit = Boolean(customer);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { blacklisted: false },
  });

  useEffect(() => {
    if (!open) return;
    if (customer) {
      reset({
        fullName: customer.fullName, mobile: customer.mobile,
        whatsapp: customer.whatsapp ?? '', email: customer.email ?? '',
        address: customer.address ?? '', licenseNumber: customer.licenseNumber,
        licenseExpiry: toDateInput(customer.licenseExpiry), aadhaarNumber: customer.aadhaarNumber ?? '',
        emergencyContact: customer.emergencyContact ?? '', notes: customer.notes ?? '',
        blacklisted: customer.blacklisted, blacklistReason: customer.blacklistReason ?? '',
      });
    } else {
      reset({ blacklisted: false });
    }
  }, [open, customer, reset]);

  const blacklisted = watch('blacklisted');

  const onSubmit = handleSubmit(async (raw) => {
    const data = schema.parse(raw);
    const payload = { ...data, licenseExpiry: toIso(data.licenseExpiry) };
    try {
      if (customer) await api.patch(`/customers/${customer.id}`, payload);
      else await api.post('/customers', payload);
      toast.success(isEdit ? 'Customer updated' : 'Customer added');
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to save customer');
    }
  });

  const Err = ({ name }: { name: keyof FormData }) =>
    errors[name] ? <p className="text-xs text-destructive mt-1">{String(errors[name]?.message)}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update customer details.' : 'Create a new customer profile.'}</DialogDescription>
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
            <textarea id="notes" rows={2} className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/30" {...register('notes')} />
          </div>

          <div className="sm:col-span-2 rounded-lg border border-border p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="cursor-pointer accent-red-600 w-4 h-4" {...register('blacklisted')} />
              <span className="text-sm font-medium">Blacklist this customer</span>
            </label>
            {blacklisted && (
              <div className="mt-2">
                <Label htmlFor="blacklistReason">Reason</Label>
                <Input id="blacklistReason" placeholder="Reason for blacklisting" {...register('blacklistReason')} />
              </div>
            )}
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : isEdit ? 'Save Changes' : 'Save Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
