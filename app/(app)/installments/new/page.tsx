"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  computeInstallmentSchedule,
  formatBillingMonth,
} from "@/lib/installments";
import { createInstallment } from "../actions";
import { cn } from "@/lib/utils";
import { Check, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CreditCard = {
  id: string;
  name: string;
  color: string | null;
  closing_day: number;
  due_day: number;
};
type Category = { id: string; name: string; color: string | null };

function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const n = parseInt(digits, 10);
  return (n / 100)
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseCurrency(formatted: string): number {
  const clean = formatted.replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function NewInstallmentPage() {
  const [description, setDescription] = useState("");
  const [creditCardId, setCreditCardId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [totalInstallments, setTotalInstallments] = useState(2);
  const [totalAmountRaw, setTotalAmountRaw] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startInstallment, setStartInstallment] = useState(1);
  const [inputMode, setInputMode] = useState<"total" | "monthly">("total");

  const [cards, setCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase
          .from("credit_cards")
          .select("id, name, color, closing_day, due_day")
          .eq("user_id", user.id)
          .order("name"),
        supabase
          .from("categories")
          .select("id, name, color")
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .eq("type", "expense")
          .order("name"),
      ]).then(([{ data: c }, { data: cats }]) => {
        const cardList = (c as CreditCard[]) ?? [];
        setCards(cardList);
        if (cardList.length > 0 && !creditCardId)
          setCreditCardId(cardList[0].id);
        setCategories((cats as Category[]) ?? []);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAmount = parseCurrency(totalAmountRaw);
  const installmentAmount =
    totalInstallments > 0 && totalAmount > 0
      ? parseFloat((totalAmount / totalInstallments).toFixed(2))
      : 0;

  const selectedCard = useMemo(
    () => cards.find((c) => c.id === creditCardId) ?? null,
    [cards, creditCardId],
  );

  const schedule = useMemo(() => {
    if (
      !selectedCard ||
      totalAmount <= 0 ||
      totalInstallments < 1 ||
      !purchaseDate
    )
      return [];
    return computeInstallmentSchedule({
      installmentAmount,
      totalInstallments,
      totalAmount,
      purchaseDate: new Date(purchaseDate),
      closingDay: selectedCard.closing_day,
      dueDay: selectedCard.due_day,
      startParcel: startInstallment,
    });
  }, [
    selectedCard,
    totalAmount,
    totalInstallments,
    purchaseDate,
    installmentAmount,
    startInstallment,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Informe a descrição");
      return;
    }
    if (!creditCardId) {
      setError("Selecione um cartão");
      return;
    }
    if (totalAmount <= 0) {
      setError("Informe o valor");
      return;
    }
    if (totalInstallments < 1) {
      setError("Número de parcelas inválido");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await createInstallment({
        description: description.trim(),
        credit_card_id: creditCardId,
        purchase_date: purchaseDate,
        total_installments: totalInstallments,
        total_amount: totalAmount,
        installment_amount: installmentAmount,
        category_id: categoryId || null,
        start_installment: startInstallment,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
      setLoading(false);
    }
  }

  const INSTALLMENT_OPTIONS = [
    2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 24, 36, 48,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Compra Parcelada"
        description="Registre uma compra parcelada no cartão de crédito."
      >
        <Link
          href="/installments"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
        >
          Cancelar
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Value input */}
          <Card className="border-2 border-red-200 dark:border-red-900">
            <CardContent className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {inputMode === "total"
                    ? "Valor Total da Compra"
                    : "Valor por Parcela"}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setInputMode(inputMode === "total" ? "monthly" : "total")
                  }
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  {inputMode === "total"
                    ? "Inserir por parcela"
                    : "Inserir total"}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-muted-foreground">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={totalAmountRaw}
                  onChange={(e) =>
                    setTotalAmountRaw(formatCurrency(e.target.value))
                  }
                  placeholder="0,00"
                  className="flex-1 bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/30"
                  autoFocus
                />
              </div>
              {totalAmount > 0 && totalInstallments > 1 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {totalInstallments}x de{" "}
                  <span className="font-semibold text-foreground">
                    {fmt(installmentAmount)}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Main fields */}
          <Card>
            <CardContent className="p-5 space-y-5">
              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: TV Samsung, iPhone 16..."
                  className="h-11 w-full rounded-xl border-2 border-input bg-background px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Credit card */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Cartão de Crédito *
                </label>
                {cards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum cartão cadastrado.{" "}
                    <Link
                      href="/credit-cards/new"
                      className="text-primary underline"
                    >
                      Adicione um
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {cards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setCreditCardId(card.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all",
                          creditCardId === card.id
                            ? "text-white border-transparent shadow-sm"
                            : "border-input text-muted-foreground hover:border-primary hover:text-foreground",
                        )}
                        style={
                          creditCardId === card.id
                            ? { backgroundColor: card.color ?? "#6366f1" }
                            : {}
                        }
                      >
                        {creditCardId === card.id && (
                          <Check className="h-3 w-3" />
                        )}
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: card.color ?? "#6366f1" }}
                        />
                        {card.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Data da Compra
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-input bg-background px-3 text-sm focus:border-primary focus:outline-none transition-colors"
                />
                {selectedCard && (
                  <p className="text-xs text-muted-foreground">
                    Fechamento no dia{" "}
                    <strong>{selectedCard.closing_day}</strong> · Vencimento no
                    dia <strong>{selectedCard.due_day}</strong>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Number of installments */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Número de Parcelas
              </label>
              <div className="flex flex-wrap gap-2">
                {INSTALLMENT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setTotalInstallments(n);
                      // reset startInstallment if it would exceed new total
                      setStartInstallment((prev) => Math.min(prev, n));
                    }}
                    className={cn(
                      "flex h-10 w-12 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all",
                      totalInstallments === n
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-input text-muted-foreground hover:border-primary hover:text-foreground",
                    )}
                  >
                    {n}x
                  </button>
                ))}
              </div>

              {/* Current installment — only shown when totalInstallments > 1 */}
              {totalInstallments > 1 && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Esta compra já começou a ser paga?{" "}
                    <span className="normal-case">(parcela atual)</span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Se você já pagou algumas parcelas, selecione qual é a
                    parcela atual. O calendário mostrará apenas as parcelas
                    restantes.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      { length: totalInstallments },
                      (_, i) => i + 1,
                    ).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setStartInstallment(n)}
                        className={cn(
                          "flex h-9 w-11 items-center justify-center rounded-xl border-2 text-xs font-bold transition-all",
                          startInstallment === n
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-input text-muted-foreground hover:border-primary hover:text-foreground",
                        )}
                      >
                        {n}ª
                      </button>
                    ))}
                  </div>
                  {startInstallment > 1 && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {startInstallment - 1} parcela
                      {startInstallment - 1 > 1 ? "s" : ""} já paga
                      {startInstallment - 1 > 1 ? "s" : ""}. O calendário
                      mostrará a{startInstallment}ª até a {totalInstallments}ª.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardContent className="p-5 space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Categoria (opcional)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId("")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                    !categoryId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-muted-foreground hover:border-primary hover:text-foreground",
                  )}
                >
                  Nenhuma
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                      categoryId === cat.id
                        ? "border-transparent text-white shadow-sm"
                        : "border-input text-muted-foreground hover:border-primary hover:text-foreground",
                    )}
                    style={
                      categoryId === cat.id
                        ? { backgroundColor: cat.color ?? "#6366f1" }
                        : {}
                    }
                  >
                    {categoryId === cat.id && <Check className="h-3 w-3" />}
                    {cat.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Auto-confirm toggle removed — parcels are display-only */}

          {/* Schedule preview */}
          {schedule.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Parcelas a Pagar
                  </p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {schedule.length} parcela{schedule.length !== 1 ? "s" : ""}{" "}
                    restante{schedule.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="divide-y rounded-xl border overflow-hidden">
                  {schedule.map((parcel) => (
                    <div
                      key={parcel.parcelNumber}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {parcel.parcelNumber}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            {formatBillingMonth(parcel.billingMonth)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Vence em{" "}
                            {new Date(parcel.dueDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-red-600">
                        {fmt(parcel.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t pt-3 text-sm">
                  <span className="text-muted-foreground">
                    {startInstallment > 1
                      ? `Total restante (${startInstallment}ª–${totalInstallments}ª)`
                      : "Total"}
                  </span>
                  <span className="font-bold">
                    {fmt(schedule.reduce((s, p) => s + p.amount, 0))}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30">
              {error}
            </div>
          )}

          <div className="pb-6">
            <button
              type="submit"
              disabled={loading || cards.length === 0}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Registrar Parcelamento"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
