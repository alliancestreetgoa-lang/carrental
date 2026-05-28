import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

export const createReview = async (data: { customerId: string; bookingId: string; rating: number; comment?: string }) => {
  if (data.rating < 1 || data.rating > 5) throw new AppError(400, 'Rating must be 1–5');
  const booking = await prisma.booking.findFirst({ where: { id: data.bookingId, deletedAt: null } });
  if (!booking || booking.customerId !== data.customerId) throw new AppError(404, 'Booking not found');
  if (booking.bookingStatus !== 'COMPLETED') throw new AppError(400, 'You can review a car after the rental is completed');
  const existing = await prisma.review.findFirst({ where: { bookingId: data.bookingId, deletedAt: null } });
  if (existing) throw new AppError(409, 'You have already reviewed this booking');
  return prisma.review.create({ data: { customerId: data.customerId, carId: booking.carId, bookingId: data.bookingId, rating: data.rating, comment: data.comment } });
};

const firstName = (full: string) => full.split(' ')[0];

export const getCarReviews = async (carId: string) => {
  const reviews = await prisma.review.findMany({
    where: { carId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { customer: { select: { fullName: true } } },
  });
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  return {
    average,
    count,
    reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, reviewer: firstName(r.customer.fullName), createdAt: r.createdAt })),
  };
};

export const getTestimonials = async (limit = 8) => {
  const reviews = await prisma.review.findMany({
    where: { deletedAt: null, rating: { gte: 4 }, comment: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { customer: { select: { fullName: true } }, car: { select: { carName: true, brand: true } } },
  });
  return reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, reviewer: firstName(r.customer.fullName), car: `${r.car.brand} ${r.car.carName}`, createdAt: r.createdAt }));
};
