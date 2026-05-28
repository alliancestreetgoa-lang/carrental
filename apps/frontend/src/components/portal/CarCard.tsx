import Link from 'next/link';
import Image from 'next/image';
import { Car } from 'lucide-react';
import type { PortalCar } from '@/lib/portalTypes';
import { formatCurrency, cn } from '@/lib/utils';

interface CarCardProps {
  car: PortalCar;
  query?: string;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

export function CarCard({ car, query }: CarCardProps) {
  const href = `/cars/${car.id}${query ? `?${query}` : ''}`;
  const hasImage = car.images && car.images.length > 0 && car.images[0];

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200',
        'shadow-sm cursor-pointer',
        'transition-all duration-200',
        'motion-safe:hover:-translate-y-0.5 hover:shadow-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2'
      )}
    >
      {/* Image area — 16:9 */}
      <div className="relative w-full overflow-hidden bg-slate-100" style={{ paddingBottom: '56.25%' }}>
        {hasImage ? (
          <Image
            src={car.images[0]}
            alt={`${car.brand} ${car.carName}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover rounded-t-2xl transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 rounded-t-2xl">
            <Car className="size-12 text-slate-400" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title */}
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{car.brand}</p>
          <h3 className="font-semibold text-slate-900 text-base leading-snug">{car.carName}</h3>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5">
          <Chip>{car.fuelType}</Chip>
          <Chip>{car.transmission}</Chip>
          <Chip>{car.seatingCapacity} seats</Chip>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between pt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-900">{formatCurrency(car.dailyRent)}</span>
            <span className="text-sm text-slate-500">/day</span>
          </div>
          <span className="text-sm font-medium text-red-600 group-hover:underline underline-offset-2 transition-colors">
            View &amp; book
          </span>
        </div>
      </div>
    </Link>
  );
}
