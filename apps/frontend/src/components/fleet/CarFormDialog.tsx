'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Upload, ImageIcon, X, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { Car } from '@/lib/types';

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
  status: z.enum(['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'OUT_OF_SERVICE']),
  seatingCapacity: z.coerce.number().int().min(1).max(50),
  currentKilometer: optionalNumber,
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
const toDateInput = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car?: Car | null;
  onSaved: () => void;
}

export function CarFormDialog({ open, onOpenChange, car, onSaved }: Props) {
  const isEdit = Boolean(car);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fuelType: 'PETROL', transmission: 'MANUAL', status: 'AVAILABLE', seatingCapacity: 5 },
  });

  useEffect(() => {
    if (!open) return;
    if (car) {
      reset({
        carName: car.carName, brand: car.brand, model: car.model, year: car.year,
        registrationNumber: car.registrationNumber, chassisNumber: car.chassisNumber,
        fuelType: car.fuelType, transmission: car.transmission, status: car.status,
        seatingCapacity: car.seatingCapacity, currentKilometer: car.currentKilometer,
        dailyRent: Number(car.dailyRent),
        weeklyRent: car.weeklyRent ? Number(car.weeklyRent) : undefined,
        monthlyRent: car.monthlyRent ? Number(car.monthlyRent) : undefined,
        securityDeposit: Number(car.securityDeposit),
        insuranceExpiry: toDateInput(car.insuranceExpiry),
        pollutionExpiry: toDateInput(car.pollutionExpiry),
        rcExpiry: toDateInput(car.rcExpiry),
      });
      setImages(car.images ?? []);
    } else {
      reset({ fuelType: 'PETROL', transmission: 'MANUAL', status: 'AVAILABLE', seatingCapacity: 5 });
      setImages([]);
    }
    setUrlInput('');
  }, [open, car, reset]);

  const addImage = (url: string) => {
    const u = url.trim();
    if (!u) return;
    setImages((prev) => (prev.includes(u) ? prev : [...prev, u]));
  };
  const removeImage = (url: string) => setImages((prev) => prev.filter((i) => i !== url));

  const handleFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/uploads/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      addImage(data.data.url);
      toast.success('Image uploaded');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Upload failed — you can paste an image URL instead');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = handleSubmit(async (raw) => {
    const data = schema.parse(raw);
    const payload = {
      ...data,
      images,
      insuranceExpiry: toIso(data.insuranceExpiry),
      pollutionExpiry: toIso(data.pollutionExpiry),
      rcExpiry: toIso(data.rcExpiry),
    };
    try {
      if (car) await api.patch(`/cars/${car.id}`, payload);
      else await api.post('/cars', payload);
      toast.success(isEdit ? 'Vehicle updated' : 'Vehicle added');
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to save vehicle');
    }
  });

  const renderErr = (name: keyof FormData) =>
    errors[name] ? <p className="text-xs text-destructive mt-1">{String(errors[name]?.message)}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update vehicle details.' : 'Register a new car in the fleet.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Image gallery */}
          <div className="sm:col-span-2">
            <Label>Images</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {images.map((url, i) => (
                <div key={url} className="relative w-20 h-16 rounded-lg overflow-hidden border border-border group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Car ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center">Cover</span>}
                  <button type="button" onClick={() => removeImage(url)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {images.length === 0 && (
                <div className="w-20 h-16 rounded-lg bg-muted flex items-center justify-center border border-border">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Input placeholder="Paste image URL" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(urlInput); setUrlInput(''); } }} />
              <Button type="button" variant="outline" className="cursor-pointer flex-shrink-0" onClick={() => { addImage(urlInput); setUrlInput(''); }}><Plus className="w-4 h-4" /></Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Button type="button" variant="outline" className="cursor-pointer flex-shrink-0" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="carName">Car Name</Label>
            <Input id="carName" placeholder="Swift VXi" {...register('carName')} />
            {renderErr('carName')}
          </div>
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" placeholder="Maruti Suzuki" {...register('brand')} />
            {renderErr('brand')}
          </div>
          <div>
            <Label htmlFor="model">Model</Label>
            <Input id="model" placeholder="Swift" {...register('model')} />
            {renderErr('model')}
          </div>
          <div>
            <Label htmlFor="year">Year</Label>
            <Input id="year" type="number" {...register('year')} />
            {renderErr('year')}
          </div>
          <div>
            <Label htmlFor="registrationNumber">Registration No.</Label>
            <Input id="registrationNumber" placeholder="GA-01-AB-1234" {...register('registrationNumber')} />
            {renderErr('registrationNumber')}
          </div>
          <div>
            <Label htmlFor="chassisNumber">Chassis No.</Label>
            <Input id="chassisNumber" {...register('chassisNumber')} />
            {renderErr('chassisNumber')}
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
            <Label htmlFor="status">Status</Label>
            <select id="status" className={selectClass} {...register('status')}>
              {['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'OUT_OF_SERVICE'].map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="seatingCapacity">Seating Capacity</Label>
            <Input id="seatingCapacity" type="number" {...register('seatingCapacity')} />
            {renderErr('seatingCapacity')}
          </div>
          <div>
            <Label htmlFor="currentKilometer">Current KM</Label>
            <Input id="currentKilometer" type="number" {...register('currentKilometer')} />
          </div>
          <div>
            <Label htmlFor="dailyRent">Daily Rent</Label>
            <Input id="dailyRent" type="number" {...register('dailyRent')} />
            {renderErr('dailyRent')}
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
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : isEdit ? 'Save Changes' : 'Save Vehicle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
