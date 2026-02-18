import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import type { Tables } from '@/types/database.types';

export default async function InstallmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawInst } = await supabase
    .from('installments')
    .select('*, credit_cards(name, color)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  type InstWithCard = Tables<'installments'> & { credit_cards: { name: string; color: string } | null };
  const installments = rawInst as InstWithCard[] | null;

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalMonthly = (installments ?? []).reduce(
    (sum, i) => sum + (i.installment_amount ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Parcelamentos" description="Compras parceladas em andamento" />

      {/* KPI */}
      <Card className="max-w-xs">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total mensal parcelado</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{fmt(totalMonthly)}</p>
        </CardContent>
      </Card>

      {(installments ?? []).length === 0 ? (
        <p className="text-center text-muted-foreground py-16">Nenhum parcelamento ativo.</p>
      ) : (
        <Card>
          <div className="divide-y">
            {(installments ?? []).map((item) => {
              const card = item.credit_cards as { name: string; color: string } | null;
              const progress = item.total_installments
                ? Math.round(((item.current_installment ?? 0) / item.total_installments) * 100)
                : 0;
              return (
                <div key={item.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {card && (
                        <div
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: card.color }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {card?.name ?? 'Sem cartão'} ·{' '}
                          {item.current_installment}ª de {item.total_installments}x
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-red-600">
                        {fmt(item.installment_amount ?? 0)}/mês
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total: {fmt((item.installment_amount ?? 0) * (item.total_installments ?? 1))}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: card?.color ?? '#6366f1',
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground text-right">
                      {progress}% pago
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
