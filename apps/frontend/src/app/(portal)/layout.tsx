import type { Metadata } from 'next';
import { CustomerAuthProvider } from '@/providers/CustomerAuthProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import { PortalNavbar } from '@/components/portal/PortalNavbar';
import { Footer } from '@/components/portal/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3011'),
  title: {
    default: 'Alliance Car Rental — Premium self-drive cars in Goa',
    template: '%s | Alliance Car Rental',
  },
  description:
    'Alliance Car Rental offers premium self-drive cars in Goa. Browse a hand-picked fleet, book instantly, and explore Goa at your own pace — transparent INR pricing, no hidden fees.',
  keywords: [
    'car rental Goa',
    'self drive car Goa',
    'rent a car Goa',
    'Goa car hire',
    'cheap car rental Goa',
    'Alliance Car Rental',
    'Calangute car rental',
    'self-drive Goa',
    'premium car rental',
  ],
  openGraph: {
    title: 'Alliance Car Rental — Premium self-drive cars in Goa',
    description:
      'Browse a hand-picked fleet of well-maintained cars in Goa. Pick your dates, confirm instantly, and hit the road.',
    type: 'website',
    siteName: 'Alliance Car Rental',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3011',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alliance Car Rental — Premium self-drive cars in Goa',
    description:
      'Browse a hand-picked fleet of well-maintained cars in Goa. Pick your dates, confirm instantly, and hit the road.',
  },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerAuthProvider>
      <SocketProvider>
        <div className="min-h-screen flex flex-col bg-white text-slate-900">
          <PortalNavbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </SocketProvider>
    </CustomerAuthProvider>
  );
}
