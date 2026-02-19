import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import type { Tables } from '@/types/database.types';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { MetricCard } from '@/components/dashboard/metric-card';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  // Previous month range
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevFirstDay = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
  const prevLastDay = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  // 6 months ago start
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sixMonthsAgoStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

  const [
    { data: txRowsRaw },
    { data: prevTxRaw },
    { data: accountRowsRaw },
    { data: billRowsRaw },
    { data: allTxRaw },
  ] = await Promise.all([
    // Transações do mês atual: usa apenas a data real da transação para os KPIs
    supabase
      .from('transactions')
      .select('type, amount, description, date, reference_date, status, categories(name, color)')
      .eq('user_id', user!.id)
      .eq('status', 'confirmed')
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date', { ascending: false }),
    // Mês anterior: também usa apenas date
    supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', user!.id)
      .eq('status', 'confirmed')
      .gte('date', prevFirstDay)
      .lte('date', prevLastDay),
    supabase
      .from('accounts')
      .select('name, balance, color')
      .eq('user_id', user!.id),
    supabase
      .from('bills')
      .select('amount, description, due_date, status')
      .eq('user_id', user!.id)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(5),
    // Últimos 6 meses para o gráfico — busca por competência
    supabase
      .from('transactions')
      .select('type, amount, date, reference_date')
      .eq('user_id', user!.id)
      .eq('status', 'confirmed')
      .or(
        `and(reference_date.gte.${sixMonthsAgoStr},reference_date.lte.${lastDay}),` +
        `and(reference_date.is.null,date.gte.${sixMonthsAgoStr},date.lte.${lastDay})`
      ),
  ]);

  type TxDash = Pick<Tables<'transactions'>, 'type' | 'amount' | 'description' | 'date' | 'reference_date' | 'status'> & {
    categories: { name: string; color: string } | null;
  };
  type TxSimple = Pick<Tables<'transactions'>, 'type' | 'amount'>;
  type TxChart = Pick<Tables<'transactions'>, 'type' | 'amount' | 'date' | 'reference_date'>;
  type BillDash = Pick<Tables<'bills'>, 'amount' | 'description' | 'due_date' | 'status'>;
  type AccountDash = Pick<Tables<'accounts'>, 'name' | 'balance' | 'color'>;

  const transactions = (txRowsRaw as TxDash[] | null) ?? [];
  const prevTransactions = (prevTxRaw as TxSimple[] | null) ?? [];
  const accounts = (accountRowsRaw as AccountDash[] | null) ?? [];
  const bills = (billRowsRaw as BillDash[] | null) ?? [];
  const allTx = (allTxRaw as TxChart[] | null) ?? [];

  // Current month totals
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  // Previous month totals (for % delta)
  const prevIncome = prevTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const prevExpenses = prevTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (t.amount ?? 0), 0);

  const incomeDelta = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : null;
  const expensesDelta = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : null;

  // Build 6-month chart data — usa reference_date quando preenchida, senão date
  const monthlyChart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const monthStr = `${y}-${String(m).padStart(2, '0')}`;
    const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    // Agrupa pelo mês de competência (reference_date se existir, caso contrário date)
    const monthTx = allTx.filter((t) => {
      const ref = t.reference_date ?? t.date;
      return ref.startsWith(monthStr);
    });
    return {
      month: monthLabel,
      receitas: monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount ?? 0), 0),
      despesas: monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount ?? 0), 0),
    };
  });

  // Top expense categories
  const catMap = new Map<string, { total: number; color: string }>();
  for (const tx of transactions.filter((t) => t.type === 'expense')) {
    const cat = tx.categories as { name: string; color: string } | null;
    const key = cat?.name ?? 'Sem categoria';
    const color = cat?.color ?? '#94a3b8';
    const existing = catMap.get(key);
    catMap.set(key, { total: (existing?.total ?? 0) + (tx.amount ?? 0), color });
  }
  const topCategories = Array.from(catMap.entries())
    .map(([name, { total, color }]) => ({ name, total, color }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const overdueBills = bills.filter((b) => b.status === 'overdue');

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const DeltaBadge = ({ delta }: { delta: number | null }) => {
    if (delta === null) return <span className="text-xs text-muted-foreground">—</span>;
    const positive = delta >= 0;
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(delta).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-muted-foreground">Resumo financeiro de {monthName}</p>
         </div>
      </div>

      {/* Overdue alert */}
      {overdueBills.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-600 dark:text-red-400 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">
            Você tem {overdueBills.length} conta{overdueBills.length > 1 ? 's' : ''} vencida{overdueBills.length > 1 ? 's' : ''}.{' '}
            <Link href="/bills" className="underline underline-offset-2 hover:no-underline font-semibold">
              Ver agora
            </Link>
          </p>
        </div>
      )}

      {/* KPI Cards */}
      {/* Mobile Layout: Saldo topo + Carrossel */}
      <div className="flex flex-col gap-4 md:hidden">
        <MetricCard
          title="Saldo Total"
          value={fmt(totalBalance)}
          icon={Wallet}
          variant="primary"
          subValue={`em ${accounts.length} conta${accounts.length !== 1 ? 's' : ''}`}
        />
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          <div className="min-w-[85%] snap-center flex">
            <MetricCard
              title="Receitas"
              value={fmt(income)}
              icon={TrendingUp}
              variant="success"
              trend={incomeDelta !== null ? { value: parseFloat(incomeDelta.toFixed(1)), label: 'vs mês anterior' } : undefined}
              subValue={`${transactions.filter((t) => t.type === 'income').length} transações`}
              className="w-full flex flex-col justify-between"
            />
          </div>
          <div className="min-w-[85%] snap-center flex">
            <MetricCard
              title="Despesas"
              value={fmt(expenses)}
              icon={TrendingDown}
              variant="danger"
              trend={expensesDelta !== null ? { value: parseFloat(expensesDelta.toFixed(1)), label: 'vs mês anterior' } : undefined}
              subValue={`${transactions.filter((t) => t.type === 'expense').length} transações`}
              className="w-full flex flex-col justify-between"
            />
          </div>
          <div className="min-w-[85%] snap-center flex">
            <MetricCard
              title="Economia"
              value={fmt(savings)}
              icon={Wallet}
              variant="info"
              subValue={`${savingsRate}% da renda`}
              className="w-full flex flex-col justify-between"
            />
          </div>
        </div>
      </div>

      {/* Desktop Layout: Grid único */}
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Saldo — gradient card */}
        <MetricCard
          title="Saldo Total"
          value={fmt(totalBalance)}
          icon={Wallet}
          variant="primary"
          subValue={`em ${accounts.length} conta${accounts.length !== 1 ? 's' : ''}`}
        />

        {/* Receitas */}
        <MetricCard
          title="Receitas"
          value={fmt(income)}
          icon={TrendingUp} // Changed icon to TrendingUp for better semantic
          variant="success"
          trend={incomeDelta !== null ? { value: parseFloat(incomeDelta.toFixed(1)), label: 'vs mês anterior' } : undefined}
          subValue={`${transactions.filter((t) => t.type === 'income').length} transações`}
        />

        {/* Despesas */}
        <MetricCard
          title="Despesas"
          value={fmt(expenses)}
          icon={TrendingDown} // Changed icon to TrendingDown
          variant="danger"
          trend={expensesDelta !== null ? { value: parseFloat(expensesDelta.toFixed(1)), label: 'vs mês anterior' } : undefined}
          subValue={`${transactions.filter((t) => t.type === 'expense').length} transações`}
        />

        {/* Economia */}
        <MetricCard
          title="Economia"
          value={fmt(savings)}
          icon={Wallet}
          variant="info"
          subValue={`${savingsRate}% da renda`}
        />
      </div>

      {/* Chart + Top categories */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm">
          <CardContent className="p-0">
            <div className="px-4 sm:px-6 py-4 border-b border-border/50">
              <h2 className="font-semibold">Receitas vs Despesas</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Comparativo mensal</p>
            </div>
            <div className="p-2 sm:p-4">
              <DashboardCharts monthlyData={monthlyChart} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="px-4 sm:px-6 py-4 border-b border-border/50">
              <h2 className="font-semibold">Top Despesas</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Por categoria este mês</p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {topCategories.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">Nenhuma despesa.</p>
              ) : (
                topCategories.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <span className="text-muted-foreground">{fmt(cat.total)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          backgroundColor: cat.color,
                          width: expenses > 0 ? `${(cat.total / expenses) * 100}%` : '0%',
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent transactions */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50">
              <div>
                <h2 className="font-semibold">Transações Recentes</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Este mês</p>
              </div>
              <Link href="/transactions" className="text-xs text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="divide-y divide-border/50">
              {transactions.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma transação neste mês.
                </p>
              ) : (
                transactions.slice(0, 8).map((tx, idx) => {
                  const cat = tx.categories as { name: string; color: string } | null;
                  return (
                    <div
                      key={`${tx.date}-${tx.description}-${idx}`}
                      className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${cat?.color ?? '#6366f1'}22` }}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight truncate">{tx.description ?? '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {cat?.name ?? 'Sem categoria'} •{' '}
                            {new Date(tx.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm font-semibold tabular-nums shrink-0 ml-2 ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '−'}
                        {fmt(tx.amount ?? 0)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Bills due */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50">
                <div>
                  <h2 className="font-semibold">Contas a Pagar</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Próximos vencimentos</p>
                </div>
                <Link href="/bills" className="text-xs text-primary hover:underline">
                  Ver todas
                </Link>
              </div>
              <div className="divide-y divide-border/50">
                {bills.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma conta pendente.
                  </p>
                ) : (
                  bills.map((bill, idx) => {
                    const isOverdue = bill.status === 'overdue';
                    return (
                      <div key={`${bill.description}-${idx}`} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`shrink-0 rounded-full p-2 ${isOverdue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                            <CreditCard className={`h-3.5 w-3.5 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{bill.description}</p>
                            <p className={`text-xs truncate ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                              {isOverdue ? 'Vencida — ' : 'Vence '}
                              {new Date(bill.due_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold tabular-nums shrink-0 ml-2 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                          {fmt(bill.amount)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Accounts */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50">
                <h2 className="font-semibold">Suas Contas</h2>
                <Link href="/accounts" className="text-xs text-primary hover:underline">
                  Ver todas
                </Link>
              </div>
              <div className="divide-y divide-border/50">
                {accounts.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>
                ) : (
                  accounts.map((acc, idx) => (
                    <div key={`${acc.name}-${idx}`} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                          style={{ backgroundColor: acc.color ?? '#6366f1' }}
                        >
                          {acc.name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium">{acc.name}</p>
                      </div>
                      <p className={`text-sm font-semibold tabular-nums ${(acc.balance ?? 0) >= 0 ? 'text-foreground' : 'text-red-600'}`}>
                        {fmt(acc.balance ?? 0)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
