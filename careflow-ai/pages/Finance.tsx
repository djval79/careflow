/**
 * Finance & Billing Page
 * 
 * Refactored to use React Query hooks for data fetching.
 * Displays payroll and invoicing with stats and management actions.
 */

import React, { useState } from 'react';
import { PayrollTable } from '../components/finance/PayrollTable';
import { InvoicesList } from '../components/finance/InvoicesTable';
import { PayrollStats, InvoiceStats } from '../components/finance/FinanceStats';
import { log } from '../lib/logger';

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'invoices'>('payroll');

  // Handlers
  const handleExportCSV = () => {
    log.info('Exporting payroll data to CSV');
    // TODO: Implement CSV export
    alert('CSV Export - Coming soon!');
  };

  const handleRunPayroll = () => {
    log.info('Running payroll');
    // TODO: Implement payroll run
    alert('Run Payroll - Coming soon!');
  };

  const handleViewInvoice = (invoice: { id: string }) => {
    log.info('Viewing invoice', { id: invoice.id });
    // TODO: Open invoice detail modal
    alert(`View Invoice ${invoice.id} - Coming soon!`);
  };

  // Render Payroll Tab
  const renderPayroll = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PayrollStats />
      <PayrollTable 
        period="October 2023"
        onExport={handleExportCSV}
        onRunPayroll={handleRunPayroll}
      />
    </div>
  );

  // Render Invoices Tab
  const renderInvoices = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <InvoiceStats />
      <InvoicesList onView={handleViewInvoice} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Finance & Billing</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('payroll')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'payroll' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Payroll
        </button>
        <button 
          onClick={() => setActiveTab('invoices')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'invoices' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Invoicing
        </button>
      </div>

      {activeTab === 'payroll' ? renderPayroll() : renderInvoices()}
    </div>
  );
};

export default Finance;
