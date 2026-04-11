'use client';

import { BadgePercent, ChartNoAxesColumn, HandCoins, Wallet } from 'lucide-react';

import { CURRENCY_FORMATTER } from '@/lib/crm/constants';
import { useCrmClients } from '@/lib/crm/use-crm-clients';

import { MetricTile, PageIntro, ProgressBar, SurfaceCard } from './crm-ui';

export function AnalyticsWorkspace() {
  const { clients, metrics, isHydrated } = useCrmClients();

  if (!isHydrated) {
    return <div className="h-[480px] animate-pulse rounded-[32px] bg-white/70" />;
  }

  const avgTicket = clients.length
    ? Math.round(metrics.totalExpectedRevenue / clients.length)
    : 0;
  const outstanding = metrics.totalExpectedRevenue - metrics.totalCollectedRevenue;
  const maxServiceRevenue = Math.max(
    ...metrics.serviceDistribution.map((item) => item.revenue),
    1,
  );

  return (
    <div className="space-y-5 px-1 sm:space-y-6 sm:px-2">
      <PageIntro
        eyebrow="Analytics"
        title="Performance, earnings, and workload insight"
        description="Use these visual summaries to understand how many jobs are moving, where revenue is coming from, how much money has already been collected, and what still needs attention."
      />

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricTile
          label="Completion rate"
          value={`${metrics.completionRate}%`}
          hint="Completed work compared to the current client pipeline"
          icon={<BadgePercent className="h-5 w-5" />}
        />
        <MetricTile
          label="Collection rate"
          value={`${metrics.collectionRate}%`}
          hint="Collected amount against expected service revenue"
          icon={<Wallet className="h-5 w-5" />}
          tone="success"
        />
        <MetricTile
          label="Average ticket"
          value={CURRENCY_FORMATTER.format(avgTicket)}
          hint="Average client value based on all current service records"
          icon={<ChartNoAxesColumn className="h-5 w-5" />}
        />
        <MetricTile
          label="Outstanding"
          value={CURRENCY_FORMATTER.format(outstanding)}
          hint="Value still waiting to be collected from active clients"
          icon={<HandCoins className="h-5 w-5" />}
          tone="warning"
        />
      </div>

      <div className="grid gap-5 xl:gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Service volume
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Revenue by service type</h2>
          </div>

          <div className="mt-8 space-y-5">
            {metrics.serviceDistribution.map((item) => {
              const width = Math.max((item.revenue / maxServiceRevenue) * 100, 12);

              return (
                <div key={item.serviceType} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-semibold text-slate-950">{item.label}</p>
                      <p className="text-slate-500">{item.count} client(s)</p>
                    </div>
                    <p className="font-semibold text-slate-950">
                      {CURRENCY_FORMATTER.format(item.revenue)}
                    </p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-slate-950" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Payment split
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Half paid vs fully paid</h2>
          </div>

          <div className="mt-6 space-y-5">
            {metrics.paymentBreakdown.map((item, index) => (
              <ProgressBar
                key={item.status}
                value={clients.length ? Math.round((item.count / clients.length) * 100) : 0}
                label={`${item.label} — ${item.count} client(s)`}
                colorClass={index === 0 ? 'bg-rose-500' : index === 1 ? 'bg-sky-500' : 'bg-emerald-500'}
              />
            ))}
          </div>

          <div className="mt-8 rounded-[24px] bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Decision hint
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              If the collection rate is lagging behind the completion rate, prioritize payment reminders for completed jobs before taking on more unpaid requests.
            </p>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
