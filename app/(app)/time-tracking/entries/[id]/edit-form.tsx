'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Save,
  Loader2,
  StickyNote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { upsertTimeEntry } from '@/app/(app)/time-tracking/actions';
import { getCurrentTime, calcWorkedMinutes, calcBalanceMinutes, formatBalance, minutesToString } from '@/lib/time-tracking';
import type { Tables } from '@/types/database.types';

type TimeEntry = Tables<'time_entries'>;

export function EditEntryForm({ entry }: { entry: TimeEntry }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState(entry.date);
  const [clockIn, setClockIn] = useState(entry.clock_in ? entry.clock_in.slice(0, 5) : '');
  const [lunchStart, setLunchStart] = useState(entry.lunch_start ? entry.lunch_start.slice(0, 5) : '');
  const [lunchEnd, setLunchEnd] = useState(entry.lunch_end ? entry.lunch_end.slice(0, 5) : '');
  const [clockOut, setClockOut] = useState(entry.clock_out ? entry.clock_out.slice(0, 5) : '');
  const [expectedHours, setExpectedHours] = useState(String(entry.expected_hours ?? 8));
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [error, setError] = useState('');

  function fillNow(setter: (v: string) => void) {
    setter(getCurrentTime());
  }

  const preview = { clock_in: clockIn, lunch_start: lunchStart, lunch_end: lunchEnd, clock_out: clockOut };
  const workedMin = calcWorkedMinutes(preview);
  const balanceMin = workedMin > 0 ? calcBalanceMinutes(workedMin, parseFloat(expectedHours) || 8) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clockIn) { setError('Horário de entrada é obrigatório'); return; }
    setError('');
    startTransition(async () => {
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
        router.push('/time-tracking/entries');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Live preview */}
      {workedMin > 0 && (
        <div className={`rounded-xl p-4 flex items-center gap-4 border ${
          balanceMin !== null && balanceMin >= 0
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-rose-500/10 border-rose-500/20'
        }`}>
          <Clock className={`h-5 w-5 shrink-0 ${balanceMin !== null && balanceMin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          <div>
            <p className="text-sm font-semibold">Horas trabalhadas: {minutesToString(workedMin)}</p>
            {balanceMin !== null && (
              <p className={`text-xs ${balanceMin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                Saldo: {formatBalance(balanceMin)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Date + Times */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Data e Horários
        </h3>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <LogIn className="h-3.5 w-3.5 text-emerald-500" /> Entrada *
            </label>
            <div className="flex gap-2">
              <input type="time" value={clockIn} onChange={e => setClockIn(e.target.value)} required
                className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" />
              <button type="button" onClick={() => fillNow(setClockIn)}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 transition-colors">Agora</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <LogOut className="h-3.5 w-3.5 text-rose-500" /> Saída
            </label>
            <div className="flex gap-2">
              <input type="time" value={clockOut} onChange={e => setClockOut(e.target.value)}
                className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" />
              <button type="button" onClick={() => fillNow(setClockOut)}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-500/20 transition-colors">Agora</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Coffee className="h-3.5 w-3.5 text-amber-500" /> Início Almoço
            </label>
            <div className="flex gap-2">
              <input type="time" value={lunchStart} onChange={e => setLunchStart(e.target.value)}
                className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" />
              <button type="button" onClick={() => fillNow(setLunchStart)}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition-colors">↑</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Coffee className="h-3.5 w-3.5 text-amber-500" /> Fim Almoço
            </label>
            <div className="flex gap-2">
              <input type="time" value={lunchEnd} onChange={e => setLunchEnd(e.target.value)}
                className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50" />
              <button type="button" onClick={() => fillNow(setLunchEnd)}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition-colors">↑</button>
            </div>
          </div>
        </div>
      </div>

      {/* Expected hours */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5">
        <h3 className="text-sm font-semibold mb-4">Jornada</h3>
        <div className="flex items-center gap-3">
          <input
            type="number" step="0.5" min="1" max="24"
            value={expectedHours} onChange={e => setExpectedHours(e.target.value)}
            className="w-24 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-sm text-muted-foreground">horas</span>
          <div className="flex gap-2">
            {[6, 7, 7.5, 8, 9].map(h => (
              <button key={h} type="button" onClick={() => setExpectedHours(String(h))}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  expectedHours === String(h)
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground'
                )}>
                {h}h
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <StickyNote className="h-4 w-4 text-primary" /> Observações
        </h3>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Observações sobre o dia..."
          rows={3}
          className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-rose-500 bg-rose-500/10 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all duration-300 disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="h-4 w-4" />
            Salvar Alterações
          </>
        )}
      </button>
    </form>
  );
}
