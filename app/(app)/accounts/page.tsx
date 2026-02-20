import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Plus,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Trash2,
  TrendingDown,
  Wallet,
} from "lucide-react";
import type { Tables } from "@/types/database.types";
import { deleteAccount } from "./actions";

const typeLabels: Record<string, string> = {
  checking: "Conta Corrente",
  savings: "Poupança",
  cash: "Dinheiro",
  investment: "Investimento",
  other: "Outro",
};

export default async function AccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [{ data: accountsRaw }, { data: allTxRaw }, { data: pendingBillsRaw }] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user!.id)
        .order("name"),
      // Fetch ALL confirmed transactions to compute real current balance per account
      supabase
        .from("transactions")
        .select("type, amount, account_id, date")
        .eq("user_id", user!.id)
        .eq("status", "confirmed")
        .not("account_id", "is", null),
      supabase
        .from("bills")
        .select(
          "id, description, amount, due_date, is_recurring, categories(name, color)",
        )
        .eq("user_id", user!.id)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(5),
    ]);

  type AllTx = Pick<
    Tables<"transactions">,
    "type" | "amount" | "account_id" | "date"
  >;
  type PendingBill = Pick<
    Tables<"bills">,
    "id" | "description" | "amount" | "due_date" | "is_recurring"
  > & { categories: { name: string; color: string } | null };

  const accounts = (accountsRaw as Tables<"accounts">[] | null) ?? [];
  const allTx = (allTxRaw as AllTx[] | null) ?? [];
  const pendingBills = (pendingBillsRaw as PendingBill[] | null) ?? [];

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // --- Per-account: all-time totals (to compute real current balance) ---
  const accountAllTime = new Map<
    string,
    { income: number; expenses: number }
  >();
  for (const tx of allTx) {
    if (!tx.account_id) continue;
    const prev = accountAllTime.get(tx.account_id) ?? {
      income: 0,
      expenses: 0,
    };
    if (tx.type === "income") prev.income += tx.amount ?? 0;
    else if (tx.type === "expense") prev.expenses += tx.amount ?? 0;
    accountAllTime.set(tx.account_id, prev);
  }

  // Real current balance = initial (manually set) + all income - all expenses
  const accountCurrentBalance = new Map<string, number>();
  for (const acc of accounts) {
    const at = accountAllTime.get(acc.id);
    const current =
      (acc.balance ?? 0) + (at?.income ?? 0) - (at?.expenses ?? 0);
    accountCurrentBalance.set(acc.id, current);
  }

  // --- Per-account: this month's activity only (for card display) ---
  const accountActivity = new Map<
    string,
    { income: number; expenses: number }
  >();
  for (const tx of allTx) {
    if (!tx.account_id || !tx.date.startsWith(firstDay.slice(0, 7))) continue;
    const prev = accountActivity.get(tx.account_id) ?? {
      income: 0,
      expenses: 0,
    };
    if (tx.type === "income") prev.income += tx.amount ?? 0;
    else if (tx.type === "expense") prev.expenses += tx.amount ?? 0;
    accountActivity.set(tx.account_id, prev);
  }

  // Global KPIs — derived from computed current balances
  const totalBalance = accounts.reduce(
    (s, a) => s + (accountCurrentBalance.get(a.id) ?? a.balance ?? 0),
    0,
  );
  const monthIncome = allTx
    .filter(
      (t) => t.date.startsWith(firstDay.slice(0, 7)) && t.type === "income",
    )
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const monthExpenses = allTx
    .filter(
      (t) => t.date.startsWith(firstDay.slice(0, 7)) && t.type === "expense",
    )
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalPendingBills = pendingBills.reduce(
    (s, b) => s + (b.amount ?? 0),
    0,
  );
  const projectedBalance = totalBalance - totalPendingBills;

  const today = new Date().toISOString().split("T")[0];
  const monthName = now.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas"
        description={`Visão consolidada · ${monthName}`}
      >
        <Link
          href="/accounts/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Conta
        </Link>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Saldo Total</p>
            </div>
            <p
              className={`text-xl font-bold ${totalBalance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {fmt(totalBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {accounts.length} conta{accounts.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">Entradas</p>
            </div>
            <p className="text-xl font-bold text-green-600">
              {fmt(monthIncome)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft className="h-4 w-4 text-red-500" />
              <p className="text-xs text-muted-foreground">Saídas</p>
            </div>
            <p className="text-xl font-bold text-red-600">
              {fmt(monthExpenses)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <p className="text-xs text-muted-foreground">Saldo Projetado</p>
            </div>
            <p
              className={`text-xl font-bold ${projectedBalance >= 0 ? "text-foreground" : "text-red-600"}`}
            >
              {fmt(projectedBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              após {pendingBills.length} conta
              {pendingBills.length !== 1 ? "s" : ""} a pagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account cards */}
      {accounts.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          Nenhuma conta cadastrada.{" "}
          <Link href="/accounts/new" className="text-primary underline">
            Crie uma agora
          </Link>
          .
        </p>
      ) : (
        <div>
          <h2 className="mb-3 text-base font-semibold">Suas Contas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => {
              const activity = accountActivity.get(account.id);
              const currentBalance =
                accountCurrentBalance.get(account.id) ?? account.balance ?? 0;
              const deleteAction = deleteAccount.bind(null, account.id);
              return (
                <Card key={account.id} className="overflow-hidden">
                  <div
                    className="h-1.5"
                    style={{ backgroundColor: account.color ?? "#6366f1" }}
                  />
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{account.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {typeLabels[account.type ?? ""] ?? account.type}
                        </p>
                      </div>
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{
                          backgroundColor: account.color ?? "#6366f1",
                        }}
                      >
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <p
                        className={`text-2xl font-bold ${currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {fmt(currentBalance)}
                      </p>
                      {(account.balance ?? 0) !== 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Saldo inicial: {fmt(account.balance ?? 0)}
                        </p>
                      )}
                    </div>

                    {activity &&
                    (activity.income > 0 || activity.expenses > 0) ? (
                      <div className="flex gap-3 border-t pt-2">
                        {activity.income > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <ArrowUpRight className="h-3 w-3" />
                            <span className="font-medium">
                              {fmt(activity.income)}
                            </span>
                          </div>
                        )}
                        {activity.expenses > 0 && (
                          <div className="flex items-center gap-1 text-xs text-red-500">
                            <ArrowDownLeft className="h-3 w-3" />
                            <span className="font-medium">
                              {fmt(activity.expenses)}
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          este mês
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground border-t pt-2">
                        Sem movimentação este mês
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Link
                        href={`/accounts/${account.id}/edit`}
                        className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded border border-input bg-background text-xs font-medium hover:bg-accent transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Link>
                      <form action={deleteAction}>
                        <button
                          type="submit"
                          className="h-8 w-8 inline-flex items-center justify-center rounded border border-input bg-background text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
                          title="Excluir conta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming bills */}
      {pendingBills.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Contas a Pagar
            </h2>
            <Link
              href="/bills"
              className="text-sm text-primary hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <Card>
            <div className="divide-y">
              {pendingBills.map((bill) => {
                const cat = bill.categories as {
                  name: string;
                  color: string;
                } | null;
                const isOverdue = bill.due_date < today;
                return (
                  <div
                    key={bill.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat?.color ?? "#94a3b8" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {bill.description}
                      </p>
                      <p
                        className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}
                      >
                        {isOverdue ? "Vencida · " : "Vence "}
                        {new Date(
                          bill.due_date + "T00:00:00",
                        ).toLocaleDateString("pt-BR")}
                        {bill.is_recurring && " · Recorrente"}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold whitespace-nowrap ${isOverdue ? "text-red-600" : ""}`}
                    >
                      {fmt(bill.amount ?? 0)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2.5 border-t bg-muted/30 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Total pendente:{" "}
                <span className="font-semibold text-foreground">
                  {fmt(totalPendingBills)}
                </span>
              </p>
              <Link
                href="/bills/new"
                className="text-xs text-primary hover:underline"
              >
                + Nova conta
              </Link>
            </div>
          </Card>
        </div>
      )}

      {accounts.length > 0 && pendingBills.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma conta a pagar pendente.
          </p>
          <Link
            href="/bills/new"
            className="mt-2 inline-flex text-sm text-primary hover:underline"
          >
            Adicionar conta a pagar
          </Link>
        </div>
      )}
    </div>
  );
}
