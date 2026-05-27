'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', revenue: 4200 },
  { month: 'Feb', revenue: 5800 },
  { month: 'Mar', revenue: 5100 },
  { month: 'Apr', revenue: 7200 },
  { month: 'May', revenue: 6800 },
  { month: 'Jun', revenue: 8900 },
  { month: 'Jul', revenue: 9200 },
  { month: 'Aug', revenue: 8100 },
  { month: 'Sep', revenue: 7600 },
  { month: 'Oct', revenue: 8800 },
  { month: 'Nov', revenue: 9500 },
  { month: 'Dec', revenue: 11200 },
];

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E293B" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1E293B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `$${Number(v) / 1000}k`} />
            <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#1E293B" fill="url(#revenueGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
