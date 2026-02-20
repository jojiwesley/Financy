"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Loader2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createInstallment } from "../../installments/actions";

type Category = {
  id: string;
  name: string;
  type: string;
  color: string | null;
};
type Account = { id: string; name: string; color: string | null };
type CreditCardOption = {
  id: string;
  name: string;
  color: string | null;
  closing_day: number;
  due_day: number;
};

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

export default function NewTransactionPage() {
  const router = useRouter();
  const descRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amountRaw, setAmountRaw] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  // Competência: mês ao qual a transação pertence (pode diferir do mês de lançamento)
  const [referenceMonth, setReferenceMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed");
  const [notes, setNotes] = useState("");
  const [installments, setInstallments] = useState(1);
  const [showInstallments, setShowInstallments] = useState(false);

  const [creditCardId, setCreditCardId] = useState("");

  const [loading, setLoading] = useState(false);
  const [addAnother, setAddAnother] = useState(false);
  const [error, setError] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardOption[]>([]);
  const [recentDescriptions, setRecentDescriptions] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase
          .from("categories")
          .select("id, name, type, color")
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order("name"),
        supabase
          .from("accounts")
          .select("id, name, color")
          .eq("user_id", user.id)
          .order("name"),
        supabase
          .from("transactions")
          .select("description")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("credit_cards")
          .select("id, name, color, closing_day, due_day")
          .eq("user_id", user.id)
          .order("name"),
      ]).then(
        ([
          { data: cats },
          { data: accs },
          { data: recent },
          { data: cards },
        ]) => {
          setCategories((cats as Category[]) ?? []);
          setAccounts((accs as Account[]) ?? []);
          setCreditCards((cards as CreditCardOption[]) ?? []);
          const unique = [
            ...new Set(
              (recent ?? []).map((r) => r.description).filter(Boolean),
            ),
          ] as string[];
          setRecentDescriptions(unique.slice(0, 20));
          if (accs && accs.length > 0) setAccountId(accs[0].id);
        },
      );
    });
  }, []);

  useEffect(() => {
    if (!description.trim()) {
      setSuggestions([]);
      return;
    }
    const q = description.toLowerCase();
    setSuggestions(
      recentDescriptions
        .filter((d) => d.toLowerCase().includes(q) && d !== description)
        .slice(0, 4),
    );
  }, [description, recentDescriptions]);

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === "both",
  );

  function resetForm() {
    setAmountRaw("");
    setDescription("");
    setCategoryId("");
    setCreditCardId("");
    setDate(new Date().toISOString().split("T")[0]);
    const d = new Date();
    setReferenceMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
    setStatus("confirmed");
    setNotes("");
    setInstallments(1);
    setShowInstallments(false);
    setError("");
    setSavedOk(false);
    setTimeout(() => descRef.current?.focus(), 50);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Informe a descrição");
      return;
    }
    const amount = parseCurrency(amountRaw);
    if (!amount || amount <= 0) {
      setError("Informe um valor válido");
      return;
    }

    setError("");
    setLoading(true);
    try {
      // Parcelamento no cartão → delegar para createInstallment (abordagem híbrida)
      if (installments > 1 && creditCardId && type === "expense") {
        await createInstallment({
          description: description.trim(),
          credit_card_id: creditCardId,
          purchase_date: date,
          total_installments: installments,
          total_amount: amount,
          installment_amount: parseFloat((amount / installments).toFixed(2)),
          category_id: categoryId || null,
        });
        return; // createInstallment redireciona para /installments
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const refDate = `${referenceMonth}-01`;

      // Parcelamento em conta (sem cartão) → criar N transações
      if (installments > 1 && type === "expense") {
        const rows = Array.from({ length: installments }, (_, i) => {
          const d = new Date(date);
          d.setMonth(d.getMonth() + i);
          const ref = new Date(refDate);
          ref.setMonth(ref.getMonth() + i);
          return {
            user_id: user.id,
            type,
            description: `${description.trim()} (${i + 1}/${installments})`,
            amount: parseFloat((amount / installments).toFixed(2)),
            date: d.toISOString().split("T")[0],
            reference_date: ref.toISOString().split("T")[0],
            category_id: categoryId || null,
            account_id: accountId || null,
            notes: notes || null,
            status,
          };
        });
        const { error: err } = await supabase.from("transactions").insert(rows);
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await supabase.from("transactions").insert({
          user_id: user.id,
          type,
          description: description.trim(),
          amount,
          date,
          reference_date: refDate,
          category_id: categoryId || null,
          account_id: accountId || null,
          credit_card_id: creditCardId || null,
          notes: notes || null,
          status,
        });
        if (err) throw new Error(err.message);
      }

      setSavedOk(true);
      setTimeout(() => {
        if (addAnother) {
          resetForm();
        } else {
          router.push("/transactions");
          router.refresh();
        }
      }, 500);
    } catch (e: unknown) {
      // Re-throw Next.js redirect errors so navigation proceeds
      const digest = (e as { digest?: string })?.digest ?? "";
      if (digest.startsWith("NEXT_REDIRECT")) throw e;
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Transação"
        description="Registre uma nova entrada ou saída."
      >
        <Link
          href="/transactions"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
        >
          Cancelar
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border-2 border-input p-1">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                setCategoryId("");
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all",
                type === "expense"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <ArrowDownLeft className="h-4 w-4" />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setType("income");
                setCategoryId("");
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all",
                type === "income"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <ArrowUpRight className="h-4 w-4" />
              Receita
            </button>
          </div>

          {/* Value input */}
          <Card
            className={cn(
              "border-2 transition-colors",
              type === "expense"
                ? "border-red-200 dark:border-red-900"
                : "border-green-200 dark:border-green-900",
            )}
          >
            <CardContent className="px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Valor
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-muted-foreground">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountRaw}
                  onChange={(e) => setAmountRaw(formatCurrency(e.target.value))}
                  placeholder="0,00"
                  className="flex-1 bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/30"
                  autoFocus
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-5">
              {/* Description + autocomplete */}
              <div className="relative space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Descrição *
                </label>
                <input
                  ref={descRef}
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Supermercado, Salário..."
                  className="h-11 w-full rounded-xl border-2 border-input bg-background px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border bg-background shadow-lg">
                    {suggestions.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => {
                            setDescription(s);
                            setSuggestions([]);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
                        >
                          <span className="text-muted-foreground text-xs">
                            ↩
                          </span>
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Category chips */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Categoria
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
                  {filteredCategories.map((cat) => (
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
                          ? {
                              backgroundColor: cat.color ?? "#6366f1",
                              borderColor: cat.color ?? "#6366f1",
                            }
                          : {}
                      }
                    >
                      {categoryId === cat.id && <Check className="h-3 w-3" />}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account chips */}
              {accounts.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Conta
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setAccountId(acc.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                          accountId === acc.id
                            ? "border-transparent text-white shadow-sm"
                            : "border-input text-muted-foreground hover:border-primary hover:text-foreground",
                        )}
                        style={
                          accountId === acc.id
                            ? {
                                backgroundColor: acc.color ?? "#6366f1",
                                borderColor: acc.color ?? "#6366f1",
                              }
                            : {}
                        }
                      >
                        {accountId === acc.id && <Check className="h-3 w-3" />}
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: acc.color ?? "#6366f1" }}
                        />
                        {acc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Credit card chips (expense only) */}
              {type === "expense" && creditCards.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cartão de Crédito (opcional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCreditCardId("")}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                        !creditCardId
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input text-muted-foreground hover:border-primary hover:text-foreground",
                      )}
                    >
                      Nenhum
                    </button>
                    {creditCards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setCreditCardId(card.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                          creditCardId === card.id
                            ? "border-transparent text-white shadow-sm"
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
                  {creditCardId && installments > 1 && (
                    <p className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:bg-violet-950/30 dark:text-violet-400">
                      <span>💳</span>
                      Parcelamento no cartão: as {installments} parcelas serão
                      registradas em <strong>Parcelamentos</strong> para
                      confirmação manual mês a mês.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date, Status, Competência */}
          <Card>
            <CardContent className="p-5 space-y-4">
              {/* Competência (full width, highlighted) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Competência
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Mês a que pertence esta transação
                  </span>
                </div>
                <input
                  type="month"
                  value={referenceMonth}
                  onChange={(e) => setReferenceMonth(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-primary/30 bg-background px-3 text-sm font-medium focus:border-primary focus:outline-none transition-colors"
                />
                {referenceMonth !==
                  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                    <span>⚠</span>
                    Contabilizando em{" "}
                    <strong>
                      {(() => {
                        const [y, m] = referenceMonth.split("-");
                        const MONTHS = [
                          "janeiro",
                          "fevereiro",
                          "março",
                          "abril",
                          "maio",
                          "junho",
                          "julho",
                          "agosto",
                          "setembro",
                          "outubro",
                          "novembro",
                          "dezembro",
                        ];
                        return `${MONTHS[parseInt(m, 10) - 1]} de ${y}`;
                      })()}
                    </strong>
                    , não no mês atual.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Data do lançamento
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-input bg-background px-3 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-1 rounded-xl border-2 border-input p-0.5">
                    <button
                      type="button"
                      onClick={() => setStatus("confirmed")}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-semibold transition-all",
                        status === "confirmed"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      Confirmado
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("pending")}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-semibold transition-all",
                        status === "pending"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      Pendente
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installments */}
          {type === "expense" && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowInstallments((v) => !v)}
                  className="flex w-full items-center justify-between text-sm font-medium"
                >
                  <span className="flex items-center gap-2">
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        showInstallments && "rotate-180",
                      )}
                    />
                    {installments > 1
                      ? `Parcelado em ${installments}x de R$ ${formatCurrency(String(Math.round((parseCurrency(amountRaw) / installments) * 100)))}`
                      : "Parcelar compra"}
                  </span>
                  {installments > 1 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {installments}x
                    </span>
                  )}
                </button>
                {showInstallments && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setInstallments(n)}
                        className={cn(
                          "flex h-10 w-12 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all",
                          installments === n
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-input text-muted-foreground hover:border-primary hover:text-foreground",
                        )}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardContent className="p-5 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Observações (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Alguma nota sobre essa transação..."
                className="w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors resize-none"
              />
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30">
              {error}
            </div>
          )}

          {savedOk && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <Check className="h-4 w-4" />
              Transação salva com sucesso!
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pb-6">
            <button
              type="submit"
              disabled={loading}
              onClick={() => setAddAnother(false)}
              className={cn(
                "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 active:scale-[0.99]",
                type === "expense"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700",
              )}
            >
              {loading && !addAnother ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : savedOk && !addAnother ? (
                <>
                  <Check className="h-4 w-4" /> Salvo!
                </>
              ) : (
                <>Salvar {type === "expense" ? "Despesa" : "Receita"}</>
              )}
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={() => setAddAnother(true)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-input bg-background text-sm font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              {loading && addAnother ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Salvar e adicionar outra
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
