import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

export const getAllCustomers = () =>
  prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });

export const getCustomerById = async (id: string) => {
  const customer = await prisma.customer.findUnique({ where: { id }, include: { reservations: { include: { car: { select: { make: true, model: true, plate: true } } }, orderBy: { createdAt: 'desc' } } } });
  if (!customer) throw new AppError(404, 'Customer not found');
  return customer;
};

export const createCustomer = (data: { firstName: string; lastName: string; email: string; phone: string; licenseNo: string; address?: string }) =>
  prisma.customer.create({ data });

export const updateCustomer = async (id: string, data: Partial<{ firstName: string; lastName: string; email: string; phone: string; address: string }>) => {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new AppError(404, 'Customer not found');
  return prisma.customer.update({ where: { id }, data });
};

export const deleteCustomer = async (id: string) => {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new AppError(404, 'Customer not found');
  return prisma.customer.delete({ where: { id } });
};
