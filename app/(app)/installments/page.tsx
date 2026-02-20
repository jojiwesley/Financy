import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CreditCard,
  Layers,
  Plus,
} from "lucide-react";
import type { Tables } from "@/types/database.types";
import {
  computeInstallmentSchedule,
  formatBillingMonth,
} from "@/lib/installments";
import { CancelInstallmentButton } from "@/components/installments/cancel-installment-button";
import { CalendarForecast } from "@/components/installments/calendar-forecast";
import type { CalendarEntry } from "@/components/installments/calendar-forecast";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type InstWithCard = Tables<"installments"> & {
  credit_cards: { id: string; name: string; color: string } | null;
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: {
    label: "Ativo",
    className:
      "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  },
  completed: {
    label: "Concluído",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  },
};

export default async function InstallmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all data in parallel
  const [{ data: rawInst }, { data: creditCardsRaw }] = await Promise.all([
    supabase
      .from("installments")
      .select("*, credit_cards(id, name, color)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("credit_cards").select("*").eq("user_id", user!.id),
  ]);

  const installments = (rawInst as InstWithCard[] | null) ?? [];
  const creditCards = (creditCardsRaw as Tables<"credit_cards">[] | null) ?? [];
  const cardsMap = new Map(creditCards.map((c) => [c.id, c]));

  const active = installments.filter((i) => i.status === "active" || !i.status);
  const inactive = installments.filter(
    (i) => i.status === "completed" || i.status === "cancelled",
  );

  // KPIs
  const totalMonthly = active.reduce(
    (sum, i) => sum + (i.installment_amount ?? 0),
    0,
  );
  const totalRemaining = active.reduce((sum, i) => {
    const rem =
      ((i.total_installments ?? 0) - (i.confirmed_installments ?? 0)) *
      (i.installment_amount ?? 0);
    return sum + rem;
  }, 0);

  // Build calendar entries + per-card month totals from all pending parcels
  const calendarEntries: CalendarEntry[] = [];
  const cardMonthMap = new Map<string, Map<string, number>>();

  for (const inst of active) {
    if (!inst.start_date || !inst.credit_card_id) continue;
    const card = cardsMap.get(inst.credit_card_id);
    if (!card) continue;

    const confirmedCount = inst.confirmed_installments ?? 0;
    const totalCount = inst.total_installments ?? 0;
    if (confirmedCount >= totalCount) continue;

    const schedule = computeInstallmentSchedule({
      installmentAmount: inst.installment_amount ?? 0,
      totalInstallments: totalCount,
      totalAmount: inst.total_amount ?? 0,
      purchaseDate: new Date(inst.start_date),
      closingDay: card.closing_day,
      dueDay: card.due_day,
      startParcel: confirmedCount + 1,
    });

    const cardInfo = inst.credit_cards;
    for (const parcel of schedule) {
      calendarEntries.push({
        date: parcel.dueDate,
        amount: parcel.amount,
        description: inst.description ?? "",
        parcelNumber: parcel.parcelNumber,
        totalInstallments: totalCount,
        cardColor: cardInfo?.color ?? "#6366f1",
        cardName: cardInfo?.name ?? "Cartão",
      });

      const monthKey = parcel.billingMonth.slice(0, 7);
      if (!cardMonthMap.has(inst.credit_card_id)) {
        cardMonthMap.set(inst.credit_card_id, new Map());
      }
      const cm = cardMonthMap.get(inst.credit_card_id)!;
      cm.set(monthKey, (cm.get(monthKey) ?? 0) + parcel.amount);
    }
  }

  // Alerts: >80% limit
  type ForecastAlert = {
    cardName: string;
    monthLabel: string;
    amount: number;
    pct: number;
    color: string;
  };
  const alerts: ForecastAlert[] = [];
  for (const [cardId, cardMap] of cardMonthMap.entries()) {
    const card = cardsMap.get(cardId);
    if (!card || !card.limit_amount) continue;
    for (const [monthKey, amount] of cardMap.entries()) {
      const pct = (amount / card.limit_amount) * 100;
      if (pct >= 80) {
        alerts.push({
          cardName: card.name,
          monthLabel: formatBillingMonth(`${monthKey}-01`),
          amount,
          pct,
          color: card.color ?? "#6366f1",
        });
      }
    }
  }

  // Resumo por Cartão — next 3 months
  const today = new Date();
  const next3Months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: formatBillingMonth(`${key}-01`) };
  });

  const cardForecasts = creditCards.map((card) => {
    const cardMap = cardMonthMap.get(card.id);
    const months = next3Months.map((m) => {
      const amount = cardMap?.get(m.key) ?? 0;
      const pct = card.limit_amount
        ? Math.min(100, (amount / card.limit_amount) * 100)
        : 0;
      return { ...m, amount, pct };
    });
    return { card, months };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Parcelamentos"
        description="Compras parceladas e previsão de débitos futuros"
      >
        <Link
          href="/installments/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:block">Nova Compra Parcelada</span>
          <span className="sm:hidden">Nova</span>
        </Link>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Comprometido/mês</p>
            <p className="mt-1 text-xl font-bold text-red-600">
              {fmt(totalMonthly)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total a pagar</p>
            <p className="mt-1 text-xl font-bold text-amber-600">
              {fmt(totalRemaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            <AlertTriangle className="h-4 w-4" />
            Alertas de Limite
          </h2>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"
              >
                <span
                  className="mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: alert.color }}
                />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>{alert.cardName}</strong> em{" "}
                  <strong>{alert.monthLabel}</strong>: {fmt(alert.amount)}{" "}
                  previsto —{" "}
                  <span className="font-semibold">
                    {alert.pct.toFixed(0)}% do limite
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active installments */}
      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-center text-muted-foreground">
            Nenhum parcelamento ativo.
          </p>
          <Link
            href="/installments/new"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Registrar primeira compra parcelada
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Layers className="h-4 w-4" />
            Parcelamentos Ativos
          </h2>
          {active.map((item) => {
            const cardInfo = item.credit_cards;
            const card = item.credit_card_id
              ? cardsMap.get(item.credit_card_id)
              : null;
            const confirmedCount = item.confirmed_installments ?? 0;
            const totalCount = item.total_installments ?? 1;
            const currentParcel = Math.min(confirmedCount + 1, totalCount);
            const isAllDone = confirmedCount >= totalCount;
            const progress = Math.round((confirmedCount / totalCount) * 100);
            const statusStyle = STATUS_LABEL[item.status ?? "active"];

            return (
              <Card key={item.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {cardInfo && (
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cardInfo.color }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {cardInfo && (
                            <Link
                              href={`/credit-cards/${cardInfo.id}`}
                              className="text-xs text-primary hover:underline"
                            >
                              {cardInfo.name}
                            </Link>
                          )}
                          <span className="text-xs text-muted-foreground">
                            ·
                          </span>
                          {isAllDone ? (
                            <span className="text-xs text-green-600 font-medium">
                              Concluído
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-foreground">
                              Parcela {currentParcel}/{totalCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-red-600">
                        {fmt(item.installment_amount ?? 0)}/mês
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total: {fmt(item.total_amount ?? 0)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: cardInfo?.color ?? "#6366f1",
                        }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>
                        {isAllDone
                          ? `${totalCount}/${totalCount} parcelas pagas`
                          : `${confirmedCount} paga${confirmedCount !== 1 ? "s" : ""} · ${totalCount - confirmedCount} restante${totalCount - confirmedCount !== 1 ? "s" : ""}`}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusStyle.className}`}
                      >
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end border-t pt-2">
                    <CancelInstallmentButton installmentId={item.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dynamic Calendar */}
      {calendarEntries.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Calendário de Vencimentos
          </h2>
          <Card>
            <CardContent className="p-4">
              <CalendarForecast entries={calendarEntries} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumo por cartão */}
      {cardForecasts.some((cf) => cf.months.some((m) => m.amount > 0)) && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Resumo por Cartão — Próximos 3 Meses
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {cardForecasts.map(({ card, months }) => {
              const hasData = months.some((m) => m.amount > 0);
              if (!hasData) return null;
              return (
                <Card key={card.id} className="overflow-hidden">
                  <div
                    className="px-4 py-3 text-white text-sm font-semibold"
                    style={{ backgroundColor: card.color ?? "#6366f1" }}
                  >
                    {card.name}
                    {card.last_four_digits && (
                      <span className="ml-2 text-xs opacity-80">
                        •••• {card.last_four_digits}
                      </span>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {months.map((m) => (
                      <div key={m.key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{m.label}</span>
                          <span
                            className={cn(
                              "font-semibold",
                              m.pct >= 80
                                ? "text-amber-600"
                                : m.amount > 0
                                  ? "text-red-600"
                                  : "text-muted-foreground",
                            )}
                          >
                            {m.amount > 0 ? fmt(m.amount) : "—"}
                          </span>
                        </div>
                        {m.amount > 0 && (
                          <>
                            <div className="h-1.5 w-full rounded-full bg-slate-100">
                              <div
                                className={cn(
                                  "h-1.5 rounded-full transition-all",
                                  m.pct >= 80 ? "bg-amber-400" : "bg-primary",
                                )}
                                style={{ width: `${m.pct}%` }}
                              />
                            </div>
                            {card.limit_amount && (
                              <p className="text-right text-[10px] text-muted-foreground">
                                {m.pct.toFixed(0)}% do limite (
                                {fmt(card.limit_amount)})
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    <Link
                      href={`/credit-cards/${card.id}`}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Ver fatura
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Histórico */}
      {inactive.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Histórico
          </h2>
          <Card>
            <div className="divide-y">
              {inactive.map((item) => {
                const cardInfo = item.credit_cards;
                const statusStyle = STATUS_LABEL[item.status ?? "completed"];
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {cardInfo && (
                        <div
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0 opacity-50"
                          style={{ backgroundColor: cardInfo.color }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate text-muted-foreground">
                          {item.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.total_installments}x ·{" "}
                          {fmt(item.total_amount ?? 0)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${statusStyle.className}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
