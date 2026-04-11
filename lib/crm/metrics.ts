import {
  CrmClient,
  DashboardMetrics,
  MonthlyEarningPoint,
  PaymentStatus,
  PaymentBreakdownItem,
  ServiceDistributionItem,
} from '@/lib/crm/types';
import { SERVICE_LABELS } from '@/lib/crm/constants';

const safeDividePercent = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);

const MONTHS_TO_SHOW = 6;

const monthKeyFromDate = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const monthLabelFromKey = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(Date.UTC(year, (month || 1) - 1, 1));
  return d.toLocaleString('en-NP', { month: 'short', year: '2-digit' });
};

function buildMonthKeys(referenceDate = new Date(), count = MONTHS_TO_SHOW) {
  const keys: string[] = [];
  const base = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
  );

  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setUTCMonth(base.getUTCMonth() - i);
    keys.push(monthKeyFromDate(d));
  }

  return keys;
}

function calculatePaymentBreakdown(clients: CrmClient[]): PaymentBreakdownItem[] {
  const statuses: PaymentStatus[] = ['unpaid', 'half_paid', 'fully_paid'];
  return statuses.map((status) => {
    const label =
      status === 'unpaid'
        ? 'Unpaid'
        : status === 'half_paid'
        ? 'Half Paid'
        : 'Fully Paid';
    return {
      status,
      label,
      count: clients.filter((client) => client.service.paymentStatus === status).length,
    };
  });
}

function calculateServiceDistribution(clients: CrmClient[]): ServiceDistributionItem[] {
  const grouped = new Map<string, ServiceDistributionItem>();

  for (const client of clients) {
    const key = client.service.type;
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        serviceType: client.service.type,
        label: SERVICE_LABELS[client.service.type],
        count: 1,
        revenue: client.service.fee,
      });
      continue;
    }

    grouped.set(key, {
      ...current,
      count: current.count + 1,
      revenue: current.revenue + client.service.fee,
    });
  }

  return [...grouped.values()].sort((a, b) => b.count - a.count);
}

function calculateMonthlyEarnings(clients: CrmClient[]): MonthlyEarningPoint[] {
  const monthKeys = buildMonthKeys();
  const byMonth = new Map<string, { expected: number; collected: number }>();

  monthKeys.forEach((key) => {
    byMonth.set(key, { expected: 0, collected: 0 });
  });

  for (const client of clients) {
    const key = monthKeyFromDate(new Date(client.createdAt));
    if (!byMonth.has(key)) continue;

    const current = byMonth.get(key)!;
    byMonth.set(key, {
      expected: current.expected + client.service.fee,
      collected: current.collected + client.service.paidAmount,
    });
  }

  return monthKeys.map((monthKey) => ({
    monthKey,
    monthLabel: monthLabelFromKey(monthKey),
    expected: byMonth.get(monthKey)?.expected ?? 0,
    collected: byMonth.get(monthKey)?.collected ?? 0,
  }));
}

function recentActivitiesFromClients(clients: CrmClient[]) {
  return clients
    .flatMap((client) => client.timeline)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
}

export function computeDashboardMetrics(clients: CrmClient[]): DashboardMetrics {
  const totalClients = clients.length;
  const pendingJobs = clients.filter(
    (client) => client.service.workStatus === 'pending',
  ).length;
  const completedJobs = clients.filter(
    (client) => client.service.workStatus === 'completed',
  ).length;

  const totalExpectedRevenue = clients.reduce(
    (sum, client) => sum + client.service.fee,
    0,
  );
  const totalCollectedRevenue = clients.reduce(
    (sum, client) => sum + client.service.paidAmount,
    0,
  );

  const completionRate = safeDividePercent(completedJobs, totalClients);
  const collectionRate = safeDividePercent(
    totalCollectedRevenue,
    totalExpectedRevenue,
  );

  return {
    totalClients,
    pendingJobs,
    completedJobs,
    totalExpectedRevenue,
    totalCollectedRevenue,
    completionRate,
    collectionRate,
    paymentBreakdown: calculatePaymentBreakdown(clients),
    serviceDistribution: calculateServiceDistribution(clients),
    monthlyEarnings: calculateMonthlyEarnings(clients),
    recentActivities: recentActivitiesFromClients(clients),
  };
}

