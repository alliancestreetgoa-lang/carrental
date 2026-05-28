'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, IndianRupee } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { portalApi } from '@/lib/portalApi';
import { formatDate, formatCurrency } from '@/lib/utils';

interface PaymentRow {
  id: string;
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  notes: string | null;
  booking: {
    id: string;
    car: {
      carName: string;
      brand: string;
      registrationNumber: string;
    };
  };
}

const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-green-50 text-green-700 border-green-100',
  UPI: 'bg-blue-50 text-blue-700 border-blue-100',
  CARD: 'bg-purple-50 text-purple-700 border-purple-100',
  BANK_TRANSFER: 'bg-amber-50 text-amber-700 border-amber-100',
  ONLINE: 'bg-sky-50 text-sky-700 border-sky-100',
};

function PaymentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white">
      <Skeleton className="size-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi
      .get<{ success: boolean; data: PaymentRow[] }>('/payments')
      .then((res) => {
        if (res.data.success) setPayments(res.data.data);
      })
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Payment history</h2>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <PaymentRowSkeleton key={i} />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
          <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <CreditCard className="size-8 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-700 font-semibold text-lg">No payments yet</p>
            <p className="text-slate-400 text-sm max-w-xs">
              Your payment history will appear here once you make a payment.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {payments.map((payment) => {
            const methodClass =
              METHOD_COLORS[payment.paymentMethod?.toUpperCase()] ??
              'bg-slate-100 text-slate-600 border-slate-200';
            return (
              <div
                key={payment.id}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-red-200 hover:shadow-sm transition-all"
              >
                {/* Icon */}
                <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <IndianRupee className="size-5 text-red-600" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {payment.booking.car.brand} {payment.booking.car.carName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {payment.booking.car.registrationNumber}
                    {payment.notes ? ` · ${payment.notes}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(payment.paymentDate)}</p>
                </div>

                {/* Amount + method */}
                <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                  <p className="font-bold text-slate-900 text-sm">{formatCurrency(payment.amount)}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${methodClass}`}
                  >
                    {payment.paymentMethod}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
