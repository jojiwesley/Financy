import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Tables } from '@/types/database.types';

const typeLabels: Record<string, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  cash: 'Dinheiro',
  investment: 'Investimento',
  other: 'Outro',
};

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: accountsRaw } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user!.id)
    .order('name');
  const accounts = accountsRaw as Tables<'accounts'>[] | null;

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const accountList = accounts ?? [];
  const totalBalance = accountList.reduce((sum, a) => sum + (a.balance ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Contas" description="Gerencie suas contas bancárias e carteiras">
        <Link
          href="/accounts/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Conta
        </Link>
      </PageHeader>

      {/* Saldo total */}
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Saldo Total</p>
          <p className={`mt-1 text-3xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fmt(totalBalance)}
          </p>
        </CardContent>
      </Card>

      {/* Grade de contas */}
      {accountList.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          Nenhuma conta cadastrada.{' '}
          <Link href="/accounts/new" className="text-primary underline">
            Crie uma agora
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accountList.map((account) => (
            <Card key={account.id} className="overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: account.color ?? '#6366f1' }} />
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {typeLabels[account.type ?? ''] ?? account.type}
                    </p>
                  </div>
                  <div
                    className="h-8 w-8 rounded-full"
                    style={{ backgroundColor: `${account.color ?? '#6366f1'}30` }}
                  />
                </div>
                <p className={`text-2xl font-bold ${(account.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(account.balance ?? 0)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
