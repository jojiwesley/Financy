'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
} from 'recharts';

const fmt = (v: number) =>
  'R$\u00a0' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const SHORT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function monthKey(d: Date) {
  return `${SHORT_MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#22c55e', '#14b8a6', '#3b82f6'];

export default function ReportsPage() {
  const [monthlyData, setMonthlyData] = useState<{ month: string; receitas: number; despesas: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [balanceData, setBalanceData] = useState<{ month: string; saldo: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Last 6 months
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 5);
      start.setDate(1);

      const { data: rawTxs } = await supabase
        .from('transactions')
        .select('amount, type, date, categories(name, color)')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0])
        .order('date');

      type TxReport = { amount: number | null; type: string; date: string; categories: { name: string; color: string } | null };
      const txs = rawTxs as TxReport[] | null;
      if (!txs) { setLoading(false); return; }

      // Monthly bar chart
      const monthMap = new Map<string, { receitas: number; despesas: number }>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = monthKey(d);
        monthMap.set(key, { receitas: 0, despesas: 0 });
      }

      for (const tx of txs) {
        const d = new Date(tx.date + 'T00:00:00');
        const key = monthKey(d);
        const entry = monthMap.get(key);
        if (entry) {
          if (tx.type === 'income') entry.receitas += tx.amount ?? 0;
          else entry.despesas += tx.amount ?? 0;
        }
      }

      const monthly = Array.from(monthMap.entries()).map(([month, v]) => ({ month, ...v }));
      setMonthlyData(monthly);

      // Balance line
      setBalanceData(monthly.map((m) => ({ month: m.month, saldo: m.receitas - m.despesas })));

      // Category pie (expenses only)
      const catMap = new Map<string, number>();
      for (const tx of txs.filter((t) => t.type === 'expense')) {
        const name = (tx.categories as { name: string } | null)?.name ?? 'Sem categoria';
        catMap.set(name, (catMap.get(name) ?? 0) + (tx.amount ?? 0));
      }
      const catArr = Array.from(catMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
      setCategoryData(catArr);

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Carregando relatórios...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Análise financeira dos últimos 6 meses" />

      {/* Bar chart */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-base font-semibold">Receitas vs Despesas</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => fmt(v as number)} tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => fmt((v as number) ?? 0)} />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie chart */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-base font-semibold">Despesas por Categoria</h2>
            {categoryData.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt((v as number) ?? 0)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Line chart */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-base font-semibold">Evolução do Saldo</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={balanceData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => fmt(v as number)} tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => fmt((v as number) ?? 0)} />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
