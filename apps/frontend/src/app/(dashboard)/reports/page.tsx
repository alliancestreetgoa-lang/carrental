'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { DollarSign, TrendingDown, Wallet, CalendarCheck, Gauge, Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { ReportData } from '@/lib/types';

const STATUS_COLOR: Record<string, string> = {
  RESERVED: '#f59e0b', ACTIVE: '#3b82f6', COMPLETED: '#10b981', CANCELLED: '#ef4444',
};
const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [from, setFrom] = useState(isoDay(new Date(now.getFullYear(), now.getMonth() - 5, 1)));
  const [to, setTo] = useState(isoDay(now));

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', new Date(from).toISOString());
    if (to) params.set('to', new Date(`${to}T23:59:59`).toISOString());
    api.get(`/reports?${params.toString()}`)
      .then((res) => setReport(res.data.data))
      .catch((e) => toast.error(e?.response?.data?.message ?? 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    if (!report) return;
    const lines: string[] = [];
    lines.push('Monthly');
    lines.push('Month,Revenue,Expenses');
    report.revenueByMonth.forEach((m) => lines.push([m.month, m.revenue, m.expenses].map(csvCell).join(',')));
    lines.push('');
    lines.push('Top Vehicles');
    lines.push('Vehicle,Registration,Bookings,Revenue');
    report.topCars.forEach((c) => lines.push([c.label, c.registrationNumber, c.bookings, c.revenue].map(csvCell).join(',')));
    lines.push('');
    lines.push('Top Customers');
    lines.push('Customer,Spent');
    report.topCustomers.forEach((c) => lines.push([c.name, c.spent].map(csvCell).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const t = report?.totals;

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Revenue, utilization and performance insights"
        action={<Button variant="outline" className="cursor-pointer" onClick={exportCsv} disabled={!report}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">From</span>
        <Input type="date" className="h-9 w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-sm text-muted-foreground">To</span>
        <Input type="date" className="h-9 w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {loading || !t ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
            <StatsCard title="Revenue" value={formatCurrency(t.revenue)} icon={DollarSign} />
            <StatsCard title="Expenses" value={formatCurrency(t.expenses)} icon={TrendingDown} />
            <StatsCard title="Profit" value={formatCurrency(t.profit)} icon={Wallet} className={t.profit < 0 ? 'border-red-200 dark:border-red-900/40' : ''} />
            <StatsCard title="Bookings" value={t.bookings} icon={CalendarCheck} />
            <StatsCard title="Avg Booking" value={formatCurrency(t.avgBookingValue)} icon={DollarSign} />
            <StatsCard title="Utilization" value={`${t.utilization}%`} icon={Gauge} />
          </div>

          {/* Revenue vs expenses + status mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base font-semibold">Revenue vs Expenses</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={report.revenueByMonth} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `$${Number(v) / 1000}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">Bookings by Status</CardTitle></CardHeader>
              <CardContent>
                {report.statusMix.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-16">No bookings in range</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={report.statusMix} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                        {report.statusMix.map((s) => <Cell key={s.status} fill={STATUS_COLOR[s.status] ?? '#94a3b8'} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${Number(v)} bookings`, String(n)]} />
                      <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{String(value)}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top cars + customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">Top Vehicles</CardTitle></CardHeader>
              <CardContent className="p-0">
                {report.topCars.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Vehicle</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                        <TableHead className="pr-6 text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topCars.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="pl-6">
                            <div className="font-medium text-foreground">{c.label}</div>
                            <div className="text-xs text-muted-foreground font-mono">{c.registrationNumber}</div>
                          </TableCell>
                          <TableCell className="text-right">{c.bookings}</TableCell>
                          <TableCell className="pr-6 text-right font-medium">{formatCurrency(c.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">Top Customers</CardTitle></CardHeader>
              <CardContent className="p-0">
                {report.topCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Customer</TableHead>
                        <TableHead className="pr-6 text-right">Total Spent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topCustomers.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="pl-6 font-medium text-foreground">{c.name}</TableCell>
                          <TableCell className="pr-6 text-right font-medium">{formatCurrency(c.spent)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
