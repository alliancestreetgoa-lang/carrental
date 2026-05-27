import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { DocumentType } from '@prisma/client';

export const getAllDocuments = (filter: { customerId?: string; carId?: string }) =>
  prisma.document.findMany({
    where: {
      deletedAt: null,
      ...(filter.customerId ? { customerId: filter.customerId } : {}),
      ...(filter.carId ? { carId: filter.carId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

export const createDocument = async (data: {
  type: DocumentType;
  fileUrl: string;
  customerId?: string;
  carId?: string;
}) => {
  if (!data.customerId && !data.carId) {
    throw new AppError(400, 'Document must be linked to a customer or a car');
  }
  if (data.customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: data.customerId, deletedAt: null } });
    if (!customer) throw new AppError(404, 'Customer not found');
  }
  if (data.carId) {
    const car = await prisma.car.findFirst({ where: { id: data.carId, deletedAt: null } });
    if (!car) throw new AppError(404, 'Car not found');
  }
  return prisma.document.create({ data });
};

export const deleteDocument = async (id: string) => {
  const document = await prisma.document.findFirst({ where: { id, deletedAt: null } });
  if (!document) throw new AppError(404, 'Document not found');
  return prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });
};
