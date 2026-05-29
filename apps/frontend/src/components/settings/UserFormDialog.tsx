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
import type { AdminUser } from '@/lib/types';

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';

export function UserFormDialog({
  open, onOpenChange, user, onSaved,
}: { open: boolean; onOpenChange: (o: boolean) => void; user?: AdminUser | null; onSaved: () => void }) {
  const isEdit = Boolean(user);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('STAFF');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Populate form fields from props when the dialog opens / target changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    if (user) {
      setName(user.name); setEmail(user.email); setMobile(user.mobile ?? '');
      setRole(user.role); setIsActive(user.isActive); setPassword('');
    } else {
      setName(''); setEmail(''); setMobile(''); setRole('STAFF'); setIsActive(true); setPassword('');
    }
  }, [open, user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const submit = async () => {
    setSaving(true);
    try {
      if (user) {
        const payload: Record<string, unknown> = { name, mobile: mobile || undefined, role, isActive };
        if (password) payload.password = password;
        await api.patch(`/users/${user.id}`, payload);
      } else {
        await api.post('/users', { name, email, mobile: mobile || undefined, role, password });
      }
      toast.success(isEdit ? 'User updated' : 'User created');
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update the team member’s details and role.' : 'Create a new team member account.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="uname">Name</Label>
            <Input id="uname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="uemail">Email</Label>
            <Input id="uemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEdit} />
          </div>
          <div>
            <Label htmlFor="umobile">Mobile</Label>
            <Input id="umobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="urole">Role</Label>
            <select id="urole" className={selectClass} value={role} onChange={(e) => setRole(e.target.value)}>
              {['SUPER_ADMIN', 'STAFF', 'ACCOUNTANT'].map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="upass">{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</Label>
            <Input id="upass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? '••••••' : 'Min 6 characters'} />
          </div>
          {isEdit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="cursor-pointer accent-red-600 w-4 h-4" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm">Active</span>
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button className="cursor-pointer acr-liquid" onClick={submit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
