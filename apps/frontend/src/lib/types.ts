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
  createdAt: string;
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

export interface DashboardStats {
  totalCars: number;
  availableCars: number;
  bookedCars: number;
  maintenanceCars: number;
  totalCustomers: number;
  activeBookings: number;
  monthlyRevenue: string;
  monthlyExpenses: string;
  recentBookings: Array<{
    id: string;
    pickupDate: string;
    totalAmount: string;
    bookingStatus: BookingStatus;
    customer: { fullName: string };
    car: { carName: string; brand: string; registrationNumber: string };
  }>;
}
