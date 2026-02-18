import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { deleteTransaction } from '../actions';
import { ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Tables } from '@/types/database.types';

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: txRaw } = await supabase
    .from('transactions')
    .select('*, categories(name, color), accounts(name)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single();

  type TxWithJoins = Tables<'transactions'> & {
    categories: { name: string; color: string } | null;
    accounts: { name: string } | null;
  };
  const tx = txRaw as TxWithJoins | null;
  if (!tx) notFound();

  const cat = tx.categories as { name: string; color: string } | null;
  const acc = tx.accounts as { name: string } | null;
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const deleteAction = deleteTransaction.bind(null, id);

  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmado',
    pending: 'Pendente',
    cancelled: 'Cancelado',
  };
  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalhe da Transação"
        description={new Date(tx.date).toLocaleDateString('pt-BR', { dateStyle: 'full' })}
      >
        <Link
          href="/transactions"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
        >
          Voltar
        </Link>
        <form action={deleteAction}>
          <button
            type="submit"
            onClick={(e) => { if (!confirm('Excluir esta transação?')) e.preventDefault(); }}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </form>
      </PageHeader>

      <Card className="max-w-lg">
        <CardContent className="p-6 space-y-5">
          {/* Tipo e valor */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: `${cat?.color ?? '#6366f1'}20` }}
            >
              {tx.type === 'income' ? (
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              ) : (
                <ArrowDownLeft className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-lg font-bold">{tx.description ?? '—'}</p>
              <p className={`text-2xl font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount ?? 0)}
              </p>
            </div>
          </div>

          <div className="divide-y rounded-xl border">
            {[
              { label: 'Tipo', value: tx.type === 'income' ? 'Receita' : 'Despesa' },
              { label: 'Data', value: new Date(tx.date).toLocaleDateString('pt-BR') },
              { label: 'Categoria', value: cat?.name ?? 'Sem categoria' },
              { label: 'Conta', value: acc?.name ?? 'Sem conta' },
              {
                label: 'Status',
                value: (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[tx.status ?? ''] ?? 'bg-slate-100 text-slate-500'}`}>
                    {statusLabels[tx.status ?? ''] ?? tx.status}
                  </span>
                ),
              },
              ...(tx.notes ? [{ label: 'Observações', value: tx.notes }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
