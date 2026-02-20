"use client";

import { cancelInstallment } from "@/app/(app)/installments/actions";
import { Loader2, X } from "lucide-react";
import { useState } from "react";

type Props = { installmentId: string };

export function CancelInstallmentButton({ installmentId }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    setLoading(true);
    setError("");
    try {
      await cancelInstallment(installmentId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao cancelar");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Confirmar cancelamento?
        </span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Sim, cancelar"
          )}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted"
        >
          Não
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-red-600 transition-colors"
    >
      <X className="h-3 w-3" />
      Cancelar
    </button>
  );
}
