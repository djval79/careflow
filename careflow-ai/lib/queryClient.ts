/**
 * React Query Configuration for CareFlow
 * 
 * Centralized query client setup with consistent defaults,
 * query key factories, and cache invalidation helpers.
 */

import { QueryClient, QueryClientConfig } from '@tanstack/react-query';
import { log } from './logger';
import { isRetryableError } from './errorHandler';

/**
 * Default stale times for different data types (in milliseconds)
 */
export const STALE_TIMES = {
  /** Static data that rarely changes */
  static: 30 * 60 * 1000, // 30 minutes
  /** Standard data with moderate change frequency */
  standard: 5 * 60 * 1000, // 5 minutes
  /** Frequently changing data */
  frequent: 1 * 60 * 1000, // 1 minute
  /** Real-time data */
  realtime: 30 * 1000, // 30 seconds
} as const;

/**
 * Query key factory for consistent key generation
 * This enables targeted cache invalidation
 */
export const queryKeys = {
  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    carePlans: (clientId: string) =>
      [...queryKeys.clients.detail(clientId), 'carePlans'] as const,
    medications: (clientId: string) =>
      [...queryKeys.clients.detail(clientId), 'medications'] as const,
  },

  // Staff / Employees
  staff: {
    all: ['staff'] as const,
    lists: () => [...queryKeys.staff.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.staff.lists(), filters] as const,
    details: () => [...queryKeys.staff.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.staff.details(), id] as const,
    training: (staffId: string) =>
      [...queryKeys.staff.detail(staffId), 'training'] as const,
    compliance: (staffId: string) =>
      [...queryKeys.staff.detail(staffId), 'compliance'] as const,
  },

  // Visits / Shifts
  visits: {
    all: ['visits'] as const,
    lists: () => [...queryKeys.visits.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.visits.lists(), filters] as const,
    details: () => [...queryKeys.visits.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.visits.details(), id] as const,
    byDateRange: (start: string, end: string) =>
      [...queryKeys.visits.lists(), { start, end }] as const,
    upcoming: (limit?: number) =>
      [...queryKeys.visits.lists(), { upcoming: true, limit }] as const,
    unassigned: () =>
      [...queryKeys.visits.lists(), { unassigned: true }] as const,
  },

  // Medications
  medications: {
    all: ['medications'] as const,
    lists: () => [...queryKeys.medications.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.medications.lists(), filters] as const,
    details: () => [...queryKeys.medications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.medications.details(), id] as const,
    byClient: (clientId: string) =>
      [...queryKeys.medications.lists(), { clientId }] as const,
    mar: (clientId: string, date: string) =>
      [...queryKeys.medications.all, 'mar', clientId, date] as const,
  },

  // Incidents
  incidents: {
    all: ['incidents'] as const,
    lists: () => [...queryKeys.incidents.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.incidents.lists(), filters] as const,
    details: () => [...queryKeys.incidents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.incidents.details(), id] as const,
  },

  // Care Plans
  carePlans: {
    all: ['carePlans'] as const,
    lists: () => [...queryKeys.carePlans.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.carePlans.lists(), filters] as const,
    details: () => [...queryKeys.carePlans.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.carePlans.details(), id] as const,
    byClient: (clientId: string) =>
      [...queryKeys.carePlans.lists(), { clientId }] as const,
  },

  // Dashboard Stats
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recentActivity: () => [...queryKeys.dashboard.all, 'activity'] as const,
  },

  // Training
  training: {
    all: ['training'] as const,
    modules: () => [...queryKeys.training.all, 'modules'] as const,
    records: (staffId?: string) =>
      [...queryKeys.training.all, 'records', staffId] as const,
  },

  // Payroll
  payroll: {
    all: ['payroll'] as const,
    lists: () => [...queryKeys.payroll.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.payroll.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.payroll.all, 'detail', id] as const,
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.invoices.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.invoices.all, 'detail', id] as const,
  },
} as const;

/**
 * Query client configuration
 */
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: STALE_TIMES.standard,
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: (failureCount, error) => {
        // Only retry retryable errors, max 3 times
        if (!isRetryableError(error)) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Disable aggressive refetching
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      onError: (error) => {
        log.error('Mutation failed', { error: String(error) });
      },
    },
  },
};

/**
 * Create and export the query client singleton
 */
let queryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient(queryClientConfig);
  }
  return queryClient;
}

/**
 * Create a fresh query client (useful for testing)
 */
export function createQueryClient(): QueryClient {
  return new QueryClient(queryClientConfig);
}

/**
 * Invalidate queries by key pattern
 */
export function invalidateQueries(queryKey: readonly unknown[]): Promise<void> {
  const client = getQueryClient();
  log.debug('Invalidating queries', { queryKey });
  return client.invalidateQueries({ queryKey });
}

/**
 * Prefetch a query for faster initial load
 */
export async function prefetchQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  staleTime = STALE_TIMES.standard
): Promise<void> {
  const client = getQueryClient();
  await client.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
  });
}

/**
 * Set query data directly (for optimistic updates)
 */
export function setQueryData<T>(
  queryKey: readonly unknown[],
  data: T | ((old: T | undefined) => T)
): void {
  const client = getQueryClient();
  client.setQueryData(queryKey, data);
}

/**
 * Get cached query data
 */
export function getQueryData<T>(queryKey: readonly unknown[]): T | undefined {
  const client = getQueryClient();
  return client.getQueryData(queryKey);
}

/**
 * Clear all cached data (useful for logout)
 */
export function clearQueryCache(): void {
  const client = getQueryClient();
  client.clear();
  log.info('Query cache cleared');
}

export default getQueryClient;
