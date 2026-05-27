import { PrismaClient, Role, CarStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@alliancecarrental.com' },
    update: {},
    create: {
      email: 'admin@alliancecarrental.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  const economy = await prisma.carCategory.upsert({
    where: { name: 'Economy' },
    update: {},
    create: { name: 'Economy', description: 'Fuel-efficient compact cars', pricePerDay: 35 },
  });

  const suv = await prisma.carCategory.upsert({
    where: { name: 'SUV' },
    update: {},
    create: { name: 'SUV', description: 'Spacious SUVs for families', pricePerDay: 75 },
  });

  await prisma.car.createMany({
    skipDuplicates: true,
    data: [
      { plate: 'ACR-001', make: 'Toyota', model: 'Corolla', year: 2023, color: 'White', status: CarStatus.AVAILABLE, mileage: 12000, categoryId: economy.id },
      { plate: 'ACR-002', make: 'Honda', model: 'Civic', year: 2023, color: 'Silver', status: CarStatus.AVAILABLE, mileage: 8500, categoryId: economy.id },
      { plate: 'ACR-003', make: 'Toyota', model: 'RAV4', year: 2024, color: 'Black', status: CarStatus.AVAILABLE, mileage: 3200, categoryId: suv.id },
      { plate: 'ACR-004', make: 'Ford', model: 'Explorer', year: 2023, color: 'Blue', status: CarStatus.RENTED, mileage: 22000, categoryId: suv.id },
    ],
  });

  console.log('✓ Database seeded');
}

main().catch(console.error).finally(() => prisma.$disconnect());
