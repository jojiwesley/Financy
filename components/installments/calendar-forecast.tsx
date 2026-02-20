"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarEntry = {
  date: string; // 'YYYY-MM-DD' — actual due date
  amount: number;
  description: string;
  parcelNumber: number;
  totalInstallments: number;
  cardColor: string;
  cardName: string;
};

interface CalendarForecastProps {
  entries: CalendarEntry[];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Groups entries by their date string (YYYY-MM-DD) */
function groupByDate(entries: CalendarEntry[]): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.date) ?? [];
    list.push(entry);
    map.set(entry.date, list);
  }
  return map;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function CalendarForecast({ entries }: CalendarForecastProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const byDate = groupByDate(entries);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  interface DayCell {
    day: number | null;
    dateStr: string | null;
    isToday: boolean;
    isPast: boolean;
    entries: CalendarEntry[];
  }

  const cells: DayCell[] = [];

  // Empty cells before the 1st
  for (let i = 0; i < firstDay; i++) {
    cells.push({
      day: null,
      dateStr: null,
      isToday: false,
      isPast: false,
      entries: [],
    });
  }

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    cells.push({
      day: d,
      dateStr,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      entries: byDate.get(dateStr) ?? [],
    });
  }

  const selectedEntries = selectedDate ? (byDate.get(selectedDate) ?? []) : [];
  const selectedDayTotal = selectedEntries.reduce((s, e) => s + e.amount, 0);

  // Total for the displayed month
  const monthKey = `${year}-${pad(month + 1)}`;
  const monthTotal = entries
    .filter((e) => e.date.startsWith(monthKey))
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg border p-2 hover:bg-muted transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-center">
          <p className="text-base font-semibold">
            {MONTHS[month]} {year}
          </p>
          {monthTotal > 0 && (
            <p className="text-xs text-red-600 font-medium">
              {fmt(monthTotal)} previsto
            </p>
          )}
        </div>

        <button
          onClick={nextMonth}
          className="rounded-lg border p-2 hover:bg-muted transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-[11px] font-semibold text-muted-foreground py-1"
          >
            {wd}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((cell, idx) => {
          if (!cell.day || !cell.dateStr) {
            return <div key={`empty-${idx}`} />;
          }

          const isSelected = selectedDate === cell.dateStr;
          const hasEntries = cell.entries.length > 0;
          const totalForDay = cell.entries.reduce((s, e) => s + e.amount, 0);

          return (
            <button
              key={cell.dateStr}
              onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
              className={cn(
                "relative flex flex-col items-center rounded-lg py-1.5 px-0.5 transition-all text-center min-h-[52px] border",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-transparent hover:border-border hover:bg-muted/50",
                cell.isToday && !isSelected && "border-primary/30 bg-primary/5",
                cell.isPast && !hasEntries && "opacity-40",
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium leading-none",
                  cell.isToday && "text-primary font-bold",
                  isSelected && "text-primary",
                )}
              >
                {cell.day}
              </span>

              {hasEntries && (
                <div className="mt-1 flex flex-col items-center gap-0.5 w-full px-0.5">
                  {/* Colored dots for each card */}
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {cell.entries.slice(0, 3).map((e, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: e.cardColor }}
                      />
                    ))}
                    {cell.entries.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{cell.entries.length - 3}
                      </span>
                    )}
                  </div>
                  {/* Amount */}
                  <span className="text-[10px] font-semibold text-red-600 leading-none">
                    {fmt(totalForDay).replace("R$\u00a0", "")}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day details */}
      {selectedDate && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                "pt-BR",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                },
              )}
            </p>
            {selectedDayTotal > 0 && (
              <p className="text-sm font-bold text-red-600">
                {fmt(selectedDayTotal)}
              </p>
            )}
          </div>

          {selectedEntries.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhum vencimento neste dia.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedEntries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-background border p-3"
                >
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.cardColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {entry.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.cardName} · Parcela {entry.parcelNumber}/
                      {entry.totalInstallments}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-red-600 flex-shrink-0">
                    {fmt(entry.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
