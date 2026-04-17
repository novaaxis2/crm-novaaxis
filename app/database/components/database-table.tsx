'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DatabaseRecord } from '@/lib/crm/database-types';
import { ChevronDown, ChevronUp, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatabaseTableProps {
  records: DatabaseRecord[];
}

type SortField = keyof DatabaseRecord;
type SortDirection = 'asc' | 'desc';

const statusColors = {
  Ready: 'bg-green-100 text-green-800 border-green-300',
  'Not ready': 'bg-red-100 text-red-800 border-red-300',
  'In Progress': 'bg-orange-100 text-orange-800 border-orange-300',
};

const paymentColors = {
  Done: 'bg-green-100 text-green-800 border-green-300',
  Pending: 'bg-orange-100 text-orange-800 border-orange-300',
  Cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
};

const appliedColors = {
  Yes: 'bg-blue-100 text-blue-800 border-blue-300',
  No: 'bg-slate-100 text-slate-800 border-slate-300',
};

export function DatabaseTable({ records }: DatabaseTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('serialNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAndSortedRecords = useMemo(() => {
    let sorted = [...records];

    sorted.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      if (typeof aVal === 'number') {
        return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      }

      return 0;
    });

    return sorted;
  }, [records, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedRecords.length / itemsPerPage);
  const paginatedRecords = filteredAndSortedRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const TableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th className="sticky top-0 select-none bg-white border-r border-slate-200 last:border-r-0">
      <button
        onClick={() => handleSort(field)}
        className="w-full text-left px-2 sm:px-4 py-3 font-semibold text-xs sm:text-sm text-slate-900 hover:bg-slate-200 transition flex items-center gap-2 group"
      >
        <span className="hidden sm:inline">{label}</span>
        <span className="inline sm:hidden">{label.substring(0, 3)}</span>
        <SortIcon field={field} />
      </button>
    </th>
  );

  return (
    <div className="space-y-0">
      {/* Desktop Table View - hidden on mobile */}
      <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-sky-100 border-b border-slate-300">
            <tr>
              <TableHeader field="serialNumber" label="S.N" />
              <TableHeader field="name" label="Name" />
              <TableHeader field="email" label="Email" />
              <TableHeader field="address" label="Address" />
              <TableHeader field="contact" label="Contact" />
              <TableHeader field="service" label="Service" />
              <TableHeader field="profileStatus" label="Profile" />
              <TableHeader field="paymentStatus" label="Payment" />
              <TableHeader field="applied" label="Applied" />
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((record, index) => (
                <tr key={record.id} className={cn('hover:bg-blue-50 transition border-b border-slate-200', index % 2 === 0 && 'bg-slate-50')}>
                  <td className="px-4 py-3 text-slate-700 font-medium border-r border-slate-200">{record.serialNumber}</td>
                  <td className="px-4 py-3 border-r border-slate-200">
                    <div 
                      onClick={() => router.push(`/database/${record.id}`)}
                      className="flex flex-col gap-1 hover:opacity-70 transition cursor-pointer"
                    >
                      <p className="font-semibold text-sky-600 hover:text-sky-700 hover:underline">{record.name}</p>
                      <p className="text-xs text-slate-500">{record.joinedDate}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200">
                    <a
                      href={`mailto:${record.email}`}
                      className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium hover:underline truncate"
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate">{record.email}</span>
                    </a>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200">
                    <div className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      {record.address}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200">
                    <a
                      href={`tel:${record.contact}`}
                      className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium hover:underline"
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      {record.contact}
                    </a>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200">
                    <span className="inline-block px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-xs font-semibold">
                      {record.service}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200">
                    <span
                      className={cn('inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border', statusColors[record.profileStatus as keyof typeof statusColors])}
                    >
                      {record.profileStatus.substring(0, 8)}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200">
                    <span
                      className={cn('inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border', paymentColors[record.paymentStatus as keyof typeof paymentColors])}
                    >
                      {record.paymentStatus.substring(0, 7)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn('inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border', appliedColors[record.applied as keyof typeof appliedColors])}
                    >
                      {record.applied}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No records found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - visible only on mobile */}
      <div className="md:hidden space-y-3">
        {paginatedRecords.length > 0 ? (
          paginatedRecords.map((record) => (
            <div
              key={record.id}
              className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div 
              onClick={() => router.push(`/database/${record.id}`)}
                  className="flex-1 min-w-0 hover:opacity-70 transition cursor-pointer"
                >
                  <p className="font-bold text-sky-600 hover:text-sky-700 hover:underline text-base">{record.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">#{record.serialNumber} • {record.joinedDate}</p>
                </div>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-xs font-semibold shrink-0">
                  {record.service}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <a
                  href={`mailto:${record.email}`}
                  className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm truncate"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{record.email}</span>
                </a>
                <a
                  href={`tel:${record.contact}`}
                  className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{record.contact}</span>
                </a>
                <div className="flex items-center gap-2 text-slate-700 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{record.address}</span>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <div className="flex-1 min-w-max">
                  <p className="text-xs text-slate-500 mb-1">Profile</p>
                  <span
                    className={cn('inline-block px-2 py-1 rounded-full text-xs font-semibold border', statusColors[record.profileStatus as keyof typeof statusColors])}
                  >
                    {record.profileStatus}
                  </span>
                </div>
                <div className="flex-1 min-w-max">
                  <p className="text-xs text-slate-500 mb-1">Payment</p>
                  <span
                    className={cn('inline-block px-2 py-1 rounded-full text-xs font-semibold border', paymentColors[record.paymentStatus as keyof typeof paymentColors])}
                  >
                    {record.paymentStatus}
                  </span>
                </div>
                <div className="flex-1 min-w-max">
                  <p className="text-xs text-slate-500 mb-1">Applied</p>
                  <span
                    className={cn('inline-block px-2 py-1 rounded-full text-xs font-semibold border', appliedColors[record.applied as keyof typeof appliedColors])}
                  >
                    {record.applied}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            No records found matching your search criteria.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
          Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
          <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredAndSortedRecords.length)}</span> of{' '}
          <span className="font-semibold">{filteredAndSortedRecords.length}</span> records
        </div>
        <div className="flex gap-1 sm:gap-2 items-center flex-wrap justify-center sm:justify-end">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Prev
          </button>
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages)
              .map((page, index, array) => (
                <div key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && <span className="px-1 text-slate-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'px-3 py-2 rounded-lg border transition text-sm',
                      currentPage === page
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    {page}
                  </button>
                </div>
              ))}
          </div>
          <div className="sm:hidden text-xs text-slate-600 font-semibold">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
