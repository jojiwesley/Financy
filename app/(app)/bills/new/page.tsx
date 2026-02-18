import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { createBill } from '../actions';

export default async function NewBillPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, color, type')
    .or(`user_id.is.null,user_id.eq.${user!.id}`)
    .order('name');

  return (
    <div className="space-y-6">
      <PageHeader title="Nova Conta a Pagar" description="Registre um boleto ou conta">
        <Link
          href="/bills"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
        >
          Cancelar
        </Link>
      </PageHeader>

      <Card className="max-w-lg">
        <CardContent className="p-6">
          <form action={createBill} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="name">
                Descrição <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Ex: Aluguel, Energia, Internet..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="amount">
                Valor <span className="text-red-500">*</span>
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="due_date">
                Vencimento <span className="text-red-500">*</span>
              </label>
              <input
                id="due_date"
                name="due_date"
                type="date"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="category_id">Categoria</label>
              <select
                id="category_id"
                name="category_id"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sem categoria</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_recurring"
                name="is_recurring"
                type="checkbox"
                value="true"
                className="h-4 w-4 rounded border-input"
              />
              <label className="text-sm" htmlFor="is_recurring">Conta recorrente (mensal)</label>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="notes">Observações</label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Informações adicionais..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/bills"
                className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Criar Conta
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
