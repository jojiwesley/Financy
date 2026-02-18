'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Clock,
  Coffee,
  LogIn,
  LogOut,
  X,
  Check,
  Loader2,
  StickyNote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { upsertTimeEntry } from '@/app/(app)/time-tracking/actions';
import { getCurrentTime, getTodayDate, formatTime } from '@/lib/time-tracking';

interface ClockInDrawerProps {
  open: boolean;
  onClose: () => void;
}

type ExistingEntry = {
  id: string;
  clock_in: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  clock_out: string | null;
  expected_hours: number | null;
};

export function ClockInDrawer({ open, onClose }: ClockInDrawerProps) {
  const [date, setDate] = useState(getTodayDate());
  const [clockIn, setClockIn] = useState('');
  const [lunchStart, setLunchStart] = useState('');
  const [lunchEnd, setLunchEnd] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [expectedHours, setExpectedHours] = useState('8');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [existing, setExisting] = useState<ExistingEntry | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState('');

  // Load existing entry when date changes
  useEffect(() => {
    if (!open) return;
    setFetching(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setFetching(false); return; }
      supabase
        .from('time_entries')
        .select('id, clock_in, lunch_start, lunch_end, clock_out, expected_hours')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setExisting(data as ExistingEntry);
            setClockIn(data.clock_in ? data.clock_in.slice(0, 5) : '');
            setLunchStart(data.lunch_start ? data.lunch_start.slice(0, 5) : '');
            setLunchEnd(data.lunch_end ? data.lunch_end.slice(0, 5) : '');
            setClockOut(data.clock_out ? data.clock_out.slice(0, 5) : '');
            setExpectedHours(String(data.expected_hours ?? 8));
          } else {
            setExisting(null);
            setClockIn('');
            setLunchStart('');
            setLunchEnd('');
            setClockOut('');
            setExpectedHours('8');
          }
          setFetching(false);
        });
    });
  }, [date, open]);

  // Reset when drawer opens
  useEffect(() => {
    if (open) {
      setDate(getTodayDate());
      setSavedOk(false);
      setError('');
      setShowNotes(false);
      setNotes('');
    }
  }, [open]);

  function fillNow(setter: (v: string) => void) {
    setter(getCurrentTime());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clockIn) { setError('Horário de entrada é obrigatório'); return; }
    setLoading(true);
    setError('');
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
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background border-t border-border/50 shadow-2xl md:left-auto md:right-6 md:bottom-6 md:rounded-2xl md:w-[440px] md:border animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">
                {existing ? 'Atualizar Ponto' : 'Registrar Ponto'}
              </h2>
              <p className="text-xs text-muted-foreground">Rápido e intuitivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Data</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
            </div>

            {/* Clock In */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <LogIn className="h-3.5 w-3.5 text-emerald-500" />
                Entrada
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={clockIn}
                  onChange={e => setClockIn(e.target.value)}
                  className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => fillNow(setClockIn)}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
                >
                  Agora
                </button>
              </div>
            </div>

            {/* Lunch */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Coffee className="h-3.5 w-3.5 text-amber-500" />
                  Início Almoço
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="time"
                    value={lunchStart}
                    onChange={e => setLunchStart(e.target.value)}
                    className="flex-1 min-w-0 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => fillNow(setLunchStart)}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-2.5 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition-colors"
                  >
                    ↑
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Coffee className="h-3.5 w-3.5 text-amber-500" />
                  Fim Almoço
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="time"
                    value={lunchEnd}
                    onChange={e => setLunchEnd(e.target.value)}
                    className="flex-1 min-w-0 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => fillNow(setLunchEnd)}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-2.5 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition-colors"
                  >
                    ↑
                  </button>
                </div>
              </div>
            </div>

            {/* Clock Out */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <LogOut className="h-3.5 w-3.5 text-rose-500" />
                Saída
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={clockOut}
                  onChange={e => setClockOut(e.target.value)}
                  className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => fillNow(setClockOut)}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-500/20 transition-colors whitespace-nowrap"
                >
                  Agora
                </button>
              </div>
            </div>

            {/* Expected hours + Notes toggle */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Horas esperadas
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={expectedHours}
                  onChange={e => setExpectedHours(e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowNotes(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors mt-4',
                  showNotes
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground'
                )}
              >
                <StickyNote className="h-3.5 w-3.5" />
                Nota
              </button>
            </div>

            {/* Notes */}
            {showNotes && (
              <div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observações sobre o dia..."
                  rows={2}
                  className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none"
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-500 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || savedOk}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300',
                savedOk
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-primary to-violet-600 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]'
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : savedOk ? (
                <>
                  <Check className="h-4 w-4" />
                  Salvo!
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  {existing ? 'Atualizar Registro' : 'Registrar Ponto'}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
