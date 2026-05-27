'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import {
  Car, LayoutDashboard, Users, CalendarDays, Receipt,
  Settings, ChevronLeft, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/fleet', label: 'Fleet', icon: Car },
  { href: '/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/billing', label: 'Billing', icon: Receipt },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-border z-40 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-[260px]' : 'w-[68px]'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Car className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-sm text-foreground whitespace-nowrap">Alliance Car Rental</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn('cursor-pointer flex-shrink-0 h-8 w-8', !sidebarOpen && 'hidden')}
          onClick={toggleSidebar}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
          </Link>
        ))}
      </nav>

      <Separator />

      <div className="p-3">
        <div className={cn('flex items-center gap-3 p-2 rounded-lg', sidebarOpen && 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-red-600 text-white text-xs">
              {user?.name?.charAt(0) ?? 'A'}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
          )}
          {sidebarOpen && (
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer flex-shrink-0" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
