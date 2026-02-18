'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfilePage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      setEmail(user.email ?? '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      setFullName(profile?.full_name ?? '');
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, full_name: fullName }, { onConflict: 'id' });

      if (error) throw error;
      setMessage('Perfil atualizado com sucesso!');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" description="Gerencie seus dados de conta" />

      <Card className="max-w-lg">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
              <p className={`rounded-md px-4 py-2 text-sm ${message.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="fullName">
                Nome completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-lg border-red-200">
        <CardContent className="p-6">
          <h2 className="mb-1 text-base font-semibold text-red-600">Zona de Perigo</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Encerrar a sessão desconectará você do aplicativo.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-9 items-center rounded-md border border-red-600 px-4 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Sair da conta
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
