/**
 * Medication Data Hooks using React Query
 * 
 * Provides type-safe data fetching and mutations for medication entities
 * and MAR (Medication Administration Record) management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries, STALE_TIMES } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';
import type { Medication, MarRecord } from '@/types';

/**
 * Transform database row to Medication type
 */
function transformMedication(row: Record<string, unknown>): Medication {
  return {
    id: row.id as string,
    name: row.name as string,
    dosage: row.dosage as string,
    frequency: row.frequency as string,
    route: row.route as string,
    stockLevel: row.stock_level as number,
    totalStock: row.total_stock as number | undefined,
    startDate: row.start_date as string,
    endDate: row.end_date as string | undefined,
    instructions: row.instructions as string | undefined,
    isActive: (row.is_active as boolean) ?? true,
    clientId: row.client_id as string,
    prescribedBy: row.prescribed_by as string | undefined,
    tenant_id: row.tenant_id as string | undefined,
  };
}

/**
 * Transform database row to MarRecord type
 */
function transformMarRecord(row: Record<string, unknown>): MarRecord {
  const admin = row.administeredBy || row.administered_by_user;
  
  return {
    id: row.id as string,
    medicationId: row.medication_id as string,
    date: (row.scheduled_date || row.date) as string,
    scheduledDate: row.scheduled_date as string,
    timeSlot: row.time_slot as string,
    status: row.status as MarRecord['status'],
    administeredBy: admin 
      ? typeof admin === 'object' 
        ? (admin as Record<string, unknown>).name as string
        : admin as string
      : undefined,
    administeredAt: row.administered_at as string | undefined,
    notes: row.notes as string | undefined,
    clientId: row.client_id as string,
  };
}

/**
 * Fetch medications for a client
 */
export function useMedicationsByClient(clientId: string | null) {
  return useQuery({
    queryKey: queryKeys.medications.byClient(clientId || ''),
    queryFn: async () => {
      if (!clientId) throw createError.validation('Client ID is required');

      try {
        // Try RPC first for better security
        try {
          const { data, error } = await supabase.rpc('get_client_medications', {
            p_client_id: clientId,
          });
          
          if (!error && data) {
            return (data as Record<string, unknown>[]).map(transformMedication);
          }
        } catch (rpcError) {
          log.warn('Medications RPC failed, falling back to direct query', { 
            error: String(rpcError) 
          });
        }

        // Fallback to direct query
        const { data, error } = await supabase
          .from('medications')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .order('name');

        if (error) throw handleError(error, 'Failed to fetch medications');
        return (data || []).map(transformMedication);
      } catch (error) {
        throw handleError(error, 'useMedicationsByClient query failed');
      }
    },
    enabled: !!clientId,
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Fetch all medications (admin view)
 */
export function useMedications(filters?: { isActive?: boolean }) {
  return useQuery({
    queryKey: queryKeys.medications.list(filters),
    queryFn: async () => {
      try {
        let query = supabase
          .from('medications')
          .select('*, clients(name)')
          .order('name');

        if (filters?.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive);
        }

        const { data, error } = await query;
        if (error) throw handleError(error, 'Failed to fetch medications');

        return (data || []).map(transformMedication);
      } catch (error) {
        throw handleError(error, 'useMedications query failed');
      }
    },
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Fetch single medication by ID
 */
export function useMedication(id: string | null) {
  return useQuery({
    queryKey: queryKeys.medications.detail(id || ''),
    queryFn: async () => {
      if (!id) throw createError.validation('Medication ID is required');

      try {
        const { data, error } = await supabase
          .from('medications')
          .select('*, clients(name)')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Medication', { id });
          }
          throw handleError(error, 'Failed to fetch medication');
        }

        return transformMedication(data);
      } catch (error) {
        throw handleError(error, 'useMedication query failed');
      }
    },
    enabled: !!id,
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Fetch MAR records for a client on a specific date
 */
export function useMarRecords(clientId: string | null, date: string | null) {
  return useQuery({
    queryKey: queryKeys.medications.mar(clientId || '', date || ''),
    queryFn: async () => {
      if (!clientId || !date) {
        throw createError.validation('Client ID and date are required');
      }

      try {
        // Try RPC first
        try {
          const { data, error } = await supabase.rpc('get_client_mar', {
            p_client_id: clientId,
            p_date: date,
          });

          if (!error && data) {
            return (data as Record<string, unknown>[]).map(transformMarRecord);
          }
        } catch (rpcError) {
          log.warn('MAR RPC failed, falling back to direct query', { 
            error: String(rpcError) 
          });
        }

        // Fallback to direct query
        const { data, error } = await supabase
          .from('medication_records')
          .select('*, administered_by_user:employees(name)')
          .eq('client_id', clientId)
          .eq('scheduled_date', date)
          .order('time_slot');

        if (error) throw handleError(error, 'Failed to fetch MAR records');
        return (data || []).map(transformMarRecord);
      } catch (error) {
        throw handleError(error, 'useMarRecords query failed');
      }
    },
    enabled: !!clientId && !!date,
    staleTime: STALE_TIMES.realtime,
  });
}

/**
 * Create a new medication
 */
export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (medicationData: Partial<Medication>) => {
      try {
        const dbData = {
          client_id: medicationData.clientId,
          name: medicationData.name,
          dosage: medicationData.dosage,
          frequency: medicationData.frequency,
          route: medicationData.route,
          start_date: medicationData.startDate,
          end_date: medicationData.endDate,
          instructions: medicationData.instructions,
          stock_level: medicationData.stockLevel,
          total_stock: medicationData.totalStock,
          is_active: medicationData.isActive ?? true,
          prescribed_by: medicationData.prescribedBy,
          tenant_id: medicationData.tenant_id,
        };

        const { data, error } = await supabase
          .from('medications')
          .insert(dbData)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to create medication');
        log.info('Medication created successfully', { id: data.id });
        return transformMedication(data);
      } catch (error) {
        throw handleError(error, 'useCreateMedication mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.medications.all);
      if (data.clientId) {
        invalidateQueries(queryKeys.medications.byClient(data.clientId));
      }
      queryClient.setQueryData(queryKeys.medications.detail(data.id), data);
      log.track('medication_created', { medicationId: data.id, clientId: data.clientId });
    },
  });
}

/**
 * Update a medication
 */
export function useUpdateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: medicationData }: { id: string; data: Partial<Medication> }) => {
      try {
        const dbData: Record<string, unknown> = {};
        
        if (medicationData.name !== undefined) dbData.name = medicationData.name;
        if (medicationData.dosage !== undefined) dbData.dosage = medicationData.dosage;
        if (medicationData.frequency !== undefined) dbData.frequency = medicationData.frequency;
        if (medicationData.route !== undefined) dbData.route = medicationData.route;
        if (medicationData.startDate !== undefined) dbData.start_date = medicationData.startDate;
        if (medicationData.endDate !== undefined) dbData.end_date = medicationData.endDate;
        if (medicationData.instructions !== undefined) dbData.instructions = medicationData.instructions;
        if (medicationData.stockLevel !== undefined) dbData.stock_level = medicationData.stockLevel;
        if (medicationData.totalStock !== undefined) dbData.total_stock = medicationData.totalStock;
        if (medicationData.isActive !== undefined) dbData.is_active = medicationData.isActive;

        const { data, error } = await supabase
          .from('medications')
          .update(dbData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to update medication');
        return transformMedication(data);
      } catch (error) {
        throw handleError(error, 'useUpdateMedication mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.medications.detail(data.id), data);
      invalidateQueries(queryKeys.medications.all);
      if (data.clientId) {
        invalidateQueries(queryKeys.medications.byClient(data.clientId));
      }
      log.track('medication_updated', { medicationId: data.id });
    },
  });
}

/**
 * Delete (deactivate) a medication
 */
export function useDeactivateMedication() {
  const updateMedication = useUpdateMedication();

  return useMutation({
    mutationFn: async (id: string) => {
      return updateMedication.mutateAsync({
        id,
        data: { isActive: false },
      });
    },
    onSuccess: (data) => {
      log.track('medication_deactivated', { medicationId: data.id });
    },
  });
}

/**
 * Sign MAR record (record medication administration)
 */
export function useSignMarRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: {
      clientId: string;
      medicationId: string;
      date: string;
      timeSlot: string;
      status: MarRecord['status'];
      staffId?: string;
      notes?: string;
    }) => {
      try {
        const { data, error } = await supabase
          .from('medication_records')
          .insert({
            client_id: record.clientId,
            medication_id: record.medicationId,
            scheduled_date: record.date,
            time_slot: record.timeSlot,
            status: record.status,
            administered_by: record.staffId || null,
            notes: record.notes,
            administered_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to sign MAR record');
        log.info('MAR record signed', { id: data.id, status: record.status });
        return transformMarRecord(data);
      } catch (error) {
        throw handleError(error, 'useSignMarRecord mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.medications.mar(data.clientId, data.date));
      log.track('mar_signed', { 
        medicationId: data.medicationId, 
        status: data.status 
      });
    },
  });
}

/**
 * Update stock level for a medication
 */
export function useUpdateMedicationStock() {
  const updateMedication = useUpdateMedication();

  return useMutation({
    mutationFn: async ({ id, stockLevel }: { id: string; stockLevel: number }) => {
      return updateMedication.mutateAsync({
        id,
        data: { stockLevel },
      });
    },
    onSuccess: (data) => {
      log.track('medication_stock_updated', { 
        medicationId: data.id, 
        stockLevel: data.stockLevel 
      });
    },
  });
}
