'use client';

import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageSquareMore,
  Search,
  Users2,
} from 'lucide-react';

type TopbarProps = {
  currentPageLabel: string;
  todayLabel: string;
  isSidebarCollapsed: boolean;
  onOpenSidebar: () => void;
  onToggleSidebar: () => void;
};

export function Topbar({
  currentPageLabel,
  todayLabel,
  isSidebarCollapsed,
  onOpenSidebar,
  onToggleSidebar,
}: TopbarProps) {
  return (
    <header className="crm-panel sticky top-0 z-30 border-b border-slate-200/60 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
      <div className="mb-4 flex items-center gap-3 xl:hidden">
        <button
          onClick={onOpenSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-950 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
          {currentPageLabel}
        </h2>
      </div>

      <div className="hidden flex-col gap-4 xl:flex 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-900 transition-all duration-200 hover:border-slate-300 hover:bg-slate-200 active:bg-slate-300"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {todayLabel}
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
              {currentPageLabel}
            </h1>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center 2xl:w-auto">
          <div className="relative w-full sm:flex-1 2xl:min-w-[320px] 2xl:max-w-[360px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients, files, payments"
              className="w-full rounded-lg border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400 focus:shadow-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-none">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
            >
              <MessageSquareMore className="h-4 w-4" />
              Open intake
            </Link>

            <Link
              href="/dashboard/database"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
            >
              <Users2 className="h-4 w-4" />
              Database
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
