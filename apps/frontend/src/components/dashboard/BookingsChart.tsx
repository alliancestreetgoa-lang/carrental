'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function BookingsChart({ data }: { data: { month: string; bookings: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Bookings Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <Tooltip formatter={(v) => [`${Number(v)}`, 'Bookings']} cursor={{ fill: 'rgba(100,116,139,0.1)' }} />
            <Bar dataKey="bookings" fill="#1e293b" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
