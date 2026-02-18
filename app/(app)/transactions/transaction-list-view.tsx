import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Tables } from '@/types/database.types';

type TxRow = Tables<'transactions'> & {
  categories: { name: string; color: string } | null;
  accounts: { name: string } | null;
};

const statusLabel: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado',
};

const statusBadge: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const SHORT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function fmt(v: number) {
  return 'R$\u00a0' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDate(dateStr: string) {
  // dateStr is YYYY-MM-DD — parse as local date without timezone shift
  const [, m, d] = dateStr.split('-');
  return `${d} ${SHORT_MONTHS[parseInt(m, 10) - 1]}`;
}

function formatMonth(dateStr: string) {
  // dateStr is YYYY-MM
  const [y, m] = dateStr.split('-');
  return `${SHORT_MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

export function TransactionListView({ transactions }: { transactions: TxRow[] }) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma transação encontrada.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-6 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <span>Descrição</span>
          <span>Categoria / Conta</span>
          <span>Data</span>
          <span>Status</span>
          <span className="text-right">Valor</span>
        </div>
        <div className="divide-y">
          {transactions.map((tx) => {
            const cat = tx.categories as { name: string; color: string } | null;
            const acc = tx.accounts as { name: string } | null;
            const badge = statusBadge[tx.status ?? ''] ?? 'bg-slate-100 text-slate-500';
            const isIncome = tx.type === 'income';
            const catColor = cat?.color ?? '#6366f1';

            const refDate = tx.reference_date ? tx.reference_date.slice(0, 7) : null;
            const txDateMonth = tx.date ? tx.date.slice(0, 7) : null;
            const hasCompetencia = refDate && txDateMonth && refDate !== txDateMonth;

            return (
              <Link
                key={tx.id}
                href={`/transactions/${tx.id}`}
                className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
              >
                {/* Descrição */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full shrink-0"
                    style={{ backgroundColor: `${catColor}20` }}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description ?? '—'}</p>
                    {tx.notes && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{tx.notes}</p>
                    )}
                  </div>
                </div>

                {/* Categoria / Conta */}
                <div className="hidden sm:block min-w-0">
                  {cat ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: `${catColor}18`, color: catColor }}
                    >
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                      {cat.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem categoria</span>
                  )}
                  {acc && (
                    <p className="text-xs text-muted-foreground mt-0.5">{acc.name}</p>
                  )}
                </div>

                {/* Data */}
                <div className="hidden sm:block">
                  <p className="text-xs text-foreground">{tx.date ? formatDate(tx.date) : '—'}</p>
                  {hasCompetencia && refDate && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Comp. {formatMonth(refDate)}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="hidden sm:block">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
                    {statusLabel[tx.status ?? ''] ?? tx.status}
                  </span>
                </div>

                {/* Valor + mobile fallback info */}
                <div className="flex flex-col items-end gap-1">
                  <p className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'}{fmt(tx.amount ?? 0)}
                  </p>
                  {/* Mobile: show category + date inline */}
                  <p className="text-xs text-muted-foreground sm:hidden">
                    {cat?.name ?? 'Sem categoria'}
                    {tx.date ? ` • ${formatDate(tx.date)}` : ''}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium sm:hidden ${badge}`}>
                    {statusLabel[tx.status ?? ''] ?? tx.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
