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
}) => {
  const where: Prisma.CarWhereInput = {
    deletedAt: null,
    status: 'AVAILABLE',
    ...(f.fuelType ? { fuelType: f.fuelType } : {}),
    ...(f.transmission ? { transmission: f.transmission } : {}),
    ...(f.seats ? { seatingCapacity: { gte: f.seats } } : {}),
    ...(f.q ? { OR: [{ carName: { contains: f.q, mode: 'insensitive' } }, { brand: { contains: f.q, mode: 'insensitive' } }] } : {}),
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
