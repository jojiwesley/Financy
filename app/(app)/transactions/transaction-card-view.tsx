import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, CalendarDays, Wallet, Tag, FileText } from 'lucide-react';
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
const LONG_MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function fmt(v: number) {
  return 'R$\u00a0' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDate(dateStr: string) {
  // dateStr is YYYY-MM-DD — parse as local date without timezone shift
  const [y, m, d] = dateStr.split('-');
  return `${d} ${SHORT_MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

function formatMonth(dateStr: string) {
  // dateStr is YYYY-MM
  const [y, m] = dateStr.split('-');
  return `${LONG_MONTHS[parseInt(m, 10) - 1]} de ${y}`;
}

export function TransactionCardView({ transactions }: { transactions: TxRow[] }) {
  if (transactions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma transação encontrada.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {transactions.map((tx) => {
        const cat = tx.categories as { name: string; color: string } | null;
        const acc = tx.accounts as { name: string } | null;
        const badge = statusBadge[tx.status ?? ''] ?? 'bg-slate-100 text-slate-500';
        const isIncome = tx.type === 'income';
        const catColor = cat?.color ?? '#6366f1';

        // Detect if reference_date differs from date (competência ≠ data)
        const refDate = tx.reference_date
          ? tx.reference_date.slice(0, 7) // YYYY-MM
          : null;
        const txDateMonth = tx.date ? tx.date.slice(0, 7) : null;
        const hasCompetencia = refDate && txDateMonth && refDate !== txDateMonth;

        return (
          <Link key={tx.id} href={`/transactions/${tx.id}`}>
            <Card className="group h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
              {/* Colored top border stripe */}
              <div className="h-1 w-full" style={{ backgroundColor: catColor }} />
              <CardContent className="p-5 space-y-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                      style={{ backgroundColor: `${catColor}20` }}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{tx.description ?? '—'}</p>
                      {tx.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tx.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
                    {statusLabel[tx.status ?? ''] ?? tx.status}
                  </span>
                </div>

                {/* Amount */}
                <p
                  className={`text-2xl font-bold tabular-nums ${isIncome ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isIncome ? '+' : '-'}{fmt(tx.amount ?? 0)}
                </p>

                {/* Meta info */}
                <div className="space-y-1.5 border-t pt-3">
                  {cat && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium"
                        style={{ backgroundColor: `${catColor}18`, color: catColor }}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: catColor }}
                        />
                        {cat.name}
                      </span>
                    </div>
                  )}
                  {acc && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Wallet className="h-3.5 w-3.5 shrink-0" />
                      <span>{acc.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span>{tx.date ? formatDate(tx.date) : '—'}</span>
                  </div>
                  {hasCompetencia && refDate && (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span>Competência: {formatMonth(refDate)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
