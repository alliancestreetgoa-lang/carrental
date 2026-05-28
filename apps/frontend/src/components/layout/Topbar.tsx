'use client';
import { Menu, Bell, Search } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/fleet': 'Fleet Management',
  '/bookings': 'Bookings',
  '/calendar': 'Booking Calendar',
  '/customers': 'Customers',
  '/billing': 'Billing',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
};

export function Topbar() {
  const { toggleSidebar } = useUIStore();
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? 'Alliance Car Rental';

  return (
    <header className="h-16 flex items-center gap-4 px-6 bg-background border-b border-border">
      <Button variant="ghost" size="icon" className="cursor-pointer" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="flex-1" />
      <div className="hidden md:flex items-center gap-2 max-w-sm w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9 h-9 bg-muted/50 border-0" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="cursor-pointer relative">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] bg-red-600 text-white flex items-center justify-center rounded-full">3</Badge>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
