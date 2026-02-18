import { Sidebar } from '@/components/layout/sidebar';
import { QuickAddProvider } from '@/components/transactions/quick-add-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuickAddProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="p-8 space-y-6">{children}</div>
        </main>
      </div>
    </QuickAddProvider>
  );
}
