'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AddCarDialog } from '@/components/fleet/AddCarDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { Car } from '@/lib/types';

export default function FleetPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/cars')
      .then((res) => setCars(res.data.data))
      .catch(() => toast.error('Failed to load vehicles'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader
        title="Fleet Management"
        description="Manage your vehicle inventory"
        action={<AddCarDialog onCreated={load} />}
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}
            </div>
          ) : cars.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No vehicles yet. Add your first vehicle.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Transmission</TableHead>
                  <TableHead className="text-right">Daily Rent</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cars.map((car) => (
                  <TableRow key={car.id} className="cursor-pointer">
                    <TableCell>
                      <div className="font-medium text-foreground">{car.brand} {car.carName}</div>
                      <div className="text-xs text-muted-foreground">{car.model} · {car.year} · {car.seatingCapacity} seats</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{car.registrationNumber}</TableCell>
                    <TableCell className="text-sm">{car.fuelType}</TableCell>
                    <TableCell className="text-sm">{car.transmission}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(car.dailyRent)}</TableCell>
                    <TableCell className="text-right text-sm">{car.currentKilometer.toLocaleString()} km</TableCell>
                    <TableCell><StatusBadge status={car.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
