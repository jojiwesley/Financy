"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const data = [
  { name: "Jan", receitas: 4000, despesas: 2400 },
  { name: "Fev", receitas: 3000, despesas: 1398 },
  { name: "Mar", receitas: 2000, despesas: 9800 },
  { name: "Abr", receitas: 2780, despesas: 3908 },
  { name: "Mai", receitas: 1890, despesas: 4800 },
  { name: "Jun", receitas: 2390, despesas: 3800 },
  { name: "Jul", receitas: 3490, despesas: 4300 },
];

export function CashFlowChart() {
  return (
    <Card className="col-span-1 lg:col-span-4 h-full">
      <CardHeader>
        <CardTitle>Fluxo de Caixa</CardTitle>
        <CardDescription>Visão geral de receitas e despesas nos últimos meses</CardDescription>
      </CardHeader>
      <CardContent className="pl-0 pb-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                dy={10}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value}`}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 4 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-border/50 bg-background/80 backdrop-blur-xl p-3 shadow-xl ring-1 ring-black/5">
                        <p className="mb-2 font-semibold text-foreground">{label}</p>
                        {payload.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2 mb-1 last:mb-0">
                            <span 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {entry.name}:
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              R$ {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right"
                height={36}
                iconType="circle" 
                iconSize={8}
                formatter={(value) => <span className="text-sm text-muted-foreground font-medium ml-1">{value}</span>}
              />
              <Bar 
                dataKey="receitas" 
                name="Receitas" 
                fill="rgb(16 185 129)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
              <Bar 
                dataKey="despesas" 
                name="Despesas" 
                fill="rgb(244 63 94)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
