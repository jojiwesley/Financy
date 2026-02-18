import { Sidebar } from '@/components/layout/sidebar';
import { QuickAddProvider } from '@/components/transactions/quick-add-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuickAddProvider>
      <div className="flex h-screen overflow-hidden bg-transparent">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </QuickAddProvider>
  );
}
