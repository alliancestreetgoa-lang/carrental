'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Ban, CreditCard, Wallet, CalendarDays, FileText } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { CustomerDocuments } from '@/components/customers/CustomerDocuments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { CustomerDetail } from '@/lib/types';

type Tab = 'overview' | 'history' | 'documents';

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

const Stat = ({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone?: string }) => (
  <Card>
    <CardContent className="p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-xl font-semibold tracking-tight', tone ?? 'text-foreground')}>{value}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><Icon className="w-5 h-5 text-muted-foreground" /></div>
    </CardContent>
  </Card>
);

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/customers/${id}`)
      .then((res) => setCustomer(res.data.data))
      .catch(() => toast.error('Failed to load customer'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40 rounded-md" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
  if (!customer) return <p className="text-sm text-muted-foreground">Customer not found.</p>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'history', label: `Rental History (${customer.bookings.length})` },
    { key: 'documents', label: `Documents (${customer.documents.length})` },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" className="cursor-pointer -ml-2" onClick={() => router.push('/customers')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Customers
        </Button>
        <Button variant="outline" className="cursor-pointer" onClick={() => setEditOpen(true)}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
      </div>

      {/* Header */}
      <Card className="mb-4">
        <CardContent className="p-6 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{customer.fullName}</h2>
              {customer.blacklisted
                ? <Badge className="bg-red-100 text-red-700 border-0 dark:bg-red-900/30 dark:text-red-400"><Ban className="w-3 h-3 mr-1" />Blacklisted</Badge>
                : <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{customer.mobile}{customer.email ? ` · ${customer.email}` : ''}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Stat icon={CreditCard} label="Pending Dues" value={formatCurrency(customer.pendingDues)} tone={customer.pendingDues > 0 ? 'text-red-600' : 'text-foreground'} />
        <Stat icon={Wallet} label="Total Spent" value={formatCurrency(customer.totalSpent)} />
        <Stat icon={CalendarDays} label="Total Bookings" value={String(customer.bookings.length)} />
        <Stat icon={FileText} label="Documents" value={String(customer.documents.length)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium cursor-pointer border-b-2 -mb-px transition-colors',
              tab === t.key ? 'border-red-600 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Mobile" value={customer.mobile} />
              <Field label="WhatsApp" value={customer.whatsapp ?? '—'} />
              <Field label="Email" value={customer.email ?? '—'} />
              <Field label="License No." value={customer.licenseNumber} />
              <Field label="License Expiry" value={customer.licenseExpiry ? formatDate(customer.licenseExpiry) : '—'} />
              <Field label="Aadhaar No." value={customer.aadhaarNumber ?? '—'} />
              <Field label="Emergency Contact" value={customer.emergencyContact ?? '—'} />
              <Field label="Address" value={customer.address ?? '—'} />
              <Field label="Joined" value={formatDate(customer.createdAt)} />
            </div>
            {customer.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
            {customer.blacklisted && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 p-3">
                <p className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1"><Ban className="w-3 h-3" /> Blacklisted</p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{customer.blacklistReason || 'No reason provided'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardContent className="p-0">
            {customer.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No rental history</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Vehicle</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Return</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="pl-6">
                        <div className="text-sm font-medium">{b.car.brand} {b.car.carName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{b.car.registrationNumber}</div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(b.pickupDate)}</TableCell>
                      <TableCell className="text-sm">{formatDate(b.returnDate)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(b.totalAmount)}</TableCell>
                      <TableCell className="pr-6"><StatusBadge status={b.bookingStatus} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'documents' && (
        <Card>
          <CardContent className="p-6">
            <CustomerDocuments customerId={customer.id} documents={customer.documents} onChanged={load} />
          </CardContent>
        </Card>
      )}

      <CustomerFormDialog open={editOpen} onOpenChange={setEditOpen} customer={customer} onSaved={load} />
    </div>
  );
}
