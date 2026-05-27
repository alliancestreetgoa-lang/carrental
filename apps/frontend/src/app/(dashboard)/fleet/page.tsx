'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus, Search, LayoutGrid, List, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Car as CarIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CarFormDialog } from '@/components/fleet/CarFormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';
import type { Car, ListMeta } from '@/lib/types';

const PAGE_SIZE = 8;
const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';

export default function FleetPage() {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Car | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Car | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
    const [sortBy, sortOrder] = sort.split(':');
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), sortBy, sortOrder });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    api.get(`/cars?${params.toString()}`)
      .then((res) => { setCars(res.data.data); setMeta(res.data.meta); })
      .catch(() => toast.error('Failed to load vehicles'))
      .finally(() => setLoading(false));
  }, [page, search, status, sort]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (car: Car) => { setEditing(car); setFormOpen(true); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/cars/${deleteTarget.id}`);
      toast.success('Vehicle deleted');
      load();
    } catch {
      toast.error('Failed to delete vehicle');
    }
  };

  const RowActions = ({ car }: { car: Car }) => (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => router.push(`/fleet/${car.id}`)} title="View"><Eye className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => openEdit(car)} title="Edit"><Pencil className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(car)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Fleet Management"
        description="Manage your vehicle inventory"
        action={<Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add Vehicle</Button>}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, brand, model, registration..." className="pl-9" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <select className={selectClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'OUT_OF_SERVICE'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select className={selectClass} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="createdAt:desc">Newest</option>
          <option value="createdAt:asc">Oldest</option>
          <option value="dailyRent:asc">Rent: Low to High</option>
          <option value="dailyRent:desc">Rent: High to Low</option>
          <option value="year:desc">Year: Newest</option>
          <option value="carName:asc">Name: A-Z</option>
        </select>
        <div className="flex rounded-lg border border-input overflow-hidden">
          <button className={cn('h-9 w-9 flex items-center justify-center cursor-pointer', view === 'table' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-muted-foreground')} onClick={() => setView('table')} title="Table view"><List className="h-4 w-4" /></button>
          <button className={cn('h-9 w-9 flex items-center justify-center cursor-pointer', view === 'grid' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-muted-foreground')} onClick={() => setView('grid')} title="Grid view"><LayoutGrid className="h-4 w-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className={cn(view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4' : 'space-y-3')}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className={view === 'grid' ? 'h-56 rounded-xl' : 'h-12 rounded-md'} />)}
        </div>
      ) : cars.length === 0 ? (
        <Card><CardContent><p className="text-sm text-muted-foreground text-center py-12">No vehicles match your filters.</p></CardContent></Card>
      ) : view === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Vehicle</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead className="text-right">Daily Rent</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cars.map((car) => (
                  <TableRow key={car.id} className="cursor-pointer" onClick={() => router.push(`/fleet/${car.id}`)}>
                    <TableCell className="pl-6">
                      <div className="font-medium text-foreground">{car.brand} {car.carName}</div>
                      <div className="text-xs text-muted-foreground">{car.model} · {car.year} · {car.transmission}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{car.registrationNumber}</TableCell>
                    <TableCell className="text-sm">{car.fuelType}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(car.dailyRent)}</TableCell>
                    <TableCell className="text-right text-sm">{car.currentKilometer.toLocaleString()} km</TableCell>
                    <TableCell><StatusBadge status={car.status} /></TableCell>
                    <TableCell className="pr-6"><div className="flex justify-end"><RowActions car={car} /></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cars.map((car) => (
            <Card key={car.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group" onClick={() => router.push(`/fleet/${car.id}`)}>
              <div className="h-36 bg-muted flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {car.imageUrl ? <img src={car.imageUrl} alt={car.carName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <CarIcon className="w-10 h-10 text-muted-foreground" />}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{car.brand} {car.carName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{car.registrationNumber}</p>
                  </div>
                  <StatusBadge status={car.status} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-muted-foreground">{car.fuelType} · {car.year}</span>
                  <span className="font-bold text-foreground">{formatCurrency(car.dailyRent)}<span className="text-xs font-normal text-muted-foreground">/day</span></span>
                </div>
                <div className="mt-3 pt-3 border-t border-border"><RowActions car={car} /></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} vehicle{meta.total === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
            <Button variant="outline" size="sm" className="cursor-pointer" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <CarFormDialog open={formOpen} onOpenChange={setFormOpen} car={editing} onSaved={load} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete vehicle?"
        description={deleteTarget ? `${deleteTarget.brand} ${deleteTarget.carName} (${deleteTarget.registrationNumber}) will be removed from the fleet.` : ''}
        confirmText="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
