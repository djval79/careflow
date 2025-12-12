/**
 * Finance Statistics Components
 * 
 * Displays financial KPIs for payroll and invoices using React Query hooks.
 */

import React from 'react';
import { Wallet, AlertCircle, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { usePayrollStats, useInvoiceStats } from '@/hooks';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgClass: string;
  valueClass?: string;
}

function StatCard({ title, value, icon, iconBgClass, valueClass = '' }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className={`text-2xl font-bold text-slate-800 mt-1 ${valueClass}`}>{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${iconBgClass}`}>{icon}</div>
      </div>
    </div>
  );
}

export function PayrollStats() {
  const { data: stats, isLoading } = usePayrollStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Total Gross Pay"
        value={`£${stats.totalGrossPay.toLocaleString()}`}
        icon={<Wallet size={20}/>}
        iconBgClass="bg-blue-100 text-blue-600"
      />
      <StatCard
        title="Pending Approval"
        value={`${stats.pendingApproval} Staff`}
        icon={<AlertCircle size={20}/>}
        iconBgClass="bg-amber-100 text-amber-600"
      />
      <StatCard
        title="Next Pay Run"
        value={stats.nextPayDate}
        icon={<TrendingUp size={20}/>}
        iconBgClass="bg-green-100 text-green-600"
      />
    </div>
  );
}

export function InvoiceStats() {
  const { data: stats, isLoading } = useInvoiceStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Total Revenue"
        value={`£${stats.totalRevenue.toLocaleString()}`}
        icon={<DollarSign size={20}/>}
        iconBgClass="bg-purple-100 text-purple-600"
      />
      <StatCard
        title="Overdue Amount"
        value={`£${stats.overdueAmount.toLocaleString()}`}
        icon={<AlertCircle size={20}/>}
        iconBgClass="bg-red-100 text-red-600"
        valueClass="text-red-600"
      />
      <StatCard
        title="Draft Invoices"
        value={stats.draftCount}
        icon={<FileText size={20}/>}
        iconBgClass="bg-slate-100 text-slate-600"
      />
    </div>
  );
}

export default { PayrollStats, InvoiceStats };
