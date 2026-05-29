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
    include: {
      booking: {
        include: {
          customer: true,
          car: true,
          payments: { where: { deletedAt: null }, select: { amount: true } },
        },
      },
    },
  });
  if (!agreement) throw new AppError(404, 'Agreement not found');
  // Never expose the customer's password hash in API responses
  const { password: _pw, ...customer } = agreement.booking.customer;
  return { ...agreement, booking: { ...agreement.booking, customer } };
};

export const setPdfUrl = (id: string, pdfUrl: string) =>
  prisma.agreement.update({ where: { id }, data: { pdfUrl } });

const generateAgreementNumber = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.agreement.count();
  return `AGR-${year}-${String(count + 1).padStart(4, '0')}`;
};

export const createAgreement = async (data: { bookingId: string; agreementNumber?: string }) => {
  const booking = await prisma.booking.findFirst({ where: { id: data.bookingId, deletedAt: null } });
  if (!booking) throw new AppError(404, 'Booking not found');

  const existing = await prisma.agreement.findUnique({ where: { bookingId: data.bookingId } });
  if (existing) throw new AppError(409, 'Agreement already exists for this booking');

  const agreementNumber = data.agreementNumber ?? (await generateAgreementNumber());
  return prisma.agreement.create({ data: { bookingId: data.bookingId, agreementNumber } });
};

export const signAgreement = async (id: string, signatureData: string, signatoryName?: string) => {
  const agreement = await prisma.agreement.findFirst({ where: { id, deletedAt: null } });
  if (!agreement) throw new AppError(404, 'Agreement not found');
  if (agreement.signed) throw new AppError(400, 'Agreement is already signed');
  return prisma.agreement.update({
    where: { id },
    data: { signed: true, signedAt: new Date(), signatureData, signatoryName },
  });
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
