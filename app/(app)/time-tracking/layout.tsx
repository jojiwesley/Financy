import { ClockInProvider } from '@/components/time-tracking/clock-in-provider';

export default function TimeTrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClockInProvider>{children}</ClockInProvider>;
}
