'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import Link from 'next/link';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#22c55e', '#14b8a6', '#3b82f6',
];

export default function NewCreditCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const formData = new FormData(formEl);
      const { error: dbError } = await supabase.from('credit_cards').insert({
        user_id: user.id,
        name: formData.get('name') as string,
        last_four_digits: (formData.get('last_four_digits') as string) || null,
        limit_amount: parseFloat(formData.get('limit_amount') as string) || 0,
        closing_day: parseInt(formData.get('closing_day') as string) || 1,
        due_day: parseInt(formData.get('due_day') as string) || 10,
        color: selectedColor,
      });

      if (dbError) throw dbError;
      router.push('/credit-cards');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cartão');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Novo Cartão" description="Adicione um cartão de crédito">
        <Link
          href="/credit-cards"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
        >
          Cancelar
        </Link>
      </PageHeader>

      <Card className="max-w-lg">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="name">
                Nome do cartão <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Ex: Nubank, Itaú Platinum..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="last_four_digits">
                Últimos 4 dígitos
              </label>
              <input
                id="last_four_digits"
                name="last_four_digits"
                maxLength={4}
                placeholder="1234"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="limit_amount">
                Limite <span className="text-red-500">*</span>
              </label>
              <input
                id="limit_amount"
                name="limit_amount"
                type="number"
                step="0.01"
                required
                placeholder="5000,00"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="closing_day">
                  Dia de fechamento <span className="text-red-500">*</span>
                </label>
                <input
                  id="closing_day"
                  name="closing_day"
                  type="number"
                  min={1}
                  max={31}
                  required
                  placeholder="15"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="due_day">
                  Dia de vencimento <span className="text-red-500">*</span>
                </label>
                <input
                  id="due_day"
                  name="due_day"
                  type="number"
                  min={1}
                  max={31}
                  required
                  placeholder="10"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="h-8 w-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                    style={{ backgroundColor: color, outline: selectedColor === color ? `3px solid ${color}` : 'none', outlineOffset: 2 }}
                  >
                    {selectedColor === color && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/credit-cards"
                className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Salvando...' : 'Criar Cartão'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
