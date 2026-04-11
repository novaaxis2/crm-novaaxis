import { ReactNode } from 'react';

import {
  PAYMENT_STATUS_LABELS,
  WORK_STATUS_LABELS,
} from '@/lib/crm/constants';
import { ClientSource, PaymentStatus, WorkStatus } from '@/lib/crm/types';
import { cn } from '@/lib/utils';

const workTone: Record<WorkStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const paymentTone: Record<PaymentStatus, string> = {
  unpaid: 'bg-rose-50 text-rose-700 ring-rose-200',
  half_paid: 'bg-sky-50 text-sky-700 ring-sky-200',
  fully_paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const sourceTone: Record<ClientSource, string> = {
  whatsapp: 'bg-green-50 text-green-700 ring-green-200',
  website_chat: 'bg-violet-50 text-violet-700 ring-violet-200',
  referral: 'bg-orange-50 text-orange-700 ring-orange-200',
};

const sourceLabel: Record<ClientSource, string> = {
  whatsapp: 'WhatsApp',
  website_chat: 'Website Chat',
  referral: 'Referral',
};

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:gap-5 sm:rounded-[32px] sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:p-8">
      <div className="max-w-3xl space-y-3">
        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
          {eyebrow}
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            {description}
          </p>
        </div>
      </div>

      {actions ? <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap lg:justify-end">{actions}</div> : null}
    </div>
  );
}

export function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn('crm-panel rounded-[24px] p-4 sm:rounded-[28px] sm:p-6', className)}>{children}</section>;
}

export function MetricTile({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'dark';
}) {
  const toneClass = {
    default: 'from-white to-slate-50',
    success: 'from-emerald-50 to-white',
    warning: 'from-amber-50 to-white',
    dark: 'from-slate-950 to-slate-900 text-white',
  }[tone];

  const textClass = tone === 'dark' ? 'text-white/70' : 'text-slate-500';
  const valueClass = tone === 'dark' ? 'text-white' : 'text-slate-950';

  return (
    <div className={cn('rounded-[22px] border border-white/70 bg-gradient-to-br p-4 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.26)] sm:rounded-[26px] sm:p-5', toneClass)}>
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <span className={cn('text-xs font-medium sm:text-sm', textClass)}>{label}</span>
        <div className={cn('rounded-2xl p-2.5 sm:p-3', tone === 'dark' ? 'bg-white/10 text-white' : 'bg-slate-900 text-white')}>
          {icon}
        </div>
      </div>
      <div className="space-y-2">
        <p className={cn('text-2xl font-semibold tracking-tight sm:text-3xl', valueClass)}>{value}</p>
        <p className={cn('text-sm leading-6', textClass)}>{hint}</p>
      </div>
    </div>
  );
}

export function WorkStatusBadge({ status }: { status: WorkStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset', workTone[status])}>
      {WORK_STATUS_LABELS[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset', paymentTone[status])}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function SourceBadge({ source }: { source: ClientSource }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset', sourceTone[source])}>
      {sourceLabel[source]}
    </span>
  );
}

export function ProgressBar({
  value,
  label,
  colorClass = 'bg-slate-950',
}: {
  value: number;
  label?: string;
  colorClass?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-500 sm:text-xs">
          <span>{label}</span>
          <span>{safeValue}%</span>
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all duration-500', colorClass)} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white/70 px-5 text-center sm:min-h-[240px] sm:rounded-[28px] sm:px-6">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
