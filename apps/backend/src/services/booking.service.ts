import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { BookingStatus } from '@prisma/client';

const bookingInclude = {
  customer: { select: { fullName: true, mobile: true, email: true } },
  car: { select: { carName: true, brand: true, registrationNumber: true } },
};

export const getAllBookings = () =>
  prisma.booking.findMany({
    where: { deletedAt: null },
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  });

export const getBookingById = async (id: string) => {
  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
    include: {
      ...bookingInclude,
      payments: { where: { deletedAt: null }, orderBy: { paymentDate: 'desc' } },
      agreement: true,
    },
  });
  if (!booking) throw new AppError(404, 'Booking not found');
  return booking;
};

export const createBooking = async (data: {
  customerId: string;
  carId: string;
  pickupDate: Date;
  returnDate: Date;
  pickupLocation?: string;
  dropLocation?: string;
  fuelLevel?: string;
  startKilometer?: number;
  advancePayment?: number;
  securityDeposit?: number;
  totalAmount?: number;
}) => {
  const car = await prisma.car.findFirst({ where: { id: data.carId, deletedAt: null } });
  if (!car) throw new AppError(404, 'Car not found');
  if (car.status !== 'AVAILABLE') throw new AppError(400, 'Car is not available');

  const customer = await prisma.customer.findFirst({ where: { id: data.customerId, deletedAt: null } });
  if (!customer) throw new AppError(404, 'Customer not found');

  if (data.returnDate <= data.pickupDate) throw new AppError(400, 'returnDate must be after pickupDate');

  const totalDays = Math.max(
    1,
    Math.ceil((data.returnDate.getTime() - data.pickupDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const totalAmount = data.totalAmount ?? Number(car.dailyRent) * totalDays;
  const securityDeposit = data.securityDeposit ?? Number(car.securityDeposit);

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        customerId: data.customerId,
        carId: data.carId,
        pickupDate: data.pickupDate,
        returnDate: data.returnDate,
        pickupLocation: data.pickupLocation,
        dropLocation: data.dropLocation,
        fuelLevel: data.fuelLevel,
        startKilometer: data.startKilometer,
        advancePayment: data.advancePayment ?? 0,
        securityDeposit,
        totalAmount,
        bookingStatus: 'RESERVED',
      },
      include: bookingInclude,
    });

    await tx.car.update({ where: { id: data.carId }, data: { status: 'BOOKED' } });

    return booking;
  });
};

export const updateBookingStatus = async (
  id: string,
  status: BookingStatus,
  endKilometer?: number
) => {
  const booking = await prisma.booking.findFirst({ where: { id, deletedAt: null } });
  if (!booking) throw new AppError(404, 'Booking not found');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id },
      data: {
        bookingStatus: status,
        ...(endKilometer !== undefined ? { endKilometer } : {}),
      },
      include: bookingInclude,
    });

    if (status === 'ACTIVE') {
      await tx.car.update({ where: { id: booking.carId }, data: { status: 'BOOKED' } });
    }
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await tx.car.update({ where: { id: booking.carId }, data: { status: 'AVAILABLE' } });
      if (status === 'COMPLETED' && endKilometer !== undefined) {
        await tx.car.update({ where: { id: booking.carId }, data: { currentKilometer: endKilometer } });
      }
    }

    return updated;
  });
};

export const deleteBooking = async (id: string) => {
  const booking = await prisma.booking.findFirst({ where: { id, deletedAt: null } });
  if (!booking) throw new AppError(404, 'Booking not found');
  return prisma.booking.update({ where: { id }, data: { deletedAt: new Date() } });
};
