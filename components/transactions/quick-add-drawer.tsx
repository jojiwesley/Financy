'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Category = { id: string; name: string; type: string; color: string | null };
type Account = { id: string; name: string; color: string | null };

interface QuickAddDrawerProps {
  open: boolean;
  onClose: () => void;
}

// Formata enquanto digita: "1234" → "12,34"
function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  return (n / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrency(formatted: string): number {
  const clean = formatted.replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

export function QuickAddDrawer({ open, onClose }: QuickAddDrawerProps) {
  const router = useRouter();
  const descRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountRaw, setAmountRaw] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  // Competência: mês a que a transação pertence (pode diferir do mês de lançamento)
  const [referenceMonth, setReferenceMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [status, setStatus] = useState<'confirmed' | 'pending'>('confirmed');
  const [installments, setInstallments] = useState(1);
  const [showInstallments, setShowInstallments] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentDescriptions, setRecentDescriptions] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  // Load categories, accounts, recent descriptions
  useEffect(() => {
    if (!open) return;
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
        supabase
          .from('transactions')
          .select('description')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]).then(([{ data: cats }, { data: accs }, { data: recent }]) => {
        setCategories((cats as Category[]) ?? []);
        setAccounts((accs as Account[]) ?? []);

        // Deduplicate descriptions
        const unique = [...new Set((recent ?? []).map((r) => r.description).filter(Boolean))] as string[];
        setRecentDescriptions(unique.slice(0, 20));

        // Pre-select first account
        if (accs && accs.length > 0 && !accountId) {
          setAccountId(accs[0].id);
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Focus description input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => descRef.current?.focus(), 150);
    }
  }, [open]);

  // Autocomplete suggestions
  useEffect(() => {
    if (!description.trim()) {
      setSuggestions([]);
      return;
    }
    const q = description.toLowerCase();
    setSuggestions(
      recentDescriptions.filter((d) => d.toLowerCase().includes(q) && d !== description).slice(0, 4)
    );
  }, [description, recentDescriptions]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');

  const reset = useCallback(() => {
    setType('expense');
    setAmountRaw('');
    setDescription('');
    setCategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    setReferenceMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setStatus('confirmed');
    setInstallments(1);
    setShowInstallments(false);
    setError('');
    setSavedOk(false);
  }, []);

  async function handleSave(addAnother = false) {
    if (!description.trim()) { setError('Informe a descrição'); return; }
    const amount = parseCurrency(amountRaw);
    if (!amount || amount <= 0) { setError('Informe um valor válido'); return; }

    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // reference_date = primeiro dia do mês de competência selecionado
      const refDate = `${referenceMonth}-01`;

      if (installments > 1 && type === 'expense') {
        const rows = Array.from({ length: installments }, (_, i) => {
          const d = new Date(date);
          d.setMonth(d.getMonth() + i);
          const ref = new Date(refDate);
          ref.setMonth(ref.getMonth() + i);
          return {
            user_id: user.id,
            type,
            description: `${description} (${i + 1}/${installments})`,
            amount: parseFloat((amount / installments).toFixed(2)),
            date: d.toISOString().split('T')[0],
            reference_date: ref.toISOString().split('T')[0],
            category_id: categoryId || null,
            account_id: accountId || null,
            status,
          };
        });
        const { error: err } = await supabase.from('transactions').insert(rows);
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await supabase.from('transactions').insert({
          user_id: user.id,
          type,
          description: description.trim(),
          amount,
          date,
          reference_date: refDate,
          category_id: categoryId || null,
          account_id: accountId || null,
          status,
        });
        if (err) throw new Error(err.message);
      }

      setSavedOk(true);
      setTimeout(() => {
        if (addAnother) {
          reset();
          setSavedOk(false);
          setTimeout(() => descRef.current?.focus(), 50);
        } else {
          onClose();
          router.refresh();
        }
      }, 600);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl',
          'translate-x-0 transition-transform duration-300'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Adicionar transação"
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-4 border-b',
          type === 'expense' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-green-50 dark:bg-green-950/30'
        )}>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Adicionar transação
            </p>
            <h2 className={cn(
              'text-lg font-bold',
              type === 'expense' ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
            )}>
              {type === 'expense' ? 'Despesa' : 'Receita'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-black/10 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border p-1">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(''); }}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                type === 'expense'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <ArrowDownLeft className="h-4 w-4" />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId(''); }}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                type === 'income'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <ArrowUpRight className="h-4 w-4" />
              Receita
            </button>
          </div>

          {/* Value — big numeric input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Valor
            </label>
            <div className={cn(
              'flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-colors',
              'focus-within:border-primary',
              type === 'expense' ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800'
            )}>
              <span className="text-2xl font-bold text-muted-foreground">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountRaw}
                onChange={(e) => setAmountRaw(formatCurrency(e.target.value))}
                placeholder="0,00"
                className="flex-1 bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          {/* Description + autocomplete */}
          <div className="relative space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Descrição
            </label>
            <input
              ref={descRef}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Aluguel..."
              className="h-11 w-full rounded-xl border-2 border-input bg-background px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border bg-background shadow-lg">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => { setDescription(s); setSuggestions([]); }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent"
                    >
                      <span className="text-muted-foreground">↩</span>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
                    : 'border-input text-muted-foreground hover:border-primary hover:text-primary'
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

          {/* Account */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Conta
              </label>
              <div className="flex flex-wrap gap-2">
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

          {/* Competência */}
          <div className="space-y-1">
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
              className="h-10 w-full rounded-xl border-2 border-input bg-background px-3 text-sm focus:border-primary focus:outline-none transition-colors"
            />
            {referenceMonth !== `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Essa transação será contabilizada em {new Date(`${referenceMonth}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Date + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
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
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-xl border-2 border-input p-0.5">
                <button
                  type="button"
                  onClick={() => setStatus('confirmed')}
                  className={cn(
                    'rounded-lg py-1.5 text-xs font-medium transition-all',
                    status === 'confirmed' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  Confirmado
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={cn(
                    'rounded-lg py-1.5 text-xs font-medium transition-all',
                    status === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  Pendente
                </button>
              </div>
            </div>
          </div>

          {/* Installments (expense only) */}
          {type === 'expense' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowInstallments((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showInstallments && 'rotate-180')} />
                {installments > 1 ? `Parcelado em ${installments}x de R$ ${formatCurrency(String(Math.round((parseCurrency(amountRaw) / installments) * 100)))}` : 'Parcelar compra'}
              </button>
              {showInstallments && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setInstallments(n)}
                      className={cn(
                        'flex h-9 w-12 items-center justify-center rounded-lg border text-sm font-semibold transition-all',
                        installments === n
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-input text-muted-foreground hover:border-primary hover:text-foreground'
                      )}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {savedOk && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
              <Check className="h-4 w-4" />
              Transação salva!
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t bg-background px-5 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={loading}
            className={cn(
              'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50',
              type === 'expense'
                ? 'bg-red-600 hover:bg-red-700 active:scale-[0.98]'
                : 'bg-green-600 hover:bg-green-700 active:scale-[0.98]'
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : savedOk ? (
              <><Check className="h-4 w-4" /> Salvo!</>
            ) : (
              <>Salvar {type === 'expense' ? 'Despesa' : 'Receita'}</>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={loading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Salvar e adicionar outra
          </button>
        </div>
      </div>
    </>
  );
}
