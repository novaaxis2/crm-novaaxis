'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';
import { ArrowRight, Filter, Search, UploadCloud } from 'lucide-react';

import { CURRENCY_FORMATTER, DATE_FORMATTER, SERVICE_LABELS } from '@/lib/crm/constants';
import { ClientSource, PaymentStatus, WorkStatus } from '@/lib/crm/types';
import { useCrmClients } from '@/lib/crm/use-crm-clients';

import {
  EmptyPanel,
  PageIntro,
  PaymentStatusBadge,
  SourceBadge,
  SurfaceCard,
  WorkStatusBadge,
} from './crm-ui';

type FilterWork = 'all' | WorkStatus;
type FilterPayment = 'all' | PaymentStatus;
type FilterSource = 'all' | ClientSource;

export function ClientsWorkspace() {
  const { clients, isHydrated } = useCrmClients();
  const [query, setQuery] = useState('');
  const [workFilter, setWorkFilter] = useState<FilterWork>('all');
  const [paymentFilter, setPaymentFilter] = useState<FilterPayment>('all');
  const [sourceFilter, setSourceFilter] = useState<FilterSource>('all');

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchQuery =
        query.trim() === '' ||
        [client.name, client.gmail, client.contactNumber]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchWork = workFilter === 'all' || client.service.workStatus === workFilter;
      const matchPayment =
        paymentFilter === 'all' || client.service.paymentStatus === paymentFilter;
      const matchSource = sourceFilter === 'all' || client.source === sourceFilter;

      return matchQuery && matchWork && matchPayment && matchSource;
    });
  }, [clients, paymentFilter, query, sourceFilter, workFilter]);

  const sourceCounts = useMemo(
    () => ({
      whatsapp: clients.filter((client) => client.source === 'whatsapp').length,
      website_chat: clients.filter((client) => client.source === 'website_chat').length,
      referral: clients.filter((client) => client.source === 'referral').length,
    }),
    [clients],
  );

  const attentionClients = useMemo(
    () =>
      clients
        .filter(
          (client) =>
            client.service.workStatus === 'pending' ||
            client.service.paymentStatus !== 'fully_paid',
        )
        .slice(0, 4),
    [clients],
  );

  const averageTicket = clients.length
    ? Math.round(clients.reduce((sum, client) => sum + client.service.fee, 0) / clients.length)
    : 0;

  if (!isHydrated) {
    return <div className="h-[420px] animate-pulse rounded-[32px] bg-white/70" />;
  }

  return (
    <div className="space-y-5 px-1 sm:space-y-6 sm:px-2">
      <PageIntro
        eyebrow="Client management"
        title="Profiles, documents, and job pipeline"
        description="Every client now has one workspace for identity details, service status, payment tracking, and uploaded documents. Use filters to focus on the people you need to handle today."
        actions={
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open intake flow
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid gap-5 xl:gap-6 2xl:grid-cols-[1.18fr_0.82fr]">
        <SurfaceCard>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Client directory
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Search and filter your active customer list
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="relative sm:col-span-2 xl:col-span-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, Gmail, or phone"
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
              />
            </label>

            <select
              value={workFilter}
              onChange={(event) => setWorkFilter(event.target.value as FilterWork)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
            >
              <option value="all">All work status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value as FilterPayment)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
            >
              <option value="all">All payment status</option>
              <option value="unpaid">Unpaid</option>
              <option value="half_paid">Half paid</option>
              <option value="fully_paid">Fully paid</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value as FilterSource)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
            >
              <option value="all">All sources</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="website_chat">Website Chat</option>
              <option value="referral">Referral</option>
            </select>
          </div>

          <div className="mt-6 space-y-4">
            {filteredClients.length === 0 ? (
              <EmptyPanel
                title="No client matches this filter"
                description="Try clearing filters or bring in a new client from the public chat flow."
                action={
                  <Link
                    href="/chat"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Open intake
                  </Link>
                }
              />
            ) : (
              filteredClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="group block rounded-[26px] border border-slate-200/70 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_44px_-24px_rgba(15,23,42,0.28)]"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950 transition group-hover:text-sky-700">
                          {client.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">{client.gmail}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <SourceBadge source={client.source} />
                        <WorkStatusBadge status={client.service.workStatus} />
                        <PaymentStatusBadge status={client.service.paymentStatus} />
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:min-w-[430px] 2xl:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Service</p>
                        <p className="mt-2 font-medium text-slate-900">
                          {SERVICE_LABELS[client.service.type]}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Files</p>
                        <p className="mt-2 font-medium text-slate-900">{client.assets.length} uploaded</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Expected fee</p>
                        <p className="mt-2 font-medium text-slate-900">
                          {CURRENCY_FORMATTER.format(client.service.fee)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-50 px-3 py-1">{client.contactNumber}</span>
                    <span className="rounded-full bg-slate-50 px-3 py-1">
                      Created {DATE_FORMATTER.format(new Date(client.createdAt))}
                    </span>
                    <span className="rounded-full bg-slate-50 px-3 py-1">
                      Paid {CURRENCY_FORMATTER.format(client.service.paidAmount)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Segment snapshot
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Lead sources</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">WhatsApp clients</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{sourceCounts.whatsapp}</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Website chat clients</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{sourceCounts.website_chat}</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Referral clients</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{sourceCounts.referral}</p>
              </div>
              <div className="rounded-[24px] bg-slate-950 p-4 text-white">
                <p className="text-sm text-slate-300">Average ticket size</p>
                <p className="mt-2 text-2xl font-semibold">
                  {CURRENCY_FORMATTER.format(averageTicket)}
                </p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Follow-up list
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Needs attention now</h2>
              </div>
              <UploadCloud className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-5 space-y-3">
              {attentionClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="block rounded-[22px] border border-slate-200/70 bg-white p-4 transition hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{client.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {SERVICE_LABELS[client.service.type]}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
