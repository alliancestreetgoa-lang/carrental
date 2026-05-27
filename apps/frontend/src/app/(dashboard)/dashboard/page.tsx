'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentReservations } from '@/components/dashboard/RecentReservations';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Users, CalendarCheck, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalCars: number;
  availableCars: number;
  totalCustomers: number;
  activeReservations: number;
  monthlyRevenue: number;
  recentReservations: Array<{
    id: string;
    customer: { firstName: string; lastName: string };
    car: { make: string; model: string; plate: string };
    startDate: string;
    totalAmount: number;
    status: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <PageHeader title="Dashboard" description="Welcome back to Alliance Car Rental" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><Skeleton className="h-72 rounded-xl" /></div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Dashboard" description="Welcome back to Alliance Car Rental" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Vehicles" value={stats?.totalCars ?? 0} description={`${stats?.availableCars ?? 0} available`} icon={Car} trend={{ value: 12, label: 'vs last month' }} />
        <StatsCard title="Total Customers" value={stats?.totalCustomers ?? 0} icon={Users} trend={{ value: 8, label: 'vs last month' }} />
        <StatsCard title="Active Rentals" value={stats?.activeReservations ?? 0} icon={CalendarCheck} trend={{ value: 5, label: 'vs last month' }} />
        <StatsCard title="Monthly Revenue" value={formatCurrency(stats?.monthlyRevenue ?? 0)} icon={DollarSign} trend={{ value: 15, label: 'vs last month' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <RecentReservations reservations={stats?.recentReservations ?? []} />
      </div>
    </div>
  );
}
