"use client";

import { cn } from "@/lib/utils";

type MonthData = {
  key: string; // 'YYYY-MM'
  label: string;
  installments: number;
  bills: number;
  total: number;
  income: number;
  balance: number; // cumulative
};

type Props = { months: MonthData[] };

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ForecastBalanceChart({ months }: Props) {
  const maxExpense = Math.max(...months.map((m) => m.total), 1);
  const maxIncome = Math.max(...months.map((m) => m.income), 1);
  const maxBar = Math.max(maxExpense, maxIncome);

  return (
    <div className="space-y-3">
      {/* Bar chart */}
      <div className="space-y-2">
        {months.map((month) => {
          const expensePct = Math.min(100, (month.total / maxBar) * 100);
          const incomePct = Math.min(100, (month.income / maxBar) * 100);
          const isSurplus = month.income >= month.total;
          return (
            <div key={month.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium w-16 flex-shrink-0">
                  {month.label}
                </span>
                <div className="flex items-center gap-3 text-muted-foreground">
                  {month.income > 0 && (
                    <span className="text-green-600 font-medium">
                      {fmt(month.income)}
                    </span>
                  )}
                  <span
                    className={cn(
                      "font-semibold",
                      isSurplus ? "text-green-600" : "text-red-600",
                    )}
                  >
                    -{fmt(month.total)}
                  </span>
                </div>
              </div>
              <div className="relative h-4 w-full rounded-full bg-slate-100 overflow-hidden">
                {/* Income bar (green, background) */}
                {month.income > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-green-200 transition-all"
                    style={{ width: `${incomePct}%` }}
                  />
                )}
                {/* Expense bar (red/amber, foreground) */}
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all",
                    month.total > month.income ? "bg-red-500" : "bg-primary",
                  )}
                  style={{ width: `${expensePct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-200" />
          Receita estimada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
          Despesas previstas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          Déficit
        </span>
      </div>
    </div>
  );
}
