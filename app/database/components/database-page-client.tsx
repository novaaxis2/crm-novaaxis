'use client';

import { useMemo, useState } from 'react';

import {
  AppliedStatus,
  DatabaseRecord,
  PaymentStatus,
  ProfileStatus,
} from '@/lib/crm/database-types';

import { DatabaseTable } from './database-table';

type DatabasePageClientProps = {
  initialData: DatabaseRecord[];
};

const selectArrowStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 6px center',
  backgroundSize: '1.1em 1.1em',
} as const;

export function DatabasePageClient({ initialData }: DatabasePageClientProps) {
  const [data] = useState<DatabaseRecord[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileFilter, setProfileFilter] = useState<ProfileStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [appliedFilter, setAppliedFilter] = useState<AppliedStatus | 'all'>('all');
  const [pageSize, setPageSize] = useState<number | 'all'>('all');

  const filteredData = useMemo(() => {
    return data.filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        record.name.toLowerCase().includes(searchLower) ||
        record.email.toLowerCase().includes(searchLower) ||
        record.contact.includes(searchTerm) ||
        record.address.toLowerCase().includes(searchLower) ||
        record.service.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
      if (profileFilter !== 'all' && record.profileStatus !== profileFilter) return false;
      if (paymentFilter !== 'all' && record.paymentStatus !== paymentFilter) return false;
      if (appliedFilter !== 'all' && record.applied !== appliedFilter) return false;

      return true;
    });
  }, [appliedFilter, data, paymentFilter, profileFilter, searchTerm]);

  return (
    <div className="space-y-2">
      <div className="bg-white border border-slate-200 rounded-lg p-2 sm:p-3">
        <div className="flex flex-col gap-2">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Profile</label>
              <select
                value={profileFilter}
                onChange={(e) => setProfileFilter(e.target.value as ProfileStatus | 'all')}
                className="px-2 py-1 text-[11px] border border-slate-200 bg-white rounded-lg text-slate-900 font-medium hover:border-slate-300 cursor-pointer transition appearance-none pr-6"
                style={selectArrowStyle}
              >
                <option value="all">All</option>
                <option value="Ready">Ready</option>
                <option value="Not ready">Not Ready</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Payment</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
                className="px-2 py-1 text-[11px] border border-slate-200 bg-white rounded-lg text-slate-900 font-medium hover:border-slate-300 cursor-pointer transition appearance-none pr-6"
                style={selectArrowStyle}
              >
                <option value="all">All</option>
                <option value="Done">Done</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Applied</label>
              <select
                value={appliedFilter}
                onChange={(e) => setAppliedFilter(e.target.value as AppliedStatus | 'all')}
                className="px-2 py-1 text-[11px] border border-slate-200 bg-white rounded-lg text-slate-900 font-medium hover:border-slate-300 cursor-pointer transition appearance-none pr-6"
                style={selectArrowStyle}
              >
                <option value="all">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Show</label>
              <div className="relative">
                <select
                  value={pageSize === 'all' ? 'all' : String(pageSize)}
                  onChange={(e) =>
                    setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="w-full px-2 py-1 text-[11px] border border-slate-200 bg-white rounded-lg text-slate-900 font-medium hover:border-slate-300 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 cursor-pointer transition appearance-none pr-6"
                  style={selectArrowStyle}
                >
                  <option value="all">All</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                &nbsp;
              </label>
              {(profileFilter !== 'all' ||
                paymentFilter !== 'all' ||
                appliedFilter !== 'all') && (
                <button
                  onClick={() => {
                    setProfileFilter('all');
                    setPaymentFilter('all');
                    setAppliedFilter('all');
                  }}
                  className="px-2 py-1 text-[11px] bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <p className="text-slate-600 font-medium">
              Showing{' '}
              <span className="text-slate-900 font-semibold">
                {pageSize === 'all' ? filteredData.length : Math.min(pageSize, filteredData.length)}
              </span>{' '}
              of <span className="text-slate-900 font-semibold">{filteredData.length}</span> (Total:{' '}
              <span className="text-slate-900 font-semibold">{data.length}</span>)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-2 sm:p-3">
        <DatabaseTable
          records={pageSize === 'all' ? filteredData : filteredData.slice(0, pageSize)}
        />
      </div>
    </div>
  );
}

