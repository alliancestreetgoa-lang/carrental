'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, AlertTriangle, Clock, Wrench, FileWarning } from 'lucide-react';
import { api } from '@/lib/api';
import { useRealtime, BOOKING_EVENTS, CAR_EVENTS } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/lib/types';

const ICON = { OVERDUE: AlertTriangle, DUE_TODAY: Clock, MAINTENANCE: Wrench, DOC_EXPIRY: FileWarning };
const SEV = {
  high: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  medium: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  low: 'text-slate-500 bg-muted',
};

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api.get('/notifications').then((res) => setItems(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useRealtime([...BOOKING_EVENTS, ...CAR_EVENTS], load);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const go = (n: AppNotification) => { setOpen(false); if (n.link) router.push(n.link); };

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="cursor-pointer relative" onClick={() => setOpen((o) => !o)}>
        <Bell className="h-4 w-4" />
        {items.length > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-red-600 text-white flex items-center justify-center rounded-full border-0">
            {items.length}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg z-50">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            <span className="text-xs text-muted-foreground">{items.length}</span>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">You&apos;re all caught up</p>
          ) : (
            <div className="divide-y divide-border">
              {items.map((n) => {
                const Icon = ICON[n.type];
                return (
                  <button key={n.id} onClick={() => go(n)} className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50 cursor-pointer transition-colors">
                    <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', SEV[n.severity])}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{n.title}</span>
                      <span className="block text-xs text-muted-foreground truncate">{n.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
