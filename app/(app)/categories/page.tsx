import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { deleteCategory } from './actions';
import type { Tables } from '@/types/database.types';

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: catRaw } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user!.id}`)
    .order('type')
    .order('name');
  const categories = catRaw as Tables<'categories'>[] | null;

  const income = (categories ?? []).filter((c) => c.type === 'income');
  const expense = (categories ?? []).filter((c) => c.type === 'expense');

  return (
    <div className="space-y-6">
      <PageHeader title="Categorias" description="Organize suas transações por categoria">
        <Link
          href="/categories/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Link>
      </PageHeader>

      {[
        { title: 'Receitas', items: income, typeColor: 'bg-green-100 text-green-700' },
        { title: 'Despesas', items: expense, typeColor: 'bg-red-100 text-red-700' },
      ].map(({ title, items, typeColor }) => (
        <div key={title}>
          <h2 className="mb-3 text-base font-semibold">{title}</h2>
          <Card>
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma categoria.</p>
            ) : (
              <div className="divide-y">
                {items.map((cat) => {
                  const deleteAction = deleteCategory.bind(null, cat.id);
                  const isGlobal = cat.user_id === null;
                  return (
                    <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color ?? '#94a3b8' }}
                      />
                      <p className="flex-1 text-sm font-medium">{cat.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColor}`}>
                        {typeColor.includes('green') ? 'Receita' : 'Despesa'}
                      </span>
                      {isGlobal ? (
                        <span className="text-xs text-muted-foreground">Padrão</span>
                      ) : (
                        <form action={deleteAction}>
                          <button
                            type="submit"
                            onClick={(e) => { if (!confirm(`Excluir "${cat.name}"?`)) e.preventDefault(); }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}
