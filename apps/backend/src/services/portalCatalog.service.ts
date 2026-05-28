import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { FuelType, Transmission, Prisma } from '@prisma/client';

const publicCarSelect = {
  id: true, carName: true, brand: true, model: true, year: true,
  registrationNumber: true, fuelType: true, transmission: true, seatingCapacity: true,
  dailyRent: true, weeklyRent: true, monthlyRent: true, securityDeposit: true,
  images: true, status: true,
} as const;

// IDs of cars with a RESERVED/ACTIVE booking overlapping [from, to)
const bookedCarIds = async (from: Date, to: Date) => {
  const rows = await prisma.booking.findMany({
    where: { deletedAt: null, bookingStatus: { in: ['RESERVED', 'ACTIVE'] }, pickupDate: { lt: to }, returnDate: { gt: from } },
    select: { carId: true },
  });
  return [...new Set(rows.map((r) => r.carId))];
};

export const listCars = async (f: {
  from?: Date; to?: Date; fuelType?: FuelType; transmission?: Transmission; seats?: number; q?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  brand?: string; minPrice?: number; maxPrice?: number;
}) => {
  const where: Prisma.CarWhereInput = {
    deletedAt: null,
    // List all bookable cars (incl. currently BOOKED ones — they're still
    // bookable for non-overlapping future dates); the date-window overlap
    // filter below handles per-date availability. Exclude only unbookable states.
    status: { notIn: ['OUT_OF_SERVICE', 'MAINTENANCE'] },
    ...(f.fuelType ? { fuelType: f.fuelType } : {}),
    ...(f.transmission ? { transmission: f.transmission } : {}),
    ...(f.seats ? { seatingCapacity: { gte: f.seats } } : {}),
    ...(f.q ? { OR: [{ carName: { contains: f.q, mode: 'insensitive' } }, { brand: { contains: f.q, mode: 'insensitive' } }] } : {}),
    ...(f.brand ? { brand: f.brand } : {}),
    ...((f.minPrice != null || f.maxPrice != null) ? { dailyRent: { ...(f.minPrice != null ? { gte: f.minPrice } : {}), ...(f.maxPrice != null ? { lte: f.maxPrice } : {}) } } : {}),
  };
  if (f.from && f.to) {
    if (f.to <= f.from) throw new AppError(400, 'Return date must be after pickup date');
    where.id = { notIn: await bookedCarIds(f.from, f.to) };
  }
  const orderBy: Prisma.CarOrderByWithRelationInput =
    f.sort === 'price_asc' ? { dailyRent: 'asc' } : f.sort === 'price_desc' ? { dailyRent: 'desc' } : { createdAt: 'desc' };
  return prisma.car.findMany({ where, select: publicCarSelect, orderBy });
};

export const getCar = async (id: string) => {
  const car = await prisma.car.findFirst({ where: { id, deletedAt: null }, select: publicCarSelect });
  if (!car) throw new AppError(404, 'Car not found');
  return car;
};

export const listBrands = async () => {
  const rows = await prisma.car.findMany({
    where: { deletedAt: null, status: { notIn: ['OUT_OF_SERVICE', 'MAINTENANCE'] } },
    select: { brand: true },
    distinct: ['brand'],
    orderBy: { brand: 'asc' },
  });
  return rows.map((r) => r.brand);
};

export const getRelatedCars = async (carId: string) => {
  const car = await prisma.car.findFirst({ where: { id: carId, deletedAt: null } });
  if (!car) return [];
  const sameBrand = await prisma.car.findMany({
    where: { deletedAt: null, id: { not: carId }, brand: car.brand, status: { notIn: ['OUT_OF_SERVICE', 'MAINTENANCE'] } },
    select: publicCarSelect, take: 4, orderBy: { createdAt: 'desc' },
  });
  if (sameBrand.length >= 3) return sameBrand;
  // top up with other bookable cars
  const others = await prisma.car.findMany({
    where: { deletedAt: null, id: { notIn: [carId, ...sameBrand.map((c) => c.id)] }, status: { notIn: ['OUT_OF_SERVICE', 'MAINTENANCE'] } },
    select: publicCarSelect, take: 4 - sameBrand.length, orderBy: { createdAt: 'desc' },
  });
  return [...sameBrand, ...others];
};

export const getAvailability = async (carId: string, from: Date, to: Date) => {
  const car = await prisma.car.findFirst({ where: { id: carId, deletedAt: null } });
  if (!car) throw new AppError(404, 'Car not found');
  if (to <= from) throw new AppError(400, 'Return date must be after pickup date');
  const conflicts = await prisma.booking.findMany({
    where: { carId, deletedAt: null, bookingStatus: { in: ['RESERVED', 'ACTIVE'] }, pickupDate: { lt: to }, returnDate: { gt: from } },
    select: { pickupDate: true, returnDate: true },
    orderBy: { pickupDate: 'asc' },
  });
  const unavailable = car.status === 'MAINTENANCE' || car.status === 'OUT_OF_SERVICE';
  return { available: conflicts.length === 0 && !unavailable, conflicts };
};
