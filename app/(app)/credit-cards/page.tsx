import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, CreditCard } from "lucide-react";
import type { Tables } from "@/types/database.types";

export default async function CreditCardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch cards and current-month transactions together
  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [{ data: cardsRaw }, { data: txRaw }] = await Promise.all([
    supabase
      .from("credit_cards")
      .select("*")
      .eq("user_id", user!.id)
      .order("name"),
    supabase
      .from("transactions")
      .select("credit_card_id, amount, type")
      .eq("user_id", user!.id)
      .eq("type", "expense")
      .not("credit_card_id", "is", null)
      .gte("date", monthStart)
      .lte("date", monthEnd),
  ]);

  const cards = cardsRaw as Tables<"credit_cards">[] | null;

  // Build a map: credit_card_id → spent amount this month
  const spentMap = new Map<string, number>();
  for (const tx of txRaw ?? []) {
    if (!tx.credit_card_id) continue;
    spentMap.set(
      tx.credit_card_id,
      (spentMap.get(tx.credit_card_id) ?? 0) + (tx.amount ?? 0),
    );
  }

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartões de Crédito"
        description="Gerencie seus cartões e faturas"
      >
        <Link
          href="/credit-cards/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Cartão
        </Link>
      </PageHeader>

      {(cards ?? []).length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          Nenhum cartão cadastrado.{" "}
          <Link href="/credit-cards/new" className="text-primary underline">
            Adicione um agora
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(cards ?? []).map((card) => {
            const usedAmount = spentMap.get(card.id) ?? 0;
            const available = Math.max(
              0,
              (card.limit_amount ?? 0) - usedAmount,
            );
            const usedPercent = card.limit_amount
              ? Math.min(100, (usedAmount / card.limit_amount) * 100)
              : 0;
            const isWarning = usedPercent >= 80;
            return (
              <Link key={card.id} href={`/credit-cards/${card.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div
                    className="relative p-5 pb-3 text-white"
                    style={{ backgroundColor: card.color ?? "#6366f1" }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-lg">{card.name}</p>
                        {card.last_four_digits && (
                          <p className="text-xs opacity-80">
                            •••• {card.last_four_digits}
                          </p>
                        )}
                      </div>
                      <CreditCard className="h-6 w-6 opacity-80" />
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Fatura do mês
                      </span>
                      <span
                        className={`font-medium ${isWarning ? "text-red-600" : ""}`}
                      >
                        {fmt(usedAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Disponível</span>
                      <span className="font-medium text-green-600">
                        {fmt(available)}
                      </span>
                    </div>
                    <div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full transition-all ${isWarning ? "bg-red-500" : "bg-primary"}`}
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-xs text-muted-foreground">
                        {usedPercent.toFixed(0)}% utilizado
                      </p>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Fechamento: dia {card.closing_day}</span>
                      <span>Vencimento: dia {card.due_day}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
