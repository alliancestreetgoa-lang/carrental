'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, IndianRupee, Phone, Mail, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CarCard } from '@/components/portal/CarCard';
import { DateRangeSearch } from '@/components/portal/DateRangeSearch';
import { StarRating } from '@/components/portal/StarRating';
import { Faq } from '@/components/portal/Faq';
import { portalApi } from '@/lib/portalApi';
import type { PortalCar } from '@/lib/portalTypes';

interface Testimonial {
  id: string;
  rating: number;
  comment: string;
  reviewer: string;
  car: string;
  createdAt: string;
}

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Verified fleet',
    desc: 'Every car is inspected, documented, and road-ready before your pickup.',
  },
  {
    icon: Clock,
    title: 'Instant booking',
    desc: 'Confirm your rental in minutes — no waiting, no back-and-forth.',
  },
  {
    icon: IndianRupee,
    title: 'Transparent INR pricing',
    desc: 'All rates shown in INR with zero hidden fees. What you see is what you pay.',
  },
];

function CarCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <Skeleton className="w-full" style={{ paddingBottom: '56.25%' }} />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-1/3 mt-2" />
      </div>
    </div>
  );
}

export default function StorefrontHome() {
  const [cars, setCars] = useState<PortalCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    portalApi
      .get<{ success: boolean; data: PortalCar[] }>('/cars?sort=newest')
      .then((res) => {
        if (res.data.success) {
          setCars(res.data.data.slice(0, 6));
        }
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));

    portalApi
      .get<{ success: boolean; data: Testimonial[] }>('/testimonials')
      .then((res) => {
        if (res.data.success) setTestimonials(res.data.data.slice(0, 6));
      })
      .catch(() => {/* silently ignore */});
  }, []);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3011';
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    name: 'Alliance Car Rental',
    url: siteUrl,
    description:
      'Alliance Car Rental offers premium self-drive cars in Goa. Browse a hand-picked fleet, book instantly, and explore Goa at your own pace.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Calangute',
      addressRegion: 'Goa',
      addressCountry: 'IN',
    },
    telephone: '+91-90000-00000',
    email: 'hello@alliancecarrental.com',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32 sm:pt-28 sm:pb-40">
          <div className="max-w-2xl">
            <p className="text-red-400 font-semibold text-sm uppercase tracking-widest mb-4">
              Premium car rentals in Goa
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              Premium cars,<br />booked in minutes.
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-xl">
              Browse a hand-picked fleet of well-maintained cars. Pick your dates, confirm instantly, and hit the road.
            </p>
          </div>
        </div>

        {/* Date search card — overlapping the hero bottom */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl bg-white rounded-2xl shadow-xl px-6 py-6 sm:py-5">
            <DateRangeSearch />
          </div>
        </div>
      </section>

      {/* Spacer to account for the overlapping search card */}
      <div className="pb-24 sm:pb-20" />

      {/* ─── FEATURED CARS ────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Featured cars</h2>
          <Link
            href="/cars"
            className="text-sm font-medium text-red-600 hover:underline underline-offset-2 transition-colors"
          >
            Browse all
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        ) : fetchError || cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <p className="text-slate-500 text-lg">
              {fetchError ? 'Could not load cars right now.' : 'No cars available at the moment.'}
            </p>
            <Link
              href="/cars"
              className="inline-flex items-center justify-center h-8 px-2.5 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              Browse all cars
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>

      {/* ─── TRUST SECTION ────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
            Why choose Alliance?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 shrink-0">
                  <Icon className="size-7" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg mb-1">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
            What our customers say
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-slate-100 bg-white p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <StarRating value={t.rating} size={15} />
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{t.comment}</p>
                <p className="text-xs font-semibold text-slate-500">
                  — {t.reviewer}
                  {t.car ? `, ${t.car}` : ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <div className="bg-slate-50 border-y border-slate-200">
        <Faq />
      </div>

      {/* ─── CONTACT ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">
          Get in touch
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 shrink-0">
              <Phone className="size-6" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Phone</p>
              <a
                href="tel:+919000000000"
                className="text-sm font-medium text-slate-800 hover:text-red-600 transition-colors cursor-pointer"
              >
                +91 90000 00000
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 shrink-0">
              <Mail className="size-6" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email</p>
              <a
                href="mailto:hello@alliancecarrental.com"
                className="text-sm font-medium text-slate-800 hover:text-red-600 transition-colors cursor-pointer break-all"
              >
                hello@alliancecarrental.com
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 shrink-0">
              <MapPin className="size-6" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Address</p>
              <p className="text-sm font-medium text-slate-800">Calangute, Goa</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="mailto:hello@alliancecarrental.com"
            className="inline-flex items-center justify-center h-11 px-8 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
          >
            Email us
          </a>
          <a
            href="tel:+919000000000"
            className="inline-flex items-center justify-center h-11 px-8 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
          >
            Call us
          </a>
        </div>
      </section>

      {/* ─── CTA BAND ─────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Ready to hit the road?</h2>
            <p className="text-slate-400 text-base">
              Explore our full fleet and book the perfect car for your trip.
            </p>
          </div>
          <Link
            href="/cars"
            className="inline-flex items-center justify-center h-11 px-8 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shrink-0"
          >
            Browse cars
          </Link>
        </div>
      </section>
    </>
  );
}
