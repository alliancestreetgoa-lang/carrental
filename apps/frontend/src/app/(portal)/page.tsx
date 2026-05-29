'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, IndianRupee, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CarCard } from '@/components/portal/CarCard';
import { DateRangeSearch } from '@/components/portal/DateRangeSearch';
import { StarRating } from '@/components/portal/StarRating';
import { Faq } from '@/components/portal/Faq';
import { Reveal } from '@/components/portal/Reveal';
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

const HERO_PILLS = ['Verified fleet', 'Instant confirmation', 'Transparent INR pricing'];

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
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="acr-aurora" aria-hidden="true" />
        <div className="acr-grid absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-36 sm:pt-32 sm:pb-44">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-300 backdrop-blur-sm">
              <span className="acr-pulse-dot size-1.5 rounded-full bg-red-400" />
              Premium car rentals in Goa
            </span>
            <h1 className="acr-display font-bold mt-6 mb-6">
              Premium cars,
              <br />
              <span className="bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">
                booked in minutes.
              </span>
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-xl">
              Browse a hand-picked fleet of well-maintained cars. Pick your dates,
              confirm instantly, and hit the road.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {HERO_PILLS.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-slate-200 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/10"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Glass search card — overlapping the hero bottom */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 sm:px-6 lg:px-8">
          <div className="acr-glass-light mx-auto max-w-5xl rounded-3xl px-6 py-6 shadow-2xl sm:py-5">
            <DateRangeSearch />
          </div>
        </div>
      </section>

      {/* Spacer for the overlapping search card */}
      <div className="pb-24 sm:pb-20" />

      {/* ─── FEATURED CARS ────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Reveal>
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Featured cars
            </h2>
            <Link
              href="/cars"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
            >
              Browse all
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

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
              className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              Browse all cars
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car, i) => (
              <Reveal key={car.id} delay={i * 80} className="h-full">
                <CarCard car={car} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ─── TRUST SECTION ────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-center mb-12">
              Why choose Alliance?
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {TRUST_ITEMS.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 100}>
                <div className="group h-full rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-7" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg mb-1.5">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-center mb-12">
              What our customers say
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={t.id} delay={i * 70}>
                <div className="h-full rounded-2xl border border-slate-100 bg-white p-6 space-y-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <StarRating value={t.rating} size={15} />
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{t.comment}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    — {t.reviewer}
                    {t.car ? `, ${t.car}` : ''}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <div className="bg-slate-50 border-y border-slate-200">
        <Faq />
      </div>

      {/* ─── CONTACT ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-center mb-10">
            Get in touch
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[
            { icon: Phone, label: 'Phone', value: '+91 90000 00000', href: 'tel:+919000000000' },
            { icon: Mail, label: 'Email', value: 'hello@alliancecarrental.com', href: 'mailto:hello@alliancecarrental.com' },
            { icon: MapPin, label: 'Address', value: 'Calangute, Goa', href: undefined },
          ].map(({ icon: Icon, label, value, href }, i) => (
            <Reveal key={label} delay={i * 90}>
              <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 shrink-0">
                  <Icon className="size-6" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      className="text-sm font-medium text-slate-800 hover:text-red-600 transition-colors cursor-pointer break-all"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-slate-800">{value}</p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
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
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="acr-aurora opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Ready to hit the road?</h2>
            <p className="text-slate-400 text-base">
              Explore our full fleet and book the perfect car for your trip.
            </p>
          </div>
          <Link
            href="/cars"
            className="group inline-flex items-center justify-center gap-2 h-12 px-8 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shrink-0"
          >
            Browse cars
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
