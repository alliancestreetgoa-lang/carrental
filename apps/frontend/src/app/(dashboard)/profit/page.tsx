'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { IndianRupee, TrendingDown, Wallet, CarFront, Download, FileText, ArrowUp, ArrowDown } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency, formatAxisCurrency } from '@/lib/utils';
import type { ProfitPerCar } from '@/lib/types';

const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export default function ProfitPage() {
  const [data, setData] = useState<ProfitPerCar | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [from, setFrom] = useState(isoDay(new Date(now.getFullYear(), now.getMonth() - 5, 1)));
  const [to, setTo] = useState(isoDay(now));

  const params = useCallback(() => {
    const p = new URLSearchParams();
    if (from) p.set('from', new Date(from).toISOString());
    if (to) p.set('to', new Date(`${to}T23:59:59`).toISOString());
    return p;
  }, [from, to]);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/reports/profit-per-car?${params().toString()}`)
      .then((res) => setData(res.data.data))
      .catch((e) => toast.error(e?.response?.data?.message ?? 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    if (!data) return;
    const header = 'Vehicle,Registration,Bookings,Utilization %,Revenue,Expenses,Profit,Idle';
    const lines = data.cars.map((c) => [c.label, c.registrationNumber, c.bookings, c.utilization, c.revenue, c.expenses, c.profit, c.idle ? 'Yes' : 'No'].map(csvCell).join(','));
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `profit-per-car-${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported CSV');
  };

  const exportPdf = async () => {
    try {
      const res = await api.get(`/reports/profit-per-car/pdf?${params().toString()}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url; a.download = `profit-per-car-${from}_${to}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download PDF'); }
  };

  const earning = data?.cars.filter((c) => c.profit > 0) ?? [];
  const losing = data ? [...data.cars].filter((c) => c.profit < 0).sort((a, b) => a.profit - b.profit) : [];
  const idle = data?.cars.filter((c) => c.idle) ?? [];
  const profitData = data?.cars.map((c) => ({ name: c.label.split(' ').slice(-1)[0] || c.label, reg: c.registrationNumber, profit: c.profit })) ?? [];

  return (
    <div>
      <PageHeader
        title="Profit Per Car"
        description="Rental income minus expenses, per vehicle"
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="cursor-pointer" onClick={exportCsv} disabled={!data}><Download className="w-4 h-4 mr-1" /> CSV</Button>
            <Button variant="outline" className="cursor-pointer" onClick={exportPdf} disabled={!data}><FileText className="w-4 h-4 mr-1" /> PDF</Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">From</span>
        <Input type="date" className="h-9 w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-sm text-muted-foreground">To</span>
        <Input type="date" className="h-9 w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {loading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatsCard title="Total Revenue" value={formatCurrency(data.totals.revenue)} icon={IndianRupee} />
            <StatsCard title="Total Expenses" value={formatCurrency(data.totals.expenses)} icon={TrendingDown} />
            <StatsCard title="Net Profit" value={formatCurrency(data.totals.profit)} icon={Wallet} className={data.totals.profit < 0 ? 'border-red-200 dark:border-red-900/40' : 'border-emerald-200 dark:border-emerald-900/40'} />
            <StatsCard title="Idle Cars" value={idle.length} description={`of ${data.cars.length} vehicles`} icon={CarFront} />
          </div>

          {/* Profit per car chart */}
          <Card className="mb-4">
            <CardHeader><CardTitle>Profit per Vehicle</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={profitData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="reg" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={formatAxisCurrency} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} cursor={{ fill: 'rgba(100,116,139,0.1)' }} />
                  <Bar dataKey="profit" name="Profit" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {profitData.map((d) => <Cell key={d.reg} fill={d.profit >= 0 ? '#10b981' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue vs expenses per car */}
          <Card className="mb-4">
            <CardHeader><CardTitle>Revenue vs Expenses per Vehicle</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.cars} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="registrationNumber" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={formatAxisCurrency} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top / Lowest / Idle */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ArrowUp className="w-4 h-4 text-emerald-600" /> Top Earning</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {earning.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No profitable cars in range</p> :
                  earning.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate">{c.label}</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(c.profit)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ArrowDown className="w-4 h-4 text-red-600" /> Lowest Earning</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {losing.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No loss-making cars</p> :
                  losing.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate">{c.label}</span>
                      <span className="font-medium text-red-600">{formatCurrency(c.profit)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CarFront className="w-4 h-4 text-amber-600" /> Idle Cars</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {idle.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">All cars rented in range</p> :
                  idle.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate">{c.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">{c.registrationNumber}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Full table */}
          <Card>
            <CardHeader><CardTitle>All Vehicles</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Vehicle</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="pr-6 text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cars.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-6">
                        <div className="font-medium text-foreground flex items-center gap-2">{c.label}{c.idle && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] dark:bg-amber-900/30 dark:text-amber-400">Idle</Badge>}</div>
                        <div className="text-xs text-muted-foreground font-mono">{c.registrationNumber}</div>
                      </TableCell>
                      <TableCell className="text-right">{c.bookings}</TableCell>
                      <TableCell className="text-right">{c.utilization}%</TableCell>
                      <TableCell className="text-right text-emerald-600">{formatCurrency(c.revenue)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(c.expenses)}</TableCell>
                      <TableCell className={cn('pr-6 text-right font-semibold', c.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(c.profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
