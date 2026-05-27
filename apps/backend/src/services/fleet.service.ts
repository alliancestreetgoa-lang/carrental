import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { CarStatus } from '@prisma/client';

export const getAllCars = () =>
  prisma.car.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } });

export const getCarById = async (id: string) => {
  const car = await prisma.car.findUnique({ where: { id }, include: { category: true, reservations: { take: 5, orderBy: { createdAt: 'desc' }, include: { customer: { select: { firstName: true, lastName: true } } } } } });
  if (!car) throw new AppError(404, 'Car not found');
  return car;
};

export const createCar = (data: { plate: string; make: string; model: string; year: number; color: string; categoryId: string; mileage?: number; imageUrl?: string }) =>
  prisma.car.create({ data, include: { category: true } });

export const updateCar = async (id: string, data: Partial<{ make: string; model: string; year: number; color: string; status: CarStatus; mileage: number; imageUrl: string; categoryId: string }>) => {
  const car = await prisma.car.findUnique({ where: { id } });
  if (!car) throw new AppError(404, 'Car not found');
  return prisma.car.update({ where: { id }, data, include: { category: true } });
};

export const deleteCar = async (id: string) => {
  const car = await prisma.car.findUnique({ where: { id } });
  if (!car) throw new AppError(404, 'Car not found');
  return prisma.car.delete({ where: { id } });
};
