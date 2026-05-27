import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

export const getAllAgreements = () =>
  prisma.agreement.findMany({
    where: { deletedAt: null },
    include: { booking: { select: { id: true, customer: { select: { fullName: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

export const getAgreementById = async (id: string) => {
  const agreement = await prisma.agreement.findFirst({
    where: { id, deletedAt: null },
    include: { booking: { include: { customer: true, car: true } } },
  });
  if (!agreement) throw new AppError(404, 'Agreement not found');
  return agreement;
};

export const createAgreement = async (data: {
  bookingId: string;
  agreementNumber: string;
  pdfUrl?: string;
}) => {
  const booking = await prisma.booking.findFirst({ where: { id: data.bookingId, deletedAt: null } });
  if (!booking) throw new AppError(404, 'Booking not found');

  const existing = await prisma.agreement.findUnique({ where: { bookingId: data.bookingId } });
  if (existing) throw new AppError(409, 'Agreement already exists for this booking');

  return prisma.agreement.create({ data });
};

export const updateAgreement = async (
  id: string,
  data: { pdfUrl?: string; signed?: boolean; signedAt?: Date }
) => {
  const agreement = await prisma.agreement.findFirst({ where: { id, deletedAt: null } });
  if (!agreement) throw new AppError(404, 'Agreement not found');

  const patch = { ...data };
  if (data.signed === true && !data.signedAt && !agreement.signedAt) {
    patch.signedAt = new Date();
  }
  return prisma.agreement.update({ where: { id }, data: patch });
};

export const deleteAgreement = async (id: string) => {
  const agreement = await prisma.agreement.findFirst({ where: { id, deletedAt: null } });
  if (!agreement) throw new AppError(404, 'Agreement not found');
  return prisma.agreement.update({ where: { id }, data: { deletedAt: new Date() } });
};
