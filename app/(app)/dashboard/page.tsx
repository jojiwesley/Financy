import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import type { Tables } from '@/types/database.types';

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

  const [{ data: txRowsRaw }, { data: accountRows }, { data: billRowsRaw }] =
    await Promise.all([
      supabase
        .from('transactions')
        .select('type, amount, description, date, status, categories(name, color)')
        .eq('user_id', user!.id)
        .eq('status', 'confirmed')
        .gte('date', firstDay)
        .lte('date', lastDay)
        .order('date', { ascending: false }),
      supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user!.id),
      supabase
        .from('bills')
        .select('amount, description, due_date, status')
        .eq('user_id', user!.id)
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(5),
    ]);

  type TxDash = Pick<Tables<'transactions'>, 'type' | 'amount' | 'description' | 'date' | 'status'> & {
    categories: { name: string; color: string } | null;
  };
  type BillDash = Pick<Tables<'bills'>, 'amount' | 'description' | 'due_date' | 'status'>;

  const transactions = (txRowsRaw as TxDash[] | null) ?? [];
  const accounts = accountRows ?? [];
  const bills = (billRowsRaw as BillDash[] | null) ?? [];

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const savings = income - expenses;

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={`Resumo de ${monthName}`} />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Saldo Total</p>
              <div className="rounded-full bg-blue-100 p-2">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold">{fmt(totalBalance)}</p>
            <p className="mt-1 text-xs text-muted-foreground">em todas as contas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Receitas do mês</p>
              <div className="rounded-full bg-green-100 p-2">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-green-600">{fmt(income)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {transactions.filter((t) => t.type === 'income').length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Despesas do mês</p>
              <div className="rounded-full bg-red-100 p-2">
                <ArrowDownLeft className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-red-600">{fmt(expenses)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {transactions.filter((t) => t.type === 'expense').length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Economia do mês</p>
              <div className="rounded-full bg-purple-100 p-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p
              className={`mt-3 text-2xl font-bold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {fmt(savings)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">receitas − despesas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent transactions */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold">Transações Recentes</h2>
              <Link href="/transactions" className="text-xs text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="divide-y">
              {transactions.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma transação neste mês.
                </p>
              ) : (
                transactions.slice(0, 8).map((tx) => {
                  const cat = tx.categories as { name: string; color: string } | null;
                  return (
                    <div
                      key={`${tx.date}-${tx.description}`}
                      className="flex items-center justify-between px-6 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${cat?.color ?? '#6366f1'}20` }}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.description ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {cat?.name ?? 'Sem categoria'} •{' '}
                            {new Date(tx.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {fmt(tx.amount ?? 0)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bills due */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold">Contas a Pagar</h2>
              <Link href="/bills" className="text-xs text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="divide-y">
              {bills.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma conta pendente.
                </p>
              ) : (
                bills.map((bill) => (
                  <div key={bill.description} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-orange-100 p-2">
                        <CreditCard className="h-3.5 w-3.5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{bill.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Vence {new Date(bill.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-orange-600">
                      {fmt(bill.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
