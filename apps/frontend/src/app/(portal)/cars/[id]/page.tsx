'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Car,
  Fuel,
  Settings2,
  Users,
  Hash,
  Calendar,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingWidget } from '@/components/portal/BookingWidget';
import { StarRating } from '@/components/portal/StarRating';
import { portalApi } from '@/lib/portalApi';
import { formatDate } from '@/lib/utils';
import type { PortalCar } from '@/lib/portalTypes';

interface CarReview {
  id: string;
  rating: number;
  comment?: string | null;
  reviewer: string;
  createdAt: string;
}

interface CarReviewsData {
  average: number;
  count: number;
  reviews: CarReview[];
}

/* ── Skeleton ──────────────────────────────────────────────────────────── */
function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="lg:grid lg:grid-cols-3 gap-8 space-y-6 lg:space-y-0">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="w-full rounded-2xl" style={{ paddingBottom: '56.25%' }} />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="rounded-xl aspect-video" />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/* ── Spec tile ─────────────────────────────────────────────────────────── */
function SpecTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

/* ── Inner page (uses useSearchParams via BookingWidget) ───────────────── */
function CarDetailInner() {
  const { id } = useParams<{ id: string }>();

  const [car, setCar] = useState<PortalCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState<CarReviewsData | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    portalApi
      .get<{ success: boolean; data: PortalCar }>(`/cars/${id}`)
      .then((res) => {
        if (res.data.success) {
          setCar(res.data.data);
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else setNotFound(true);
      })
      .finally(() => setLoading(false));

    portalApi
      .get<{ success: boolean; data: CarReviewsData }>(`/cars/${id}/reviews`)
      .then((res) => {
        if (res.data.success) setReviews(res.data.data);
      })
      .catch(() => {/* silently fail — reviews are supplementary */});
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (notFound || !car) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-5 text-center px-4">
        <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Car className="size-8 text-slate-400" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <p className="text-slate-800 font-semibold text-xl">Car not found</p>
          <p className="text-slate-400 text-sm max-w-xs">
            This car may no longer be available or the link is invalid.
          </p>
        </div>
        <Link
          href="/cars"
          className="inline-flex items-center justify-center h-9 px-5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
        >
          Browse cars
        </Link>
      </div>
    );
  }

  const hasImages = car.images && car.images.length > 0;
  const displayedImage = hasImages ? car.images[activeImage] ?? car.images[0] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb / back link */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link
          href="/cars"
          className="flex items-center gap-1 hover:text-red-600 transition-colors cursor-pointer font-medium"
        >
          <ArrowLeft className="size-3.5" />
          Back to cars
        </Link>
        <ChevronRight className="size-3.5 text-slate-300" />
        <span className="text-slate-800 font-medium truncate max-w-[200px]">{car.carName}</span>
      </nav>

      {/* Main layout: 2-col on lg */}
      <div className="lg:grid lg:grid-cols-3 gap-8 space-y-8 lg:space-y-0 items-start">
        {/* LEFT: gallery + specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Heading (mobile shows here, above gallery) */}
          <div className="lg:hidden">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{car.brand}</p>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{car.carName}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{car.year}</p>
          </div>

          {/* Main image */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm motion-safe:transition-all">
            <div style={{ paddingBottom: '56.25%' }} className="relative">
              {displayedImage ? (
                <Image
                  src={displayedImage}
                  alt={`${car.brand} ${car.carName} — photo ${activeImage + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover motion-safe:transition-opacity duration-300"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                  <Car className="size-16 text-slate-400" strokeWidth={1.5} />
                  <p className="mt-3 text-slate-400 text-sm">No image available</p>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {hasImages && car.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {car.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View photo ${i + 1} of ${car.carName}`}
                  className={`relative shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer transition-all motion-safe:hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
                    activeImage === i
                      ? 'border-red-600 shadow-sm'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                  style={{ width: 88, height: 60 }}
                >
                  <Image
                    src={src}
                    alt={`${car.brand} ${car.carName} thumbnail ${i + 1}`}
                    fill
                    sizes="88px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Heading (desktop, below gallery) */}
          <div className="hidden lg:block">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{car.brand}</p>
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">{car.carName}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{car.year}</p>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <SpecTile
              icon={<Car className="size-4" strokeWidth={1.5} />}
              label="Brand"
              value={car.brand}
            />
            <SpecTile
              icon={<Car className="size-4" strokeWidth={1.5} />}
              label="Model"
              value={car.model}
            />
            <SpecTile
              icon={<Calendar className="size-4" strokeWidth={1.5} />}
              label="Year"
              value={car.year}
            />
            <SpecTile
              icon={<Fuel className="size-4" strokeWidth={1.5} />}
              label="Fuel type"
              value={car.fuelType}
            />
            <SpecTile
              icon={<Settings2 className="size-4" strokeWidth={1.5} />}
              label="Transmission"
              value={car.transmission}
            />
            <SpecTile
              icon={<Users className="size-4" strokeWidth={1.5} />}
              label="Seating"
              value={`${car.seatingCapacity} seats`}
            />
            <SpecTile
              icon={<Hash className="size-4" strokeWidth={1.5} />}
              label="Registration"
              value={car.registrationNumber}
            />
          </div>

          {/* Short description */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">About this car</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Experience the comfort of the {car.year} {car.brand} {car.model}. This{' '}
              {car.fuelType.toLowerCase()}-powered {car.transmission.toLowerCase()} vehicle seats{' '}
              {car.seatingCapacity} passengers and is available for rent at{' '}
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(Number(car.dailyRent))}{' '}
              per day. Perfect for day trips, weekend getaways, and long-term rentals across Goa.
            </p>
          </div>

          {/* Reviews */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-slate-800">Reviews</h2>
              {reviews && reviews.count > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating value={reviews.average} size={15} />
                  <span className="text-sm text-slate-600 font-medium">
                    {reviews.average.toFixed(1)}
                    <span className="text-slate-400 font-normal ml-1">
                      ({reviews.count} {reviews.count === 1 ? 'review' : 'reviews'})
                    </span>
                  </span>
                </div>
              )}
            </div>
            {!reviews ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : reviews.count === 0 ? (
              <p className="text-sm text-slate-400">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <StarRating value={review.rating} size={13} />
                        <span className="text-sm font-semibold text-slate-800">{review.reviewer}</span>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Booking widget */}
        <div className="lg:col-span-1">
          <BookingWidget car={car} />
        </div>
      </div>
    </div>
  );
}

/* ── Page export — wraps in Suspense for useSearchParams in BookingWidget */
export default function CarDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <CarDetailInner />
    </Suspense>
  );
}
