'use client';

import { DashboardShell } from './components/dashboard-shell';
import { DashboardOverview } from './components/overview/dashboard-overview';

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardOverview />
    </DashboardShell>
  );
}
