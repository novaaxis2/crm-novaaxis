/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BadgeIndianRupee,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  Phone,
  Upload,
} from 'lucide-react';

import {
  CURRENCY_FORMATTER,
  DATE_FORMATTER,
  DATE_TIME_FORMATTER,
  SERVICE_LABELS,
} from '@/lib/crm/constants';
import { useCrmClients } from '@/lib/crm/use-crm-clients';

import {
  EmptyPanel,
  PageIntro,
  PaymentStatusBadge,
  SourceBadge,
  SurfaceCard,
  WorkStatusBadge,
} from './crm-ui';

export function ClientProfile() {
  const params = useParams<{ id: string }>();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { clients, isHydrated, updateWorkflow } = useCrmClients();

  const client = clients.find((item) => item.id === clientId);

  if (!isHydrated) {
    return <div className="h-[520px] animate-pulse rounded-[32px] bg-white/70" />;
  }

  if (!client) {
    return (
      <div className="px-1 sm:px-2">
        <EmptyPanel
          title="Client profile not found"
          description="This profile is not available in the current frontend sample dataset, or the route may be incorrect."
          action={
            <Link
              href="/clients"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Back to clients
            </Link>
          }
        />
      </div>
    );
  }

  const outstanding = Math.max(client.service.fee - client.service.paidAmount, 0);

  return (
    <div className="space-y-5 px-1 sm:space-y-6 sm:px-2">
      <PageIntro
        eyebrow="Client profile"
        title={client.name}
        description="View identity details, uploaded files, service progress, and payment updates from one dedicated client workspace."
        actions={
          <>
            <Link
              href="/clients"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to clients
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open intake flow
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <SurfaceCard>
          <p className="text-sm text-slate-500">Expected fee</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {CURRENCY_FORMATTER.format(client.service.fee)}
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-sm text-slate-500">Collected amount</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {CURRENCY_FORMATTER.format(client.service.paidAmount)}
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-sm text-slate-500">Outstanding</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {CURRENCY_FORMATTER.format(outstanding)}
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-sm text-slate-500">Uploaded files</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{client.assets.length}</p>
        </SurfaceCard>
      </div>

      <div className="grid gap-5 xl:gap-6 2xl:grid-cols-[1.02fr_0.98fr]">
        <SurfaceCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Service control panel
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Update delivery and payment status
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <SourceBadge source={client.source} />
              <WorkStatusBadge status={client.service.workStatus} />
              <PaymentStatusBadge status={client.service.paymentStatus} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Service type</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">
                {SERVICE_LABELS[client.service.type]}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{client.notes}</p>
            </div>

            <div className="rounded-[24px] bg-slate-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Timeline</p>
              <div className="mt-4 grid gap-4 text-sm text-slate-200">
                <div>
                  <p className="text-slate-400">Started</p>
                  <p className="mt-1 font-medium text-white">
                    {DATE_FORMATTER.format(new Date(client.service.startedAt))}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Completed</p>
                  <p className="mt-1 font-medium text-white">
                    {client.service.completedAt
                      ? DATE_FORMATTER.format(new Date(client.service.completedAt))
                      : 'Still in progress'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <button
              onClick={() =>
                updateWorkflow(client.id, {
                  workStatus: 'pending',
                  note: 'Moved back to pending for more work or missing documents.',
                })
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Mark pending
            </button>
            <button
              onClick={() =>
                updateWorkflow(client.id, {
                  workStatus: 'completed',
                  note: 'Work marked completed from client profile action panel.',
                })
              }
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Mark completed
            </button>
            <button
              onClick={() =>
                updateWorkflow(client.id, {
                  paymentStatus: 'half_paid',
                  paidAmount: Math.round(client.service.fee / 2),
                  note: 'Updated to half paid from the client profile.',
                })
              }
              className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              Mark half paid
            </button>
            <button
              onClick={() =>
                updateWorkflow(client.id, {
                  paymentStatus: 'fully_paid',
                  paidAmount: client.service.fee,
                  note: 'Updated to fully paid from the client profile.',
                })
              }
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Mark fully paid
            </button>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Contact details
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Identity and communication</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-4 rounded-[24px] bg-slate-50 p-4 sm:items-center">
              <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Gmail</p>
                <p className="mt-1 font-medium text-slate-900">{client.gmail}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-[24px] bg-slate-50 p-4 sm:items-center">
              <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Contact number</p>
                <p className="mt-1 font-medium text-slate-900">{client.contactNumber}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] bg-slate-50 p-4">
                <div className="flex items-center gap-3 text-slate-700">
                  <BadgeIndianRupee className="h-5 w-5" />
                  <p className="font-medium">Payment state</p>
                </div>
                <div className="mt-4">
                  <PaymentStatusBadge status={client.service.paymentStatus} />
                </div>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <div className="flex items-center gap-3 text-slate-700">
                  {client.service.workStatus === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Clock3 className="h-5 w-5" />
                  )}
                  <p className="font-medium">Work state</p>
                </div>
                <div className="mt-4">
                  <WorkStatusBadge status={client.service.workStatus} />
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-5 xl:gap-6 2xl:grid-cols-[1.03fr_0.97fr]">
        <SurfaceCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Uploaded assets
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Documents and images</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Upload className="h-4 w-4" />
              {client.assets.length} file(s)
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {client.assets.map((asset) => (
              <div key={asset.id} className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-sm">
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img src={asset.previewUrl} alt={asset.name} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                    {asset.kind === 'image' ? 'Image' : 'Document'}
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <p className="truncate font-semibold text-slate-950">{asset.name}</p>
                  <p className="text-xs text-slate-500">{asset.mimeType || 'Unknown type'}</p>
                  <p className="text-xs text-slate-500">
                    Uploaded {DATE_TIME_FORMATTER.format(new Date(asset.uploadedAt))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Timeline
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Client activity history</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {client.timeline.map((item) => (
              <div key={item.id} className="relative rounded-[24px] border border-slate-200/70 bg-white p-4 pl-6">
                <div className="absolute left-0 top-0 h-full w-px bg-slate-200" />
                <div className="absolute -left-1 top-6 h-3 w-3 rounded-full bg-slate-950" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                  <span className="text-xs text-slate-500">
                    {DATE_TIME_FORMATTER.format(new Date(item.timestamp))}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
