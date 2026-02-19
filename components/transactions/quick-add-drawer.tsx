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
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[70] flex w-full flex-col bg-background shadow-2xl transition-transform duration-300 ease-out',
          'rounded-t-[2rem] border-t',
          'md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:rounded-3xl md:border',
          'max-h-[85vh] md:max-h-[90vh]'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Adicionar transação"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Nova Transação
            </span>
            <h2 className="text-2xl font-bold tracking-tight">
              {type === 'expense' ? 'Despesa' : 'Receita'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-2 pb-safe md:pb-6">
          <div className="space-y-6">
            
            {/* Type Switcher */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
              <button
                type="button"
                onClick={() => { setType('expense'); setCategoryId(''); }}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all',
                  type === 'expense'
                    ? 'bg-background text-red-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Despesa
              </button>
              <button
                type="button"
                onClick={() => { setType('income'); setCategoryId(''); }}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all',
                  type === 'income'
                    ? 'bg-background text-green-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ArrowUpRight className="h-4 w-4" />
                Receita
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground/70">
                Valor
              </label>
              <div className={cn(
                'group flex items-center gap-2 rounded-2xl border-2 px-4 py-3 transition-colors bg-card',
                'focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10',
                type === 'expense' 
                  ? 'border-red-100 dark:border-red-900/30 input-expense' 
                  : 'border-green-100 dark:border-green-900/30 input-income'
              )}>
                <span className="text-lg font-bold text-muted-foreground">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountRaw}
                  onChange={(e) => setAmountRaw(formatCurrency(e.target.value))}
                  placeholder="0,00"
                  className="flex-1 bg-transparent text-3xl font-black tracking-tighter outline-none placeholder:text-muted-foreground/20"
                />
              </div>
            </div>

            {/* Description */}
            <div className="relative space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground/70">
                Descrição
              </label>
              <input
                ref={descRef}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Supermercado"
                className="h-12 w-full rounded-2xl border bg-muted/30 px-4 font-medium transition-all focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border bg-background shadow-xl ring-1 ring-black/5">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => { setDescription(s); setSuggestions([]); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground/70">
                Categoria
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId('')}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-bold transition-all',
                    !categoryId
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  Geral
                </button>
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold transition-all',
                      categoryId === cat.id
                        ? 'border-transparent text-white shadow-sm scale-105'
                        : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                    style={
                      categoryId === cat.id
                        ? { backgroundColor: cat.color ?? '#6366f1' }
                        : {}
                    }
                  >
                    {categoryId === cat.id && <Check className="h-3 w-3 text-white" />}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Fields Collapsible (could be nice, but keeping expanded for now) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground/70">
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 w-full rounded-xl border bg-muted/30 px-3 text-sm font-medium outline-none focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10"
                />
              </div>

               {/* Competência or Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground/70">
                   Status
                </label>
                <div className="flex rounded-xl bg-muted/50 p-1">
                  <button
                    type="button"
                    onClick={() => setStatus('confirmed')}
                    className={cn(
                      'flex-1 rounded-lg py-1.5 text-xs font-bold transition-all',
                      status === 'confirmed' ? 'bg-background shadow-sm text-green-600' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Pago
                  </button>
                  <button
                     type="button"
                     onClick={() => setStatus('pending')}
                     className={cn(
                       'flex-1 rounded-lg py-1.5 text-xs font-bold transition-all',
                       status === 'pending' ? 'bg-background shadow-sm text-amber-600' : 'text-muted-foreground hover:text-foreground'
                     )}
                   >
                     Pendente
                   </button>
                </div>
              </div>
            </div>
            
             {/* Installments Button */}
            {type === 'expense' && (
                <div className="pt-2">
                     <button
                        type="button"
                        onClick={() => setShowInstallments((v) => !v)}
                        className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                      >
                         {showInstallments ? <ChevronDown className="h-4 w-4 rotate-180 transition-transform" /> : <ChevronDown className="h-4 w-4 transition-transform" />}
                         {installments > 1 ? `Parcelado em ${installments}x de R$ ${formatCurrency(String(Math.round((parseCurrency(amountRaw) / installments) * 100)))}` : 'Parcelar esta despesa?'}
                      </button>
                      
                       {showInstallments && (
                        <div className="mt-3 grid grid-cols-6 gap-2">
                          {[2, 3, 4, 5, 6, 12].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setInstallments(n)}
                              className={cn(
                                'flex h-8 w-auto items-center justify-center rounded-lg border text-xs font-bold transition-all',
                                installments === n
                                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                  : 'border-border bg-background hover:bg-muted'
                              )}
                            >
                              {n}x
                            </button>
                          ))}
                            <input 
                                type="number" 
                                className="col-span-2 h-8 rounded-lg border bg-muted/30 text-center text-xs font-bold outline-none focus:border-primary/50 focus:bg-background"
                                placeholder="Outro"
                                value={installments > 12 || ![2,3,4,5,6,12].includes(installments) && installments !== 1 ? installments : ''}
                                onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                            />
                        </div>
                      )}
                </div>
            )}
            
            {/* Error & Success Messages */}
            {error && (
                <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
            )}
            
            {savedOk && (
                 <div className="rounded-2xl bg-green-50 p-4 text-sm font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Salvo com sucesso!
                </div>
            )}

          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-background/80 p-6 backdrop-blur-xl">
          <div className="flex gap-3">
             <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={loading}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-muted bg-transparent text-sm font-bold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all disabled:opacity-50"
            >
              + Outro
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={loading}
              className={cn(
                'flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]',
                type === 'expense'
                  ? 'bg-red-600 shadow-red-500/20 hover:bg-red-700'
                  : 'bg-green-600 shadow-green-500/20 hover:bg-green-700'
              )}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
