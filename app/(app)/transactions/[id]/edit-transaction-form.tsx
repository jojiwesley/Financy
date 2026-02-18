'use client';

import { createClient } from '@/lib/supabase/client';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { Tables } from '@/types/database.types';

type Category = { id: string; name: string; type: string; color: string | null };
type Account = { id: string; name: string; color: string | null };

function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  const formatted = (n / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return formatted;
}

function toCurrencyRaw(amount: number): string {
  return formatCurrency(String(Math.round(amount * 100)));
}

interface Props {
  tx: Tables<'transactions'>;
  updateAction: (formData: FormData) => Promise<void>;
}

export function EditTransactionForm({ tx, updateAction }: Props) {
  const router = useRouter();
  const [type, setType] = useState<'income' | 'expense'>(
    tx.type === 'income' ? 'income' : 'expense'
  );
  const [amountRaw, setAmountRaw] = useState(toCurrencyRaw(tx.amount ?? 0));
  const [description, setDescription] = useState(tx.description ?? '');
  const [categoryId, setCategoryId] = useState(tx.category_id ?? '');
  const [accountId, setAccountId] = useState(tx.account_id ?? '');
  const [date, setDate] = useState(tx.date);
  const [referenceMonth, setReferenceMonth] = useState(() => {
    const ref = tx.reference_date ?? tx.date;
    return ref.slice(0, 7); // "YYYY-MM"
  });
  const [status, setStatus] = useState<'confirmed' | 'pending'>(
    tx.status === 'pending' ? 'pending' : 'confirmed'
  );
  const [notes, setNotes] = useState(tx.notes ?? '');
  const [showInstallments] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase
          .from('categories')
          .select('id, name, type, color')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('name'),
        supabase.from('accounts').select('id, name, color').eq('user_id', user.id).order('name'),
      ]).then(([{ data: cats }, { data: accs }]) => {
        setCategories((cats as Category[]) ?? []);
        setAccounts((accs as Account[]) ?? []);
      });
    });
  }, []);

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!description.trim()) { setError('Informe a descrição'); return; }
    const digits = amountRaw.replace(/\D/g, '');
    const amount = digits ? parseInt(digits, 10) / 100 : 0;
    if (!amount || amount <= 0) { setError('Informe um valor válido'); return; }

    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('type', type);
      formData.set('description', description.trim());
      formData.set('amount', String(amount));
      formData.set('date', date);
      formData.set('reference_month', referenceMonth);
      formData.set('category_id', categoryId);
      formData.set('account_id', accountId);
      formData.set('status', status);
      formData.set('notes', notes);
      await updateAction(formData);
      router.push(`/transactions/${tx.id}`);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border-2 border-input p-1">
        <button
          type="button"
          onClick={() => { setType('expense'); setCategoryId(''); }}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all',
            type === 'expense' ? 'bg-red-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
          )}
        >
          <ArrowDownLeft className="h-4 w-4" />
          Despesa
        </button>
        <button
          type="button"
          onClick={() => { setType('income'); setCategoryId(''); }}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all',
            type === 'income' ? 'bg-green-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
          )}
        >
          <ArrowUpRight className="h-4 w-4" />
          Receita
        </button>
      </div>

      {/* Value */}
      <Card className={cn(
        'border-2 transition-colors',
        type === 'expense' ? 'border-red-200 dark:border-red-900' : 'border-green-200 dark:border-green-900'
      )}>
        <CardContent className="px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Valor</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-muted-foreground">R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={amountRaw}
              onChange={(e) => setAmountRaw(formatCurrency(e.target.value))}
              placeholder="0,00"
              className="flex-1 bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/30"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-5">
          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Descrição *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Salário..."
              className="h-11 w-full rounded-xl border-2 border-input bg-background px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Category chips */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Categoria
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryId('')}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  !categoryId
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input text-muted-foreground hover:border-primary hover:text-foreground'
                )}
              >
                Nenhuma
              </button>
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    categoryId === cat.id
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-input text-muted-foreground hover:border-primary hover:text-foreground'
                  )}
                  style={
                    categoryId === cat.id
                      ? { backgroundColor: cat.color ?? '#6366f1', borderColor: cat.color ?? '#6366f1' }
                      : {}
                  }
                >
                  {categoryId === cat.id && <Check className="h-3 w-3" />}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Account chips */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Conta
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAccountId('')}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    !accountId
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input text-muted-foreground hover:border-primary hover:text-foreground'
                  )}
                >
                  Nenhuma
                </button>
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountId(acc.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                      accountId === acc.id
                        ? 'border-transparent text-white shadow-sm'
                        : 'border-input text-muted-foreground hover:border-primary hover:text-foreground'
                    )}
                    style={
                      accountId === acc.id
                        ? { backgroundColor: acc.color ?? '#6366f1', borderColor: acc.color ?? '#6366f1' }
                        : {}
                    }
                  >
                    {accountId === acc.id && <Check className="h-3 w-3" />}
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: acc.color ?? '#6366f1' }}
                    />
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competência + Date + Status */}
      <Card>
        <CardContent className="p-5 space-y-4">
          {/* Competência */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Competência
              </label>
              <span className="text-xs text-muted-foreground">Mês a que pertence</span>
            </div>
            <input
              type="month"
              value={referenceMonth}
              onChange={(e) => setReferenceMonth(e.target.value)}
              className="h-11 w-full rounded-xl border-2 border-primary/30 bg-background px-3 text-sm font-medium focus:border-primary focus:outline-none transition-colors"
            />
            {referenceMonth !== `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` && (
              <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                <span>⚠</span>
                Contabilizando em{' '}
                <strong>{(() => { const [y, m] = referenceMonth.split('-'); const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']; return `${MONTHS[parseInt(m,10)-1]} de ${y}`; })()}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Data do lançamento
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-xl border-2 border-input bg-background px-3 text-sm focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-xl border-2 border-input p-0.5">
                <button
                  type="button"
                  onClick={() => setStatus('confirmed')}
                  className={cn(
                    'rounded-lg py-1.5 text-xs font-semibold transition-all',
                    status === 'confirmed' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  Confirmado
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={cn(
                    'rounded-lg py-1.5 text-xs font-semibold transition-all',
                    status === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  Pendente
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="p-5 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Observações (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Alguma nota sobre essa transação..."
            className="w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors resize-none"
          />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30">
          {error}
        </div>
      )}

      <div className="pb-6">
        <button
          type="submit"
          disabled={loading}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 active:scale-[0.99]',
            type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar alterações'}
        </button>
      </div>

      {/* Hidden field to suppress unused var warning */}
      {showInstallments && <span />}
    </form>
  );
}
