/**
 * Invoices Table/List Component
 * 
 * Displays invoices with status and actions using React Query hooks.
 */

import React from 'react';
import { FileText, Download, Send, Eye } from 'lucide-react';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { useInvoices, useSendInvoice, useMarkInvoicePaid } from '@/hooks';
import type { Invoice } from '@/types';
import { log } from '@/lib/logger';

interface InvoicesListProps {
  filters?: { status?: string; clientId?: string };
  onView?: (invoice: Invoice) => void;
}

export function InvoicesList({ filters, onView }: InvoicesListProps) {
  const { data: invoices = [], isLoading, error } = useInvoices(filters);
  const sendInvoice = useSendInvoice();
  const markPaid = useMarkInvoicePaid();

  const handleSend = async (id: string) => {
    try {
      await sendInvoice.mutateAsync(id);
      log.info('Invoice sent', { id });
    } catch (err) {
      log.error('Failed to send invoice', { error: err, id });
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaid.mutateAsync(id);
      log.info('Invoice marked paid', { id });
    } catch (err) {
      log.error('Failed to mark invoice as paid', { error: err, id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error.message || 'Failed to load invoices'}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <FileText size={48} className="mx-auto mb-4 opacity-50" />
        <p>No invoices found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {invoices.map((inv) => (
        <InvoiceCard 
          key={inv.id} 
          invoice={inv}
          onView={() => onView?.(inv)}
          onSend={() => handleSend(inv.id)}
          onMarkPaid={() => handleMarkPaid(inv.id)}
        />
      ))}
    </div>
  );
}

interface InvoiceCardProps {
  invoice: Invoice;
  onView?: () => void;
  onSend?: () => void;
  onMarkPaid?: () => void;
}

export function InvoiceCard({ invoice, onView, onSend, onMarkPaid }: InvoiceCardProps) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
          <FileText size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{invoice.clientName}</h3>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <span>#{invoice.id}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Due: {invoice.dueDate}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
        <div className="text-right">
          <div className="text-lg font-bold text-slate-900">£{invoice.totalAmount.toLocaleString()}</div>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="flex gap-2">
          {onView && (
            <button 
              onClick={onView}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" 
              title="View Invoice"
            >
              <Eye size={20}/>
            </button>
          )}
          <button 
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" 
            title="Download PDF"
          >
            <Download size={20}/>
          </button>
          {invoice.status === 'Draft' && onSend && (
            <button 
              onClick={onSend}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" 
              title="Send Invoice"
            >
              <Send size={20}/>
            </button>
          )}
          {invoice.status === 'Sent' && onMarkPaid && (
            <button 
              onClick={onMarkPaid}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg" 
              title="Mark as Paid"
            >
              <Send size={20}/>
            </button>
          )}
          {invoice.status === 'Overdue' && onSend && (
            <button 
              onClick={onSend}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg" 
              title="Send Reminder"
            >
              <Send size={20}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InvoicesList;
