export interface PortalCar {
  id: string; carName: string; brand: string; model: string; year: number;
  registrationNumber: string; fuelType: string; transmission: string; seatingCapacity: number;
  dailyRent: string; weeklyRent: string | null; monthlyRent: string | null; securityDeposit: string;
  images: string[]; status: string;
}
export interface PortalCustomer {
  id: string; fullName: string; email: string | null; mobile: string;
  whatsapp: string | null; address: string | null; licenseNumber: string; licenseExpiry: string | null; createdAt: string;
}
export interface PortalBookingRow {
  id: string; pickupDate: string; returnDate: string; totalAmount: string; bookingStatus: string;
  car: { carName: string; brand: string; registrationNumber: string; images: string[] };
  payments: { amount: string }[];
}
export interface Availability { available: boolean; conflicts: { pickupDate: string; returnDate: string }[]; }
