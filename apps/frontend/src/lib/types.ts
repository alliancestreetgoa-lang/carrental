export type CarStatus = 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'CNG' | 'LPG';
export type Transmission = 'MANUAL' | 'AUTOMATIC';
export type BookingStatus = 'RESERVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Car {
  id: string;
  carName: string;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  chassisNumber: string;
  fuelType: FuelType;
  transmission: Transmission;
  seatingCapacity: number;
  dailyRent: string;
  weeklyRent: string | null;
  monthlyRent: string | null;
  securityDeposit: string;
  insuranceExpiry: string | null;
  pollutionExpiry: string | null;
  rcExpiry: string | null;
  currentKilometer: number;
  status: CarStatus;
  images: string[];
  createdAt: string;
}

export interface CarExpense {
  id: string;
  category: string;
  amount: string;
  expenseDate: string;
  notes: string | null;
}

export interface CarBookingRow {
  id: string;
  pickupDate: string;
  returnDate: string;
  totalAmount: string;
  bookingStatus: BookingStatus;
  customer: { fullName: string };
}

export interface CarDetail extends Car {
  bookings: CarBookingRow[];
  expenses: CarExpense[];
}

export interface ListMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Customer {
  id: string;
  fullName: string;
  mobile: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  licenseNumber: string;
  licenseExpiry: string | null;
  aadhaarNumber: string | null;
  emergencyContact: string | null;
  notes: string | null;
  blacklisted: boolean;
  blacklistReason: string | null;
  createdAt: string;
}

export interface CustomerDocument {
  id: string;
  type: 'LICENSE' | 'AADHAAR' | 'PASSPORT' | 'RC' | 'INSURANCE' | 'POLLUTION' | 'PHOTO' | 'OTHER';
  fileUrl: string;
  ocrText: string | null;
  createdAt: string;
}

export interface CustomerBookingRow {
  id: string;
  pickupDate: string;
  returnDate: string;
  totalAmount: string;
  bookingStatus: BookingStatus;
  car: { carName: string; brand: string; registrationNumber: string };
}

export interface CustomerDetail extends Customer {
  bookings: CustomerBookingRow[];
  documents: CustomerDocument[];
  pendingDues: number;
  totalSpent: number;
}

export interface Booking {
  id: string;
  customerId: string;
  carId: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string | null;
  dropLocation: string | null;
  bookingStatus: BookingStatus;
  fuelLevel: string | null;
  returnFuelLevel: string | null;
  startKilometer: number | null;
  endKilometer: number | null;
  actualReturnDate: string | null;
  advancePayment: string;
  securityDeposit: string;
  totalAmount: string;
  lateFee: string;
  createdAt: string;
  customer: { fullName: string; mobile?: string; email?: string | null };
  car: { carName: string; brand: string; registrationNumber: string };
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: string;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
  paymentDate: string;
  notes: string | null;
}

export interface BillingPayment {
  id: string;
  amount: string;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
  paymentDate: string;
  notes: string | null;
  booking: {
    id: string;
    customer: { fullName: string };
    car: { carName: string; brand: string; registrationNumber: string };
  };
}

export type ExpenseCategory = 'FUEL' | 'SERVICE' | 'REPAIR' | 'INSURANCE' | 'CLEANING' | 'EMI' | 'OTHER';

export interface Expense {
  id: string;
  carId: string;
  category: ExpenseCategory;
  amount: string;
  expenseDate: string;
  notes: string | null;
  car: { carName: string; brand: string; registrationNumber: string };
}

export interface ExpenseSummary {
  total: number;
  monthTotal: number;
  count: number;
  byMonth: { month: string; total: number }[];
  byCategory: { category: string; total: number }[];
  byCar: { id: string; label: string; total: number }[];
}

export type UserRole = 'SUPER_ADMIN' | 'STAFF' | 'ACCOUNTANT';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'OVERDUE' | 'DUE_TODAY' | 'MAINTENANCE' | 'DOC_EXPIRY';
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  link?: string;
}

export interface ReportData {
  from: string;
  to: string;
  totals: {
    revenue: number;
    expenses: number;
    profit: number;
    bookings: number;
    avgBookingValue: number;
    utilization: number;
  };
  revenueByMonth: { month: string; revenue: number; expenses: number }[];
  statusMix: { status: string; count: number }[];
  topCars: { id: string; label: string; registrationNumber: string; bookings: number; revenue: number }[];
  topCustomers: { id: string; name: string; spent: number }[];
}

export interface ProfitCarRow {
  id: string;
  label: string;
  registrationNumber: string;
  revenue: number;
  expenses: number;
  profit: number;
  bookings: number;
  utilization: number;
  idle: boolean;
}

export interface ProfitPerCar {
  from: string;
  to: string;
  totals: { revenue: number; expenses: number; profit: number };
  cars: ProfitCarRow[];
}

export type MaintenanceType =
  | 'SERVICE' | 'OIL_CHANGE' | 'TYRE' | 'BRAKES' | 'BATTERY' | 'REPAIR' | 'INSPECTION' | 'CLEANING' | 'OTHER';
export type MaintenanceStatus = 'SCHEDULED' | 'COMPLETED';

export interface MaintenanceRecord {
  id: string;
  carId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  serviceDate: string | null;
  dueDate: string | null;
  odometer: number | null;
  cost: string;
  serviceCenter: string | null;
  notes: string | null;
  expenseId: string | null;
  createdAt: string;
  car: { carName: string; brand: string; registrationNumber: string };
}

export interface MaintenanceUpcoming {
  id: string;
  carId: string;
  carLabel: string;
  registrationNumber: string;
  type: MaintenanceType;
  dueDate: string | null;
  notes: string | null;
  overdue: boolean;
}

export interface MaintenanceExpiryAlert {
  carId: string;
  carLabel: string;
  registrationNumber: string;
  kind: 'INSURANCE' | 'POLLUTION' | 'RC';
  date: string;
  detail: string;
  expired: boolean;
}

export interface MaintenanceSummary {
  upcomingCount: number;
  overdueCount: number;
  completedThisMonth: number;
  totalCost: number;
  upcoming: MaintenanceUpcoming[];
  expiryAlerts: MaintenanceExpiryAlert[];
}

export interface BillingSummary {
  totalRevenue: number;
  monthRevenue: number;
  paymentCount: number;
  outstanding: number;
  byMethod: { method: string; total: number }[];
}

export interface BookingInvoice {
  rentTotal: number;
  lateFee: number;
  grandTotal: number;
  securityDeposit: number;
  advancePayment: number;
  paymentsReceived: number;
  balanceDue: number;
}

export interface BookingDetail extends Booking {
  totalDays: number;
  payments: Payment[];
  agreement: { id: string; agreementNumber: string; signed: boolean; signedAt: string | null } | null;
  invoice: BookingInvoice;
  car: { carName: string; brand: string; registrationNumber: string; dailyRent?: string };
}

export interface DashboardBookingRow {
  id: string;
  pickupDate: string;
  returnDate: string;
  totalAmount: string;
  bookingStatus: BookingStatus;
  customer: { fullName: string };
  car: { carName: string; brand: string; registrationNumber: string };
  overdue?: boolean;
}

export interface MaintenanceAlert {
  carId: string;
  carName: string;
  brand: string;
  registrationNumber: string;
  type: 'MAINTENANCE' | 'INSURANCE' | 'POLLUTION' | 'RC';
  detail: string;
}

export interface DashboardStats {
  cards: {
    totalCars: number;
    availableCars: number;
    activeRentals: number;
    pendingPaymentsAmount: number;
    pendingPaymentsCount: number;
    totalCustomers: number;
    monthlyRevenue: number;
  };
  monthlyRevenue: { month: string; revenue: number }[];
  bookingsAnalytics: { month: string; bookings: number }[];
  carUtilization: { status: string; count: number }[];
  recentBookings: DashboardBookingRow[];
  carsDueToday: DashboardBookingRow[];
  pendingReturns: DashboardBookingRow[];
  maintenanceAlerts: MaintenanceAlert[];
}
