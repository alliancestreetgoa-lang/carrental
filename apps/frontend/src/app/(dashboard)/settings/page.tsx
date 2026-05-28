'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Pencil, UserX, ShieldCheck } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader } from '@/components/shared/PageHeader';
import { UserFormDialog } from '@/components/settings/UserFormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn, formatDate } from '@/lib/utils';
import type { AdminUser } from '@/lib/types';

const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  STAFF: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACCOUNTANT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null);

  const { data: users, loading, refetch } = useFetch<AdminUser[]>(
    () => (isAdmin ? api.get('/users').then((r) => r.data.data) : Promise.resolve([])),
    [isAdmin],
    [],
    () => toast.error('Failed to load users'),
  );

  const deactivate = async () => {
    if (!deactivateTarget) return;
    try { await api.delete(`/users/${deactivateTarget.id}`); toast.success('User deactivated'); refetch(); }
    catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'); }
  };

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Settings" description="System configuration" />
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          User management is restricted to Super Admins.
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage team members and access"
        action={<Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add User</Button>}
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-6 font-medium text-foreground">{u.name}{u.id === user?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><Badge className={cn('border-0 text-xs', ROLE_COLOR[u.role])}>{u.role.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell>
                      {u.isActive
                        ? <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
                        : <Badge className="bg-slate-100 text-slate-600 border-0 dark:bg-slate-800 dark:text-slate-400">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="pr-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => { setEditing(u); setFormOpen(true); }} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        {u.id !== user?.id && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-red-600 hover:text-red-700" onClick={() => setDeactivateTarget(u)} title="Deactivate"><UserX className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} onSaved={refetch} />
      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => !o && setDeactivateTarget(null)}
        title="Deactivate user?"
        description={deactivateTarget ? `${deactivateTarget.name} will lose access. You can re-add them later.` : ''}
        confirmText="Deactivate"
        onConfirm={deactivate}
      />
    </div>
  );
}
