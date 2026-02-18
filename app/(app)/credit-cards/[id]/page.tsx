import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import type { Tables } from '@/types/database.types';

export default async function CreditCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: cardRaw }, { data: transactionsRaw }] = await Promise.all([
    supabase
      .from('credit_cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('transactions')
      .select('*, categories(name, color)')
      .eq('credit_card_id', id)
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(50),
  ]);

  if (!cardRaw) notFound();
  const card = cardRaw as Tables<'credit_cards'>;
  const transactions = transactionsRaw as (Tables<'transactions'> & { categories: { name: string; color: string } | null })[] | null;

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalSpent = (transactions ?? [])
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  const available = (card.limit_amount ?? 0) - totalSpent;

  return (
    <div className="space-y-6">
      <PageHeader title={card.name} description={card.last_four_digits ? `•••• ${card.last_four_digits}` : undefined}>
        <Link
          href="/credit-cards"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
        >
          Voltar
        </Link>
      </PageHeader>

      {/* Card visual */}
      <Card className="overflow-hidden max-w-sm">
        <div className="relative p-6 text-white" style={{ backgroundColor: card.color ?? '#6366f1' }}>
          <CreditCard className="h-8 w-8 mb-4 opacity-80" />
          <p className="text-xl font-bold">{card.name}</p>
          {card.last_four_digits && <p className="text-sm opacity-80">•••• •••• •••• {card.last_four_digits}</p>}
        </div>
        <CardContent className="p-5 space-y-3">
          {[
            { label: 'Limite total', value: fmt(card.limit_amount ?? 0) },
            { label: 'Gasto no período', value: fmt(totalSpent) },
            { label: 'Disponível', value: fmt(available < 0 ? 0 : available) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (totalSpent / (card.limit_amount ?? 1)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fechamento: dia {card.closing_day}</span>
            <span>Vencimento: dia {card.due_day}</span>
          </div>
        </CardContent>
      </Card>

      {/* Transações */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Lançamentos</h2>
        {(transactions ?? []).length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum lançamento encontrado.</p>
        ) : (
          <Card>
            <div className="divide-y">
              {(transactions ?? []).map((tx) => {
                const cat = tx.categories as { name: string; color: string } | null;
                return (
                  <Link key={tx.id} href={`/transactions/${tx.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {cat?.name ?? 'Sem categoria'} · {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount ?? 0)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
