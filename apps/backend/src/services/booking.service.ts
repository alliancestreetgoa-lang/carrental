import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { BookingStatus } from '@prisma/client';

const DAY_MS = 1000 * 60 * 60 * 24;

const bookingInclude = {
  customer: { select: { fullName: true, mobile: true, email: true } },
  car: { select: { carName: true, brand: true, registrationNumber: true } },
};

const daysBetween = (from: Date, to: Date) => Math.max(1, Math.ceil((to.getTime() - from.getTime()) / DAY_MS));

// Reject if the car has another RESERVED/ACTIVE booking overlapping [pickup, return)
const assertNoOverlap = async (carId: string, pickupDate: Date, returnDate: Date, excludeId?: string) => {
  const overlap = await prisma.booking.count({
    where: {
      carId,
      deletedAt: null,
      bookingStatus: { in: ['RESERVED', 'ACTIVE'] },
      pickupDate: { lt: returnDate },
      returnDate: { gt: pickupDate },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (overlap > 0) throw new AppError(409, 'Car is already booked for overlapping dates');
};

// Set car back to AVAILABLE only when it has no remaining RESERVED/ACTIVE bookings
const refreshCarStatus = async (
  tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  carId: string
) => {
  const active = await tx.booking.count({
    where: { carId, deletedAt: null, bookingStatus: { in: ['RESERVED', 'ACTIVE'] } },
  });
  await tx.car.update({ where: { id: carId }, data: { status: active > 0 ? 'BOOKED' : 'AVAILABLE' } });
};

export const getAllBookings = (status?: BookingStatus) =>
  prisma.booking.findMany({
    where: { deletedAt: null, ...(status ? { bookingStatus: status } : {}) },
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  });

export const getBookingById = async (id: string) => {
  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
    include: {
      ...bookingInclude,
      car: { select: { carName: true, brand: true, registrationNumber: true, dailyRent: true } },
      payments: { where: { deletedAt: null }, orderBy: { paymentDate: 'desc' } },
      agreement: true,
    },
  });
  if (!booking) throw new AppError(404, 'Booking not found');

  const totalDays = daysBetween(booking.pickupDate, booking.returnDate);
  const rentTotal = Number(booking.totalAmount);
  const lateFee = Number(booking.lateFee);
  const grandTotal = rentTotal + lateFee;
  // Money received is tracked solely via Payment records (the advance is recorded
  // as a payment at booking time), so nothing is double-counted.
  const paymentsReceived = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balanceDue = Math.max(0, grandTotal - paymentsReceived);

  const invoice = {
    rentTotal,
    lateFee,
    grandTotal,
    securityDeposit: Number(booking.securityDeposit),
    advancePayment: Number(booking.advancePayment),
    paymentsReceived,
    balanceDue,
  };

  return { ...booking, totalDays, invoice };
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
  notes?: string;
}) => {
  const car = await prisma.car.findFirst({ where: { id: data.carId, deletedAt: null } });
  if (!car) throw new AppError(404, 'Car not found');
  if (car.status === 'MAINTENANCE' || car.status === 'OUT_OF_SERVICE') {
    throw new AppError(400, 'Car is not available for booking');
  }

  const customer = await prisma.customer.findFirst({ where: { id: data.customerId, deletedAt: null } });
  if (!customer) throw new AppError(404, 'Customer not found');
  if (customer.blacklisted) throw new AppError(403, 'Customer is blacklisted');

  if (data.returnDate <= data.pickupDate) throw new AppError(400, 'returnDate must be after pickupDate');

  await assertNoOverlap(data.carId, data.pickupDate, data.returnDate);

  const totalDays = daysBetween(data.pickupDate, data.returnDate);
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
    // Record the advance as a payment so all "paid" calculations stay consistent
    if ((data.advancePayment ?? 0) > 0) {
      await tx.payment.create({
        data: { bookingId: booking.id, amount: data.advancePayment!, paymentMethod: 'CASH', notes: 'Advance payment' },
      });
    }
    return booking;
  });
};

export const updateBooking = async (
  id: string,
  data: {
    pickupDate?: Date;
    returnDate?: Date;
    pickupLocation?: string;
    dropLocation?: string;
    fuelLevel?: string;
    startKilometer?: number;
    advancePayment?: number;
    securityDeposit?: number;
    notes?: string;
  }
) => {
  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
    include: { car: { select: { dailyRent: true } } },
  });
  if (!booking) throw new AppError(404, 'Booking not found');
  if (booking.bookingStatus === 'COMPLETED' || booking.bookingStatus === 'CANCELLED') {
    throw new AppError(400, 'Completed or cancelled bookings cannot be edited');
  }

  const pickupDate = data.pickupDate ?? booking.pickupDate;
  const returnDate = data.returnDate ?? booking.returnDate;
  if (returnDate <= pickupDate) throw new AppError(400, 'returnDate must be after pickupDate');

  if (data.pickupDate || data.returnDate) {
    await assertNoOverlap(booking.carId, pickupDate, returnDate, id);
  }

  // Recalculate rent from the locked-in daily rate when dates change
  const currentDays = daysBetween(booking.pickupDate, booking.returnDate);
  const lockedDailyRate = Number(booking.totalAmount) > 0 ? Number(booking.totalAmount) / currentDays : Number(booking.car.dailyRent);
  const totalDays = daysBetween(pickupDate, returnDate);
  const totalAmount = Math.round(lockedDailyRate * totalDays * 100) / 100;

  return prisma.booking.update({
    where: { id },
    data: {
      pickupDate,
      returnDate,
      totalAmount,
      pickupLocation: data.pickupLocation,
      dropLocation: data.dropLocation,
      fuelLevel: data.fuelLevel,
      startKilometer: data.startKilometer,
      advancePayment: data.advancePayment,
      securityDeposit: data.securityDeposit,
    },
    include: bookingInclude,
  });
};

export const updateBookingStatus = async (id: string, status: BookingStatus) => {
  const booking = await prisma.booking.findFirst({ where: { id, deletedAt: null } });
  if (!booking) throw new AppError(404, 'Booking not found');
  if (status === 'COMPLETED') throw new AppError(400, 'Use the complete endpoint to close a booking');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({ where: { id }, data: { bookingStatus: status }, include: bookingInclude });
    if (status === 'ACTIVE') {
      await tx.car.update({ where: { id: booking.carId }, data: { status: 'BOOKED' } });
    } else if (status === 'CANCELLED') {
      await refreshCarStatus(tx, booking.carId);
    }
    return updated;
  });
};

export const completeBooking = async (
  id: string,
  data: { endKilometer?: number; returnFuelLevel?: string; actualReturnDate?: Date }
) => {
  const booking = await prisma.booking.findFirst({ where: { id, deletedAt: null } });
  if (!booking) throw new AppError(404, 'Booking not found');
  if (booking.bookingStatus === 'COMPLETED') throw new AppError(400, 'Booking already completed');
  if (booking.bookingStatus === 'CANCELLED') throw new AppError(400, 'Cancelled bookings cannot be completed');

  const actualReturnDate = data.actualReturnDate ?? new Date();

  // Late fee: full daily rate per day returned beyond the scheduled return date
  const currentDays = daysBetween(booking.pickupDate, booking.returnDate);
  const lockedDailyRate = Number(booking.totalAmount) > 0 ? Number(booking.totalAmount) / currentDays : 0;
  const lateMs = actualReturnDate.getTime() - booking.returnDate.getTime();
  const daysLate = lateMs > 0 ? Math.ceil(lateMs / DAY_MS) : 0;
  const lateFee = Math.round(daysLate * lockedDailyRate * 100) / 100;

  if (data.endKilometer !== undefined && booking.startKilometer !== null && data.endKilometer < booking.startKilometer) {
    throw new AppError(400, 'End kilometer cannot be less than start kilometer');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id },
      data: {
        bookingStatus: 'COMPLETED',
        actualReturnDate,
        endKilometer: data.endKilometer,
        returnFuelLevel: data.returnFuelLevel,
        lateFee,
      },
      include: bookingInclude,
    });
    if (data.endKilometer !== undefined) {
      await tx.car.update({ where: { id: booking.carId }, data: { currentKilometer: data.endKilometer } });
    }
    await refreshCarStatus(tx, booking.carId);
    return updated;
  });
};

export const deleteBooking = async (id: string) => {
  const booking = await prisma.booking.findFirst({ where: { id, deletedAt: null } });
  if (!booking) throw new AppError(404, 'Booking not found');
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.booking.update({ where: { id }, data: { deletedAt: new Date() } });
    await refreshCarStatus(tx, booking.carId);
    return deleted;
  });
};
