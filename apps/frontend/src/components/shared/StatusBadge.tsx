import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const colors: Record<string, string> = {
  // Booking statuses
  RESERVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  COMPLETED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Car statuses
  AVAILABLE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  BOOKED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  MAINTENANCE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge className={cn('text-xs px-2 py-0.5 rounded-md border-0 font-medium', colors[status] ?? 'bg-slate-100 text-slate-600', className)}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
