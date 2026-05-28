'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Pencil, Trash2, Car as CarIcon, Fuel, Settings2, Users, Gauge, Calendar, Wrench,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CarFormDialog } from '@/components/fleet/CarFormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { CarDetail } from '@/lib/types';

const Spec = ({ icon: Icon, label, value }: { icon: typeof Fuel; label: string; value: string | number }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  </div>
);

const expiryClass = (v: string | null) => {
  if (!v) return 'text-muted-foreground';
  const days = Math.ceil((new Date(v).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'text-red-600 font-medium';
  if (days <= 30) return 'text-amber-600 font-medium';
  return 'text-foreground';
};

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/cars/${id}`)
      .then((res) => setCar(res.data.data))
      .catch(() => toast.error('Failed to load vehicle'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    try {
      await api.delete(`/cars/${id}`);
      toast.success('Vehicle deleted');
      router.push('/fleet');
    } catch {
      toast.error('Failed to delete vehicle');
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40 rounded-md" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );

  if (!car) return <p className="text-sm text-muted-foreground">Vehicle not found.</p>;

  const gallery = car.images ?? [];
  const cover = gallery[Math.min(activeImg, Math.max(0, gallery.length - 1))];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" className="cursor-pointer -ml-2" onClick={() => router.push('/fleet')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Fleet
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="cursor-pointer" onClick={() => setEditOpen(true)}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
          <Button variant="outline" className="cursor-pointer text-red-600 hover:text-red-700" onClick={() => setDeleteOpen(true)}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
        </div>
      </div>

      {/* Profile */}
      <Card className="mb-4 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-1 bg-muted">
            <div className="h-52 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {cover ? <img src={cover} alt={car.carName} className="w-full h-full object-cover" /> : <CarIcon className="w-16 h-16 text-muted-foreground" />}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 p-2 overflow-x-auto">
                {gallery.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt={`${car.carName} ${i + 1}`}
                    onClick={() => setActiveImg(i)}
                    className={`w-14 h-12 rounded object-cover cursor-pointer flex-shrink-0 ring-2 transition-all ${i === activeImg ? 'ring-red-600' : 'ring-transparent opacity-70 hover:opacity-100'}`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-2 p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">{car.brand} {car.carName}</h2>
                <p className="text-sm text-muted-foreground">{car.model} · {car.year} · <span className="font-mono">{car.registrationNumber}</span></p>
              </div>
              <StatusBadge status={car.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Spec icon={Fuel} label="Fuel" value={car.fuelType} />
              <Spec icon={Settings2} label="Transmission" value={car.transmission} />
              <Spec icon={Users} label="Seats" value={car.seatingCapacity} />
              <Spec icon={Gauge} label="Odometer" value={`${car.currentKilometer.toLocaleString()} km`} />
              <Spec icon={CarIcon} label="Chassis" value={car.chassisNumber} />
            </div>
          </div>
        </div>
      </Card>

      {/* Pricing + Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-muted-foreground">Daily</p><p className="text-lg font-semibold text-foreground">{formatCurrency(car.dailyRent)}</p></div>
            <div><p className="text-xs text-muted-foreground">Weekly</p><p className="text-lg font-semibold text-foreground">{car.weeklyRent ? formatCurrency(car.weeklyRent) : '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Monthly</p><p className="text-lg font-semibold text-foreground">{car.monthlyRent ? formatCurrency(car.monthlyRent) : '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Security Deposit</p><p className="text-lg font-semibold text-foreground">{formatCurrency(car.securityDeposit)}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Insurance Expiry</span><span className={expiryClass(car.insuranceExpiry)}>{car.insuranceExpiry ? formatDate(car.insuranceExpiry) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pollution Expiry</span><span className={expiryClass(car.pollutionExpiry)}>{car.pollutionExpiry ? formatDate(car.pollutionExpiry) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">RC Expiry</span><span className={expiryClass(car.rcExpiry)}>{car.rcExpiry ? formatDate(car.rcExpiry) : '—'}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Booking history */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> Booking History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {car.bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No bookings for this vehicle</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Customer</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {car.bookings.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => router.push(`/bookings`)}>
                    <TableCell className="pl-6 font-medium">{b.customer.fullName}</TableCell>
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

      {/* Maintenance history */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="w-4 h-4 text-muted-foreground" /> Maintenance &amp; Expense History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {car.expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No expense records</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="pr-6 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {car.expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-6 text-sm">{formatDate(e.expenseDate)}</TableCell>
                    <TableCell><StatusBadge status={e.category} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.notes ?? '—'}</TableCell>
                    <TableCell className="pr-6 text-right font-medium">{formatCurrency(e.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CarFormDialog open={editOpen} onOpenChange={setEditOpen} car={car} onSaved={load} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete vehicle?"
        description={`${car.brand} ${car.carName} (${car.registrationNumber}) will be removed from the fleet.`}
        confirmText="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
