'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerStore } from '@/stores/customer.store';
import { formatDate } from '@/lib/utils';

const toDateValue = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export default function ProfilePage() {
  const { customer, hydrated, updateProfile } = useCustomerStore();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  // Prefill local form fields from the async-loaded customer. Syncing fetched
  // data into editable local state is an intended use of an effect here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!customer) return;
    setFullName(customer.fullName ?? '');
    setMobile(customer.mobile ?? '');
    setWhatsapp(customer.whatsapp ?? '');
    setAddress(customer.address ?? '');
    setLicenseNumber(customer.licenseNumber?.startsWith('PENDING-') ? '' : customer.licenseNumber ?? '');
    setLicenseExpiry(toDateValue(customer.licenseExpiry));
  }, [customer]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!hydrated || !customer) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const save = async () => {
    if (fullName.trim().length < 2) { toast.error('Please enter your full name'); return; }
    if (mobile.trim().length < 7) { toast.error('Please enter a valid mobile number'); return; }
    if (licenseNumber && licenseNumber.trim().length < 3) { toast.error('License number looks too short'); return; }
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        whatsapp: whatsapp.trim() || null,
        address: address.trim() || null,
        ...(licenseNumber.trim() ? { licenseNumber: licenseNumber.trim() } : {}),
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry).toISOString() : null,
      });
      toast.success('Profile updated');
    } catch (err) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e.response?.status;
      toast.error(
        !e.response ? "Can't reach the server. Please try again."
          : status === 409 ? 'That license number is already in use'
          : status === 400 ? (e.response.data?.message ?? 'Please check the form and try again')
          : status === 429 ? 'Too many attempts. Please wait a minute and try again.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const field = 'rounded-lg border-slate-200 focus:border-red-600 focus:ring-red-600 h-10';
  const labelCls = 'text-sm font-medium text-slate-700';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName" className={labelCls}>Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={saving} className={field} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className={labelCls}>Email</Label>
            <Input id="email" value={customer.email ?? ''} disabled readOnly className={`${field} bg-slate-50 text-slate-500`} />
            <p className="text-xs text-slate-400">Contact us to change your email.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mobile" className={labelCls}>Mobile number</Label>
            <Input id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={saving} className={field} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="whatsapp" className={labelCls}>WhatsApp <span className="text-slate-400">(optional)</span></Label>
            <Input id="whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} disabled={saving} className={field} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="address" className={labelCls}>Address <span className="text-slate-400">(optional)</span></Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={saving} className={field} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="licenseNumber" className={labelCls}>Driving license no.</Label>
            <Input id="licenseNumber" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} disabled={saving} placeholder="DL-XXXXXXXXXX" className={field} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="licenseExpiry" className={labelCls}>License expiry <span className="text-slate-400">(optional)</span></Label>
            <Input id="licenseExpiry" type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} disabled={saving} className={field} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-400">Member since {formatDate(customer.createdAt)}</p>
          <Button onClick={save} disabled={saving} className="acr-liquid rounded-lg cursor-pointer">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
