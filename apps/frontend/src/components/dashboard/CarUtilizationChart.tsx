'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS: Record<string, string> = {
  AVAILABLE: '#10b981',
  BOOKED: '#3b82f6',
  MAINTENANCE: '#f59e0b',
  OUT_OF_SERVICE: '#ef4444',
};

const label = (s: string) => s.replace(/_/g, ' ');

export function CarUtilizationChart({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Car Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">No vehicles yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.status} fill={COLORS[entry.status] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${Number(v)} cars`, label(String(n))]} />
              <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{label(String(value))}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
