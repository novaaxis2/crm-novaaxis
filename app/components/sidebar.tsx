'use client';

import Link from 'next/link';
import { ArrowUpRight, ShieldCheck, X } from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  dashboardVisibleNavItems,
  isDashboardItemActive,
} from './dashboard-navigation';

type SidebarProps = {
  pathname: string;
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
};

export function Sidebar({ pathname, isOpen, isCollapsed, onClose }: SidebarProps) {
  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 xl:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          'crm-panel-dark fixed left-0 top-0 z-50 overflow-y-auto border-r border-white/10 p-6 text-white transition-all duration-300 ease-in-out xl:relative xl:sticky xl:top-0 xl:z-auto xl:h-screen xl:self-start',
          isOpen
            ? 'flex translate-x-0 w-[290px] flex-col'
            : 'hidden -translate-x-full xl:flex xl:translate-x-0 xl:flex-col',
          isCollapsed ? 'xl:w-20 2xl:w-20' : 'xl:w-[290px] 2xl:w-[320px]',
        )}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div
              className={cn(
                'inline-flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 transition-all',
                isCollapsed && 'xl:h-10 xl:w-10',
              )}
            >
              <ShieldCheck
                className={cn('h-7 w-7', isCollapsed && 'xl:h-5 xl:w-5')}
              />
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-all duration-200 hover:bg-white/20 active:bg-white/25 xl:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className={cn('space-y-2', isCollapsed && 'xl:hidden')}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/90">
              NovaAxis CRM
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Service operations dashboard
            </h2>
            <p className="text-sm leading-6 text-slate-300">
              Manage leads, uploaded documents, payment follow-ups, and daily delivery in one place.
            </p>
          </div>
        </div>

        <nav className={cn('mt-10 space-y-2', isCollapsed && 'xl:mt-8 xl:space-y-3')}>
          {dashboardVisibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isDashboardItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'group flex items-center gap-4 rounded-lg border px-4 py-3.5 transition-all duration-300',
                  isCollapsed && 'xl:flex-col xl:gap-1 xl:px-2 xl:py-3',
                  active
                    ? 'border-white/20 bg-white/12 shadow-[0_8px_24px_-16px_rgba(14,165,233,0.4)]'
                    : 'border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.07]',
                )}
              >
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors',
                    active ? 'bg-white text-slate-950' : 'bg-white/8 text-slate-200',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className={cn('min-w-0', isCollapsed && 'xl:hidden')}>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="truncate text-xs text-slate-300">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className={cn('mt-auto rounded-lg border border-white/10 bg-white/8 p-5', isCollapsed && 'xl:hidden')}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
            Public intake live
          </p>
          <h3 className="mt-3 text-lg font-semibold">Open your client chat experience</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Use the public intake flow to collect client details first, then ask for all supporting documents in a guided conversation.
          </p>
          <Link
            href="/chat"
            onClick={onClose}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
          >
            Open chat flow
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </aside>

      <nav className="crm-panel fixed bottom-3 left-3 right-3 z-40 grid grid-cols-5 gap-1.5 rounded-[26px] p-2 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.45)] xl:hidden">
        {dashboardVisibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isDashboardItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2.5 text-center transition',
                active ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate text-[10px] font-semibold leading-4">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
