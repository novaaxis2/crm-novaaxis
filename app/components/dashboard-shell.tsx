'use client';

import { ReactNode, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  MessageSquareMore,
  Search,
  Settings2,
  ShieldCheck,
  Users2,
  WalletCards,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { WhatsAppChat } from './whatsapp-chat';

const navItems = [
  {
    href: '/',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Daily command center',
  },
  {
    href: '/database',
    label: 'Database',
    icon: Users2,
    description: 'Profiles, files, and statuses',
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Revenue and operations',
  },
  {
    href: '/payments',
    label: 'Payments',
    icon: WalletCards,
    description: 'Nepal gateway preview',
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings2,
    description: 'Business configuration',
  },
];

function resolvePageTitle(pathname: string) {
  return [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const currentPage = resolvePageTitle(pathname);
  const todayLabel = new Intl.DateTimeFormat('en-NP', {
    dateStyle: 'full',
  }).format(new Date());

  return (
    <div className="crm-shell-bg min-h-screen w-full text-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 transition-opacity duration-300 xl:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex min-h-screen w-full gap-0">
        <aside
          className={cn(
            'crm-panel-dark fixed left-0 top-0 z-50 text-white xl:fixed xl:top-0 xl:z-50 xl:h-screen overflow-y-auto border-r border-white/10 transition-all duration-300 ease-in-out flex-col p-6',
            sidebarOpen ? 'flex translate-x-0 w-[290px]' : 'hidden -translate-x-full xl:translate-x-0 xl:flex',
            sidebarCollapsed ? 'xl:w-20 2xl:w-20' : 'xl:w-[290px] 2xl:w-[320px]',
          )}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className={cn('inline-flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 transition-all', sidebarCollapsed && 'xl:h-10 xl:w-10')}>
                <ShieldCheck className={cn('h-7 w-7', sidebarCollapsed && 'xl:h-5 xl:w-5')} />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex xl:hidden h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-all duration-200 hover:bg-white/20 active:bg-white/25"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className={cn('space-y-2', sidebarCollapsed && 'xl:hidden')}>
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

          <nav className={cn('mt-10 space-y-2', sidebarCollapsed && 'xl:space-y-3 xl:mt-8')}>
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'group flex items-center gap-4 rounded-lg border px-4 py-3.5 transition-all duration-300',
                    sidebarCollapsed && 'xl:flex-col xl:gap-1 xl:px-2 xl:py-3',
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
                  <div className={cn('min-w-0', sidebarCollapsed && 'xl:hidden')}>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="truncate text-xs text-slate-300">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className={cn('mt-auto rounded-lg border border-white/10 bg-white/8 p-5', sidebarCollapsed && 'xl:hidden')}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
              Public intake live
            </p>
            <h3 className="mt-3 text-lg font-semibold">Open your client chat experience</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Use the public intake flow to collect client details first, then ask for all supporting documents in a guided conversation.
            </p>
            <Link
              href="/chat"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
            >
              Open chat flow
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>

        <div className={cn(
          'flex min-h-full min-w-0 flex-1 flex-col gap-0 transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'xl:ml-20 2xl:ml-20' : 'xl:ml-[290px] 2xl:ml-[320px]',
        )}>
          <header className="crm-panel sticky top-0 z-30 px-4 py-2.5 sm:px-5 sm:py-3 lg:px-6 border-b border-slate-200/60">
            {/* Mobile Menu Toggle */}
            <div className="flex xl:hidden items-center gap-2 mb-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-950 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
                aria-label="Open sidebar menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-semibold text-slate-950">
                {currentPage?.label ?? 'Dashboard'}
              </h2>
            </div>

            {/* Desktop Header */}
            <div className="hidden xl:flex flex-col gap-2.5 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-900 transition-all duration-200 hover:border-slate-300 hover:bg-slate-200 active:bg-slate-300"
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-label="Toggle sidebar"
                >
                  {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {todayLabel}
                  </p>
                  <h1 className="text-lg font-semibold tracking-tight text-slate-950">
                    {currentPage?.label ?? 'Dashboard'}
                  </h1>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center 2xl:w-auto">
                <div className="relative w-full sm:flex-1 2xl:min-w-[300px] 2xl:max-w-[340px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search clients, files, payments"
                    className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2 text-xs text-slate-700 outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400 focus:shadow-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-none">
                  <Link
                    href="/chat"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50"
                  >
                    <MessageSquareMore className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Open intake</span>
                    <span className="inline sm:hidden">Intake</span>
                  </Link>
                  <Link
                    href="/database"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 shadow-md"
                  >
                    <Users2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Database</span>
                    <span className="inline sm:hidden">DB</span>
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <main className="crm-scrollbar flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">{children}</main>

          <nav className="crm-panel fixed bottom-3 left-3 right-3 z-40 grid grid-cols-5 gap-1.5 rounded-[26px] p-2 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.45)] xl:hidden">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

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
                  <span className="truncate text-[10px] font-semibold leading-4">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <footer className="hidden px-2 pb-6 text-center text-xs text-slate-500 xl:block">
            © NovaAxis CRM - Client intake, document handling & payment management
          </footer>
        </div>
      </div>

      {/* WhatsApp Chat Widget */}
      <WhatsAppChat />
    </div>
  );
}
