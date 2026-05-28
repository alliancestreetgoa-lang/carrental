'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { Car, MaintenanceRecord, MaintenanceStatus, MaintenanceType } from '@/lib/types';

const TYPES: MaintenanceType[] = ['SERVICE', 'OIL_CHANGE', 'TYRE', 'BRAKES', 'BATTERY', 'REPAIR', 'INSPECTION', 'CLEANING', 'OTHER'];
const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';
const toDateInput = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));

export function MaintenanceFormDialog({
  open, onOpenChange, record, onSaved,
}: { open: boolean; onOpenChange: (o: boolean) => void; record?: MaintenanceRecord | null; onSaved: () => void }) {
  const isEdit = Boolean(record);
  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState('');
  const [type, setType] = useState<MaintenanceType>('SERVICE');
  const [status, setStatus] = useState<MaintenanceStatus>('COMPLETED');
  const [date, setDate] = useState(toDateInput());
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [serviceCenter, setServiceCenter] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get('/cars?pageSize=100').then((res) => setCars(res.data.data)).catch(() => {});
    if (record) {
      setCarId(record.carId);
      setType(record.type);
      setStatus(record.status);
      setDate(toDateInput(record.status === 'SCHEDULED' ? record.dueDate : record.serviceDate));
      setOdometer(record.odometer != null ? String(record.odometer) : '');
      setCost(record.cost && Number(record.cost) > 0 ? record.cost : '');
      setServiceCenter(record.serviceCenter ?? '');
      setNotes(record.notes ?? '');
    } else {
      setCarId(''); setType('SERVICE'); setStatus('COMPLETED'); setDate(toDateInput());
      setOdometer(''); setCost(''); setServiceCenter(''); setNotes('');
    }
  }, [open, record]);

  const isScheduled = status === 'SCHEDULED';

  const submit = async () => {
    if (!isEdit && !carId) { toast.error('Select a vehicle'); return; }
    setSaving(true);
    try {
      const iso = new Date(date).toISOString();
      const body = {
        type,
        status,
        serviceDate: isScheduled ? null : iso,
        dueDate: isScheduled ? iso : null,
        odometer: odometer ? Number(odometer) : undefined,
        cost: isScheduled ? 0 : cost ? Number(cost) : 0,
        serviceCenter: serviceCenter || undefined,
        notes: notes || undefined,
      };
      if (record) await api.patch(`/maintenance/${record.id}`, body);
      else await api.post('/maintenance', { ...body, carId });
      toast.success(isEdit ? 'Maintenance updated' : 'Maintenance logged');
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Maintenance' : 'Log Maintenance'}</DialogTitle>
          <DialogDescription>
            {isScheduled ? 'Schedule upcoming service for a vehicle.' : 'Record completed service. A cost is added to the expense ledger.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="mcar">Vehicle</Label>
            <select id="mcar" className={selectClass} value={carId} onChange={(e) => setCarId(e.target.value)} disabled={isEdit}>
              <option value="" disabled>Select vehicle</option>
              {cars.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.carName} · {c.registrationNumber}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mtype">Type</Label>
              <select id="mtype" className={selectClass} value={type} onChange={(e) => setType(e.target.value as MaintenanceType)}>
                {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="mstatus">Status</Label>
              <select id="mstatus" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}>
                <option value="COMPLETED">Completed</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mdate">{isScheduled ? 'Due date' : 'Service date'}</Label>
              <Input id="mdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="modo">Odometer (km)</Label>
              <Input id="modo" type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mcost">Cost {isScheduled && <span className="text-muted-foreground">(on completion)</span>}</Label>
              <Input id="mcost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} disabled={isScheduled} />
            </div>
            <div>
              <Label htmlFor="mcenter">Service centre</Label>
              <Input id="mcenter" value={serviceCenter} onChange={(e) => setServiceCenter(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="mnotes">Notes</Label>
            <Input id="mnotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={submit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : isEdit ? 'Save Changes' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
