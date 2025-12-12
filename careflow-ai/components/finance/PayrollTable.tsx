/**
 * Payroll Table Component
 * 
 * Displays payroll records using GenericCRUDTable with React Query hooks.
 */

import React from 'react';
import { MoreHorizontal, Download, CheckCircle2 } from 'lucide-react';
import { GenericCRUDTable, Column, Action } from '@/components/shared/crud/GenericCRUDTable';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { usePayroll, useApprovePayroll, useMarkPayrollPaid } from '@/hooks';
import type { PayrollRecord } from '@/types';
import { log } from '@/lib/logger';

interface PayrollTableProps {
  period?: string;
  onExport?: () => void;
  onRunPayroll?: () => void;
}

export function PayrollTable({
  period,
  onExport,
  onRunPayroll,
}: PayrollTableProps) {
  const { data: payroll = [], isLoading, error } = usePayroll({ period });
  const approvePayroll = useApprovePayroll();
  const markPaid = useMarkPayrollPaid();

  // Define table columns
  const columns: Column<PayrollRecord>[] = [
    {
      key: 'staffName',
      label: 'Staff Member',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.staffName}</p>
          <p className="text-xs text-slate-500">{item.role}</p>
        </div>
      ),
    },
    {
      key: 'totalHours',
      label: 'Hours',
      sortable: true,
      render: (item) => <span className="font-medium">{item.totalHours}h</span>,
    },
    {
      key: 'hourlyRate',
      label: 'Rate',
      render: (item) => <span>£{item.hourlyRate.toFixed(2)}/h</span>,
    },
    {
      key: 'grossPay',
      label: 'Gross Pay',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-slate-900">£{item.grossPay.toLocaleString()}</span>
      ),
    },
    {
      key: 'netPay',
      label: 'Net Pay',
      sortable: true,
      render: (item) => (
        <span className="font-medium text-green-700">£{item.netPay.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  // Custom actions based on status
  const actions: Action<PayrollRecord>[] = [
    {
      label: 'Approve',
      variant: 'primary',
      icon: CheckCircle2,
      show: (item) => item.status === 'Draft',
      onClick: async (item) => {
        try {
          await approvePayroll.mutateAsync(item.id);
          log.info('Payroll approved', { id: item.id });
        } catch (err) {
          log.error('Failed to approve payroll', { error: err, id: item.id });
        }
      },
    },
    {
      label: 'Mark Paid',
      variant: 'default',
      icon: CheckCircle2,
      show: (item) => item.status === 'Approved',
      onClick: async (item) => {
        try {
          await markPaid.mutateAsync(item.id);
          log.info('Payroll marked paid', { id: item.id });
        } catch (err) {
          log.error('Failed to mark payroll as paid', { error: err, id: item.id });
        }
      },
    },
  ];

  // Header actions
  const headerActions = (
    <>
      {onExport && (
        <button 
          onClick={onExport}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
        >
          <Download size={16}/> Export CSV
        </button>
      )}
      {onRunPayroll && (
        <button 
          onClick={onRunPayroll}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm flex items-center gap-2"
        >
          <CheckCircle2 size={16}/> Run Payroll
        </button>
      )}
    </>
  );

  return (
    <GenericCRUDTable<PayrollRecord>
      data={payroll}
      columns={columns}
      actions={actions}
      loading={isLoading}
      error={error?.message}
      title={period ? `${period} Payroll` : 'Payroll'}
      headerActions={headerActions}
      searchable={true}
      searchPlaceholder="Search staff..."
      emptyMessage="No payroll records found"
      getItemId={(item) => item.id}
    />
  );
}

export default PayrollTable;
