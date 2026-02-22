import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  LogIn,
  LogOut,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { QuickClockButton } from "@/components/time-tracking/quick-clock-button";
import { TimeBalanceChart } from "@/components/time-tracking/time-charts";
import { EntriesCalendar } from "@/components/time-tracking/entries-calendar";
import {
  calcWorkedMinutes,
  calcBalanceMinutes,
  formatBalance,
  minutesToString,
  formatTime,
  formatDate,
  getWeekNumber,
} from "@/lib/time-tracking";
import type { Tables } from "@/types/database.types";

type TimeEntry = Tables<"time_entries">;

function getMonthRange(monthParam?: string) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  if (monthParam) {
    const [y, m] = monthParam.split("-").map(Number);
    if (y && m) {
      year = y;
      month = m;
    }
  }

  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(year, month, 0).toISOString().split("T")[0];
  return { first, last, year, month };
}

function getWeekRange(monthParam?: string) {
  const now = new Date();
  let targetDate = now;

  if (monthParam) {
    const [y, m] = monthParam.split("-").map(Number);
    if (y && m) {
      // If viewing a past/future month, use the 1st day of that month to calculate the week
      const isCurrentMonth =
        y === now.getFullYear() && m === now.getMonth() + 1;
      if (!isCurrentMonth) {
        targetDate = new Date(y, m - 1, 1);
      }
    }
  }

  const dayOfWeek = targetDate.getDay();
  const diff = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(targetDate.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    first: monday.toISOString().split("T")[0],
    last: sunday.toISOString().split("T")[0],
  };
}

function buildWeeklyBalanceData(entries: TimeEntry[]) {
  const byWeek: Record<string, number> = {};
  for (const e of entries) {
    const week = `S${getWeekNumber(new Date(e.date))}`;
    const worked = calcWorkedMinutes(e);
    const balance =
      worked > 0 ? calcBalanceMinutes(worked, e.expected_hours ?? 8) : 0;
    byWeek[week] = (byWeek[week] ?? 0) + balance;
  }
  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, balance]) => ({ week, balance }));
}

export default async function TimeTrackingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const monthParam = resolvedSearchParams.month as string | undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { first, last, year, month } = getMonthRange(monthParam);
  const week = getWeekRange(monthParam);

  const today = new Date();
  const todayDate = today.toISOString().split("T")[0];

  const [{ data: monthEntries }, { data: todayEntry }] = await Promise.all([
    supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user!.id)
      .gte("date", first)
      .lte("date", last)
      .order("date", { ascending: false }),
    supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user!.id)
      .eq("date", todayDate)
      .maybeSingle(),
  ]);

  const entries = (monthEntries ?? []) as TimeEntry[];
  const today_entry = todayEntry as TimeEntry | null;

  // Metrics
  const totalWorkedMin = entries.reduce(
    (acc, e) => acc + calcWorkedMinutes(e),
    0,
  );
  const totalExpectedMin = entries.reduce((acc, e) => {
    const worked = calcWorkedMinutes(e);
    if (worked === 0) return acc; // skip days with no clock-in
    return acc + (e.expected_hours ?? 8) * 60;
  }, 0);
  const totalBalance = totalWorkedMin - totalExpectedMin;

  const completeDays = entries.filter((e) => e.clock_in && e.clock_out).length;
  const incompleteDays = entries.filter(
    (e) => e.clock_in && !e.clock_out,
  ).length;
  const overtimeDays = entries.filter((e) => {
    const w = calcWorkedMinutes(e);
    return w > 0 && calcBalanceMinutes(w, e.expected_hours ?? 8) > 0;
  }).length;
  const negativeDays = entries.filter((e) => {
    const w = calcWorkedMinutes(e);
    return w > 0 && calcBalanceMinutes(w, e.expected_hours ?? 8) < 0;
  }).length;

  // Today's worked
  const todayWorked = today_entry ? calcWorkedMinutes(today_entry) : 0;
  const todayBalance =
    today_entry && todayWorked > 0
      ? calcBalanceMinutes(todayWorked, today_entry.expected_hours ?? 8)
      : null;

  // Week entries
  // We need to fetch week entries separately if the week spans across two months
  // or if we are viewing a past month where the week entries might not be in `monthEntries`
  const { data: weekEntriesData } = await supabase
    .from("time_entries")
    .select("*")
    .eq("user_id", user!.id)
    .gte("date", week.first)
    .lte("date", week.last);

  const weekEntries = (weekEntriesData ?? []) as TimeEntry[];

  const weekWorked = weekEntries.reduce(
    (acc, e) => acc + calcWorkedMinutes(e),
    0,
  );

  // Chart data
  const weeklyBalanceData = buildWeeklyBalanceData(entries);

  // Recent entries
  const recentEntries = entries.slice(0, 5);

  const balanceColor = totalBalance >= 0 ? "text-emerald-500" : "text-rose-500";
  const balanceBg =
    totalBalance >= 0
      ? "from-emerald-600 to-teal-600"
      : "from-rose-600 to-pink-600";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de Ponto"
        description={`${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}`}
      >
        <QuickClockButton />
      </PageHeader>

      {/* Today's Status Banner */}
      <Card
        className={`bg-linear-to-r ${today_entry?.clock_in ? "from-primary/10 to-violet-500/10 border-primary/20" : "from-muted/50 to-muted/30"}`}
      >
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${today_entry?.clock_in ? "bg-primary/15" : "bg-muted"}`}
              >
                <Timer
                  className={`h-5 w-5 ${today_entry?.clock_in ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {!today_entry?.clock_in && "Sem registro hoje"}
                  {today_entry?.clock_in &&
                    !today_entry?.clock_out &&
                    "Expediente em andamento"}
                  {today_entry?.clock_in &&
                    today_entry?.clock_out &&
                    "Expediente encerrado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {today_entry?.clock_in
                    ? `Entrada: ${formatTime(today_entry.clock_in)}`
                    : 'Clique em "Bater Ponto" para registrar'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:flex sm:items-center gap-y-4 gap-x-2 sm:gap-6 text-sm mt-2 sm:mt-0">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Entrada</p>
                <p className="font-semibold">
                  {formatTime(today_entry?.clock_in)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Almoço</p>
                <p className="font-semibold">
                  {today_entry?.lunch_start
                    ? `${formatTime(today_entry.lunch_start)} - ${formatTime(today_entry.lunch_end)}`
                    : "--:--"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Saída</p>
                <p className="font-semibold">
                  {formatTime(today_entry?.clock_out)}
                </p>
              </div>
              {todayWorked > 0 && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Trabalhado</p>
                  <p className="font-semibold text-primary">
                    {minutesToString(todayWorked)}
                  </p>
                </div>
              )}
              {todayBalance !== null && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p
                    className={`font-semibold ${todayBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {formatBalance(todayBalance)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards section */}
      {/* Mobile Layout */}
      <div className="flex flex-col gap-4 md:hidden">
        {/* Main KPI: Saldo do Mês */}
        <Card
          className={`bg-linear-to-br ${balanceBg} border-none text-white shadow-lg`}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="rounded-lg bg-white/20 p-2">
                {totalBalance >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
              <span className="text-xs font-medium bg-white/20 rounded-full px-2 py-0.5 capitalize">
                {new Date(year, month - 1).toLocaleDateString("pt-BR", {
                  month: "short",
                })}
              </span>
            </div>
            <p className="text-2xl font-bold">{formatBalance(totalBalance)}</p>
            <p className="text-xs text-white/70 mt-1">Saldo do mês</p>
          </CardContent>
        </Card>

        {/* Carousel for secondary KPIs */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          <div className="min-w-60 snap-center flex">
            <Card className="w-full flex flex-col justify-between">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  {minutesToString(totalWorkedMin)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Horas trabalhadas
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="min-w-60 snap-center flex">
            <Card className="w-full flex flex-col justify-between">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{completeDays}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dias completos
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="min-w-60 snap-center flex">
            <Card className="w-full flex flex-col justify-between">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-lg bg-amber-500/10 p-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  {minutesToString(weekWorked)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Horas esta semana
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`bg-linear-to-br ${balanceBg} border-none text-white shadow-lg`}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="rounded-lg bg-white/20 p-2">
                {totalBalance >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
              <span className="text-xs font-medium bg-white/20 rounded-full px-2 py-0.5 capitalize">
                {new Date(year, month - 1).toLocaleDateString("pt-BR", {
                  month: "short",
                })}
              </span>
            </div>
            <p className="text-2xl font-bold">{formatBalance(totalBalance)}</p>
            <p className="text-xs text-white/70 mt-1">Saldo do mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">
              {minutesToString(totalWorkedMin)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Horas trabalhadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{completeDays}</p>
            <p className="text-xs text-muted-foreground mt-1">Dias completos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{minutesToString(weekWorked)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Horas esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Entries Calendar */}
      <EntriesCalendar
        initialEntries={entries}
        initialYearMonth={`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Weekly balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Saldo por Semana (Mês Selecionado)
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Stats + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Resumo do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Dias com hora extra</span>
              </div>
              <span className="font-semibold">{overtimeDays}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-rose-500">
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Dias com saldo negativo</span>
              </div>
              <span className="font-semibold">{negativeDays}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Registros incompletos</span>
              </div>
              <span className="font-semibold">{incompleteDays}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-blue-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Total esperado</span>
              </div>
              <span className="font-semibold">
                {minutesToString(totalExpectedMin)}
              </span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Saldo acumulado</span>
                <span className={balanceColor}>
                  {formatBalance(totalBalance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent entries */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Registros Recentes
              </CardTitle>
              <Link
                href="/time-tracking/entries"
                className="text-xs text-primary hover:underline font-medium"
              >
                Ver todos
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum registro este mês
                </p>
                <QuickClockButton variant="outline" className="mt-3" />
              </div>
            ) : (
              recentEntries.map((entry) => {
                const worked = calcWorkedMinutes(entry);
                const balance =
                  worked > 0
                    ? calcBalanceMinutes(worked, entry.expected_hours ?? 8)
                    : null;
                const isPositive = balance !== null && balance >= 0;

                return (
                  <Link
                    key={entry.id}
                    href={`/time-tracking/entries/${entry.id}`}
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/40 transition-colors group"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                        !entry.clock_in
                          ? "bg-muted"
                          : !entry.clock_out
                            ? "bg-amber-500/10"
                            : isPositive
                              ? "bg-emerald-500/10"
                              : "bg-rose-500/10"
                      }`}
                    >
                      <Clock
                        className={`h-4 w-4 ${
                          !entry.clock_in
                            ? "text-muted-foreground"
                            : !entry.clock_out
                              ? "text-amber-500"
                              : isPositive
                                ? "text-emerald-500"
                                : "text-rose-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {new Date(
                            entry.date + "T12:00:00",
                          ).toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </p>
                        {!entry.clock_out && entry.clock_in && (
                          <span className="text-xs bg-amber-500/10 text-amber-600 rounded-full px-2 py-0.5">
                            Em andamento
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <LogIn className="h-3 w-3 text-emerald-500" />
                          {formatTime(entry.clock_in)}
                        </span>
                        {entry.lunch_start && (
                          <span className="flex items-center gap-1">
                            <Coffee className="h-3 w-3 text-amber-500" />
                            {formatTime(entry.lunch_start)}-
                            {formatTime(entry.lunch_end)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <LogOut className="h-3 w-3 text-rose-500" />
                          {formatTime(entry.clock_out)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {worked > 0 ? minutesToString(worked) : "--"}
                      </p>
                      {balance !== null && (
                        <p
                          className={`text-xs font-medium ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {formatBalance(balance)}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
