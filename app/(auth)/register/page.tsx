'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const form = new FormData(formEl);
      const password = form.get('password') as string;
      const confirm = form.get('confirm') as string;
      if (password !== confirm) throw new Error('As senhas não coincidem');

      const { error: err } = await supabase.auth.signUp({
        email: form.get('email') as string,
        password,
        options: { data: { full_name: form.get('name') as string } },
      });
      if (err) throw new Error(err.message);
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass w-full max-w-sm space-y-6 rounded-2xl p-8 relative z-10 transition-all duration-300">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 text-white font-bold text-2xl shadow-lg shadow-primary/25">
          F
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">Comece a controlar suas finanças hoje</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome</label>
          <input
            name="name"
            type="text"
            placeholder="Seu nome"
            required
            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all h-10"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">E-mail</label>
          <input
            name="email"
            type="email"
            placeholder="seu@email.com"
            required
            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all h-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all h-10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirmar</label>
            <input
              name="confirm"
              type="password"
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all h-10"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400 border border-red-500/20 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-primary to-violet-600 h-10 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-90 disabled:opacity-50 transition-all duration-300 active:scale-[0.98] inline-flex items-center justify-center"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Criar conta'}
        </button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
          Entrar
        </Link>
      </div>
    </div>
  );
}
