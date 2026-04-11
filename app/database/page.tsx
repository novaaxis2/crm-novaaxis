import { generateMockDatabaseData } from '@/lib/crm/database-mock-data';
import { DatabasePageClient } from './components/database-page-client';

export default function DatabasePage() {
  const initialData = generateMockDatabaseData();

  return <DatabasePageClient initialData={initialData} />;
}
