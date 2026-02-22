"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { formatBalance } from "@/lib/time-tracking";

interface WeeklyChartData {
  day: string;
  balance: number; // minutes
  worked: number; // minutes
  expected: number; // minutes
}

interface TimeTrackingChartsProps {
  weeklyData: WeeklyChartData[];
  monthlyBalance: number; // total balance in minutes for the month
}

function minutesToHours(minutes: number): number {
  return parseFloat((minutes / 60).toFixed(2));
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: Record<string, unknown>;
  }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const worked = payload.find((p) => p.dataKey === "worked");
    const balance = payload.find((p) => p.dataKey === "balance");
    return (
      <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl p-3 shadow-xl text-xs space-y-1.5">
        <p className="font-semibold text-foreground">{label}</p>
        {worked && (
          <p className="text-blue-500">
            Trabalhado:{" "}
            <span className="font-medium">
              {Math.floor(worked.value)}h {Math.round((worked.value % 1) * 60)}
              min
            </span>
          </p>
        )}
        {balance && (
          <p
            className={
              balance.value >= 0 ? "text-emerald-500" : "text-rose-500"
            }
          >
            Saldo:{" "}
            <span className="font-medium">
              {formatBalance(Math.round(balance.value * 60))}
            </span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function TimeTrackingWeeklyChart({
  weeklyData,
}: {
  weeklyData: WeeklyChartData[];
}) {
  const chartData = weeklyData.map((d) => ({
    day: d.day,
    worked: minutesToHours(d.worked),
    expected: minutesToHours(d.expected),
    balance: minutesToHours(d.balance),
    balanceMin: d.balance,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.5}
        />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}h`}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
        />
        <ReferenceLine y={0} stroke="hsl(var(--border))" />
        <Bar
          dataKey="worked"
          name="Trabalhado"
          radius={[6, 6, 0, 0]}
          maxBarSize={36}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={
                entry.balanceMin >= 0 ? "hsl(var(--primary))" : "#f43f5e" // rose-500 for negative balance
              }
              opacity={entry.worked === 0 ? 0.2 : 0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TimeBalanceChart({
  data,
}: {
  data: { week: string; balance: number }[];
}) {
  const chartData = data.map((d) => ({
    week: d.week,
    balance: minutesToHours(d.balance),
    balanceMin: d.balance,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.5}
        />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}h`}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
          content={({
            active,
            payload,
            label,
          }: {
            active?: boolean;
            payload?: Array<{ payload: { balanceMin: number } }>;
            label?: string;
          }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0];
            return (
              <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl p-3 shadow-xl text-xs space-y-1">
                <p className="font-semibold">{label}</p>
                <p
                  className={
                    p?.payload?.balanceMin >= 0
                      ? "text-emerald-500"
                      : "text-rose-500"
                  }
                >
                  Saldo:{" "}
                  <span className="font-medium">
                    {formatBalance(Math.round(p?.payload?.balanceMin ?? 0))}
                  </span>
                </p>
              </div>
            );
          }}
        />
        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
        <Bar
          dataKey="balance"
          name="Saldo"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.balanceMin >= 0 ? "#10b981" : "#f43f5e"}
              opacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
