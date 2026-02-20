import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard, Plus } from "lucide-react";
import type { Tables } from "@/types/database.types";
import { InvoiceTabsClient } from "@/components/installments/invoice-tabs-client";

/** Compute the start (exclusive) and end (inclusive) dates of the current billing cycle */
function computeBillingCycle(closingDay: number): {
  start: string;
  end: string;
} {
  const today = new Date();
  const day = today.getDate();

  let cycleStart: Date;
  let cycleEnd: Date;

  if (day <= closingDay) {
    // We're before this month's closing: cycle = last month's closing+1 → this month's closing
    const prevMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      closingDay + 1,
    );
    cycleStart = prevMonth;
    cycleEnd = new Date(today.getFullYear(), today.getMonth(), closingDay);
  } else {
    // We're after this month's closing: cycle = this month's closing+1 → next month's closing
    cycleStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      closingDay + 1,
    );
    cycleEnd = new Date(today.getFullYear(), today.getMonth() + 1, closingDay);
  }

  return {
    start: cycleStart.toISOString().split("T")[0],
    end: cycleEnd.toISOString().split("T")[0],
  };
}

export default async function CreditCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: cardRaw },
    { data: transactionsRaw },
    { data: installmentsRaw },
  ] = await Promise.all([
    supabase
      .from("credit_cards")
      .select("*")
      .eq("id", id)
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("transactions")
      .select("*, categories(name, color)")
      .eq("credit_card_id", id)
      .eq("user_id", user!.id)
      .order("date", { ascending: false })
      .limit(200),
    supabase
      .from("installments")
      .select("*")
      .eq("credit_card_id", id)
      .eq("user_id", user!.id)
      .neq("status", "cancelled"),
  ]);

  if (!cardRaw) notFound();
  const card = cardRaw as Tables<"credit_cards">;
  const transactions =
    (transactionsRaw as
      | (Tables<"transactions"> & {
          categories: { name: string; color: string } | null;
        })[]
      | null) ?? [];
  const installments =
    (installmentsRaw as Tables<"installments">[] | null) ?? [];

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const { start: cycleStart, end: cycleEnd } = computeBillingCycle(
    card.closing_day,
  );

  // For the card visual: compute used amount in the current cycle
  const currentCycleSpent = transactions
    .filter((t) => {
      if (t.type !== "expense") return false;
      const txDate = t.billing_month ?? t.date;
      return txDate >= cycleStart && txDate <= cycleEnd;
    })
    .reduce((s, t) => s + (t.amount ?? 0), 0);

  const available = Math.max(0, (card.limit_amount ?? 0) - currentCycleSpent);
  const usedPct = Math.min(
    100,
    (currentCycleSpent / (card.limit_amount ?? 1)) * 100,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={card.name}
        description={
          card.last_four_digits ? `•••• ${card.last_four_digits}` : undefined
        }
      >
        <div className="flex gap-2">
          <Link
            href={`/transactions/new`}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:block">Lançamento</span>
          </Link>
          <Link
            href="/credit-cards"
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
          >
            Voltar
          </Link>
        </div>
      </PageHeader>

      {/* Card visual */}
      <Card className="overflow-hidden max-w-sm">
        <div
          className="relative p-6 text-white"
          style={{ backgroundColor: card.color ?? "#6366f1" }}
        >
          <CreditCard className="h-8 w-8 mb-4 opacity-80" />
          <p className="text-xl font-bold">{card.name}</p>
          {card.last_four_digits && (
            <p className="text-sm opacity-80">
              •••• •••• •••• {card.last_four_digits}
            </p>
          )}
        </div>
        <CardContent className="p-5 space-y-3">
          {[
            { label: "Limite total", value: fmt(card.limit_amount ?? 0) },
            { label: "Fatura atual", value: fmt(currentCycleSpent) },
            { label: "Disponível", value: fmt(available) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fechamento: dia {card.closing_day}</span>
            <span>Vencimento: dia {card.due_day}</span>
          </div>
        </CardContent>
      </Card>

      {/* Invoice tabs */}
      <InvoiceTabsClient
        card={card}
        transactions={transactions}
        installments={installments}
        currentCycleStart={cycleStart}
        currentCycleEnd={cycleEnd}
      />
    </div>
  );
}
