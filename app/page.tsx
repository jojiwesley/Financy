import { BillsDueToday } from "@/components/dashboard/bills-due-today";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { FinancialAlerts } from "@/components/dashboard/financial-alerts";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Bell, Search, UserCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            F
          </div>
          Financy
        </div>
        <nav className="ml-6 flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#" className="text-foreground transition-colors hover:text-foreground">Dashboard</a>
          <a href="#" className="transition-colors hover:text-foreground">Transações</a>
          <a href="#" className="transition-colors hover:text-foreground">Contas</a>
          <a href="#" className="transition-colors hover:text-foreground">Cartões</a>
          <a href="#" className="transition-colors hover:text-foreground">Relatórios</a>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar..."
              className="h-9 w-64 rounded-md border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-full border bg-background hover:bg-accent hover:text-accent-foreground">
            <Bell className="h-4 w-4" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
             <UserCircle className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </header>
      <main className="flex-1 space-y-4 bg-muted/20 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              Download Relatório
            </button>
          </div>
        </div>
        
        <OverviewCards />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <CashFlowChart />
          <RecentTransactions />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <BillsDueToday />
          <FinancialAlerts />
        </div>
      </main>
    </div>
  );
}
