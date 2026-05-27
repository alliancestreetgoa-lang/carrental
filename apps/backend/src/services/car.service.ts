import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { Prisma } from '@prisma/client';

export const getAllCars = () =>
  prisma.car.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });

export const getCarById = async (id: string) => {
  const car = await prisma.car.findFirst({
    where: { id, deletedAt: null },
    include: {
      bookings: {
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { fullName: true } } },
      },
      expenses: { where: { deletedAt: null }, take: 10, orderBy: { expenseDate: 'desc' } },
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
