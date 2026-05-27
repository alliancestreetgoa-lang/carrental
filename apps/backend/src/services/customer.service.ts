import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { Prisma } from '@prisma/client';

export const getAllCustomers = () =>
  prisma.customer.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });

export const getCustomerById = async (id: string) => {
  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    include: {
      bookings: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { car: { select: { carName: true, brand: true, registrationNumber: true } } },
      },
      documents: { where: { deletedAt: null } },
    },
  });
  if (!customer) throw new AppError(404, 'Customer not found');
  return customer;
};

export const createCustomer = (data: Prisma.CustomerCreateInput) =>
  prisma.customer.create({ data });

export const updateCustomer = async (id: string, data: Prisma.CustomerUpdateInput) => {
  const customer = await prisma.customer.findFirst({ where: { id, deletedAt: null } });
  if (!customer) throw new AppError(404, 'Customer not found');
  return prisma.customer.update({ where: { id }, data });
};

export const deleteCustomer = async (id: string) => {
  const customer = await prisma.customer.findFirst({ where: { id, deletedAt: null } });
  if (!customer) throw new AppError(404, 'Customer not found');
  return prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
};
