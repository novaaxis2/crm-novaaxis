'use client';

import { BadgeIndianRupee, QrCode, ShieldEllipsis, WalletCards } from 'lucide-react';

import { CURRENCY_FORMATTER, NEPAL_GATEWAYS, SERVICE_LABELS } from '@/lib/crm/constants';
import { useCrmClients } from '@/lib/crm/use-crm-clients';

import { PageIntro, PaymentStatusBadge, SurfaceCard } from './crm-ui';

export function PaymentsWorkspace() {
  const { clients, metrics, isHydrated } = useCrmClients();

  if (!isHydrated) {
    return <div className="h-[480px] animate-pulse rounded-[32px] bg-white/70" />;
  }

  const outstandingClients = clients
    .filter((client) => client.service.paymentStatus !== 'fully_paid')
    .slice(0, 5);

  const outstandingValue = metrics.totalExpectedRevenue - metrics.totalCollectedRevenue;

  return (
    <div className="space-y-5 px-1 sm:space-y-6 sm:px-2">
      <PageIntro
        eyebrow="Payment gateway design"
        title="Nepal payment integrations, designed for future checkout"
        description="This page is frontend-only for now. It prepares the dashboard for a future eSewa, Khalti, and Fonepay connection while helping you understand what should be collected from each client."
      />

      <div className="grid gap-5 xl:gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
        <SurfaceCard>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Gateway cards
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Checkout providers for Nepal</h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {NEPAL_GATEWAYS.map((gateway) => (
              <div
                key={gateway.id}
                className="rounded-[28px] border bg-white p-5 shadow-sm"
                style={{ borderColor: `${gateway.accent}33` }}
              >
                <div
                  className="inline-flex rounded-2xl px-3 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: gateway.accent }}
                >
                  {gateway.name}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{gateway.description}</p>

                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-900">Settlement:</span> {gateway.settlement}
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-900">Charges:</span> {gateway.charges}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="overflow-hidden">
          <div className="rounded-[30px] bg-slate-950 p-6 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Mock checkout preview
                </p>
                <h2 className="mt-2 text-xl font-semibold">Future payment request card</h2>
              </div>
              <QrCode className="h-7 w-7 text-sky-300" />
            </div>

            <div className="mt-6 grid gap-4 rounded-[24px] border border-white/10 bg-white/5 p-5 md:grid-cols-[0.9fr_1.1fr]">
              <div className="flex items-center justify-center rounded-[24px] bg-white/10 p-6">
                <div className="crm-dotted-bg flex h-44 w-44 items-center justify-center rounded-[28px] border border-white/10 bg-slate-900">
                  <QrCode className="h-20 w-20 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[22px] bg-white/6 p-4">
                  <p className="text-sm text-slate-300">Collected so far</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {CURRENCY_FORMATTER.format(metrics.totalCollectedRevenue)}
                  </p>
                </div>
                <div className="rounded-[22px] bg-white/6 p-4">
                  <p className="text-sm text-slate-300">Outstanding balance</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {CURRENCY_FORMATTER.format(outstandingValue)}
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-[22px] bg-white/6 p-4 text-sm text-slate-200">
                  <ShieldEllipsis className="mt-0.5 h-5 w-5 text-sky-300" />
                  Frontend placeholder ready for future QR, deep link, or hosted checkout integration.
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-5 xl:gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
        <SurfaceCard>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Collection queue
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Clients waiting for payment follow-up</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {outstandingClients.map((client) => (
              <div key={client.id} className="rounded-[24px] border border-slate-200/70 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{client.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{SERVICE_LABELS[client.service.type]}</p>
                  </div>
                  <PaymentStatusBadge status={client.service.paymentStatus} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span>Paid {CURRENCY_FORMATTER.format(client.service.paidAmount)}</span>
                  <span className="font-semibold text-slate-950">
                    Due {CURRENCY_FORMATTER.format(client.service.fee - client.service.paidAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <BadgeIndianRupee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Integration notes
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">What this page is preparing for</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              'Generate payment links per client profile',
              'Auto-update payment status after successful callbacks',
              'Attach gateway receipts to the client timeline',
              'Create reminder flows for half-paid or unpaid jobs',
            ].map((item) => (
              <div key={item} className="rounded-[24px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
