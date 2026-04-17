import { generateMockDatabaseData } from '@/lib/crm/database-mock-data';
import { DashboardShell } from '@/app/components/dashboard-shell';
import { DatabasePageClient } from './components/database-page-client';

export default function DatabasePage() {
  const initialData = generateMockDatabaseData();

  return (
    <DashboardShell>
      <DatabasePageClient initialData={initialData} />
    </DashboardShell>
  );
}
