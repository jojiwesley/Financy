'use client';

import { confirmInstallmentParcel } from '@/app/(app)/installments/actions';
import { Loader2, CheckCircle } from 'lucide-react';
import { useState } from 'react';

type Props = {
  installmentId: string;
  parcelNumber: number;
  amount: number;
  billingMonth: string;
};

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ConfirmParcelButton({ installmentId, parcelNumber, amount, billingMonth }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      await confirmInstallmentParcel(installmentId, parcelNumber);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao confirmar');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-400">
        <CheckCircle className="h-3.5 w-3.5" />
        Parcela {parcelNumber} confirmada!
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
        Confirmar parcela {parcelNumber} · {fmt(amount)}
        <span className="text-muted-foreground font-normal ml-1">
          ({new Date(billingMonth).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })})
        </span>
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
