'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Wrench, CalendarClock, AlertTriangle, CheckCircle2, Banknote, FileWarning, Check } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MaintenanceFormDialog } from '@/components/maintenance/MaintenanceFormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRealtime, MAINTENANCE_EVENTS } from '@/hooks/useRealtime';
import { formatCurrency, formatDate, selectClass } from '@/lib/utils';
import type { MaintenanceRecord, MaintenanceSummary } from '@/lib/types';

const TYPES = ['SERVICE', 'OIL_CHANGE', 'TYRE', 'BRAKES', 'BATTERY', 'REPAIR', 'INSPECTION', 'CLEANING', 'OTHER'];
const TYPE_COLOR: Record<string, string> = {
  SERVICE: '#f59e0b', OIL_CHANGE: '#3b82f6', TYRE: '#6366f1', BRAKES: '#ef4444',
  BATTERY: '#10b981', REPAIR: '#dc2626', INSPECTION: '#8b5cf6', CLEANING: '#06b6d4', OTHER: '#94a3b8',
};

export default function MaintenancePage() {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceRecord | null>(null);

  const { data: summary, refetch: refetchSummary } = useFetch<MaintenanceSummary | null>(
    () => api.get('/maintenance/summary').then((r) => r.data.data),
    [],
    null,
    () => toast.error('Failed to load summary'),
  );
  const { data: records, loading, refetch: refetchRecords } = useFetch<MaintenanceRecord[]>(
    () => {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      return api.get(`/maintenance?${params.toString()}`).then((r) => r.data.data);
    },
    [type, status],
    [],
    () => toast.error('Failed to load records'),
  );

  const reload = () => { refetchSummary(); refetchRecords(); };
  useRealtime(MAINTENANCE_EVENTS, reload);

  const markDone = async (id: string) => {
    try { await api.patch(`/maintenance/${id}/complete`, {}); toast.success('Marked as done'); reload(); }
    catch { toast.error('Failed to update record'); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/maintenance/${deleteTarget.id}`); toast.success('Record deleted'); reload(); }
    catch { toast.error('Failed to delete record'); }
  };

  return (
    <div>
      <PageHeader
        title="Maintenance & Service"
        description="Service history, upcoming maintenance and document expiry"
        action={<Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Log Maintenance</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatsCard title="Upcoming" value={summary?.upcomingCount ?? 0} icon={CalendarClock} />
        <StatsCard title="Overdue" value={summary?.overdueCount ?? 0} icon={AlertTriangle} className={summary?.overdueCount ? 'border-red-500/40' : ''} />
        <StatsCard title="Done This Month" value={summary?.completedThisMonth ?? 0} icon={CheckCircle2} />
        <StatsCard title="Total Service Cost" value={formatCurrency(summary?.totalCost ?? 0)} icon={Banknote} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Upcoming & overdue */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="w-4 h-4" /> Upcoming & Overdue</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!summary ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)
            ) : summary.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nothing scheduled.</p>
            ) : (
              summary.upcoming.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className="border-0 text-xs text-white" style={{ backgroundColor: TYPE_COLOR[u.type] }}>{u.type.replace('_', ' ')}</Badge>
                      {u.overdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                    </div>
                    <div className="text-sm font-medium text-foreground mt-1 truncate">{u.carLabel} <span className="font-mono text-xs text-muted-foreground">{u.registrationNumber}</span></div>
                    <div className="text-xs text-muted-foreground">{u.dueDate ? `Due ${formatDate(u.dueDate)}` : 'No due date'}{u.notes ? ` · ${u.notes}` : ''}</div>
                  </div>
                  <Button size="sm" variant="outline" className="cursor-pointer flex-shrink-0" onClick={() => markDone(u.id)}><Check className="w-3.5 h-3.5 mr-1" /> Done</Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Document expiry alerts */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileWarning className="w-4 h-4" /> Document Expiry Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!summary ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)
            ) : summary.expiryAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">All documents valid.</p>
            ) : (
              summary.expiryAlerts.map((a, i) => (
                <div key={`${a.carId}-${a.kind}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{a.kind}</Badge>
                      <Badge className={`text-xs border-0 text-white ${a.expired ? 'bg-red-600' : 'bg-amber-500'}`}>{a.expired ? 'Expired' : 'Expiring'}</Badge>
                    </div>
                    <div className="text-sm font-medium text-foreground mt-1 truncate">{a.carLabel} <span className="font-mono text-xs text-muted-foreground">{a.registrationNumber}</span></div>
                    <div className="text-xs text-muted-foreground">{a.detail}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service history */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><Wrench className="w-4 h-4" /> Service History</CardTitle>
          <div className="flex gap-2">
            <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select className={selectClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}</div>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No maintenance records match your filter.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => {
                  const date = r.status === 'SCHEDULED' ? r.dueDate : r.serviceDate;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="pl-6 text-sm">
                        {date ? formatDate(date) : '—'}
                        {r.status === 'SCHEDULED' && <span className="text-xs text-muted-foreground ml-1">(due)</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{r.car.brand} {r.car.carName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{r.car.registrationNumber}</div>
                      </TableCell>
                      <TableCell><Badge className="border-0 text-xs text-white" style={{ backgroundColor: TYPE_COLOR[r.type] }}>{r.type.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>
                        {r.status === 'COMPLETED'
                          ? <Badge className="border-0 text-xs bg-emerald-600 text-white">Completed</Badge>
                          : <Badge variant="outline" className="text-xs">Scheduled</Badge>}
                      </TableCell>
                      <TableCell className="text-right text-sm">{r.odometer != null ? `${r.odometer.toLocaleString('en-IN')} km` : '—'}</TableCell>
                      <TableCell className="text-right font-medium">{r.status === 'COMPLETED' ? formatCurrency(r.cost) : '—'}</TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end gap-1">
                          {r.status === 'SCHEDULED' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-emerald-600 hover:text-emerald-700" onClick={() => markDone(r.id)} title="Mark done"><Check className="h-4 w-4" /></Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => { setEditing(r); setFormOpen(true); }} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(r)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MaintenanceFormDialog open={formOpen} onOpenChange={setFormOpen} record={editing} onSaved={reload} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete maintenance record?"
        description={deleteTarget ? `${deleteTarget.type.replace('_', ' ')} for ${deleteTarget.car.brand} ${deleteTarget.car.carName} will be removed${deleteTarget.expenseId ? ', along with its linked expense' : ''}.` : ''}
        confirmText="Delete"
        onConfirm={remove}
      />
    </div>
  );
}
