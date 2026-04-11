'use client';

import { useState } from 'react';

import { Bell, Building2, RefreshCcw, Workflow } from 'lucide-react';

import { useCrmClients } from '@/lib/crm/use-crm-clients';

import { PageIntro, SurfaceCard } from './crm-ui';

export function SettingsWorkspace() {
  const { resetToMock } = useCrmClients();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pendingReminders, setPendingReminders] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);

  return (
    <div className="space-y-5 px-1 sm:space-y-6 sm:px-2">
      <PageIntro
        eyebrow="Settings"
        title="Business profile and workflow preferences"
        description="This frontend settings area keeps the dashboard ready for future account customization, reminder preferences, and operational defaults."
      />

      <div className="grid gap-5 xl:gap-6 2xl:grid-cols-[1fr_1fr]">
        <SurfaceCard>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Business details
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Brand and contact identity</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Business name</span>
              <input defaultValue="NovaAxis Service Desk" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-300" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Support Gmail</span>
              <input defaultValue="support@novaaxis.com" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-300" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Primary contact</span>
              <input defaultValue="+977-98XXXXXXXX" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-300" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Default turnaround</span>
              <input defaultValue="2 to 3 working days" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-300" />
            </label>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Notification logic
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Frontend reminder preferences</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                label: 'Email me when a new chat intake is created',
                checked: emailAlerts,
                onChange: () => setEmailAlerts((value) => !value),
              },
              {
                label: 'Show reminders for pending work',
                checked: pendingReminders,
                onChange: () => setPendingReminders((value) => !value),
              },
              {
                label: 'Show payment follow-up notifications',
                checked: paymentAlerts,
                onChange: () => setPaymentAlerts((value) => !value),
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.onChange}
                className="flex w-full flex-col items-start gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                <span className={`h-6 w-11 rounded-full p-1 transition ${item.checked ? 'bg-slate-950' : 'bg-slate-200'}`}>
                  <span className={`block h-4 w-4 rounded-full bg-white transition ${item.checked ? 'translate-x-5' : 'translate-x-0'}`} />
                </span>
              </button>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-5 xl:gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
        <SurfaceCard>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Workflow defaults
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Operational notes</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              'Collect client basics before documents',
              'Keep payment status visible on every client card',
              'Attach file uploads directly to the client profile',
              'Use analytics to monitor pending load and earnings',
            ].map((item) => (
              <div key={item} className="rounded-[24px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Demo tools
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Reset sample CRM data</h2>
            </div>
          </div>

          <p className="mt-6 text-sm leading-7 text-slate-600">
            This frontend preview uses session-based sample data only. Resetting will restore the original showcase dataset without any backend dependency.
          </p>

          <button
            onClick={() => resetToMock()}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset sample data
          </button>
        </SurfaceCard>
      </div>
    </div>
  );
}
