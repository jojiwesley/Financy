import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const bills = [
  {
    id: "1",
    title: "Cartão Nubank",
    amount: 1250.00,
    dueDate: "Hoje",
    status: "pending", // pending, paid, overdue
  },
  {
    id: "2",
    title: "Internet Claro",
    amount: 120.90,
    dueDate: "Hoje",
    status: "pending",
  },
];

export function BillsDueToday() {
  return (
    <Card className="col-span-1 lg:col-span-2 h-full">
      <CardHeader>
        <CardTitle>Contas a Pagar Hoje</CardTitle>
        <CardDescription>Não atrase seus pagamentos</CardDescription>
      </CardHeader>
      <CardContent>
        {bills.length > 0 ? (
          <div className="space-y-3">
            {bills.map((bill) => (
              <div key={bill.id} className="group flex items-center justify-between p-3 border rounded-xl bg-amber-500/5 border-amber-200/20 hover:bg-amber-500/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground/90">{bill.title}</p>
                    <p className="text-xs text-amber-600 font-medium">Vence hoje</p>
                  </div>
                </div>
                <div className="font-bold text-sm">
                  R$ {bill.amount.toFixed(2).replace('.',',')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
            <p className="text-sm font-medium">Tudo pago por hoje!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
