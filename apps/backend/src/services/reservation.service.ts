import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { ReservationStatus } from '@prisma/client';

export const getAllReservations = () =>
  prisma.reservation.findMany({
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
      car: { select: { make: true, model: true, plate: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

export const createReservation = async (data: {
  customerId: string; carId: string; startDate: Date; endDate: Date; notes?: string;
}) => {
  const car = await prisma.car.findUnique({ where: { id: data.carId }, include: { category: true } });
  if (!car) throw new AppError(404, 'Car not found');
  if (car.status !== 'AVAILABLE') throw new AppError(400, 'Car is not available');

  const totalDays = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalAmount = Number(car.category.pricePerDay) * totalDays;

  const reservation = await prisma.reservation.create({
    data: { ...data, totalDays, totalAmount, status: 'CONFIRMED' },
    include: { customer: true, car: { include: { category: true } } },
  });

  await prisma.car.update({ where: { id: data.carId }, data: { status: 'RENTED' } });

  return reservation;
};

export const updateReservationStatus = async (id: string, status: ReservationStatus) => {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) throw new AppError(404, 'Reservation not found');

  const updated = await prisma.reservation.update({ where: { id }, data: { status } });

  if (status === 'COMPLETED' || status === 'CANCELLED') {
    await prisma.car.update({ where: { id: reservation.carId }, data: { status: 'AVAILABLE' } });
  }

  return updated;
};
