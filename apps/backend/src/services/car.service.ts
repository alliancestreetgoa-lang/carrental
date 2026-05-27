import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { Prisma, CarStatus, FuelType } from '@prisma/client';

export interface CarListParams {
  search?: string;
  status?: CarStatus;
  fuelType?: FuelType;
  minYear?: number;
  maxYear?: number;
  minRent?: number;
  maxRent?: number;
  sortBy?: 'createdAt' | 'dailyRent' | 'year' | 'carName' | 'brand';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const getAllCars = async (params: CarListParams = {}) => {
  const {
    search, status, fuelType, minYear, maxYear, minRent, maxRent,
    sortBy = 'createdAt', sortOrder = 'desc', page = 1, pageSize = 10,
  } = params;

  const yearFilter = minYear !== undefined || maxYear !== undefined
    ? { year: { ...(minYear !== undefined ? { gte: minYear } : {}), ...(maxYear !== undefined ? { lte: maxYear } : {}) } }
    : {};
  const rentFilter = minRent !== undefined || maxRent !== undefined
    ? { dailyRent: { ...(minRent !== undefined ? { gte: minRent } : {}), ...(maxRent !== undefined ? { lte: maxRent } : {}) } }
    : {};

  const where: Prisma.CarWhereInput = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(fuelType ? { fuelType } : {}),
    ...yearFilter,
    ...rentFilter,
    ...(search
      ? {
          OR: [
            { carName: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { model: { contains: search, mode: 'insensitive' } },
            { registrationNumber: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.car.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.car.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
};

export const getCarById = async (id: string) => {
  const car = await prisma.car.findFirst({
    where: { id, deletedAt: null },
    include: {
      bookings: {
        where: { deletedAt: null },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { fullName: true } } },
      },
      expenses: { where: { deletedAt: null }, orderBy: { expenseDate: 'desc' } },
    },
  });
  if (!car) throw new AppError(404, 'Car not found');
  return car;
};

export const createCar = (data: Prisma.CarCreateInput) =>
  prisma.car.create({ data });

export const updateCar = async (id: string, data: Prisma.CarUpdateInput) => {
  const car = await prisma.car.findFirst({ where: { id, deletedAt: null } });
  if (!car) throw new AppError(404, 'Car not found');
  return prisma.car.update({ where: { id }, data });
};

export const deleteCar = async (id: string) => {
  const car = await prisma.car.findFirst({ where: { id, deletedAt: null } });
  if (!car) throw new AppError(404, 'Car not found');
  return prisma.car.update({ where: { id }, data: { deletedAt: new Date() } });
};

export const bulkUpdateStatus = async (ids: string[], status: CarStatus) => {
  const result = await prisma.car.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { status },
  });
  return { count: result.count };
};

export const bulkDeleteCars = async (ids: string[]) => {
  const result = await prisma.car.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return { count: result.count };
};
