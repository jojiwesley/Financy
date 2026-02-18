"use client";

import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { MetricCard } from "./metric-card";

export function OverviewCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Saldo Total"
        value="R$ 12.450,00"
        icon={Wallet}
        subValue="Atualizado agora"
        className="border-l-4 border-l-blue-500"
      />
      <MetricCard
        title="Receitas (Mês)"
        value="R$ 5.230,00"
        icon={TrendingUp}
        trend={{ value: 12, label: "vs mês passado" }}
        className="border-l-4 border-l-green-500"
      />
      <MetricCard
        title="Despesas (Mês)"
        value="R$ 3.100,00"
        icon={TrendingDown}
        trend={{ value: -4, label: "vs mês passado" }}
        className="border-l-4 border-l-red-500"
      />
      <MetricCard
        title="Cartão de Crédito"
        value="R$ 1.250,00"
        icon={DollarSign}
        subValue="Fatura atual"
        className="border-l-4 border-l-orange-500"
      />
    </div>
  );
}
