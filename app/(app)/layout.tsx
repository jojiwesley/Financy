'use client';

import { ResponsiveLayout } from '@/components/layout/responsive-layout';
import { QuickAddProvider } from '@/components/transactions/quick-add-provider';
import { ClockInProvider } from '@/components/time-tracking/clock-in-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuickAddProvider>
      <ClockInProvider>
        <ResponsiveLayout>{children}</ResponsiveLayout>
      </ClockInProvider>
    </QuickAddProvider>
  );
}
