/**
 * useFinance Hook Tests
 * 
 * Tests for payroll and invoice React Query hooks.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  usePayroll,
  usePayrollStats,
  useApprovePayroll,
  useMarkPayrollPaid,
  useInvoices,
  useInvoiceStats,
  useSendInvoice,
  useMarkInvoicePaid,
} from '@/hooks/useFinance';

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

describe('useFinance Hooks', () => {
  describe('usePayroll', () => {
    it('should fetch payroll data successfully', async () => {
      const { result } = renderHook(() => usePayroll(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have payroll data
      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data!.length).toBeGreaterThan(0);
    });

    it('should filter payroll by status', async () => {
      const { result } = renderHook(() => usePayroll({ status: 'Draft' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // All returned records should have Draft status
      result.current.data?.forEach((record) => {
        expect(record.status).toBe('Draft');
      });
    });
  });

  describe('usePayrollStats', () => {
    it('should fetch payroll statistics', async () => {
      const { result } = renderHook(() => usePayrollStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveProperty('totalGrossPay');
      expect(result.current.data).toHaveProperty('totalNetPay');
      expect(result.current.data).toHaveProperty('pendingApproval');
      expect(typeof result.current.data!.totalGrossPay).toBe('number');
    });
  });

  describe('useApprovePayroll', () => {
    it('should approve a payroll record', async () => {
      const wrapper = createWrapper();
      
      // First get payroll data
      const { result: payrollResult } = renderHook(() => usePayroll(), { wrapper });
      
      await waitFor(() => {
        expect(payrollResult.current.isLoading).toBe(false);
      });

      // Find a draft record
      const draftRecord = payrollResult.current.data?.find(r => r.status === 'Draft');
      expect(draftRecord).toBeDefined();
      
      if (draftRecord) {
        // Now test the mutation
        const { result: mutationResult } = renderHook(() => useApprovePayroll(), { wrapper });

        // Execute and wait for mutation to complete
        await mutationResult.current.mutateAsync(draftRecord.id);
        
        // Wait for mutation state to update
        await waitFor(() => {
          expect(mutationResult.current.isSuccess).toBe(true);
        });
      }
    });
  });

  describe('useInvoices', () => {
    it('should fetch invoices successfully', async () => {
      const { result } = renderHook(() => useInvoices(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should filter invoices by status', async () => {
      const { result } = renderHook(() => useInvoices({ status: 'Paid' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.data?.forEach((invoice) => {
        expect(invoice.status).toBe('Paid');
      });
    });
  });

  describe('useInvoiceStats', () => {
    it('should fetch invoice statistics', async () => {
      const { result } = renderHook(() => useInvoiceStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveProperty('totalRevenue');
      expect(result.current.data).toHaveProperty('overdueAmount');
      expect(result.current.data).toHaveProperty('draftCount');
    });
  });

  describe('useSendInvoice', () => {
    it('should send an invoice', async () => {
      const wrapper = createWrapper();
      
      const { result: invoicesResult } = renderHook(() => useInvoices(), { wrapper });
      
      await waitFor(() => {
        expect(invoicesResult.current.isLoading).toBe(false);
      });

      const draftInvoice = invoicesResult.current.data?.find(i => i.status === 'Draft');
      
      if (draftInvoice) {
        const { result: mutationResult } = renderHook(() => useSendInvoice(), { wrapper });

        await mutationResult.current.mutateAsync(draftInvoice.id);

        expect(mutationResult.current.isSuccess).toBe(true);
      }
    });
  });
});
