/**
 * Incident Data Hooks using React Query
 * 
 * Provides type-safe data fetching and mutations for incident entities.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries, STALE_TIMES } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';
import type { Incident } from '@/types';

/**
 * Transform database row to Incident type
 */
function transformIncident(row: Record<string, unknown>): Incident {
  const client = row.client || row.clients;
  const staff = row.staff || row.employees;
  
  return {
    id: row.id as string,
    date: row.date as string,
    clientId: row.client_id as string,
    clientName: client 
      ? (client as Record<string, unknown>).name as string
      : row.client_name as string | undefined,
    staffId: row.staff_id as string | undefined,
    staffName: staff 
      ? (staff as Record<string, unknown>).name as string
      : row.staff_name as string | undefined,
    type: row.type as Incident['type'],
    severity: row.severity as Incident['severity'],
    status: row.status as Incident['status'],
    description: row.description as string,
    investigationNotes: row.investigation_notes as string | undefined,
    rootCause: row.root_cause as string | undefined,
    actionsTaken: row.actions_taken as string | undefined,
    reportedToCQC: row.reported_to_cqc as boolean | undefined,
    witnesses: row.witnesses as string[] | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    tenant_id: row.tenant_id as string | undefined,
  };
}

/**
 * Fetch all incidents with optional filters
 */
export function useIncidents(filters?: { 
  status?: string; 
  severity?: string;
  type?: string;
  clientId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.incidents.list(filters),
    queryFn: async () => {
      try {
        let query = supabase
          .from('incidents')
          .select('*, clients(name), employees(name)')
          .order('date', { ascending: false });

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.severity) {
          query = query.eq('severity', filters.severity);
        }
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.clientId) {
          query = query.eq('client_id', filters.clientId);
        }

        const { data, error } = await query;
        if (error) throw handleError(error, 'Failed to fetch incidents');

        return (data || []).map(transformIncident);
      } catch (error) {
        throw handleError(error, 'useIncidents query failed');
      }
    },
    staleTime: STALE_TIMES.frequent,
  });
}

/**
 * Fetch open incidents (for dashboard)
 */
export function useOpenIncidents() {
  return useQuery({
    queryKey: queryKeys.incidents.list({ status: 'Open' }),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*, clients(name), employees(name)')
          .in('status', ['Open', 'Investigating'])
          .order('severity', { ascending: false })
          .order('date', { ascending: false });

        if (error) throw handleError(error, 'Failed to fetch open incidents');
        return (data || []).map(transformIncident);
      } catch (error) {
        throw handleError(error, 'useOpenIncidents query failed');
      }
    },
    staleTime: STALE_TIMES.frequent,
  });
}

/**
 * Fetch single incident by ID
 */
export function useIncident(id: string | null) {
  return useQuery({
    queryKey: queryKeys.incidents.detail(id || ''),
    queryFn: async () => {
      if (!id) throw createError.validation('Incident ID is required');

      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*, clients(name, address), employees(name, email)')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Incident', { id });
          }
          throw handleError(error, 'Failed to fetch incident');
        }

        return transformIncident(data);
      } catch (error) {
        throw handleError(error, 'useIncident query failed');
      }
    },
    enabled: !!id,
    staleTime: STALE_TIMES.frequent,
  });
}

/**
 * Create a new incident
 */
export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentData: Partial<Incident>) => {
      try {
        const dbData = {
          date: incidentData.date || new Date().toISOString().split('T')[0],
          client_id: incidentData.clientId,
          staff_id: incidentData.staffId,
          type: incidentData.type,
          severity: incidentData.severity,
          status: incidentData.status || 'Open',
          description: incidentData.description,
          investigation_notes: incidentData.investigationNotes,
          witnesses: incidentData.witnesses,
          tenant_id: incidentData.tenant_id,
        };

        const { data, error } = await supabase
          .from('incidents')
          .insert(dbData)
          .select('*, clients(name), employees(name)')
          .single();

        if (error) throw handleError(error, 'Failed to create incident');
        log.info('Incident created successfully', { id: data.id, type: incidentData.type });
        return transformIncident(data);
      } catch (error) {
        throw handleError(error, 'useCreateIncident mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.incidents.all);
      queryClient.setQueryData(queryKeys.incidents.detail(data.id), data);
      log.track('incident_created', { 
        incidentId: data.id, 
        type: data.type, 
        severity: data.severity 
      });
    },
  });
}

/**
 * Update an incident
 */
export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: incidentData }: { id: string; data: Partial<Incident> }) => {
      try {
        const dbData: Record<string, unknown> = {};
        
        if (incidentData.date !== undefined) dbData.date = incidentData.date;
        if (incidentData.clientId !== undefined) dbData.client_id = incidentData.clientId;
        if (incidentData.staffId !== undefined) dbData.staff_id = incidentData.staffId;
        if (incidentData.type !== undefined) dbData.type = incidentData.type;
        if (incidentData.severity !== undefined) dbData.severity = incidentData.severity;
        if (incidentData.status !== undefined) dbData.status = incidentData.status;
        if (incidentData.description !== undefined) dbData.description = incidentData.description;
        if (incidentData.investigationNotes !== undefined) 
          dbData.investigation_notes = incidentData.investigationNotes;
        if (incidentData.rootCause !== undefined) dbData.root_cause = incidentData.rootCause;
        if (incidentData.actionsTaken !== undefined) dbData.actions_taken = incidentData.actionsTaken;
        if (incidentData.reportedToCQC !== undefined) dbData.reported_to_cqc = incidentData.reportedToCQC;
        if (incidentData.witnesses !== undefined) dbData.witnesses = incidentData.witnesses;

        const { data, error } = await supabase
          .from('incidents')
          .update(dbData)
          .eq('id', id)
          .select('*, clients(name), employees(name)')
          .single();

        if (error) throw handleError(error, 'Failed to update incident');
        return transformIncident(data);
      } catch (error) {
        throw handleError(error, 'useUpdateIncident mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.incidents.detail(data.id), data);
      invalidateQueries(queryKeys.incidents.all);
      log.track('incident_updated', { incidentId: data.id, status: data.status });
    },
  });
}

/**
 * Close an incident with resolution
 */
export function useCloseIncident() {
  const updateIncident = useUpdateIncident();

  return useMutation({
    mutationFn: async ({ 
      id, 
      rootCause, 
      actionsTaken,
      reportedToCQC 
    }: { 
      id: string; 
      rootCause: string;
      actionsTaken: string;
      reportedToCQC?: boolean;
    }) => {
      return updateIncident.mutateAsync({
        id,
        data: {
          status: 'Closed',
          rootCause,
          actionsTaken,
          reportedToCQC,
        },
      });
    },
    onSuccess: (data) => {
      log.track('incident_closed', { incidentId: data.id });
    },
  });
}

/**
 * Escalate an incident
 */
export function useEscalateIncident() {
  const updateIncident = useUpdateIncident();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return updateIncident.mutateAsync({
        id,
        data: {
          status: 'Investigating',
          investigationNotes: notes,
        },
      });
    },
    onSuccess: (data) => {
      log.track('incident_escalated', { incidentId: data.id });
    },
  });
}

/**
 * Report incident to CQC
 */
export function useReportIncidentToCQC() {
  const updateIncident = useUpdateIncident();

  return useMutation({
    mutationFn: async (id: string) => {
      return updateIncident.mutateAsync({
        id,
        data: { reportedToCQC: true },
      });
    },
    onSuccess: (data) => {
      log.track('incident_reported_to_cqc', { incidentId: data.id });
    },
  });
}

/**
 * Get incident statistics
 */
export function useIncidentStats() {
  return useQuery({
    queryKey: [...queryKeys.incidents.all, 'stats'],
    queryFn: async () => {
      try {
        const { data: openCount } = await supabase
          .from('incidents')
          .select('*', { count: 'exact', head: true })
          .in('status', ['Open', 'Investigating']);

        const { data: highSeverity } = await supabase
          .from('incidents')
          .select('*', { count: 'exact', head: true })
          .eq('severity', 'High')
          .in('status', ['Open', 'Investigating']);

        const { data: thisMonth } = await supabase
          .from('incidents')
          .select('*', { count: 'exact', head: true })
          .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

        return {
          openIncidents: openCount || 0,
          highSeverityOpen: highSeverity || 0,
          thisMonthTotal: thisMonth || 0,
        };
      } catch (error) {
        throw handleError(error, 'useIncidentStats query failed');
      }
    },
    staleTime: STALE_TIMES.frequent,
  });
}
