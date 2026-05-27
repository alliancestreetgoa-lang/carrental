'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Wrench, ShieldAlert, Leaf, FileWarning } from 'lucide-react';
import type { MaintenanceAlert } from '@/lib/types';

const iconFor = {
  MAINTENANCE: Wrench,
  INSURANCE: ShieldAlert,
  POLLUTION: Leaf,
  RC: FileWarning,
} as const;

export function MaintenanceAlerts({ alerts }: { alerts: MaintenanceAlert[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Maintenance Alerts
          {alerts.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">{alerts.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">All vehicles in good standing</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((a, i) => {
              const Icon = iconFor[a.type];
              return (
                <div key={`${a.carId}-${a.type}-${i}`} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.brand} {a.carName}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.registrationNumber} · {a.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
