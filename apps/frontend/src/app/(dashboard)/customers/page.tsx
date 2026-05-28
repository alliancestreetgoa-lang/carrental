'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Search, Eye, Pencil, ChevronLeft, ChevronRight, Ban } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useFetch } from '@/hooks/useFetch';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import type { Customer, ListMeta } from '@/lib/types';

const PAGE_SIZE = 10;
const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';

export default function CustomersPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [blacklisted, setBlacklisted] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, loading, refetch } = useFetch<{ items: Customer[]; meta: ListMeta | null }>(
    () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (search) params.set('search', search);
      if (blacklisted) params.set('blacklisted', blacklisted);
      return api.get(`/customers?${params.toString()}`).then((r) => ({ items: r.data.data, meta: r.data.meta }));
    },
    [page, search, blacklisted],
    { items: [], meta: null },
    () => toast.error('Failed to load customers'),
  );
  const customers = data.items;
  const meta = data.meta;

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); setFormOpen(true); };

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer profiles"
        action={<Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add Customer</Button>}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, mobile, email, license..." className="pl-9" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <select className={selectClass} value={blacklisted} onChange={(e) => { setBlacklisted(e.target.value); setPage(1); }}>
          <option value="">All customers</option>
          <option value="false">Active only</option>
          <option value="true">Blacklisted only</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)}</div>
          ) : customers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No customers match your filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>License No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                    <TableCell className="pl-6 font-medium text-foreground">{c.fullName}</TableCell>
                    <TableCell className="text-sm">{c.mobile}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{c.licenseNumber}</TableCell>
                    <TableCell>
                      {c.blacklisted
                        ? <Badge className="bg-red-100 text-red-700 border-0 dark:bg-red-900/30 dark:text-red-400"><Ban className="w-3 h-3 mr-1" />Blacklisted</Badge>
                        : <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                    <TableCell className="pr-6">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)} title="View"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => openEdit(c)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages} · {meta.total} customer{meta.total === 1 ? '' : 's'}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
            <Button variant="outline" size="sm" className="cursor-pointer" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} onSaved={refetch} />
    </div>
  );
}
