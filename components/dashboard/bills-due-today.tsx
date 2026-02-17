import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
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
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Contas a Pagar Hoje</CardTitle>
        <CardDescription>Não atrase seus pagamentos</CardDescription>
      </CardHeader>
      <CardContent>
        {bills.length > 0 ? (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50/50 border-orange-100">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-sm">{bill.title}</p>
                    <p className="text-xs text-orange-600">Vence hoje</p>
                  </div>
                </div>
                <div className="font-semibold text-sm">
                  R$ {bill.amount.toFixed(2).replace('.',',')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm">Tudo pago por hoje!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
