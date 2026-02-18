import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import {
  calcWorkedMinutes,
  calcBalanceMinutes,
  formatBalance,
  minutesToString,
  formatTime,
  getWeekNumber,
} from '@/lib/time-tracking';
import { TimeBalanceChart } from '@/components/time-tracking/time-charts';
import type { Tables } from '@/types/database.types';

type TimeEntry = Tables<'time_entries'>;

function groupByWeek(entries: TimeEntry[]) {
  const weeks: Record<string, { entries: TimeEntry[]; weekLabel: string }> = {};
  for (const e of entries) {
    const d = new Date(e.date + 'T12:00:00');
    const wn = getWeekNumber(d);
    const year = d.getFullYear();
    const key = `${year}-W${String(wn).padStart(2, '0')}`;
    const weekLabel = `Sem. ${wn}`;
    if (!weeks[key]) weeks[key] = { entries: [], weekLabel };
    weeks[key].entries.push(e);
  }
  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({ key, ...val }));
}

export default async function TimeTrackingReportsPage({
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
    .order('date', { ascending: true });

  const allEntries = (entries ?? []) as TimeEntry[];

  // Metrics
  const completedEntries = allEntries.filter(e => e.clock_in && e.clock_out);
  const totalWorked = allEntries.reduce((a, e) => a + calcWorkedMinutes(e), 0);
  const totalExpected = allEntries.reduce((a, e) => {
    const w = calcWorkedMinutes(e);
    return w > 0 ? a + (e.expected_hours ?? 8) * 60 : a;
  }, 0);
  const totalBalance = totalWorked - totalExpected;

  const overtimeDays = completedEntries.filter(e => {
    const w = calcWorkedMinutes(e);
    return calcBalanceMinutes(w, e.expected_hours ?? 8) > 0;
  });
  const negativeDays = completedEntries.filter(e => {
    const w = calcWorkedMinutes(e);
    return calcBalanceMinutes(w, e.expected_hours ?? 8) < 0;
  });

  const totalOvertime = overtimeDays.reduce((a, e) => {
    const w = calcWorkedMinutes(e);
    return a + calcBalanceMinutes(w, e.expected_hours ?? 8);
  }, 0);
  const totalNegative = negativeDays.reduce((a, e) => {
    const w = calcWorkedMinutes(e);
    return a + calcBalanceMinutes(w, e.expected_hours ?? 8);
  }, 0);

  const avgWorked = completedEntries.length > 0
    ? Math.round(totalWorked / completedEntries.length)
    : 0;

  // Lunch duration avg
  const lunchEntries = allEntries.filter(e => e.lunch_start && e.lunch_end);
  const avgLunch = lunchEntries.length > 0
    ? Math.round(
        lunchEntries.reduce((a, e) => {
          const ls = e.lunch_start!.split(':').map(Number);
          const le = e.lunch_end!.split(':').map(Number);
          return a + (le[0] * 60 + le[1]) - (ls[0] * 60 + ls[1]);
        }, 0) / lunchEntries.length
      )
    : 0;

  // Per-week data
  const weekGroups = groupByWeek(allEntries);
  const weeklyBalanceData = weekGroups.map(w => ({
    week: w.weekLabel,
    balance: w.entries.reduce((a, e) => {
      const worked = calcWorkedMinutes(e);
      return worked > 0 ? a + calcBalanceMinutes(worked, e.expected_hours ?? 8) : a;
    }, 0),
  }));

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Análise detalhada das horas trabalhadas"
      >
        <Link
          href="/time-tracking"
          className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
        >
          <BarChart3 className="h-4 w-4" />
          Dashboard
        </Link>
      </PageHeader>

      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <Link
          href={`/time-tracking/reports?month=${prevMonth}`}
          className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          {new Date(prevDate.getFullYear(), prevDate.getMonth(), 1).toLocaleDateString('pt-BR', { month: 'short' })}
        </Link>
        <h2 className="text-base font-semibold capitalize">{monthLabel}</h2>
        <Link
          href={isCurrentMonth ? '#' : `/time-tracking/reports?month=${nextMonth}`}
          className={`flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-sm font-medium transition-all ${
            isCurrentMonth
              ? 'bg-muted/10 text-muted-foreground/40 cursor-not-allowed pointer-events-none'
              : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          {new Date(nextDate.getFullYear(), nextDate.getMonth(), 1).toLocaleDateString('pt-BR', { month: 'short' })}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <p className="text-xl font-bold">{minutesToString(totalWorked)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total trabalhado</p>
          </CardContent>
        </Card>

        <Card className={`${totalBalance >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`rounded-lg p-2 ${totalBalance >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                {totalBalance >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
              </div>
            </div>
            <p className={`text-xl font-bold ${totalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatBalance(totalBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Saldo do mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg bg-violet-500/10 p-2">
                <Clock className="h-4 w-4 text-violet-500" />
              </div>
            </div>
            <p className="text-xl font-bold">{minutesToString(avgWorked)}</p>
            <p className="text-xs text-muted-foreground mt-1">Média diária</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <p className="text-xl font-bold">{completedEntries.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Dias registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Saldo por Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyBalanceData.length > 0 ? (
              <>
                <TimeBalanceChart data={weeklyBalanceData} />
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500 opacity-85" />
                    Saldo positivo
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2.5 w-2.5 rounded-sm bg-rose-500 opacity-85" />
                    Saldo negativo
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Horas Extras & Negativas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700">Horas Extras</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{formatBalance(totalOvertime)}</p>
              <p className="text-xs text-emerald-700/70 mt-1">{overtimeDays.length} dia(s) com saldo positivo</p>
            </div>

            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-semibold text-rose-700">Horas Negativas</span>
              </div>
              <p className="text-2xl font-bold text-rose-600">{formatBalance(totalNegative)}</p>
              <p className="text-xs text-rose-700/70 mt-1">{negativeDays.length} dia(s) com saldo negativo</p>
            </div>

            {avgLunch > 0 && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                <p className="text-sm font-semibold text-amber-700">Almoço médio</p>
                <p className="text-lg font-bold text-amber-600 mt-1">{minutesToString(avgLunch)}</p>
                <p className="text-xs text-amber-700/70">{lunchEntries.length} dia(s) com intervalo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly breakdown table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Detalhamento Semanal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {weekGroups.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              Sem registros para exibir
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {weekGroups.map(w => {
                const wWorked = w.entries.reduce((a, e) => a + calcWorkedMinutes(e), 0);
                const wExpected = w.entries.reduce((a, e) => {
                  const worked = calcWorkedMinutes(e);
                  return worked > 0 ? a + (e.expected_hours ?? 8) * 60 : a;
                }, 0);
                const wBalance = wWorked - wExpected;

                return (
                  <div key={w.key} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">{w.weekLabel}</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{minutesToString(wWorked)} trabalhado</span>
                        <span className={`font-semibold ${wBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatBalance(wBalance)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {w.entries.map(e => {
                        const worked = calcWorkedMinutes(e);
                        const balance = worked > 0 ? calcBalanceMinutes(worked, e.expected_hours ?? 8) : null;
                        return (
                          <Link
                            key={e.id}
                            href={`/time-tracking/entries/${e.id}`}
                            className="rounded-lg border border-border/50 bg-muted/20 p-2.5 hover:bg-muted/40 transition-colors text-center"
                          >
                            <p className="text-xs text-muted-foreground capitalize">
                              {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                            </p>
                            <p className="text-sm font-semibold mt-1">
                              {worked > 0 ? minutesToString(worked) : '—'}
                            </p>
                            {balance !== null && (
                              <p className={`text-xs ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatBalance(balance)}
                              </p>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
