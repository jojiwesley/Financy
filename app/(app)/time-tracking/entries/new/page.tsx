"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Save,
  X,
  Loader2,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeInput } from "@/components/ui/time-input";
import { upsertTimeEntry } from "@/app/(app)/time-tracking/actions";
import {
  getCurrentTime,
  getTodayDate,
  calcWorkedMinutes,
  calcBalanceMinutes,
  formatBalance,
  minutesToString,
} from "@/lib/time-tracking";

export default function NewTimeEntryPage() {
  const router = useRouter();

  const [date, setDate] = useState(getTodayDate());
  const [clockIn, setClockIn] = useState("");
  const [lunchStart, setLunchStart] = useState("");
  const [lunchEnd, setLunchEnd] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [expectedHours, setExpectedHours] = useState("8");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function fillNow(setter: (v: string) => void) {
    setter(getCurrentTime());
  }

  // Live calculation
  const preview = {
    clock_in: clockIn,
    lunch_start: lunchStart,
    lunch_end: lunchEnd,
    clock_out: clockOut,
  };
  const workedMin = calcWorkedMinutes(preview);
  const balanceMin =
    workedMin > 0
      ? calcBalanceMinutes(workedMin, parseFloat(expectedHours) || 8)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clockIn) {
      setError("Horário de entrada é obrigatório");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await upsertTimeEntry({
        date,
        clock_in: clockIn,
        lunch_start: lunchStart || undefined,
        lunch_end: lunchEnd || undefined,
        clock_out: clockOut || undefined,
        expected_hours: parseFloat(expectedHours) || 8,
        notes: notes || undefined,
      });
      router.push("/time-tracking/entries");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Registro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registre manualmente suas horas trabalhadas
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
      </div>

      {/* Live preview */}
      {workedMin > 0 && (
        <div
          className={`rounded-xl p-4 flex items-center gap-4 border ${
            balanceMin !== null && balanceMin >= 0
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-rose-500/10 border-rose-500/20"
          }`}
        >
          <Clock
            className={`h-5 w-5 shrink-0 ${balanceMin !== null && balanceMin >= 0 ? "text-emerald-500" : "text-rose-500"}`}
          />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              Horas trabalhadas: {minutesToString(workedMin)}
            </p>
            {balanceMin !== null && (
              <p
                className={`text-xs ${balanceMin >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                Saldo: {formatBalance(balanceMin)}
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Data e Horários
          </h3>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Clock In */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <LogIn className="h-3.5 w-3.5 text-emerald-500" />
                Entrada *
              </label>
              <div className="flex gap-2">
                <TimeInput
                  value={clockIn}
                  onChange={setClockIn}
                  required
                  className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => fillNow(setClockIn)}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                >
                  Agora
                </button>
              </div>
            </div>

            {/* Clock Out */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <LogOut className="h-3.5 w-3.5 text-rose-500" />
                Saída
              </label>
              <div className="flex gap-2">
                <TimeInput
                  value={clockOut}
                  onChange={setClockOut}
                  className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => fillNow(setClockOut)}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-500/20 transition-colors"
                >
                  Agora
                </button>
              </div>
            </div>
          </div>

          {/* Lunch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Coffee className="h-3.5 w-3.5 text-amber-500" />
                Início do Almoço
              </label>
              <div className="flex gap-2">
                <TimeInput
                  value={lunchStart}
                  onChange={setLunchStart}
                  className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => fillNow(setLunchStart)}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition-colors"
                >
                  ↑
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Coffee className="h-3.5 w-3.5 text-amber-500" />
                Fim do Almoço
              </label>
              <div className="flex gap-2">
                <TimeInput
                  value={lunchEnd}
                  onChange={setLunchEnd}
                  className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => fillNow(setLunchEnd)}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition-colors"
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expected hours */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            Jornada
          </h3>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Horas esperadas para este dia
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={expectedHours}
                  onChange={(e) => setExpectedHours(e.target.value)}
                  className="w-24 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[6, 7, 7.5, 8, 9].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setExpectedHours(String(h))}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                      expectedHours === String(h)
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <StickyNote className="h-4 w-4 text-primary" />
            Observações
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adicione observações sobre o dia (opcional)..."
            rows={3}
            className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-500 bg-rose-500/10 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all duration-300 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Registro
            </>
          )}
        </button>
      </form>
    </div>
  );
}
