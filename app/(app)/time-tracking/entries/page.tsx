import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  Clock,
  Plus,
  LogIn,
  LogOut,
  Coffee,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { QuickClockButton } from '@/components/time-tracking/quick-clock-button';
import {
  calcWorkedMinutes,
  calcBalanceMinutes,
  formatBalance,
  minutesToString,
  formatTime,
} from '@/lib/time-tracking';
import type { Tables } from '@/types/database.types';

type TimeEntry = Tables<'time_entries'>;

export default async function TimeEntriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();
  const monthParam = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [year, month] = monthParam.split('-').map(Number);

  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

  // Prev / next month
  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = monthParam === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user!.id)
    .gte('date', firstDay)
    .lte('date', lastDay)
    .order('date', { ascending: false });

  const allEntries = (entries ?? []) as TimeEntry[];

  const totalWorked = allEntries.reduce((a, e) => a + calcWorkedMinutes(e), 0);
  const totalExpected = allEntries.reduce((a, e) => {
    const w = calcWorkedMinutes(e);
    return w > 0 ? a + (e.expected_hours ?? 8) * 60 : a;
  }, 0);
  const totalBalance = totalWorked - totalExpected;

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Registros de Ponto" description="Histórico completo de entradas e saídas">
        <QuickClockButton />
        <Link
          href="/time-tracking/entries/new"
          className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Manual</span>
        </Link>
      </PageHeader>

      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <Link
          href={`/time-tracking/entries?month=${prevMonth}`}
          className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">
            {new Date(prevDate.getFullYear(), prevDate.getMonth(), 1).toLocaleDateString('pt-BR', { month: 'short' })}
          </span>
        </Link>

        <h2 className="text-base font-semibold capitalize">{monthLabel}</h2>

        <Link
          href={isCurrentMonth ? '#' : `/time-tracking/entries?month=${nextMonth}`}
          className={`flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-sm font-medium transition-all ${
            isCurrentMonth
              ? 'bg-muted/10 text-muted-foreground/40 cursor-not-allowed pointer-events-none'
              : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <span className="hidden sm:inline">
            {new Date(nextDate.getFullYear(), nextDate.getMonth(), 1).toLocaleDateString('pt-BR', { month: 'short' })}
          </span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold">{minutesToString(totalWorked)}</p>
            <p className="text-xs text-muted-foreground mt-1">Horas trabalhadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold">{minutesToString(totalExpected)}</p>
            <p className="text-xs text-muted-foreground mt-1">Horas esperadas</p>
          </CardContent>
        </Card>
        <Card className={`${totalBalance >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
          <CardContent className="p-4 text-center">
            <p className={`text-xl font-bold ${totalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatBalance(totalBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Saldo do mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Entries list */}
      <Card>
        <CardContent className="p-0">
          {allEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum registro em {monthLabel}</p>
              <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Comece registrando seu ponto</p>
              <QuickClockButton />
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {allEntries.map(entry => {
                const worked = calcWorkedMinutes(entry);
                const balance = worked > 0
                  ? calcBalanceMinutes(worked, entry.expected_hours ?? 8)
                  : null;
                const isIncomplete = entry.clock_in && !entry.clock_out;

                return (
                  <Link
                    key={entry.id}
                    href={`/time-tracking/entries/${entry.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Date */}
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-lg font-bold leading-none">
                        {new Date(entry.date + 'T12:00:00').getDate()}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
                      </p>
                    </div>

                    {/* Status icon */}
                    <div className={`hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isIncomplete ? 'bg-amber-500/10' :
                      balance === null ? 'bg-muted' :
                      balance >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                    }`}>
                      {isIncomplete ? (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      ) : balance !== null && balance >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : balance !== null ? (
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Times */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="flex items-center gap-1.5">
                          <LogIn className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="font-medium">{formatTime(entry.clock_in)}</span>
                        </span>
                        {entry.lunch_start && (
                          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Coffee className="h-3 w-3 text-amber-500 shrink-0" />
                            {formatTime(entry.lunch_start)} – {formatTime(entry.lunch_end)}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <LogOut className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          <span className={`font-medium ${!entry.clock_out ? 'text-muted-foreground' : ''}`}>
                            {formatTime(entry.clock_out)}
                          </span>
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.notes}</p>
                      )}
                    </div>

                    {/* Worked + balance */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {worked > 0 ? minutesToString(worked) : '—'}
                      </p>
                      {balance !== null && (
                        <p className={`text-xs font-medium ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatBalance(balance)}
                        </p>
                      )}
                      {isIncomplete && (
                        <p className="text-xs text-amber-500">incompleto</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
