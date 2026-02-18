import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { createCategory } from '../actions';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#22c55e', '#14b8a6', '#3b82f6',
];

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Nova Categoria" description="Crie uma categoria personalizada">
        <Link
          href="/categories"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
        >
          Cancelar
        </Link>
      </PageHeader>

      <Card className="max-w-lg">
        <CardContent className="p-6">
          <form action={createCategory} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="name">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Ex: Alimentação, Salário..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="type">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color, i) => (
                  <label key={color} className="cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      defaultChecked={i === 0}
                      className="sr-only peer"
                    />
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 peer-checked:ring-2 peer-checked:ring-offset-2"
                      style={{ backgroundColor: color, ['--tw-ring-color' as string]: color }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/categories"
                className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Criar Categoria
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
