import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { Prisma } from '@prisma/client';

export interface CustomerListParams {
  search?: string;
  blacklisted?: boolean;
  sortBy?: 'createdAt' | 'fullName';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const getAllCustomers = async (params: CustomerListParams = {}) => {
  const { search, blacklisted, sortBy = 'createdAt', sortOrder = 'desc', page = 1, pageSize = 10 } = params;

  const where: Prisma.CustomerWhereInput = {
    deletedAt: null,
    ...(blacklisted !== undefined ? { blacklisted } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { licenseNumber: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.customer.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
};

export const getCustomerById = async (id: string) => {
  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    include: {
      bookings: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          car: { select: { carName: true, brand: true, registrationNumber: true } },
          payments: { where: { deletedAt: null }, select: { amount: true } },
        },
      },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!customer) throw new AppError(404, 'Customer not found');

  // Pending dues = outstanding across non-cancelled bookings
  let pendingDues = 0;
  let totalSpent = 0;
  for (const b of customer.bookings) {
    if (b.bookingStatus === 'CANCELLED') continue;
    const paid = b.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    totalSpent += paid;
    const outstanding = Number(b.totalAmount) - paid;
    if (outstanding > 0) pendingDues += outstanding;
  }

  // Strip per-booking payment details from the response
  const bookings = customer.bookings.map(({ payments, ...b }) => b);

  return { ...customer, bookings, pendingDues, totalSpent };
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
