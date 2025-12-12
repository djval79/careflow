/**
 * Visit/Shift Data Hooks using React Query
 * 
 * Provides type-safe data fetching and mutations for visit/shift entities.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries, STALE_TIMES } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';
import type { Visit } from '@/types';

/**
 * Transform database row to Visit type
 */
function transformVisit(row: Record<string, unknown>): Visit {
  const client = row.client || row.clients;
  const staff = row.staff || row.employees;
  
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    staffId: row.staff_id as string | null,
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    visitType: row.visit_type as string,
    status: row.status as Visit['status'],
    notes: row.notes as string | undefined,
    completedAt: row.completed_at as string | undefined,
    clientName: client ? (client as Record<string, unknown>).name as string : undefined,
    clientAddress: client ? (client as Record<string, unknown>).address as string : undefined,
    staffName: staff 
      ? `${(staff as Record<string, unknown>).first_name || ''} ${(staff as Record<string, unknown>).last_name || ''}`.trim() ||
        (staff as Record<string, unknown>).name as string
      : undefined,
    tenant_id: row.tenant_id as string | undefined,
  };
}

/**
 * Fetch all visits with optional filters
 */
export function useVisits(filters?: { 
  status?: string; 
  staffId?: string;
  clientId?: string;
  tenantId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.visits.list(filters),
    queryFn: async () => {
      try {
        let query = supabase
          .from('visits')
          .select('*, clients(name, address), employees(first_name, last_name, name)')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.staffId) {
          query = query.eq('staff_id', filters.staffId);
        }
        if (filters?.clientId) {
          query = query.eq('client_id', filters.clientId);
        }
        if (filters?.tenantId) {
          query = query.eq('tenant_id', filters.tenantId);
        }

        const { data, error } = await query;
        if (error) throw handleError(error, 'Failed to fetch visits');

        return (data || []).map(transformVisit);
      } catch (error) {
        throw handleError(error, 'useVisits query failed');
      }
    },
    staleTime: STALE_TIMES.frequent,
  });
}

/**
 * Fetch visits by date range
 */
export function useVisitsByDateRange(startDate: string, endDate: string, tenantId?: string) {
  return useQuery({
    queryKey: queryKeys.visits.byDateRange(startDate, endDate),
    queryFn: async () => {
      try {
        let query = supabase
          .from('visits')
          .select('*, clients(name, address), employees(first_name, last_name, name)')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (tenantId) {
          query = query.eq('tenant_id', tenantId);
        }

        const { data, error } = await query;
        if (error) throw handleError(error, 'Failed to fetch visits by date range');

        return (data || []).map(transformVisit);
      } catch (error) {
        throw handleError(error, 'useVisitsByDateRange query failed');
      }
    },
    staleTime: STALE_TIMES.frequent,
  });
}

/**
 * Fetch upcoming visits
 */
export function useUpcomingVisits(limit = 5) {
  return useQuery({
    queryKey: queryKeys.visits.upcoming(limit),
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('visits')
          .select('*, clients(name, address)')
          .gte('date', today)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(limit);

        if (error) throw handleError(error, 'Failed to fetch upcoming visits');
        return (data || []).map(transformVisit);
      } catch (error) {
        throw handleError(error, 'useUpcomingVisits query failed');
      }
    },
    staleTime: STALE_TIMES.realtime,
  });
}

/**
 * Fetch unassigned visits
 */
export function useUnassignedVisits() {
  return useQuery({
    queryKey: queryKeys.visits.unassigned(),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('visits')
          .select('*, clients(name, address)')
          .is('staff_id', null)
          .eq('status', 'Scheduled')
          .order('date', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch unassigned visits');
        return (data || []).map(transformVisit);
      } catch (error) {
        throw handleError(error, 'useUnassignedVisits query failed');
      }
    },
    staleTime: STALE_TIMES.frequent,
  });
}

/**
 * Fetch single visit by ID
 */
export function useVisit(id: string | null) {
  return useQuery({
    queryKey: queryKeys.visits.detail(id || ''),
    queryFn: async () => {
      if (!id) throw createError.validation('Visit ID is required');

      try {
        const { data, error } = await supabase
          .from('visits')
          .select('*, clients(name, address), employees(first_name, last_name, name)')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Visit', { id });
          }
          throw handleError(error, 'Failed to fetch visit');
        }

        return transformVisit(data);
      } catch (error) {
        throw handleError(error, 'useVisit query failed');
      }
    },
    enabled: !!id,
    staleTime: STALE_TIMES.frequent,
  });
}

/**
 * Create a new visit
 */
export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitData: Partial<Visit>) => {
      try {
        const dbData = {
          client_id: visitData.clientId,
          staff_id: visitData.staffId,
          date: visitData.date,
          start_time: visitData.startTime,
          end_time: visitData.endTime,
          visit_type: visitData.visitType,
          status: visitData.status || 'Scheduled',
          notes: visitData.notes || 'Created via Rostering',
          tenant_id: visitData.tenant_id,
        };

        const { data, error } = await supabase
          .from('visits')
          .insert(dbData)
          .select('*, clients(name, address), employees(first_name, last_name, name)')
          .single();

        if (error) throw handleError(error, 'Failed to create visit');
        log.info('Visit created successfully', { id: data.id });
        return transformVisit(data);
      } catch (error) {
        throw handleError(error, 'useCreateVisit mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.visits.all);
      queryClient.setQueryData(queryKeys.visits.detail(data.id), data);
      log.track('visit_created', { visitId: data.id });
    },
  });
}

/**
 * Update a visit
 */
export function useUpdateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: visitData }: { id: string; data: Partial<Visit> }) => {
      try {
        const dbData: Record<string, unknown> = {};
        
        if (visitData.clientId !== undefined) dbData.client_id = visitData.clientId;
        if (visitData.staffId !== undefined) dbData.staff_id = visitData.staffId;
        if (visitData.date !== undefined) dbData.date = visitData.date;
        if (visitData.startTime !== undefined) dbData.start_time = visitData.startTime;
        if (visitData.endTime !== undefined) dbData.end_time = visitData.endTime;
        if (visitData.visitType !== undefined) dbData.visit_type = visitData.visitType;
        if (visitData.status !== undefined) dbData.status = visitData.status;
        if (visitData.notes !== undefined) dbData.notes = visitData.notes;

        const { data, error } = await supabase
          .from('visits')
          .update(dbData)
          .eq('id', id)
          .select('*, clients(name, address), employees(first_name, last_name, name)')
          .single();

        if (error) throw handleError(error, 'Failed to update visit');
        return transformVisit(data);
      } catch (error) {
        throw handleError(error, 'useUpdateVisit mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.visits.detail(data.id), data);
      invalidateQueries(queryKeys.visits.all);
      log.track('visit_updated', { visitId: data.id });
    },
  });
}

/**
 * Delete a visit
 */
export function useDeleteVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('visits')
          .delete()
          .eq('id', id);

        if (error) throw handleError(error, 'Failed to delete visit');
        return id;
      } catch (error) {
        throw handleError(error, 'useDeleteVisit mutation failed');
      }
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.visits.detail(id) });
      invalidateQueries(queryKeys.visits.all);
      log.track('visit_deleted', { visitId: id });
    },
  });
}

/**
 * Assign staff to a visit
 */
export function useAssignStaffToVisit() {
  const updateVisit = useUpdateVisit();

  return useMutation({
    mutationFn: async ({ visitId, staffId, date }: { visitId: string; staffId: string; date?: string }) => {
      return updateVisit.mutateAsync({
        id: visitId,
        data: {
          staffId,
          date,
          status: 'Scheduled',
        },
      });
    },
    onSuccess: (data) => {
      log.track('staff_assigned_to_visit', { visitId: data.id, staffId: data.staffId });
    },
  });
}

/**
 * Complete a visit
 */
export function useCompleteVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      try {
        const { data, error } = await supabase
          .from('visits')
          .update({
            status: 'Completed',
            completed_at: new Date().toISOString(),
            notes: notes,
          })
          .eq('id', id)
          .select('*, clients(name, address), employees(first_name, last_name, name)')
          .single();

        if (error) throw handleError(error, 'Failed to complete visit');
        return transformVisit(data);
      } catch (error) {
        throw handleError(error, 'useCompleteVisit mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.visits.detail(data.id), data);
      invalidateQueries(queryKeys.visits.all);
      log.track('visit_completed', { visitId: data.id });
    },
  });
}

/**
 * Cancel a visit
 */
export function useCancelVisit() {
  const updateVisit = useUpdateVisit();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      return updateVisit.mutateAsync({
        id,
        data: {
          status: 'Cancelled',
          notes: reason,
        },
      });
    },
    onSuccess: (data) => {
      log.track('visit_cancelled', { visitId: data.id });
    },
  });
}
