import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

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
    <Card className="col-span-1 lg:col-span-3">
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
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {transaction.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.category} • {transaction.date}
                  </p>
                </div>
              </div>
              <div className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>
                {transaction.type === 'income' ? '+' : ''} R$ {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
