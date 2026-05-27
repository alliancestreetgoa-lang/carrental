'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { BookingsChart } from '@/components/dashboard/BookingsChart';
import { CarUtilizationChart } from '@/components/dashboard/CarUtilizationChart';
import { RecentBookingsTable } from '@/components/dashboard/RecentBookingsTable';
import { BookingListCard } from '@/components/dashboard/BookingListCard';
import { MaintenanceAlerts } from '@/components/dashboard/MaintenanceAlerts';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, CarFront, KeyRound, CreditCard, Users, DollarSign, CalendarClock, RotateCcw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return (
    <div>
      <PageHeader title="Dashboard" description="Welcome back to Alliance Car Rental" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2"><Skeleton className="h-80 rounded-xl" /></div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><Skeleton className="h-72 rounded-xl" /></div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );

  const { cards } = stats;

  return (
    <div>
      <PageHeader title="Dashboard" description="Welcome back to Alliance Car Rental" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatsCard title="Total Cars" value={cards.totalCars} icon={Car} />
        <StatsCard title="Available Cars" value={cards.availableCars} icon={CarFront} />
        <StatsCard title="Active Rentals" value={cards.activeRentals} icon={KeyRound} />
        <StatsCard title="Pending Payments" value={formatCurrency(cards.pendingPaymentsAmount)} description={`${cards.pendingPaymentsCount} booking${cards.pendingPaymentsCount === 1 ? '' : 's'}`} icon={CreditCard} />
        <StatsCard title="Total Customers" value={cards.totalCustomers} icon={Users} />
        <StatsCard title="Monthly Revenue" value={formatCurrency(cards.monthlyRevenue)} icon={DollarSign} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <RevenueChart data={stats.monthlyRevenue} />
        </div>
        <CarUtilizationChart data={stats.carUtilization} />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <BookingsChart data={stats.bookingsAnalytics} />
        </div>
        <MaintenanceAlerts alerts={stats.maintenanceAlerts} />
      </div>

      {/* Tables + lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentBookingsTable bookings={stats.recentBookings} />
        </div>
        <div className="space-y-4">
          <BookingListCard title="Cars Due Today" icon={CalendarClock} bookings={stats.carsDueToday} emptyText="Nothing due today" />
          <BookingListCard title="Pending Returns" icon={RotateCcw} bookings={stats.pendingReturns} emptyText="No active rentals" showOverdue />
        </div>
      </div>
    </div>
  );
}
