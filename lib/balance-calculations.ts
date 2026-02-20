/**
 * Pure calculation functions — extracted from dashboard/page.tsx and accounts/page.tsx
 * These functions contain NO side-effects and can be unit-tested independently.
 */

export type AccountRow = {
  id: string;
  name: string;
  balance: number | null; // initial/starting balance set manually
  color?: string | null;
};

export type TransactionRow = {
  id?: string;
  type: string; // "income" | "expense"
  amount: number | null;
  account_id?: string | null;
  date?: string; // "YYYY-MM-DD"
  status?: string;
};

// ─────────────────────────────────────────────────────────────
// 1. buildAccountBalanceMap
//    Receives ALL confirmed transactions with account_id set.
//    Returns a Map<account_id, transactionsDelta>
//    where delta = Σ income - Σ expense (does NOT include initial balance yet)
// ─────────────────────────────────────────────────────────────
export function buildAccountBalanceMap(
  allAccountTx: TransactionRow[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const tx of allAccountTx) {
    if (!tx.account_id) continue;
    const prev = map.get(tx.account_id) ?? 0;
    map.set(
      tx.account_id,
      prev + (tx.type === "income" ? (tx.amount ?? 0) : -(tx.amount ?? 0)),
    );
  }
  return map;
}

// ─────────────────────────────────────────────────────────────
// 2. computeAccountCurrentBalance
//    Returns: account.balance (initial) + transactionsDelta for that account
// ─────────────────────────────────────────────────────────────
export function computeAccountCurrentBalance(
  account: AccountRow,
  balanceMap: Map<string, number>,
): number {
  return (account.balance ?? 0) + (balanceMap.get(account.id) ?? 0);
}

// ─────────────────────────────────────────────────────────────
// 3. computeTotalBalance
//    Saldo Total = sum of currentBalance across all accounts
//    This is ALL accumulated wealth (initial + all-time transactions)
// ─────────────────────────────────────────────────────────────
export function computeTotalBalance(
  accounts: AccountRow[],
  balanceMap: Map<string, number>,
): number {
  return accounts.reduce(
    (s, a) => s + computeAccountCurrentBalance(a, balanceMap),
    0,
  );
}

// ─────────────────────────────────────────────────────────────
// 4. computeMonthlyTotals
//    Receives transactions filtered to a SINGLE month.
//    Returns: { income, expenses, savings, savingsRate }
//    savings = income - expenses  (economia do mês)
// ─────────────────────────────────────────────────────────────
export function computeMonthlyTotals(monthTransactions: TransactionRow[]): {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
} {
  const income = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const expenses = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  return { income, expenses, savings, savingsRate };
}

// ─────────────────────────────────────────────────────────────
// 5. computeProjectedBalance
//    Saldo Projetado = Saldo Total - total de contas a pagar pendentes
// ─────────────────────────────────────────────────────────────
export function computeProjectedBalance(
  totalBalance: number,
  pendingBillsTotal: number,
): number {
  return totalBalance - pendingBillsTotal;
}
