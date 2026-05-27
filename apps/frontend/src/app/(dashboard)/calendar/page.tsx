'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventDropArg, EventInput, EventContentArg, DateSelectArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useSocketContext } from '@/providers/SocketProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { BookingFormDialog } from '@/components/bookings/BookingFormDialog';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Booking, Car } from '@/lib/types';

const STATUS_COLOR: Record<string, string> = {
  RESERVED: '#f59e0b',   // yellow
  ACTIVE: '#3b82f6',     // blue
  COMPLETED: '#64748b',  // slate
  CANCELLED: '#ef4444',  // red
};
const CAR_DOT: Record<string, string> = {
  AVAILABLE: '#10b981',      // green
  BOOKED: '#3b82f6',         // blue
  MAINTENANCE: '#ef4444',    // red
  OUT_OF_SERVICE: '#ef4444', // red
};

const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} /> {label}
  </span>
);

export default function CalendarPage() {
  const router = useRouter();
  const socket = useSocketContext();
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [quickOpen, setQuickOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ carId?: string; pickupDate?: string; returnDate?: string } | null>(null);

  const loadCars = useCallback(() => {
    api.get('/cars?pageSize=100').then((res) => setCars(res.data.data)).catch(() => toast.error('Failed to load cars'));
  }, []);
  const loadBookings = useCallback(() => {
    api.get('/bookings').then((res) => setBookings(res.data.data)).catch(() => toast.error('Failed to load bookings'));
  }, []);

  useEffect(() => { loadCars(); loadBookings(); }, [loadCars, loadBookings]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handler = () => { loadBookings(); loadCars(); };
    socket.on('booking:changed', handler);
    return () => { socket.off('booking:changed', handler); };
  }, [socket, loadBookings, loadCars]);

  const resources = cars.map((c) => ({
    id: c.id,
    title: `${c.brand} ${c.carName}`,
    extendedProps: { registrationNumber: c.registrationNumber, status: c.status },
  }));

  const events: EventInput[] = bookings
    .filter((b) => b.bookingStatus !== 'CANCELLED')
    .filter((b) => !statusFilter || b.bookingStatus === statusFilter)
    .map((b) => ({
      id: b.id,
      resourceId: b.carId,
      title: b.customer.fullName,
      start: b.pickupDate,
      end: b.returnDate,
      backgroundColor: STATUS_COLOR[b.bookingStatus],
      borderColor: STATUS_COLOR[b.bookingStatus],
      editable: b.bookingStatus === 'RESERVED' || b.bookingStatus === 'ACTIVE',
      extendedProps: {
        status: b.bookingStatus,
        car: `${b.car.brand} ${b.car.carName} (${b.car.registrationNumber})`,
        amount: b.totalAmount,
      },
    }));

  const persistMove = async (
    info: EventDropArg | EventResizeDoneArg,
  ) => {
    const e = info.event;
    if (!e.start || !e.end) { info.revert(); return; }
    const newResourceId = (info as EventDropArg).newResource?.id;
    try {
      await api.patch(`/bookings/${e.id}`, {
        pickupDate: e.start.toISOString(),
        returnDate: e.end.toISOString(),
        ...(newResourceId ? { carId: newResourceId } : {}),
      });
      toast.success('Booking updated');
      loadBookings();
      loadCars();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not move booking');
      info.revert();
    }
  };

  const onSelect = (info: DateSelectArg) => {
    const resourceId = info.resource?.id;
    setPrefill({ carId: resourceId, pickupDate: info.start.toISOString(), returnDate: info.end.toISOString() });
    setQuickOpen(true);
    info.view.calendar.unselect();
  };

  const renderEvent = (arg: EventContentArg) => (
    <div className="px-1 truncate text-xs font-medium">{arg.event.title}</div>
  );

  return (
    <div>
      <PageHeader title="Booking Calendar" description="Drag, resize and schedule bookings across the fleet" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <select className={selectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All bookings</option>
            {['RESERVED', 'ACTIVE', 'COMPLETED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LegendDot color={STATUS_COLOR.RESERVED} label="Reserved" />
          <LegendDot color={STATUS_COLOR.ACTIVE} label="Active" />
          <LegendDot color={STATUS_COLOR.COMPLETED} label="Completed" />
          <span className="text-border">|</span>
          <LegendDot color={CAR_DOT.AVAILABLE} label="Available" />
          <LegendDot color={CAR_DOT.MAINTENANCE} label="Maintenance" />
        </div>
      </div>

      <Card>
        <CardContent className="p-3 acr-calendar">
          <FullCalendar
            plugins={[resourceTimelinePlugin, interactionPlugin]}
            schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
            initialView="resourceTimelineWeek"
            height="auto"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth',
            }}
            views={{
              resourceTimelineDay: { buttonText: 'Day' },
              resourceTimelineWeek: { buttonText: 'Week' },
              resourceTimelineMonth: { buttonText: 'Month' },
            }}
            resourceAreaHeaderContent="Vehicles"
            resourceAreaWidth="240px"
            resources={resources}
            events={events}
            editable
            eventResourceEditable
            selectable
            selectMirror
            nowIndicator
            eventContent={renderEvent}
            resourceLabelContent={(arg) => {
              const status = (arg.resource.extendedProps as { status?: string }).status ?? '';
              const reg = (arg.resource.extendedProps as { registrationNumber?: string }).registrationNumber ?? '';
              return (
                <div className="flex items-center gap-2 py-1">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAR_DOT[status] ?? '#94a3b8' }} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{arg.resource.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">{reg}</div>
                  </div>
                </div>
              );
            }}
            eventDidMount={(arg) => {
              const p = arg.event.extendedProps as { status: string; car: string; amount: string };
              arg.el.title = `${arg.event.title}\n${p.car}\n${p.status} · $${p.amount}\n${arg.event.start?.toLocaleString()} → ${arg.event.end?.toLocaleString()}`;
            }}
            eventClick={(arg) => router.push(`/bookings/${arg.event.id}`)}
            eventDrop={persistMove}
            eventResize={persistMove}
            select={onSelect}
          />
        </CardContent>
      </Card>

      <BookingFormDialog open={quickOpen} onOpenChange={setQuickOpen} prefill={prefill} onSaved={() => { loadBookings(); loadCars(); }} />
    </div>
  );
}
