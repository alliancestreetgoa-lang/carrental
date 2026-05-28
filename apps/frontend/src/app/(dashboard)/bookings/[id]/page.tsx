'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Pencil, CheckCircle, XCircle, KeyRound, Download, Plus, FileText, FileSignature, PenLine, Mail, UploadCloud,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { BookingFormDialog } from '@/components/bookings/BookingFormDialog';
import { CompleteBookingDialog } from '@/components/bookings/CompleteBookingDialog';
import { AddPaymentDialog } from '@/components/bookings/AddPaymentDialog';
import { SignatureDialog } from '@/components/bookings/SignatureDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useFetch } from '@/hooks/useFetch';
import { useRealtime } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { BookingDetail } from '@/lib/types';

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

const InvoiceRow = ({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: string }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className={`text-sm ${bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{label}</span>
    <span className={`text-sm ${bold ? 'font-semibold' : 'font-medium'} ${tone ?? 'text-foreground'}`}>{value}</span>
  </div>
);

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);

  const { data: booking, loading, refetch } = useFetch<BookingDetail | null>(
    () => api.get(`/bookings/${id}`).then((r) => r.data.data),
    [id],
    null,
    () => toast.error('Failed to load booking'),
  );
  useRealtime(['booking:updated', 'booking:cancelled', 'payment:added'], refetch);

  const activate = async () => {
    try { await api.patch(`/bookings/${id}/status`, { status: 'ACTIVE' }); toast.success('Booking activated'); refetch(); }
    catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'); }
  };
  const cancel = async () => {
    try { await api.patch(`/bookings/${id}/cancel`); toast.success('Booking cancelled'); refetch(); }
    catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'); }
  };
  const downloadBlob = async (urlPath: string, filename: string) => {
    try {
      const res = await api.get(urlPath, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };
  const downloadInvoice = () => downloadBlob(`/bookings/${id}/invoice`, `invoice-${id}.pdf`);

  const generateAgreement = async () => {
    try {
      await api.post('/agreements', { bookingId: id });
      toast.success('Agreement generated');
      refetch();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to generate agreement');
    }
  };

  const emailAgreement = async (agreementId: string) => {
    try {
      const { data } = await api.post(`/agreements/${agreementId}/email`, {});
      toast.success(data.message ?? 'Agreement emailed');
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to email agreement');
    }
  };

  const storeAgreement = async (agreementId: string) => {
    try {
      await api.post(`/agreements/${agreementId}/store`, {});
      toast.success('Agreement PDF stored');
      refetch();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to store agreement');
    }
  };

  const approve = async () => {
    setApprovalLoading(true);
    try {
      await api.patch(`/bookings/${id}/approve`);
      toast.success('Booking approved');
      refetch();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to approve');
    } finally {
      setApprovalLoading(false);
    }
  };

  const reject = async () => {
    setApprovalLoading(true);
    try {
      await api.patch(`/bookings/${id}/reject`, { reason: rejectReason || undefined });
      toast.success('Booking rejected');
      setRejectOpen(false);
      setRejectReason('');
      refetch();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to reject');
    } finally {
      setApprovalLoading(false);
    }
  };

  if (loading || !booking) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40 rounded-md" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );

  const b = booking;
  const distance = b.startKilometer != null && b.endKilometer != null ? b.endKilometer - b.startKilometer : null;
  const canEdit = b.bookingStatus === 'RESERVED' || b.bookingStatus === 'ACTIVE';

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <Button variant="ghost" className="cursor-pointer -ml-2" onClick={() => router.push('/bookings')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Bookings
        </Button>
        <div className="flex gap-2 flex-wrap">
          {canEdit && <Button variant="outline" className="cursor-pointer" onClick={() => setEditOpen(true)}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>}
          {b.bookingStatus === 'RESERVED' && <Button variant="outline" className="cursor-pointer" onClick={activate}><KeyRound className="w-4 h-4 mr-1" /> Activate</Button>}
          {b.bookingStatus === 'ACTIVE' && <Button className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCompleteOpen(true)}><CheckCircle className="w-4 h-4 mr-1" /> Complete</Button>}
          {canEdit && <Button variant="outline" className="cursor-pointer text-red-600 hover:text-red-700" onClick={() => setCancelOpen(true)}><XCircle className="w-4 h-4 mr-1" /> Cancel</Button>}
        </div>
      </div>

      {/* Header */}
      <Card className="mb-4">
        <CardContent className="p-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{b.customer.fullName}</h2>
              <StatusBadge status={b.bookingStatus} />
              {b.approvalStatus === 'PENDING' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">Awaiting approval</span>
              )}
              {b.approvalStatus === 'APPROVED' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">Approved</span>
              )}
              {b.approvalStatus === 'REJECTED' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">Rejected</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{b.car.brand} {b.car.carName} · <span className="font-mono">{b.car.registrationNumber}</span></p>
            {b.approvalStatus === 'REJECTED' && b.rejectionReason && (
              <p className="text-xs text-red-600 mt-1">Reason: {b.rejectionReason}</p>
            )}
            {b.approvalStatus === 'PENDING' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white" onClick={approve} disabled={approvalLoading}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="cursor-pointer text-red-600 hover:text-red-700 border-red-200 hover:border-red-300" onClick={() => setRejectOpen(true)} disabled={approvalLoading}>
                  Reject
                </Button>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Grand Total</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{formatCurrency(b.invoice.grandTotal)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Rental Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Pickup" value={formatDate(b.pickupDate)} />
              <Field label="Scheduled Return" value={formatDate(b.returnDate)} />
              <Field label="Actual Return" value={b.actualReturnDate ? formatDate(b.actualReturnDate) : '—'} />
              <Field label="Rental Days" value={String(b.totalDays)} />
              <Field label="Pickup Location" value={b.pickupLocation ?? '—'} />
              <Field label="Drop Location" value={b.dropLocation ?? '—'} />
              <Field label="Fuel (out)" value={b.fuelLevel?.replace(/_/g, ' ') ?? '—'} />
              <Field label="Fuel (in)" value={b.returnFuelLevel?.replace(/_/g, ' ') ?? '—'} />
              <Field label="Start Odometer" value={b.startKilometer != null ? `${b.startKilometer.toLocaleString()} km` : '—'} />
              <Field label="End Odometer" value={b.endKilometer != null ? `${b.endKilometer.toLocaleString()} km` : '—'} />
              <Field label="Distance" value={distance != null ? `${distance.toLocaleString()} km` : '—'} />
              <Field label="Customer Mobile" value={b.customer.mobile ?? '—'} />
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Payments</CardTitle>
              <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setPaymentOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add Payment</Button>
            </CardHeader>
            <CardContent className="p-0">
              {b.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No payments recorded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="pr-6 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {b.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="pl-6 text-sm">{formatDate(p.paymentDate)}</TableCell>
                        <TableCell><Badge className="bg-slate-100 text-slate-700 border-0 dark:bg-slate-800 dark:text-slate-300 text-xs">{p.paymentMethod.replace(/_/g, ' ')}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.notes ?? '—'}</TableCell>
                        <TableCell className="pr-6 text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: invoice */}
        <div>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /> Invoice</CardTitle>
              <Button size="sm" variant="outline" className="cursor-pointer" onClick={downloadInvoice}><Download className="w-4 h-4 mr-1" /> PDF</Button>
            </CardHeader>
            <CardContent>
              <InvoiceRow label="Rental charge" value={formatCurrency(b.invoice.rentTotal)} />
              <InvoiceRow label="Late fee" value={formatCurrency(b.invoice.lateFee)} tone={b.invoice.lateFee > 0 ? 'text-red-600' : undefined} />
              <div className="border-t border-border my-1" />
              <InvoiceRow label="Grand total" value={formatCurrency(b.invoice.grandTotal)} bold />
              <div className="border-t border-border my-1" />
              <InvoiceRow label="Payments received" value={formatCurrency(b.invoice.paymentsReceived)} bold />
              <div className="border-t border-border my-1" />
              <InvoiceRow label="Balance due" value={formatCurrency(b.invoice.balanceDue)} bold tone={b.invoice.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'} />
              <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
                <InvoiceRow label="Security deposit (refundable)" value={formatCurrency(b.invoice.securityDeposit)} />
              </div>
            </CardContent>
          </Card>

          {/* Agreement */}
          <Card className="mt-4">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileSignature className="w-4 h-4 text-muted-foreground" /> Agreement</CardTitle></CardHeader>
            <CardContent>
              {!b.agreement ? (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-3">No rental agreement yet.</p>
                  <Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={generateAgreement} disabled={b.bookingStatus === 'CANCELLED'}>
                    <FileSignature className="w-4 h-4 mr-1" /> Generate Agreement
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-mono text-foreground">{b.agreement.agreementNumber}</p>
                      <p className="text-xs text-muted-foreground">{b.agreement.signed ? `Signed ${b.agreement.signedAt ? formatDate(b.agreement.signedAt) : ''}` : 'Awaiting signature'}</p>
                    </div>
                    {b.agreement.signed
                      ? <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400">Signed</Badge>
                      : <Badge className="bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-400">Unsigned</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => downloadBlob(`/agreements/${b.agreement!.id}/pdf`, `agreement-${b.agreement!.agreementNumber}.pdf`)}>
                      <Download className="w-4 h-4 mr-1" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => emailAgreement(b.agreement!.id)}>
                      <Mail className="w-4 h-4 mr-1" /> Email
                    </Button>
                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => storeAgreement(b.agreement!.id)}>
                      <UploadCloud className="w-4 h-4 mr-1" /> Store
                    </Button>
                    {!b.agreement.signed && (
                      <Button size="sm" className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={() => setSignOpen(true)}>
                        <PenLine className="w-4 h-4 mr-1" /> Sign
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {b.agreement && !b.agreement.signed && (
        <SignatureDialog open={signOpen} onOpenChange={setSignOpen} agreementId={b.agreement.id} defaultName={b.customer.fullName} onSigned={refetch} />
      )}
      <BookingFormDialog open={editOpen} onOpenChange={setEditOpen} booking={b} onSaved={refetch} />
      <CompleteBookingDialog open={completeOpen} onOpenChange={setCompleteOpen} booking={b} onCompleted={refetch} />
      <AddPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} bookingId={b.id} onAdded={refetch} />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel booking?"
        description="The booking will be marked cancelled and the vehicle freed if no other active bookings remain."
        confirmText="Cancel Booking"
        onConfirm={cancel}
      />
      <Dialog open={rejectOpen} onOpenChange={(open) => { setRejectOpen(open); if (!open) setRejectReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject booking?</DialogTitle>
            <DialogDescription>Optionally provide a reason for the customer.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm text-muted-foreground block mb-1.5">Reason (optional)</label>
            <textarea
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
              placeholder="e.g. Incomplete documents"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => { setRejectOpen(false); setRejectReason(''); }} disabled={approvalLoading}>Cancel</Button>
            <Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white" onClick={reject} disabled={approvalLoading}>Reject Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
