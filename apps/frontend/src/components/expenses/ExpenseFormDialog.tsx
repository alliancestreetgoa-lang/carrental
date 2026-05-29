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
import { formSelectClass, toDateInput } from '@/lib/utils';
import type { Car, Expense } from '@/lib/types';

const CATEGORIES = ['FUEL', 'SERVICE', 'REPAIR', 'INSURANCE', 'CLEANING', 'EMI', 'OTHER'];

export function ExpenseFormDialog({
  open, onOpenChange, expense, onSaved,
}: { open: boolean; onOpenChange: (o: boolean) => void; expense?: Expense | null; onSaved: () => void }) {
  const isEdit = Boolean(expense);
  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState('');
  const [category, setCategory] = useState('FUEL');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(toDateInput());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Populate form fields from props when the dialog opens / target changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    api.get('/cars?pageSize=100').then((res) => setCars(res.data.data)).catch(() => {});
    if (expense) {
      setCarId(expense.carId); setCategory(expense.category); setAmount(expense.amount);
      setExpenseDate(toDateInput(expense.expenseDate)); setNotes(expense.notes ?? '');
    } else {
      setCarId(''); setCategory('FUEL'); setAmount(''); setExpenseDate(toDateInput()); setNotes('');
    }
  }, [open, expense]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const submit = async () => {
    if (!isEdit && !carId) { toast.error('Select a vehicle'); return; }
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      const body = {
        category, amount: Number(amount), notes: notes || undefined,
        expenseDate: new Date(expenseDate).toISOString(),
      };
      if (expense) await api.patch(`/expenses/${expense.id}`, body);
      else await api.post('/expenses', { ...body, carId });
      toast.success(isEdit ? 'Expense updated' : 'Expense added');
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update the expense record.' : 'Log a new vehicle expense.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="excar">Vehicle</Label>
            <select id="excar" className={formSelectClass} value={carId} onChange={(e) => setCarId(e.target.value)} disabled={isEdit}>
              <option value="" disabled>Select vehicle</option>
              {cars.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.carName} · {c.registrationNumber}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="excat">Category</Label>
              <select id="excat" className={formSelectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="examt">Amount</Label>
              <Input id="examt" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="exdate">Date</Label>
            <Input id="exdate" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="exnotes">Notes</Label>
            <Input id="exnotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button className="cursor-pointer acr-liquid" onClick={submit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : isEdit ? 'Save Changes' : 'Add Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
