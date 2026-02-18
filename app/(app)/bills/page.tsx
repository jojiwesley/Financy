import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { payBill } from './actions';
import type { Tables } from '@/types/database.types';

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-600' },
  paid: { label: 'Pago', icon: CheckCircle2, color: 'text-green-600' },
  overdue: { label: 'Vencida', icon: AlertCircle, color: 'text-red-600' },
};

export default async function BillsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: billsRaw } = await supabase
    .from('bills')
    .select('*, categories(name, color)')
    .eq('user_id', user!.id)
    .order('due_date', { ascending: true });
  const bills = billsRaw as (Tables<'bills'> & { categories: { name: string; color: string } | null })[] | null;

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const today = new Date().toISOString().split('T')[0];
  const pending = (bills ?? []).filter((b) => b.status === 'pending' && b.due_date >= today);
  const overdue = (bills ?? []).filter((b) => b.status === 'pending' && b.due_date < today);
  const paid = (bills ?? []).filter((b) => b.status === 'paid');

  const totalPending = [...pending, ...overdue].reduce((s, b) => s + (b.amount ?? 0), 0);
  const totalPaid = paid.reduce((s, b) => s + (b.amount ?? 0), 0);

  const groups = [
    { title: 'Vencidas', items: overdue, highlight: true },
    { title: 'A Vencer', items: pending, highlight: false },
    { title: 'Pagas', items: paid, highlight: false },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Contas a Pagar" description="Acompanhe suas contas e vencimentos">
        <Link
          href="/bills/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Conta
        </Link>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">A Pagar</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{fmt(totalPending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Vencidas</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{overdue.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pagas este mês</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Groups */}
      {groups.map(({ title, items, highlight }) =>
        items.length > 0 ? (
          <div key={title}>
            <h2 className={`mb-3 text-base font-semibold ${highlight ? 'text-red-600' : ''}`}>{title}</h2>
            <Card>
              <div className="divide-y">
                {items.map((bill) => {
                  const cat = bill.categories as { name: string; color: string } | null;
                  const cfg = statusConfig[bill.status ?? 'pending'];
                  const Icon = cfg?.icon ?? Clock;
                  const payAction = payBill.bind(null, bill.id);
                  return (
                    <div key={bill.id} className="flex items-center gap-4 px-4 py-3">
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{bill.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {cat?.name ?? 'Sem categoria'} · Vence: {new Date(bill.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          {bill.is_recurring && ' · Recorrente'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{fmt(bill.amount ?? 0)}</span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${cfg?.color ?? 'text-muted-foreground'}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {cfg?.label}
                      </span>
                      {bill.status === 'pending' && (
                        <form action={payAction}>
                          <button
                            type="submit"
                            className="inline-flex h-7 items-center rounded bg-green-600 px-2.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                          >
                            Pagar
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : null
      )}

      {(bills ?? []).length === 0 && (
        <p className="text-center text-muted-foreground py-16">
          Nenhuma conta cadastrada.{' '}
          <Link href="/bills/new" className="text-primary underline">
            Adicione uma agora
          </Link>
          .
        </p>
      )}
    </div>
  );
}
