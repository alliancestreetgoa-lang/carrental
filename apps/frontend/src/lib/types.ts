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
  createdAt: string;
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
  startKilometer: number | null;
  endKilometer: number | null;
  advancePayment: string;
  securityDeposit: string;
  totalAmount: string;
  createdAt: string;
  customer: { fullName: string; mobile?: string; email?: string | null };
  car: { carName: string; brand: string; registrationNumber: string };
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
