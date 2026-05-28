'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useFetch } from '@/hooks/useFetch';
import { Plus, Pencil, Trash2, Wallet, TrendingDown, Receipt, Tag } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, formatAxisCurrency, selectClass } from '@/lib/utils';
import type { Expense, ExpenseSummary } from '@/lib/types';

const CATEGORIES = ['FUEL', 'SERVICE', 'REPAIR', 'INSURANCE', 'CLEANING', 'EMI', 'OTHER'];
const CAT_COLOR: Record<string, string> = {
  FUEL: '#3b82f6', SERVICE: '#f59e0b', REPAIR: '#ef4444', INSURANCE: '#8b5cf6',
  CLEANING: '#06b6d4', EMI: '#10b981', OTHER: '#94a3b8',
};

export default function ExpensesPage() {
  const [category, setCategory] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const { data: summary, refetch: refetchSummary } = useFetch<ExpenseSummary | null>(
    () => api.get('/expenses/summary').then((r) => r.data.data),
    [],
    null,
    () => toast.error('Failed to load summary'),
  );
  const { data: expenses, loading, refetch: refetchExpenses } = useFetch<Expense[]>(
    () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      return api.get(`/expenses?${params.toString()}`).then((r) => r.data.data);
    },
    [category],
    [],
    () => toast.error('Failed to load expenses'),
  );

  const reload = () => { refetchSummary(); refetchExpenses(); };

  const remove = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/expenses/${deleteTarget.id}`); toast.success('Expense deleted'); reload(); }
    catch { toast.error('Failed to delete expense'); }
  };

  const topCategory = summary?.byCategory[0];

  return (
    <div>
      <PageHeader
        title="Expense Management"
        description="Track and analyse fleet running costs"
        action={<Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add Expense</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatsCard title="Total Expenses" value={formatCurrency(summary?.total ?? 0)} icon={Wallet} />
        <StatsCard title="This Month" value={formatCurrency(summary?.monthTotal ?? 0)} icon={TrendingDown} />
        <StatsCard title="Records" value={summary?.count ?? 0} icon={Receipt} />
        <StatsCard title="Top Category" value={topCategory ? topCategory.category : '—'} description={topCategory ? formatCurrency(topCategory.total) : ''} icon={Tag} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Monthly Expenses</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={summary?.byMonth ?? []} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={formatAxisCurrency} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} cursor={{ fill: 'rgba(100,116,139,0.1)' }} />
                <Bar dataKey="total" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
          <CardContent>
            {!summary || summary.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">No expenses yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={summary.byCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {summary.byCategory.map((c) => <Cell key={c.category} fill={CAT_COLOR[c.category] ?? '#94a3b8'} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [formatCurrency(Number(v)), String(n)]} />
                  <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{String(value)}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By car */}
        <Card>
          <CardHeader><CardTitle>Top Spend by Vehicle</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!summary || summary.byCar.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data</p>
            ) : (
              summary.byCar.map((c) => {
                const max = Math.max(1, ...summary.byCar.map((x) => x.total));
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground truncate">{c.label}</span>
                      <span className="font-medium text-foreground">{formatCurrency(c.total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-red-600 rounded-full" style={{ width: `${(c.total / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Ledger */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Expenses</CardTitle>
            <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}</div>
            ) : expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No expenses match your filter.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="pl-6 text-sm">{formatDate(e.expenseDate)}</TableCell>
                      <TableCell className="text-sm">
                        <div>{e.car.brand} {e.car.carName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{e.car.registrationNumber}</div>
                      </TableCell>
                      <TableCell><Badge className="border-0 text-xs text-white" style={{ backgroundColor: CAT_COLOR[e.category] ?? '#94a3b8' }}>{e.category}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{e.notes ?? '—'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(e.amount)}</TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => { setEditing(e); setFormOpen(true); }} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(e)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} expense={editing} onSaved={reload} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete expense?"
        description={deleteTarget ? `${deleteTarget.category} · ${formatCurrency(deleteTarget.amount)} will be removed.` : ''}
        confirmText="Delete"
        onConfirm={remove}
      />
    </div>
  );
}
