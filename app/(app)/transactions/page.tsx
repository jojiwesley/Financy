import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { TransactionFilters } from './transaction-filters';
import { TransactionListView } from './transaction-list-view';
import { TransactionCardView } from './transaction-card-view';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { Tables } from '@/types/database.types';

const PAGE_SIZE = 20;

function buildPageUrl(
  params: Record<string, string | undefined>,
  page: number
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.type) sp.set('type', params.type);
  if (params.status) sp.set('status', params.status);
  if (params.category) sp.set('category', params.category);
  if (params.view && params.view !== 'list') sp.set('view', params.view);
  if (page > 1) sp.set('page', String(page));
  const qs = sp.toString();
  return `/transactions${qs ? `?${qs}` : ''}`;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const q = params.q ?? '';
  const typeFilter = params.type ?? '';
  const statusFilter = params.status ?? '';
  const categoryFilter = params.category ?? '';
  const view = params.view === 'cards' ? 'cards' : 'list';
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Data do mês atual para os cards de resumo
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  let query = supabase
    .from('transactions')
    .select('*, categories(name, color), accounts(name)', { count: 'exact' })
    .eq('user_id', user!.id)
    .order('date', { ascending: false })
    .range(from, to);

  if (q) query = query.ilike('description', `%${q}%`);
  if (typeFilter) query = query.eq('type', typeFilter);
  if (statusFilter) query = query.eq('status', statusFilter);
  if (categoryFilter) query = query.eq('category_id', categoryFilter);

  const [{ data: allTx, count }, { data: monthTx }, { data: cats }] = await Promise.all([
    query,
    supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', user!.id)
      .eq('status', 'confirmed')
      .gte('date', firstDay)
      .lte('date', lastDay),
    supabase
      .from('categories')
      .select('id, name')
      .or(`user_id.eq.${user!.id},user_id.is.null`)
      .order('name'),
  ]);

  type TxRow = Tables<'transactions'> & {
    categories: { name: string; color: string } | null;
    accounts: { name: string } | null;
  };
  type MonthTx = Pick<Tables<'transactions'>, 'type' | 'amount'>;

  const transactions = (allTx as TxRow[] | null) ?? [];
  const categories = (cats as Pick<Tables<'categories'>, 'id' | 'name'>[] | null) ?? [];
  const monthTransactions = (monthTx as MonthTx[] | null) ?? [];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const income = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount ?? 0), 0);
  const expenses = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount ?? 0), 0);
  const balance = income - expenses;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <PageHeader title="Transações" description="Histórico de todas as suas movimentações.">
        <Link
          href="/transactions/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Transação
        </Link>
      </PageHeader>

      {/* Resumo do mês */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Receitas do mês</p>
            <p className="text-xl font-bold text-green-600 mt-1">{fmt(income)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Despesas do mês</p>
            <p className="text-xl font-bold text-red-600 mt-1">{fmt(expenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Saldo do mês</p>
            <p className={`text-xl font-bold mt-1 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(balance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <TransactionFilters
        categories={categories}
        defaultValues={{ q, type: typeFilter, status: statusFilter, category: categoryFilter, view }}
      />

      {/* Transações */}
      {view === 'cards' ? (
        <TransactionCardView transactions={transactions} />
      ) : (
        <TransactionListView transactions={transactions} />
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border bg-background px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {from + 1}–{Math.min(to + 1, totalCount)} de {totalCount} transações
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildPageUrl(params as Record<string, string>, page - 1)}
                className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent transition-colors"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildPageUrl(params as Record<string, string>, page + 1)}
                className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent transition-colors"
              >
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
