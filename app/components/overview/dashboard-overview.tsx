'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Sparkles,
  Users2,
} from 'lucide-react';

import {
  CURRENCY_FORMATTER,
  DATE_TIME_FORMATTER,
  SERVICE_LABELS,
} from '@/lib/crm/constants';
import type { CrmClient } from '@/lib/crm/types';
import { useCrmClients } from '@/lib/crm/use-crm-clients';

import {
  MetricTile,
  PageIntro,
  PaymentStatusBadge,
  ProgressBar,
  SourceBadge,
  SurfaceCard,
  WorkStatusBadge,
} from '../crm-ui';

function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-5 px-1 sm:space-y-6 sm:px-2">
      <div className="h-40 animate-pulse rounded-[32px] bg-white/70" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-[28px] bg-white/70" />
        ))}
      </div>
    </div>
  );
}

function getUrgentClients(clients: CrmClient[]) {
  return clients
    .filter(
      (client) =>
        client.service.workStatus === 'pending' ||
        client.service.paymentStatus !== 'fully_paid',
    )
    .sort(
      (a, b) =>
        new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime(),
    )
    .slice(0, 4);
}

export function DashboardOverview() {
  const { clients, metrics, isHydrated } = useCrmClients();

  if (!isHydrated) {
    return <DashboardOverviewSkeleton />;
  }

  const urgentClients = getUrgentClients(clients);
  const maxRevenue = Math.max(
    ...metrics.monthlyEarnings.map((item) => Math.max(item.expected, item.collected)),
    1,
  );
  const outstanding = metrics.totalExpectedRevenue - metrics.totalCollectedRevenue;

  return (
    <div className="space-y-5 px-1 sm:space-y-6 sm:px-2">
      <PageIntro
        eyebrow="Daily operations"
        title="Modern CRM command center"
        description="Track new leads from the public chat flow, manage client documents, monitor work status, and understand how much revenue is still outstanding before the day ends."
        actions={
          <>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
            >
              Open public chat
            </Link>
            <Link
              href="/dashboard/clients"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Review clients
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <div className="grid gap-5 xl:gap-6 2xl:grid-cols-[1.35fr_0.95fr]">
        <SurfaceCard className="crm-grid-lines overflow-hidden">
          <div className="grid gap-5 xl:gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                <Sparkles className="h-3.5 w-3.5" />
                Live business snapshot
              </div>

              <div className="space-y-3">
                <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  Your dashboard is now structured around how this business actually works.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-600">
                  Every intake starts with a client record, flows into document collection, then moves through service completion and payment recovery. This layout is designed to feel like a real business operations workspace rather than a generic admin panel.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] bg-slate-950 p-4 text-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Collected</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {CURRENCY_FORMATTER.format(metrics.totalCollectedRevenue)}
                  </p>
                </div>
                <div className="rounded-[24px] bg-white/90 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Outstanding</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {CURRENCY_FORMATTER.format(outstanding)}
                  </p>
                </div>
                <div className="rounded-[24px] bg-white/90 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Completion</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {metrics.completionRate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                    Revenue pulse
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">Collection momentum</h3>
                </div>
                <BadgeDollarSign className="h-8 w-8 text-sky-300" />
              </div>

              <div className="mt-6 space-y-5">
                <ProgressBar
                  value={metrics.collectionRate}
                  label="Collected vs expected"
                  colorClass="bg-sky-400"
                />
                <ProgressBar
                  value={metrics.completionRate}
                  label="Completed client jobs"
                  colorClass="bg-emerald-400"
                />
              </div>

              <div className="mt-6 grid gap-3">
                {metrics.paymentBreakdown.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="text-sm text-slate-200">{item.label}</span>
                    <span className="text-base font-semibold text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Attention queue
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Clients needing follow-up
              </h2>
            </div>
            <Link href="/dashboard/clients" className="text-sm font-semibold text-sky-700">
              View all
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {urgentClients.map((client) => (
              <Link
                key={client.id}
                href={`/dashboard/clients/${client.id}`}
                className="block rounded-[24px] border border-slate-200/70 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">{client.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {SERVICE_LABELS[client.service.type]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <WorkStatusBadge status={client.service.workStatus} />
                    <PaymentStatusBadge status={client.service.paymentStatus} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <SourceBadge source={client.source} />
                  <span>{client.assets.length} file(s)</span>
                  <span>•</span>
                  <span>{CURRENCY_FORMATTER.format(client.service.fee)}</span>
                </div>
              </Link>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricTile
          label="Total clients"
          value={String(metrics.totalClients)}
          hint="Active pipeline across chat, WhatsApp, and referrals"
          icon={<Users2 className="h-5 w-5" />}
        />
        <MetricTile
          label="Pending jobs"
          value={String(metrics.pendingJobs)}
          hint="Client requests still in progress or waiting for action"
          icon={<Clock3 className="h-5 w-5" />}
          tone="warning"
        />
        <MetricTile
          label="Completed jobs"
          value={String(metrics.completedJobs)}
          hint="Finished services ready for delivery or already closed"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="success"
        />
        <MetricTile
          label="Expected revenue"
          value={CURRENCY_FORMATTER.format(metrics.totalExpectedRevenue)}
          hint="Current value of the active and completed service book"
          icon={<FolderKanban className="h-5 w-5" />}
          tone="dark"
        />
      </div>

      <div className="grid gap-5 xl:gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Earnings trend
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Monthly expected vs collected
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Last {metrics.monthlyEarnings.length} months
            </p>
          </div>

          <div className="-mx-1 mt-8 overflow-x-auto pb-2">
            <div className="grid h-[250px] min-w-[560px] grid-cols-6 items-end gap-3 px-1 sm:min-w-0">
              {metrics.monthlyEarnings.map((item) => {
                const expectedHeight = Math.max((item.expected / maxRevenue) * 100, 10);
                const collectedHeight = Math.max(
                  (item.collected / maxRevenue) * 100,
                  item.collected ? 8 : 4,
                );

                return (
                  <div
                    key={item.monthKey}
                    className="flex h-full flex-col items-center justify-end gap-3"
                  >
                    <div className="relative flex h-full w-full items-end justify-center gap-1 rounded-[22px] bg-slate-50 px-2 pb-2 pt-4">
                      <div
                        className="w-4 rounded-full bg-slate-200"
                        style={{ height: `${expectedHeight}%` }}
                      />
                      <div
                        className="w-4 rounded-full bg-slate-950"
                        style={{ height: `${collectedHeight}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-700">{item.monthLabel}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {CURRENCY_FORMATTER.format(item.collected)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Recent activity
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Latest client movement
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {metrics.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-4 rounded-[24px] border border-slate-200/70 bg-white p-4"
              >
                <div className="mt-1 h-3 w-3 rounded-full bg-slate-950" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {activity.title}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {DATE_TIME_FORMATTER.format(new Date(activity.timestamp))}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
