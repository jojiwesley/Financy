'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTimeEntry } from '@/app/(app)/time-tracking/actions';
import { Trash2, Loader2 } from 'lucide-react';

export function DeleteEntryButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteTimeEntry(id);
      router.push('/time-tracking/entries');
    });
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Confirmar?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-2 text-xs font-medium text-white hover:bg-rose-600 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Sim, excluir
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="rounded-lg border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-500/20 transition-all"
    >
      <Trash2 className="h-4 w-4" />
      Excluir
    </button>
  );
}
