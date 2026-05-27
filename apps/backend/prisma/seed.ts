import {
  PrismaClient,
  Role,
  CarStatus,
  FuelType,
  Transmission,
  BookingStatus,
  PaymentMethod,
  ExpenseCategory,
  DocumentType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ---- Users ----
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const staffPassword = await bcrypt.hash('Staff@123', 12);
  const accountantPassword = await bcrypt.hash('Accountant@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@alliancecarrental.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@alliancecarrental.com',
      mobile: '+919000000001',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@alliancecarrental.com' },
    update: {},
    create: {
      name: 'Front Desk Staff',
      email: 'staff@alliancecarrental.com',
      mobile: '+919000000002',
      password: staffPassword,
      role: Role.STAFF,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'accounts@alliancecarrental.com' },
    update: {},
    create: {
      name: 'Account Manager',
      email: 'accounts@alliancecarrental.com',
      mobile: '+919000000003',
      password: accountantPassword,
      role: Role.ACCOUNTANT,
      isActive: true,
    },
  });

  // ---- Cars ----
  const swift = await prisma.car.upsert({
    where: { registrationNumber: 'GA-01-AB-1234' },
    update: {},
    create: {
      carName: 'Swift VXi',
      brand: 'Maruti Suzuki',
      model: 'Swift',
      year: 2023,
      registrationNumber: 'GA-01-AB-1234',
      chassisNumber: 'MA3EWDE1S00111111',
      fuelType: FuelType.PETROL,
      transmission: Transmission.MANUAL,
      seatingCapacity: 5,
      dailyRent: 1500,
      weeklyRent: 9000,
      monthlyRent: 32000,
      securityDeposit: 5000,
      insuranceExpiry: new Date('2026-12-31'),
      pollutionExpiry: new Date('2026-06-30'),
      rcExpiry: new Date('2038-01-01'),
      currentKilometer: 18500,
      status: CarStatus.AVAILABLE,
      images: [
        'https://images.unsplash.com/photo-1549924231-f129b911e442?w=800',
        'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800',
      ],
    },
  });

  const innova = await prisma.car.upsert({
    where: { registrationNumber: 'GA-02-CD-5678' },
    update: {},
    create: {
      carName: 'Innova Crysta',
      brand: 'Toyota',
      model: 'Innova Crysta',
      year: 2024,
      registrationNumber: 'GA-02-CD-5678',
      chassisNumber: 'MBJ11JV3007222222',
      fuelType: FuelType.DIESEL,
      transmission: Transmission.AUTOMATIC,
      seatingCapacity: 7,
      dailyRent: 3500,
      weeklyRent: 21000,
      monthlyRent: 78000,
      securityDeposit: 10000,
      insuranceExpiry: new Date('2026-09-15'),
      pollutionExpiry: new Date('2026-03-31'),
      rcExpiry: new Date('2039-01-01'),
      currentKilometer: 9200,
      status: CarStatus.BOOKED,
      images: [
        'https://images.unsplash.com/photo-1632245889029-e406faaa34cd?w=800',
        'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800',
      ],
    },
  });

  const nexon = await prisma.car.upsert({
    where: { registrationNumber: 'GA-03-EF-9012' },
    update: {},
    create: {
      carName: 'Nexon EV',
      brand: 'Tata',
      model: 'Nexon EV',
      year: 2024,
      registrationNumber: 'GA-03-EF-9012',
      chassisNumber: 'MAT625487PWE33333',
      fuelType: FuelType.ELECTRIC,
      transmission: Transmission.AUTOMATIC,
      seatingCapacity: 5,
      dailyRent: 2500,
      weeklyRent: 15000,
      monthlyRent: 55000,
      securityDeposit: 8000,
      insuranceExpiry: new Date('2027-01-20'),
      rcExpiry: new Date('2039-06-01'),
      currentKilometer: 4300,
      status: CarStatus.MAINTENANCE,
      images: [
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
      ],
    },
  });

  // ---- Customers ----
  const rahul = await prisma.customer.upsert({
    where: { licenseNumber: 'GA0120230001234' },
    update: {},
    create: {
      fullName: 'Rahul Naik',
      mobile: '+919812345678',
      whatsapp: '+919812345678',
      email: 'rahul.naik@example.com',
      address: '12 Miramar Road, Panaji, Goa',
      licenseNumber: 'GA0120230001234',
      licenseExpiry: new Date('2032-05-10'),
      aadhaarNumber: '111122223333',
      emergencyContact: '+919800000011',
      notes: 'Repeat customer, prefers automatic cars.',
    },
  });

  const priya = await prisma.customer.upsert({
    where: { licenseNumber: 'GA0220210005678' },
    update: {},
    create: {
      fullName: 'Priya Shenoy',
      mobile: '+919898765432',
      whatsapp: '+919898765432',
      email: 'priya.shenoy@example.com',
      address: '45 Calangute Beach Road, Bardez, Goa',
      licenseNumber: 'GA0220210005678',
      licenseExpiry: new Date('2030-11-22'),
      aadhaarNumber: '444455556666',
      emergencyContact: '+919800000022',
    },
  });

  // ---- Booking (active rental for Priya with the Innova) ----
  const booking = await prisma.booking.upsert({
    where: { id: 'seed-booking-0001' },
    update: {},
    create: {
      id: 'seed-booking-0001',
      customerId: priya.id,
      carId: innova.id,
      pickupDate: new Date('2026-05-25T10:00:00Z'),
      returnDate: new Date('2026-05-30T10:00:00Z'),
      pickupLocation: 'Dabolim Airport',
      dropLocation: 'Dabolim Airport',
      bookingStatus: BookingStatus.ACTIVE,
      fuelLevel: 'FULL',
      startKilometer: 9200,
      advancePayment: 7000,
      securityDeposit: 10000,
      totalAmount: 17500,
    },
  });

  // ---- Payment for the booking ----
  await prisma.payment.upsert({
    where: { id: 'seed-payment-0001' },
    update: {},
    create: {
      id: 'seed-payment-0001',
      bookingId: booking.id,
      amount: 7000,
      paymentMethod: PaymentMethod.UPI,
      paymentDate: new Date('2026-05-25T09:45:00Z'),
      notes: 'Advance payment via UPI.',
    },
  });

  // ---- Agreement for the booking ----
  await prisma.agreement.upsert({
    where: { bookingId: booking.id },
    update: {},
    create: {
      bookingId: booking.id,
      agreementNumber: 'AGR-2026-0001',
      signed: true,
      signedAt: new Date('2026-05-25T09:50:00Z'),
    },
  });

  // ---- Expenses ----
  await prisma.expense.createMany({
    data: [
      { carId: innova.id, category: ExpenseCategory.FUEL, amount: 3000, expenseDate: new Date('2026-05-24'), notes: 'Full tank before handover.' },
      { carId: nexon.id, category: ExpenseCategory.SERVICE, amount: 4500, expenseDate: new Date('2026-05-20'), notes: 'Scheduled service + software update.' },
      { carId: swift.id, category: ExpenseCategory.INSURANCE, amount: 18000, expenseDate: new Date('2026-01-02'), notes: 'Annual comprehensive insurance renewal.' },
    ],
    skipDuplicates: true,
  });

  // ---- Documents ----
  await prisma.document.createMany({
    data: [
      { customerId: rahul.id, type: DocumentType.LICENSE, fileUrl: 'https://res.cloudinary.com/demo/rahul-license.jpg' },
      { customerId: priya.id, type: DocumentType.AADHAAR, fileUrl: 'https://res.cloudinary.com/demo/priya-aadhaar.jpg' },
      { carId: innova.id, type: DocumentType.RC, fileUrl: 'https://res.cloudinary.com/demo/innova-rc.pdf' },
    ],
    skipDuplicates: true,
  });

  console.log('✓ Database seeded');
  console.log(`  Admin login: ${admin.email} / Admin@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
