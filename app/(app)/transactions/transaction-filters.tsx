'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Loader2, LayoutList, LayoutGrid } from 'lucide-react';

type Props = {
  categories: { id: string; name: string }[];
  defaultValues: {
    q: string;
    type: string;
    status: string;
    category: string;
    view: string;
  };
};

export function TransactionFilters({ categories, defaultValues }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const pushFilters = useCallback(
    (overrides: Partial<typeof defaultValues>) => {
      const values = { ...defaultValues, ...overrides };
      const sp = new URLSearchParams();
      if (values.q) sp.set('q', values.q);
      if (values.type) sp.set('type', values.type);
      if (values.status) sp.set('status', values.status);
      if (values.category) sp.set('category', values.category);
      if (values.view && values.view !== 'list') sp.set('view', values.view);
      const qs = sp.toString();
      startTransition(() => {
        router.push(`${pathname}${qs ? `?${qs}` : ''}`);
      });
    },
    [defaultValues, pathname, router]
  );

  const isCards = defaultValues.view === 'cards';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-background p-4">
      {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

      {/* Busca por descrição */}
      <input
        type="search"
        placeholder="Buscar transação..."
        defaultValue={defaultValues.q}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            pushFilters({ q: (e.target as HTMLInputElement).value });
          }
        }}
        onChange={(e) => {
          const val = e.target.value;
          if (val.length === 0 || val.length >= 2) {
            const timeout = setTimeout(() => pushFilters({ q: val }), 400);
            return () => clearTimeout(timeout);
          }
        }}
        className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* Tipo */}
      <select
        defaultValue={defaultValues.type}
        onChange={(e) => pushFilters({ type: e.target.value })}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Todos os tipos</option>
        <option value="income">Receita</option>
        <option value="expense">Despesa</option>
      </select>

      {/* Status */}
      <select
        defaultValue={defaultValues.status}
        onChange={(e) => pushFilters({ status: e.target.value })}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Todos os status</option>
        <option value="confirmed">Confirmado</option>
        <option value="pending">Pendente</option>
        <option value="cancelled">Cancelado</option>
      </select>

      {/* Categoria */}
      <select
        defaultValue={defaultValues.category}
        onChange={(e) => pushFilters({ category: e.target.value })}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Todas as categorias</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Limpar filtros */}
      {(defaultValues.q || defaultValues.type || defaultValues.status || defaultValues.category) && (
        <button
          onClick={() => pushFilters({ q: '', type: '', status: '', category: '' })}
          className="h-9 rounded-md border px-3 text-sm text-muted-foreground hover:bg-accent transition-colors"
        >
          Limpar filtros
        </button>
      )}

      {/* View toggle */}
      <div className="ml-auto flex items-center rounded-lg border bg-muted/40 p-1 gap-1">
        <button
          onClick={() => pushFilters({ view: 'list' })}
          title="Visão em lista"
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            !isCards
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutList className="h-4 w-4" />
        </button>
        <button
          onClick={() => pushFilters({ view: 'cards' })}
          title="Visão em cards"
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            isCards
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
