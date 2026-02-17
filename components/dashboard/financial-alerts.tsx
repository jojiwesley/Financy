import { AlertTriangle, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FinancialAlerts() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Alertas & Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4 rounded-lg border p-3 bg-yellow-50 text-yellow-900 border-yellow-200">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Gasto Elevado em Alimentação</h4>
            <p className="text-xs text-yellow-800">
              Você gastou 20% a mais em alimentação esta semana comparado à média mensal.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-4 rounded-lg border p-3 bg-blue-50 text-blue-900 border-blue-200">
          <TrendingDown className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Economia Possível</h4>
            <p className="text-xs text-blue-800">
              Sua conta de energia está acima da média da região. Considere verificar o consumo.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
