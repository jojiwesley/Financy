'use client';

import { Trash2 } from 'lucide-react';

interface DeleteButtonProps {
  action: () => Promise<void>;
}

export function DeleteButton({ action }: DeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('Excluir esta transação?')) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="inline-flex h-9 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </button>
    </form>
  );
}
