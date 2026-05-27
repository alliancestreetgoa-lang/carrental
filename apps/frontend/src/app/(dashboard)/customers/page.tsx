'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { AddCustomerDialog } from '@/components/customers/AddCustomerDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import type { Customer } from '@/lib/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/customers')
      .then((res) => setCustomers(res.data.data))
      .catch(() => toast.error('Failed to load customers'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer profiles"
        action={<AddCustomerDialog onCreated={load} />}
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}
            </div>
          ) : customers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No customers yet. Add your first customer.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>License No.</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer">
                    <TableCell className="font-medium text-foreground">{c.fullName}</TableCell>
                    <TableCell className="text-sm">{c.mobile}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{c.licenseNumber}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
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
