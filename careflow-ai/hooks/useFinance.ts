/**
 * Finance Data Hooks using React Query
 * 
 * Provides type-safe data fetching and mutations for payroll and invoices.
 * Note: Currently uses mock data - ready to connect to Supabase when tables are created.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries, STALE_TIMES } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';
import type { PayrollRecord, Invoice, InvoiceItem } from '@/types';

// ========================================
// Mock Data (until Supabase tables exist)
// ========================================

const MOCK_PAYROLL: PayrollRecord[] = [
  { id: 'PAY001', staffId: '1', staffName: 'Sarah Smith', role: 'Senior Carer', period: 'Oct 2023', totalHours: 160, hourlyRate: 14.50, bonuses: 100, deductions: 50, grossPay: 2420, netPay: 1936, status: 'Paid' },
  { id: 'PAY002', staffId: '2', staffName: 'James Wilson', role: 'Carer', period: 'Oct 2023', totalHours: 140, hourlyRate: 12.00, bonuses: 0, deductions: 30, grossPay: 1680, netPay: 1344, status: 'Approved' },
  { id: 'PAY003', staffId: '3', staffName: 'Emily Davis', role: 'Nurse', period: 'Oct 2023', totalHours: 152, hourlyRate: 18.00, bonuses: 150, deductions: 100, grossPay: 2886, netPay: 2309, status: 'Draft' },
  { id: 'PAY004', staffId: '4', staffName: 'Michael Brown', role: 'Carer', period: 'Oct 2023', totalHours: 120, hourlyRate: 12.00, bonuses: 25, deductions: 20, grossPay: 1465, netPay: 1172, status: 'Draft' },
];

const MOCK_INVOICES: Invoice[] = [
  { 
    id: 'INV-2023-001', clientId: '1', clientName: 'Council Funding Block A', date: '2023-10-01', dueDate: '2023-10-30', 
    items: [{ description: 'Care Services - Sept', quantity: 400, unitPrice: 22.50, total: 9000 }], 
    totalAmount: 9000, status: 'Paid' 
  },
  { 
    id: 'INV-2023-002', clientId: '2', clientName: 'Edith Crawley', date: '2023-10-05', dueDate: '2023-10-19', 
    items: [{ description: 'Personal Care', quantity: 24, unitPrice: 28.00, total: 672 }], 
    totalAmount: 672, status: 'Overdue' 
  },
  { 
    id: 'INV-2023-003', clientId: '3', clientName: 'Robert Grantham', date: '2023-10-15', dueDate: '2023-10-29', 
    items: [{ description: 'Domestic Support', quantity: 10, unitPrice: 20.00, total: 200 }], 
    totalAmount: 200, status: 'Sent' 
  },
];

// In-memory state for mutations (simulates database)
let payrollData = [...MOCK_PAYROLL];
let invoiceData = [...MOCK_INVOICES];

// ========================================
// Payroll Hooks
// ========================================

/**
 * Fetch all payroll records
 */
export function usePayroll(filters?: { status?: string; period?: string }) {
  return useQuery({
    queryKey: queryKeys.payroll.list(filters),
    queryFn: async () => {
      try {
        // TODO: Replace with Supabase query when table exists
        // const { data, error } = await supabase
        //   .from('payroll')
        //   .select('*, employees(name, role)')
        //   .order('period', { ascending: false });

        let result = [...payrollData];
        
        if (filters?.status) {
          result = result.filter(p => p.status === filters.status);
        }
        if (filters?.period) {
          result = result.filter(p => p.period === filters.period);
        }

        log.debug('Payroll data fetched', { count: result.length, filters });
        return result;
      } catch (error) {
        throw handleError(error, 'Failed to fetch payroll data');
      }
    },
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Fetch payroll statistics
 */
export function usePayrollStats() {
  return useQuery({
    queryKey: queryKeys.payroll.stats(),
    queryFn: async () => {
      try {
        const data = payrollData;
        
        return {
          totalGrossPay: data.reduce((acc, curr) => acc + curr.grossPay, 0),
          totalNetPay: data.reduce((acc, curr) => acc + curr.netPay, 0),
          pendingApproval: data.filter(p => p.status === 'Draft').length,
          awaitingPayment: data.filter(p => p.status === 'Approved').length,
          totalStaff: data.length,
          nextPayDate: '31 Oct 2023', // Would be calculated from config
        };
      } catch (error) {
        throw handleError(error, 'Failed to fetch payroll stats');
      }
    },
    staleTime: STALE_TIMES.frequent,
  });
}

/**
 * Approve a payroll record
 */
export function useApprovePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        // TODO: Replace with Supabase update
        const index = payrollData.findIndex(p => p.id === id);
        if (index === -1) throw createError.notFound('Payroll record', { id });
        
        payrollData[index] = { ...payrollData[index], status: 'Approved' };
        log.info('Payroll approved', { id });
        return payrollData[index];
      } catch (error) {
        throw handleError(error, 'Failed to approve payroll');
      }
    },
    onSuccess: () => {
      invalidateQueries(queryKeys.payroll.all);
      log.track('payroll_approved');
    },
  });
}

/**
 * Mark a payroll record as paid
 */
export function useMarkPayrollPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const index = payrollData.findIndex(p => p.id === id);
        if (index === -1) throw createError.notFound('Payroll record', { id });
        
        payrollData[index] = { ...payrollData[index], status: 'Paid' };
        log.info('Payroll marked as paid', { id });
        return payrollData[index];
      } catch (error) {
        throw handleError(error, 'Failed to mark payroll as paid');
      }
    },
    onSuccess: () => {
      invalidateQueries(queryKeys.payroll.all);
      log.track('payroll_paid');
    },
  });
}

/**
 * Create a new payroll record
 */
export function useCreatePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Omit<PayrollRecord, 'id'>) => {
      try {
        const newRecord: PayrollRecord = {
          ...record,
          id: `PAY${String(payrollData.length + 1).padStart(3, '0')}`,
        };
        
        payrollData.push(newRecord);
        log.info('Payroll record created', { id: newRecord.id });
        return newRecord;
      } catch (error) {
        throw handleError(error, 'Failed to create payroll record');
      }
    },
    onSuccess: () => {
      invalidateQueries(queryKeys.payroll.all);
      log.track('payroll_created');
    },
  });
}

// ========================================
// Invoice Hooks
// ========================================

/**
 * Fetch all invoices
 */
export function useInvoices(filters?: { status?: string; clientId?: string }) {
  return useQuery({
    queryKey: queryKeys.invoices.list(filters),
    queryFn: async () => {
      try {
        // TODO: Replace with Supabase query when table exists
        let result = [...invoiceData];
        
        if (filters?.status) {
          result = result.filter(inv => inv.status === filters.status);
        }
        if (filters?.clientId) {
          result = result.filter(inv => inv.clientId === filters.clientId);
        }

        log.debug('Invoice data fetched', { count: result.length, filters });
        return result;
      } catch (error) {
        throw handleError(error, 'Failed to fetch invoices');
      }
    },
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Fetch invoice statistics
 */
export function useInvoiceStats() {
  return useQuery({
    queryKey: queryKeys.invoices.stats(),
    queryFn: async () => {
      try {
        const data = invoiceData;
        
        return {
          totalRevenue: data.reduce((acc, curr) => acc + curr.totalAmount, 0),
          paidAmount: data.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.totalAmount, 0),
          overdueAmount: data.filter(i => i.status === 'Overdue').reduce((acc, curr) => acc + curr.totalAmount, 0),
          pendingAmount: data.filter(i => i.status === 'Sent').reduce((acc, curr) => acc + curr.totalAmount, 0),
          draftCount: data.filter(i => i.status === 'Draft').length,
          overdueCount: data.filter(i => i.status === 'Overdue').length,
        };
      } catch (error) {
        throw handleError(error, 'Failed to fetch invoice stats');
      }
    },
    staleTime: STALE_TIMES.frequent,
  });
}

/**
 * Fetch single invoice by ID
 */
export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id || ''),
    queryFn: async () => {
      if (!id) throw createError.validation('Invoice ID is required');

      try {
        const invoice = invoiceData.find(inv => inv.id === id);
        if (!invoice) throw createError.notFound('Invoice', { id });
        
        return invoice;
      } catch (error) {
        throw handleError(error, 'Failed to fetch invoice');
      }
    },
    enabled: !!id,
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Create a new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceInput: Omit<Invoice, 'id' | 'totalAmount'>) => {
      try {
        const totalAmount = invoiceInput.items.reduce((acc, item) => acc + item.total, 0);
        const newInvoice: Invoice = {
          ...invoiceInput,
          id: `INV-${new Date().getFullYear()}-${String(invoiceData.length + 1).padStart(3, '0')}`,
          totalAmount,
        };
        
        invoiceData.push(newInvoice);
        log.info('Invoice created', { id: newInvoice.id, amount: totalAmount });
        return newInvoice;
      } catch (error) {
        throw handleError(error, 'Failed to create invoice');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.invoices.all);
      queryClient.setQueryData(queryKeys.invoices.detail(data.id), data);
      log.track('invoice_created', { invoiceId: data.id });
    },
  });
}

/**
 * Send an invoice
 */
export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const index = invoiceData.findIndex(inv => inv.id === id);
        if (index === -1) throw createError.notFound('Invoice', { id });
        
        invoiceData[index] = { ...invoiceData[index], status: 'Sent' };
        log.info('Invoice sent', { id });
        return invoiceData[index];
      } catch (error) {
        throw handleError(error, 'Failed to send invoice');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.invoices.all);
      queryClient.setQueryData(queryKeys.invoices.detail(data.id), data);
      log.track('invoice_sent', { invoiceId: data.id });
    },
  });
}

/**
 * Mark an invoice as paid
 */
export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const index = invoiceData.findIndex(inv => inv.id === id);
        if (index === -1) throw createError.notFound('Invoice', { id });
        
        invoiceData[index] = { ...invoiceData[index], status: 'Paid' };
        log.info('Invoice marked as paid', { id });
        return invoiceData[index];
      } catch (error) {
        throw handleError(error, 'Failed to mark invoice as paid');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.invoices.all);
      queryClient.setQueryData(queryKeys.invoices.detail(data.id), data);
      log.track('invoice_paid', { invoiceId: data.id });
    },
  });
}

/**
 * Delete an invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const index = invoiceData.findIndex(inv => inv.id === id);
        if (index === -1) throw createError.notFound('Invoice', { id });
        
        invoiceData = invoiceData.filter(inv => inv.id !== id);
        log.info('Invoice deleted', { id });
        return id;
      } catch (error) {
        throw handleError(error, 'Failed to delete invoice');
      }
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.invoices.detail(id) });
      invalidateQueries(queryKeys.invoices.all);
      log.track('invoice_deleted', { invoiceId: id });
    },
  });
}
