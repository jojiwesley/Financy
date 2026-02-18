import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const transactions = [
  {
    id: "1",
    description: "Supermercado Extra",
    category: "Alimentação",
    amount: -350.0,
    date: "Hoje",
    status: "Confirmado",
    type: "expense",
  },
  {
    id: "2",
    description: "Salário Mensal",
    category: "Renda",
    amount: 5200.0,
    date: "Ontem",
    status: "Confirmado",
    type: "income",
  },
  {
    id: "3",
    description: "Netflix",
    category: "Lazer",
    amount: -55.9,
    date: "15/02",
    status: "Pendente",
    type: "expense",
  },
  {
    id: "4",
    description: "Posto Shell",
    category: "Transporte",
    amount: -150.0,
    date: "14/02",
    status: "Confirmado",
    type: "expense",
  },
  {
    id: "5",
    description: "Freelance Design",
    category: "Renda Extra",
    amount: 850.0,
    date: "12/02",
    status: "Confirmado",
    type: "income",
  },
];

export function RecentTransactions() {
  return (
    <Card className="col-span-1 lg:col-span-3 h-full">
      <CardHeader>
        <CardTitle>Últimas Transações</CardTitle>
        <CardDescription>
          Você fez {transactions.filter(t => t.date === "Hoje").length} transações hoje.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="group flex items-center justify-between rounded-xl border border-transparent p-3 transition-all hover:bg-muted/30 hover:border-border/50"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors",
                  transaction.type === 'income' 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200/20 group-hover:bg-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 border-rose-200/20 group-hover:bg-rose-500/20'
                )}>
                    {transaction.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground/90">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {transaction.category} • {transaction.date}
                  </p>
                </div>
              </div>
              <div className={cn(
                "font-semibold text-sm",
                transaction.type === 'income' ? 'text-emerald-600' : 'text-foreground'
              )}>
                {transaction.type === 'income' ? '+' : ''} R$ {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
