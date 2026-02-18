'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type MonthData = {
  month: string;
  receitas: number;
  despesas: number;
};

interface Props {
  monthlyData: MonthData[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-background/80 backdrop-blur-xl p-3 shadow-xl text-sm ring-1 ring-black/5">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-muted-foreground capitalize">{p.name === 'receitas' ? 'Receitas' : 'Despesas'}:</span>
          <span className="font-semibold text-foreground tabular-nums">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardCharts({ monthlyData }: Props) {
  const maxVal = Math.max(
    ...monthlyData.map((m) => Math.max(m.receitas, m.despesas))
  );

  return (
    <div className="px-2 pb-4 pt-2 h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={monthlyData}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          barCategoryGap="28%"
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--border))" opacity={0.4} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tickFormatter={(v) =>
              v >= 1000
                ? `R$${(v / 1000).toFixed(0)}k`
                : `R$${v}`
            }
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={50}
            domain={[0, maxVal * 1.15 || 100]}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 6 }} 
          />
          <Legend
            verticalAlign="top"
            align="right" 
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground font-medium ml-1">
                {value === 'receitas' ? 'Receitas' : 'Despesas'}
              </span>
            )}
          />
          <Bar
            dataKey="receitas"
            name="receitas"
            fill="rgb(16 185 129)" // emerald-500
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="despesas"
            name="despesas"
            fill="rgb(244 63 94)" // rose-500
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
