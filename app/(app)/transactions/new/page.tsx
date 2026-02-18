'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Category = { id: string; name: string; type: string };
type Account = { id: string; name: string; type: string };

export default function NewTransactionPage() {
  const router = useRouter();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Carrega categorias e contas ao montar o componente
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase
          .from('categories')
          .select('id, name, type')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('name'),
        supabase.from('accounts').select('id, name, type').eq('user_id', user.id).order('name'),
      ]).then(([{ data: cats }, { data: accs }]) => {
        setCategories(cats ?? []);
        setAccounts(accs ?? []);
      });
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Captura ANTES de qualquer await — React zera e.currentTarget após operações assíncronas
    const formEl = e.currentTarget;
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const form = new FormData(formEl);

      const { error: err } = await supabase.from('transactions').insert({
        user_id: user.id,
        type,
        description: form.get('description') as string,
        amount: parseFloat(form.get('amount') as string),
        date: form.get('date') as string,
        category_id: (form.get('category_id') as string) || null,
        account_id: (form.get('account_id') as string) || null,
        notes: (form.get('notes') as string) || null,
        status: (form.get('status') as string) || 'confirmed',
      });

      if (err) throw new Error(err.message);

      router.push('/transactions');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  }

  // Filtra categorias pelo tipo selecionado
  const filteredCategories = categories.filter((c) => c.type === type);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Nova Transação" description="Registre uma nova entrada ou saída.">
        <Link
          href="/transactions"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
        >
          Cancelar
        </Link>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados da Transação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Toggle despesa/receita */}
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-1">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
                  type === 'expense' ? 'bg-red-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
                  type === 'income' ? 'bg-green-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                Receita
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição *</label>
              <input
                name="description"
                type="text"
                placeholder="Ex: Supermercado, Salário..."
                required
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor (R$) *</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  required
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data *</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={today}
                  required
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <select
                  name="category_id"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Sem categoria</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Conta</label>
                <select
                  name="account_id"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Sem conta</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                name="status"
                defaultValue="confirmed"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="confirmed">Confirmado</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações (opcional)</label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Alguma nota sobre essa transação..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Link
                href="/transactions"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Transação'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
