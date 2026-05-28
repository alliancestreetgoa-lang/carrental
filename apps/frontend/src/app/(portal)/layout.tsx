import type { Metadata } from 'next';
import { CustomerAuthProvider } from '@/providers/CustomerAuthProvider';
import { PortalNavbar } from '@/components/portal/PortalNavbar';
import { Footer } from '@/components/portal/Footer';

export const metadata: Metadata = { title: 'Alliance Car Rental — Book a car', description: 'Rent premium cars across Goa.' };

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerAuthProvider>
      <div className="min-h-screen flex flex-col bg-white text-slate-900">
        <PortalNavbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CustomerAuthProvider>
  );
}
