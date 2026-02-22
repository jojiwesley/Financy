"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Clock,
  Coffee,
  LogIn,
  LogOut,
  X,
  Check,
  Loader2,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { upsertTimeEntry } from "@/app/(app)/time-tracking/actions";
import { getCurrentTime, getTodayDate, formatTime } from "@/lib/time-tracking";
import { TimeInput } from "@/components/ui/time-input";

interface ClockInDrawerProps {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
}

type ExistingEntry = {
  id: string;
  clock_in: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  clock_out: string | null;
  expected_hours: number | null;
};

export function ClockInDrawer({
  open,
  onClose,
  initialDate,
}: ClockInDrawerProps) {
  const [date, setDate] = useState(initialDate ?? getTodayDate());
  const [clockIn, setClockIn] = useState("");
  const [lunchStart, setLunchStart] = useState("");
  const [lunchEnd, setLunchEnd] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [expectedHours, setExpectedHours] = useState("8");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [existing, setExisting] = useState<ExistingEntry | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState("");

  // Load existing entry when date changes
  useEffect(() => {
    if (!open) return;
    setFetching(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setFetching(false);
        return;
      }
      supabase
        .from("time_entries")
        .select(
          "id, clock_in, lunch_start, lunch_end, clock_out, expected_hours",
        )
        .eq("user_id", user.id)
        .eq("date", date)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setExisting(data as ExistingEntry);
            setClockIn(data.clock_in ? data.clock_in.slice(0, 5) : "");
            setLunchStart(data.lunch_start ? data.lunch_start.slice(0, 5) : "");
            setLunchEnd(data.lunch_end ? data.lunch_end.slice(0, 5) : "");
            setClockOut(data.clock_out ? data.clock_out.slice(0, 5) : "");
            setExpectedHours(String(data.expected_hours ?? 8));
          } else {
            setExisting(null);
            setClockIn("");
            setLunchStart("");
            setLunchEnd("");
            setClockOut("");
            setExpectedHours("8");
          }
          setFetching(false);
        });
    });
  }, [date, open]);

  // Reset when drawer opens
  useEffect(() => {
    if (open) {
      setDate(initialDate ?? getTodayDate());
      setSavedOk(false);
      setError("");
      setShowNotes(false);
      setNotes("");
    }
  }, [open, initialDate]);

  function fillNow(setter: (v: string) => void) {
    setter(getCurrentTime());
  }

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
      setSavedOk(true);
      setTimeout(() => {
        setSavedOk(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-70 flex w-full flex-col bg-background shadow-2xl transition-transform duration-300 ease-out",
          "rounded-t-4xl border-t",
          "md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md md:rounded-3xl md:border",
          "max-h-[85vh]",
        )}
      >
        {/* Handle for mobile feel */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Controle de Ponto
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {existing ? "Editar Registro" : "Novo Registro"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {fetching ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-2 pb-safe md:pb-6"
          >
            <div className="space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground/70">
                  Data
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-12 w-full rounded-2xl border bg-muted/30 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Clock In */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground/70 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>{" "}
                  Entrada
                </label>
                <div className="flex gap-2">
                  <TimeInput
                    value={clockIn}
                    onChange={setClockIn}
                    className="flex-1 h-12 rounded-2xl border bg-muted/30 px-4 text-lg font-bold outline-none focus:border-emerald-500/50 focus:bg-background focus:ring-2 focus:ring-emerald-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => fillNow(setClockIn)}
                    className="h-12 px-5 rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-xs hover:bg-emerald-500/20 transition-colors capitalize"
                  >
                    Agora
                  </button>
                </div>
              </div>

              {/* Lunch Section */}
              <div className="rounded-3xl bg-muted/30 p-4 space-y-4 border border-border/50">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground/70">
                  <Coffee className="h-3.5 w-3.5" />
                  Intervalo
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      Início
                    </label>
                    <div className="flex flex-col gap-1">
                      <TimeInput
                        value={lunchStart}
                        onChange={setLunchStart}
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-bold outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
                      />
                      <button
                        type="button"
                        onClick={() => fillNow(setLunchStart)}
                        className="text-[10px] font-bold text-amber-600 self-end hover:underline"
                      >
                        USAR AGORA
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      Fim
                    </label>
                    <div className="flex flex-col gap-1">
                      <TimeInput
                        value={lunchEnd}
                        onChange={setLunchEnd}
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-bold outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
                      />
                      <button
                        type="button"
                        onClick={() => fillNow(setLunchEnd)}
                        className="text-[10px] font-bold text-amber-600 self-end hover:underline"
                      >
                        USAR AGORA
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clock Out */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground/70 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500"></div> Saída
                </label>
                <div className="flex gap-2">
                  <TimeInput
                    value={clockOut}
                    onChange={setClockOut}
                    className="flex-1 h-12 rounded-2xl border bg-muted/30 px-4 text-lg font-bold outline-none focus:border-rose-500/50 focus:bg-background focus:ring-2 focus:ring-rose-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => fillNow(setClockOut)}
                    className="h-12 px-5 rounded-2xl bg-rose-500/10 text-rose-600 font-bold text-xs hover:bg-rose-500/20 transition-colors capitalize"
                  >
                    Agora
                  </button>
                </div>
              </div>

              {/* Notes & Hours */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNotes((v) => !v)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border",
                      showNotes
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-background border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <StickyNote className="h-3.5 w-3.5" />
                    {showNotes ? "Ocultar Observação" : "Adicionar Observação"}
                  </button>
                </div>

                {showNotes && (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Alguma observação importante sobre hoje?"
                    rows={3}
                    className="w-full rounded-2xl border bg-muted/30 p-4 text-sm font-medium outline-none focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10 resize-none"
                  />
                )}
              </div>

              {error && (
                <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-600 flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Submit Button in flow for mobile */}
              <div className="pt-2 pb-6">
                <button
                  type="submit"
                  disabled={loading || savedOk}
                  className={cn(
                    "w-full flex h-14 items-center justify-center gap-3 rounded-2xl text-base font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100",
                    savedOk
                      ? "bg-emerald-500 shadow-emerald-500/25"
                      : "bg-primary shadow-primary/25 hover:bg-primary/90",
                  )}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : savedOk ? (
                    <>
                      <Check className="h-5 w-5" />
                      Registrado!
                    </>
                  ) : (
                    <>{existing ? "Atualizar" : "Confirmar Registro"}</>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
