"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import {
  computeInstallmentSchedule,
  formatBillingMonth,
} from "@/lib/installments";
import type { Tables } from "@/types/database.types";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

type Transaction = Tables<"transactions"> & {
  categories: { name: string; color: string } | null;
};

type Installment = Tables<"installments">;

type CreditCardInvoice = {
  card: Tables<"credit_cards">;
  transactions: Transaction[];
  installments: Installment[];
  currentCycleStart: string;
  currentCycleEnd: string;
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Tab = "current" | "upcoming" | "history";

/** Groups transactions by billing_month (falling back to date month) */
function groupByBillingMonth(
  transactions: Transaction[],
): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = tx.billing_month
      ? tx.billing_month.slice(0, 7) // 'YYYY-MM'
      : tx.date.slice(0, 7);
    const group = map.get(key) ?? [];
    group.push(tx);
    map.set(key, group);
  }
  return map;
}

export function InvoiceTabsClient({
  card,
  transactions,
  installments,
  currentCycleStart,
  currentCycleEnd,
}: CreditCardInvoice) {
  const [tab, setTab] = useState<Tab>("current");

  // ------------------------------------------------------------------
  // Current invoice
  // ------------------------------------------------------------------
  const currentTransactions = transactions.filter((tx) => {
    const txDate = tx.billing_month ?? tx.date;
    return txDate >= currentCycleStart && txDate <= currentCycleEnd;
  });
  const currentTotal = currentTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + (t.amount ?? 0), 0);

  const usedPercent = Math.min(
    100,
    (currentTotal / (card.limit_amount ?? 1)) * 100,
  );
  const isOverLimit = currentTotal > (card.limit_amount ?? 0);

  // ------------------------------------------------------------------
  // Upcoming invoices (next 6 months from installments)
  // ------------------------------------------------------------------
  type UpcomingMonth = {
    key: string;
    label: string;
    projected: number;
    confirmed: number;
  };
  const upcomingMap = new Map<string, UpcomingMonth>();

  // Build months for the next 6 months
  const today = new Date();
  for (let i = 1; i <= 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    upcomingMap.set(key, {
      key,
      label: formatBillingMonth(`${key}-01`),
      projected: 0,
      confirmed: 0,
    });
  }

  // Add confirmed future transactions
  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    const monthKey = (tx.billing_month ?? tx.date).slice(0, 7);
    if (upcomingMap.has(monthKey)) {
      const m = upcomingMap.get(monthKey)!;
      m.confirmed += tx.amount ?? 0;
    }
  }

  // Add pending parcel projections
  for (const inst of installments) {
    if (inst.status === "cancelled" || !inst.start_date) continue;
    const schedule = computeInstallmentSchedule({
      installmentAmount: inst.installment_amount ?? 0,
      totalInstallments: inst.total_installments ?? 0,
      totalAmount: inst.total_amount ?? 0,
      purchaseDate: new Date(inst.start_date),
      closingDay: card.closing_day,
      dueDay: card.due_day,
      startParcel: (inst.confirmed_installments ?? 0) + 1,
    });

    for (const parcel of schedule) {
      const monthKey = parcel.billingMonth.slice(0, 7);
      if (upcomingMap.has(monthKey)) {
        const m = upcomingMap.get(monthKey)!;
        m.projected += parcel.amount;
      }
    }
  }

  const upcomingMonths = Array.from(upcomingMap.values());

  // ------------------------------------------------------------------
  // History (grouped by billing month, past)
  // ------------------------------------------------------------------
  const pastTransactions = transactions.filter((tx) => {
    const txDate = (tx.billing_month ?? tx.date).slice(0, 7);
    const cycleMonth = currentCycleStart.slice(0, 7);
    return txDate < cycleMonth;
  });
  const historyGroups = groupByBillingMonth(pastTransactions);
  const historySorted = Array.from(historyGroups.entries()).sort((a, b) =>
    b[0].localeCompare(a[0]),
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "current", label: "Fatura Atual" },
    { key: "upcoming", label: "Próximas" },
    { key: "history", label: "Histórico" },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex rounded-xl border-2 border-input p-1 gap-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold transition-all",
              tab === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Current invoice */}
      {tab === "current" && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="space-y-2 rounded-xl border p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total nesta fatura</span>
              <span
                className={cn(
                  "font-bold",
                  isOverLimit ? "text-red-600" : "text-foreground",
                )}
              >
                {fmt(currentTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Disponível</span>
              <span className="font-medium text-green-600">
                {fmt(Math.max(0, (card.limit_amount ?? 0) - currentTotal))}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  isOverLimit ? "bg-red-500" : "bg-primary",
                )}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
            {isOverLimit && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Limite ultrapassado em{" "}
                {fmt(currentTotal - (card.limit_amount ?? 0))}
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>
                Período:{" "}
                {new Date(currentCycleStart).toLocaleDateString("pt-BR")} —{" "}
                {new Date(currentCycleEnd).toLocaleDateString("pt-BR")}
              </span>
              <span>Vence dia {card.due_day}</span>
            </div>
          </div>

          {/* Transaction list */}
          {currentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lançamento neste ciclo.
            </p>
          ) : (
            <Card>
              <div className="divide-y">
                {currentTransactions.map((tx) => {
                  const cat = tx.categories;
                  return (
                    <Link
                      key={tx.id}
                      href={`/transactions/${tx.id}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat?.color ?? "#94a3b8" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.description ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cat?.name ?? "Sem categoria"} ·{" "}
                          {new Date(tx.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-semibold flex-shrink-0",
                          tx.type === "income"
                            ? "text-green-600"
                            : "text-red-600",
                        )}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {fmt(tx.amount ?? 0)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Upcoming */}
      {tab === "upcoming" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground px-1">
            Projeção dos próximos 6 meses baseada nos parcelamentos ativos.
            &quot;Previsto&quot; = parcelas ainda não confirmadas.
          </p>
          {upcomingMonths.every((m) => m.projected + m.confirmed === 0) ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma despesa prevista para os próximos meses.
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingMonths.map((month) => {
                const total = month.projected + month.confirmed;
                const limitPct = Math.min(
                  100,
                  (total / (card.limit_amount ?? 1)) * 100,
                );
                const iswarning = limitPct >= 80;
                return (
                  <div
                    key={month.key}
                    className="rounded-xl border p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{month.label}</p>
                      <span
                        className={cn(
                          "text-sm font-bold",
                          iswarning ? "text-amber-600" : "text-foreground",
                        )}
                      >
                        {fmt(total)}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {month.confirmed > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                          Confirmado: {fmt(month.confirmed)}
                        </span>
                      )}
                      {month.projected > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                          Previsto: {fmt(month.projected)}
                        </span>
                      )}
                    </div>
                    {total > 0 && (
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className={cn(
                            "h-1.5 rounded-full",
                            iswarning ? "bg-amber-400" : "bg-primary",
                          )}
                          style={{ width: `${limitPct}%` }}
                        />
                      </div>
                    )}
                    {iswarning && (
                      <p className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        {limitPct.toFixed(0)}% do limite comprometido
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-3">
          {historySorted.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum histórico disponível.
            </p>
          ) : (
            historySorted.map(([monthKey, txs]) => {
              const total = txs
                .filter((t) => t.type === "expense")
                .reduce((s, t) => s + (t.amount ?? 0), 0);
              return (
                <div key={monthKey} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-sm font-semibold">
                      {formatBillingMonth(`${monthKey}-01`)}
                    </p>
                    <span className="text-sm font-bold text-red-600">
                      {fmt(total)}
                    </span>
                  </div>
                  <Card>
                    <div className="divide-y">
                      {txs.map((tx) => {
                        const cat = tx.categories;
                        return (
                          <Link
                            key={tx.id}
                            href={`/transactions/${tx.id}`}
                            className="flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors"
                          >
                            <div
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: cat?.color ?? "#94a3b8",
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {tx.description ?? "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {cat?.name ?? "Sem categoria"} ·{" "}
                                {new Date(tx.date).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "text-sm font-semibold flex-shrink-0",
                                tx.type === "income"
                                  ? "text-green-600"
                                  : "text-red-600",
                              )}
                            >
                              {tx.type === "income" ? "+" : "-"}
                              {fmt(tx.amount ?? 0)}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
