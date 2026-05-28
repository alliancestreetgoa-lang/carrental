'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQ_ITEMS = [
  {
    q: 'What documents do I need to rent?',
    a: 'A valid driving licence and a government-issued photo ID (Aadhaar, passport, or voter ID) are required at the time of pickup.',
  },
  {
    q: 'Is a security deposit required?',
    a: 'Yes. A fully refundable security deposit is collected at pickup and returned in full once the car is back in the same condition.',
  },
  {
    q: 'Can I modify or cancel my booking?',
    a: 'You can cancel a booking while it is in Reserved status. To extend a rental, log in to your account and use the booking management page.',
  },
  {
    q: 'How do I pay?',
    a: 'Payment is collected at pickup. Online payment will be available soon — we will notify you when it launches.',
  },
  {
    q: 'What is the fuel policy?',
    a: 'Cars are provided with a set fuel level and must be returned at the same level. Any shortfall will be charged at the prevailing pump rate.',
  },
  {
    q: 'Do you deliver the car?',
    a: 'Pickup and drop-off are currently at our Goa location. Contact us in advance if you need to discuss alternative arrangements.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">
        Frequently asked questions
      </h2>

      <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = open === idx;
          return (
            <div key={idx}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-800">{item.q}</span>
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-slate-400 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                  strokeWidth={2}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
