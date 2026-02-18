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
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name === 'receitas' ? 'Receitas' : 'Despesas'}:</span>
          <span className="font-semibold text-slate-800">{fmt(p.value)}</span>
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
    <div className="px-2 pb-4 pt-2">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={monthlyData}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          barCategoryGap="28%"
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) =>
              v >= 1000
                ? `R$${(v / 1000).toFixed(0)}k`
                : `R$${v}`
            }
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={50}
            domain={[0, maxVal * 1.15 || 100]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 6 }} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: '#64748b', fontSize: 12 }}>
                {value === 'receitas' ? 'Receitas' : 'Despesas'}
              </span>
            )}
          />
          <Bar
            dataKey="receitas"
            name="receitas"
            fill="#22c55e"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="despesas"
            name="despesas"
            fill="#f87171"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
