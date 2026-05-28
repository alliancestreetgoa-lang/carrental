'use client';

import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerStore } from '@/stores/customer.store';
import { formatDate } from '@/lib/utils';

function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center">{label}</dt>
      <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-slate-800 font-medium">{value}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { customer, hydrated } = useCustomerStore();

  if (!hydrated || !customer) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="sm:grid sm:grid-cols-3 sm:gap-4 py-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-48 sm:col-span-2 mt-1 sm:mt-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const licenseDisplay =
    customer.licenseNumber?.startsWith('PENDING-')
      ? 'Not set — contact us to update'
      : customer.licenseNumber ?? '—';

  const isPendingLicense = customer.licenseNumber?.startsWith('PENDING-');

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="rounded-2xl border border-slate-100 bg-white divide-y divide-slate-50 px-6">
        <ProfileRow label="Full name" value={customer.fullName} />
        <ProfileRow
          label="Email"
          value={customer.email ?? <span className="text-slate-400 italic text-sm">Not provided</span>}
        />
        <ProfileRow label="Mobile" value={customer.mobile} />
        <ProfileRow
          label="WhatsApp"
          value={customer.whatsapp ?? <span className="text-slate-400 italic text-sm">Not provided</span>}
        />
        <ProfileRow
          label="Address"
          value={customer.address ?? <span className="text-slate-400 italic text-sm">Not provided</span>}
        />
        <ProfileRow
          label="License number"
          value={
            <span className={isPendingLicense ? 'text-amber-600 italic' : undefined}>
              {licenseDisplay}
            </span>
          }
        />
        {customer.licenseExpiry && (
          <ProfileRow label="License expiry" value={formatDate(customer.licenseExpiry)} />
        )}
        <ProfileRow label="Member since" value={formatDate(customer.createdAt)} />
      </div>

      {/* Update notice */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
        <p className="text-sm text-slate-500">
          To update your details, please contact us and our team will assist you.
        </p>
      </div>
    </div>
  );
}
