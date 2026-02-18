'use client';

import { Trash2 } from 'lucide-react';

type Props = {
  action: (formData: FormData) => Promise<void>;
  name: string;
};

export function DeleteCategoryButton({ action, name }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Excluir "${name}"?`)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-red-50 text-red-600 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
