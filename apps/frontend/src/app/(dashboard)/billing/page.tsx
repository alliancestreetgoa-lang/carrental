'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { IndianRupee, TrendingUp, AlertCircle, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { RecordPaymentDialog } from '@/components/billing/RecordPaymentDialog';
import { useRealtime, BOOKING_EVENTS, PAYMENT_EVENTS } from '@/hooks/useRealtime';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { BillingPayment, BillingSummary } from '@/lib/types';

const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';
const METHOD_COLOR: Record<string, string> = {
  CASH: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPI: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  CARD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  BANK_TRANSFER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function BillingPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [method, setMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadSummary = useCallback(() => {
    api.get('/payments/summary').then((res) => setSummary(res.data.data)).catch(() => toast.error('Failed to load summary'));
  }, []);

  const loadPayments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (method) params.set('method', method);
    if (from) params.set('from', new Date(from).toISOString());
    if (to) params.set('to', new Date(`${to}T23:59:59`).toISOString());
    if (search) params.set('search', search);
    api.get(`/payments?${params.toString()}`)
      .then((res) => setPayments(res.data.data))
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  }, [method, from, to, search]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadPayments(); }, [loadPayments]);
  useRealtime([...PAYMENT_EVENTS, ...BOOKING_EVENTS], useCallback(() => { loadSummary(); loadPayments(); }, [loadSummary, loadPayments]));

  const maxMethod = Math.max(1, ...(summary?.byMethod.map((m) => m.total) ?? [1]));

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Payments, revenue and outstanding balances"
        action={<RecordPaymentDialog onRecorded={() => { loadSummary(); loadPayments(); }} />}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatsCard title="Total Revenue" value={formatCurrency(summary?.totalRevenue ?? 0)} icon={IndianRupee} />
        <StatsCard title="This Month" value={formatCurrency(summary?.monthRevenue ?? 0)} icon={TrendingUp} />
        <StatsCard title="Outstanding" value={formatCurrency(summary?.outstanding ?? 0)} icon={AlertCircle} className={summary && summary.outstanding > 0 ? 'border-red-200 dark:border-red-900/40' : ''} />
        <StatsCard title="Payments" value={summary?.paymentCount ?? 0} icon={Receipt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By method */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base font-semibold">Revenue by Method</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!summary || summary.byMethod.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
            ) : (
              summary.byMethod.map((m) => (
                <div key={m.method}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{m.method.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-foreground">{formatCurrency(m.total)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full" style={{ width: `${(m.total / maxMethod) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Ledger */}
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base font-semibold">Payments Ledger</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Input placeholder="Search customer..." className="flex-1 min-w-[140px] h-9" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
              <select className={selectClass} value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="">All methods</option>
                {['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'].map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
              <Input type="date" className="h-9 w-auto" value={from} onChange={(e) => setFrom(e.target.value)} title="From" />
              <Input type="date" className="h-9 w-auto" value={to} onChange={(e) => setTo(e.target.value)} title="To" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}</div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No payments match your filters.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="pr-6 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => router.push(`/bookings/${p.booking.id}`)}>
                      <TableCell className="pl-6 text-sm">{formatDate(p.paymentDate)}</TableCell>
                      <TableCell className="font-medium">{p.booking.customer.fullName}</TableCell>
                      <TableCell className="text-sm">
                        <div>{p.booking.car.brand} {p.booking.car.carName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{p.booking.car.registrationNumber}</div>
                      </TableCell>
                      <TableCell><Badge className={cn('border-0 text-xs', METHOD_COLOR[p.paymentMethod])}>{p.paymentMethod.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell className="pr-6 text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
