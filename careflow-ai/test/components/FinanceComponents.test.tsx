/**
 * Finance Components Tests
 * 
 * Tests for PayrollStats, InvoiceStats, and InvoiceCard components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { PayrollStats, InvoiceStats } from '@/components/finance/FinanceStats';
import { InvoiceCard } from '@/components/finance/InvoicesTable';
import type { Invoice } from '@/types';

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    track: vi.fn(),
  },
}));

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('Finance Components', () => {
  describe('PayrollStats', () => {
    it('should render loading skeleton initially', () => {
      render(<PayrollStats />, { wrapper: createWrapper() });
      
      // Should show loading skeletons (animated divs)
      const container = document.querySelector('.animate-pulse');
      expect(container).toBeInTheDocument();
    });

    it('should render stats after loading', async () => {
      render(<PayrollStats />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Total Gross Pay')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
      expect(screen.getByText('Next Pay Run')).toBeInTheDocument();
    });

    it('should display currency formatted values', async () => {
      render(<PayrollStats />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        // Should contain £ symbol for currency
        const grossPayText = screen.getByText(/£[\d,]+/);
        expect(grossPayText).toBeInTheDocument();
      });
    });
  });

  describe('InvoiceStats', () => {
    it('should render loading skeleton initially', () => {
      render(<InvoiceStats />, { wrapper: createWrapper() });
      
      const container = document.querySelector('.animate-pulse');
      expect(container).toBeInTheDocument();
    });

    it('should render invoice stats after loading', async () => {
      render(<InvoiceStats />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Overdue Amount')).toBeInTheDocument();
      expect(screen.getByText('Draft Invoices')).toBeInTheDocument();
    });
  });

  describe('InvoiceCard', () => {
    const mockInvoice: Invoice = {
      id: 'INV-001',
      clientId: 'client-1',
      clientName: 'Test Client Ltd',
      date: '2024-01-01',
      dueDate: '2024-01-31',
      items: [
        { description: 'Service A', quantity: 10, unitPrice: 100, total: 1000 },
      ],
      totalAmount: 1000,
      status: 'Draft',
    };

    it('should render invoice details', () => {
      render(<InvoiceCard invoice={mockInvoice} />);
      
      expect(screen.getByText('Test Client Ltd')).toBeInTheDocument();
      expect(screen.getByText('#INV-001')).toBeInTheDocument();
      expect(screen.getByText(/Due: 2024-01-31/)).toBeInTheDocument();
      expect(screen.getByText('£1,000')).toBeInTheDocument();
    });

    it('should render status badge', () => {
      render(<InvoiceCard invoice={mockInvoice} />);
      
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('should call onView when view button clicked', async () => {
      const user = userEvent.setup();
      const onView = vi.fn();
      
      render(<InvoiceCard invoice={mockInvoice} onView={onView} />);
      
      const viewButton = screen.getByTitle('View Invoice');
      await user.click(viewButton);
      
      expect(onView).toHaveBeenCalledTimes(1);
    });

    it('should show send button for Draft invoices', () => {
      render(<InvoiceCard invoice={mockInvoice} onSend={vi.fn()} />);
      
      expect(screen.getByTitle('Send Invoice')).toBeInTheDocument();
    });

    it('should call onSend when send button clicked', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      
      render(<InvoiceCard invoice={mockInvoice} onSend={onSend} />);
      
      const sendButton = screen.getByTitle('Send Invoice');
      await user.click(sendButton);
      
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('should show send reminder for Overdue invoices', () => {
      const overdueInvoice = { ...mockInvoice, status: 'Overdue' as const };
      render(<InvoiceCard invoice={overdueInvoice} onSend={vi.fn()} />);
      
      expect(screen.getByTitle('Send Reminder')).toBeInTheDocument();
    });

    it('should show mark paid for Sent invoices', () => {
      const sentInvoice = { ...mockInvoice, status: 'Sent' as const };
      render(<InvoiceCard invoice={sentInvoice} onMarkPaid={vi.fn()} />);
      
      expect(screen.getByTitle('Mark as Paid')).toBeInTheDocument();
    });

    it('should call onMarkPaid when mark paid button clicked', async () => {
      const user = userEvent.setup();
      const onMarkPaid = vi.fn();
      const sentInvoice = { ...mockInvoice, status: 'Sent' as const };
      
      render(<InvoiceCard invoice={sentInvoice} onMarkPaid={onMarkPaid} />);
      
      const markPaidButton = screen.getByTitle('Mark as Paid');
      await user.click(markPaidButton);
      
      expect(onMarkPaid).toHaveBeenCalledTimes(1);
    });

    it('should always show download button', () => {
      render(<InvoiceCard invoice={mockInvoice} />);
      
      expect(screen.getByTitle('Download PDF')).toBeInTheDocument();
    });

    it('should format large amounts with commas', () => {
      const largeInvoice = { ...mockInvoice, totalAmount: 12500 };
      render(<InvoiceCard invoice={largeInvoice} />);
      
      expect(screen.getByText('£12,500')).toBeInTheDocument();
    });

    describe('Status Variations', () => {
      it('should render Paid status correctly', () => {
        const paidInvoice = { ...mockInvoice, status: 'Paid' as const };
        render(<InvoiceCard invoice={paidInvoice} />);
        
        expect(screen.getByText('Paid')).toBeInTheDocument();
      });

      it('should render Overdue status with warning styling', () => {
        const overdueInvoice = { ...mockInvoice, status: 'Overdue' as const };
        render(<InvoiceCard invoice={overdueInvoice} />);
        
        const badge = screen.getByText('Overdue');
        expect(badge).toHaveClass('bg-red-100');
      });

      it('should render Sent status correctly', () => {
        const sentInvoice = { ...mockInvoice, status: 'Sent' as const };
        render(<InvoiceCard invoice={sentInvoice} />);
        
        expect(screen.getByText('Sent')).toBeInTheDocument();
      });
    });
  });
});
