"use client";

import { useState, useTransition, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClockIn } from "@/components/time-tracking/clock-in-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

type TimeEntry = Tables<"time_entries">;

interface EntriesCalendarProps {
  initialEntries: TimeEntry[];
  initialYearMonth: string; // "YYYY-MM"
}

const DAY_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function EntriesCalendar({
  initialEntries,
  initialYearMonth,
}: EntriesCalendarProps) {
  const [yearMonth, setYearMonth] = useState(initialYearMonth);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const { openDrawer } = useClockIn();

  // Sync local state if prop changes (e.g. via browser back button)
  useEffect(() => {
    setYearMonth(initialYearMonth);
  }, [initialYearMonth]);

  const [year, month] = yearMonth.split("-").map(Number);

  function navigate(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    const newYM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setYearMonth(newYM);

    startTransition(() => {
      router.push(`?month=${newYM}`, { scroll: false });
    });
  }

  // Build a lookup map: "YYYY-MM-DD" → entry
  const entryByDate = new Map<string, TimeEntry>();
  initialEntries.forEach((e) => entryByDate.set(e.date, e));

  // Calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Monday-based offset (Mon=0, ..., Sun=6)
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  function handleDayClick(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const entry = entryByDate.get(dateStr);
    if (entry) {
      router.push(`/time-tracking/entries/${entry.id}`);
    } else {
      openDrawer(dateStr);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Registros
          </CardTitle>
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
            <button
              onClick={() => navigate(-1)}
              disabled={isPending}
              className="rounded-md p-1.5 hover:bg-background transition-colors disabled:opacity-50"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium capitalize min-w-[100px] text-center select-none">
              {monthLabel}
            </span>
            <button
              onClick={() => navigate(1)}
              disabled={isPending}
              className="rounded-md p-1.5 hover:bg-background transition-colors disabled:opacity-50"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 px-4 pb-4">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-medium text-muted-foreground uppercase"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          className={`grid grid-cols-7 gap-1 transition-opacity duration-200 ${isPending ? "opacity-40 pointer-events-none" : ""}`}
        >
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;

            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const entry = entryByDate.get(dateStr);

            const isComplete = Boolean(entry?.clock_in && entry?.clock_out);
            const isIncomplete = Boolean(entry?.clock_in && !entry?.clock_out);

            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;

            return (
              <button
                key={dateStr}
                onClick={() => !isFuture && handleDayClick(day)}
                disabled={isFuture}
                className={[
                  "relative flex flex-col items-center justify-center rounded-lg aspect-square p-1 transition-all",
                  isFuture
                    ? "opacity-30 cursor-default"
                    : "hover:bg-muted/60 cursor-pointer active:scale-95",
                  isToday
                    ? "bg-primary/10 text-primary font-bold ring-1 ring-primary/20"
                    : "text-foreground font-medium",
                ].join(" ")}
              >
                {/* Day number */}
                <span className="text-sm leading-none">{day}</span>

                {/* Status dot */}
                <div className="mt-1 h-1.5 w-1.5 rounded-full shrink-0">
                  {isComplete ? (
                    <div className="h-full w-full rounded-full bg-emerald-500" />
                  ) : isIncomplete ? (
                    <div className="h-full w-full rounded-full bg-rose-500" />
                  ) : !isFuture ? (
                    <div className="h-full w-full rounded-full bg-border" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-medium">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            Completo
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-medium">
            <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
            Incompleto
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-medium">
            <div className="h-1.5 w-1.5 rounded-full bg-border shrink-0" />
            Vazio
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
