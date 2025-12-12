/**
 * Client Data Hooks using React Query
 * 
 * Provides type-safe data fetching and mutations for client entities.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries, STALE_TIMES } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';
import type { Client } from '@/types';

/**
 * Transform database row to Client type
 */
function transformClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    age: row.age as number,
    address: row.address as string,
    careLevel: (row.care_level || row.careLevel) as Client['careLevel'],
    coordinates: row.coordinates as Client['coordinates'],
    lastVisit: (row.last_visit || 'No visits yet') as string,
    fundingDetails: {
      source: (row.funding_source || (row.funding_details as Record<string, unknown>)?.source || 'Private') as string,
      contractId: (row.contract_id || (row.funding_details as Record<string, unknown>)?.contractId) as string,
      budgetLimit: (row.budget_limit || (row.funding_details as Record<string, unknown>)?.budgetLimit) as number | undefined,
    },
    emergencyContact: {
      name: (row.emergency_contact_name || (row.emergency_contact as Record<string, unknown>)?.name || '') as string,
      relation: (row.emergency_contact_relation || (row.emergency_contact as Record<string, unknown>)?.relation || '') as string,
      phone: (row.emergency_contact_phone || (row.emergency_contact as Record<string, unknown>)?.phone || '') as string,
    },
    dietaryRequirements: (row.dietary_requirements || []) as string[],
    allergies: (row.allergies || []) as string[],
    status: (row.status || 'Active') as string,
    tenant_id: row.tenant_id as string | undefined,
  };
}

/**
 * Fetch all clients
 */
export function useClients(filters?: { status?: string; careLevel?: string }) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: async () => {
      try {
        let query = supabase
          .from('clients')
          .select('*')
          .order('name');

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.careLevel) {
          query = query.eq('care_level', filters.careLevel);
        }

        const { data, error } = await query;
        if (error) throw handleError(error, 'Failed to fetch clients');

        return (data || []).map(transformClient);
      } catch (error) {
        throw handleError(error, 'useClients query failed');
      }
    },
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Fetch clients by tenant ID (for multi-tenant support)
 */
export function useClientsByTenant(tenantId: string | null) {
  return useQuery({
    queryKey: queryKeys.clients.list({ tenantId }),
    queryFn: async () => {
      if (!tenantId) throw createError.validation('Tenant ID is required');

      try {
        // Try RPC method first for better RLS handling
        const { data, error } = await supabase.rpc('get_tenant_clients', {
          p_tenant_id: tenantId,
        });

        if (error) {
          // Fallback to direct query
          log.warn('RPC failed, falling back to direct query', { error: error.message });
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('clients')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');

          if (fallbackError) throw handleError(fallbackError, 'Failed to fetch tenant clients');
          return (fallbackData || []).map(transformClient);
        }

        return (data || []).map(transformClient);
      } catch (error) {
        throw handleError(error, 'useClientsByTenant query failed');
      }
    },
    enabled: !!tenantId,
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Fetch single client by ID
 */
export function useClient(id: string | null) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id || ''),
    queryFn: async () => {
      if (!id) throw createError.validation('Client ID is required');

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*, care_plans(*), medications(*)')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Client', { id });
          }
          throw handleError(error, 'Failed to fetch client');
        }

        return transformClient(data);
      } catch (error) {
        throw handleError(error, 'useClient query failed');
      }
    },
    enabled: !!id,
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      try {
        // Transform to database schema
        const dbData = {
          name: clientData.name,
          age: clientData.age,
          address: clientData.address,
          care_level: clientData.careLevel,
          status: clientData.status || 'Active',
          funding_source: clientData.fundingDetails?.source,
          contract_id: clientData.fundingDetails?.contractId,
          budget_limit: clientData.fundingDetails?.budgetLimit,
          emergency_contact_name: clientData.emergencyContact?.name,
          emergency_contact_relation: clientData.emergencyContact?.relation,
          emergency_contact_phone: clientData.emergencyContact?.phone,
          dietary_requirements: clientData.dietaryRequirements,
          allergies: clientData.allergies,
          tenant_id: clientData.tenant_id,
        };

        const { data, error } = await supabase
          .from('clients')
          .insert(dbData)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to create client');
        log.info('Client created successfully', { id: data.id });
        return transformClient(data);
      } catch (error) {
        throw handleError(error, 'useCreateClient mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.clients.all);
      queryClient.setQueryData(queryKeys.clients.detail(data.id), data);
      log.track('client_created', { clientId: data.id });
    },
  });
}

/**
 * Update an existing client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: clientData }: { id: string; data: Partial<Client> }) => {
      try {
        // Transform to database schema (only include provided fields)
        const dbData: Record<string, unknown> = {};
        
        if (clientData.name !== undefined) dbData.name = clientData.name;
        if (clientData.age !== undefined) dbData.age = clientData.age;
        if (clientData.address !== undefined) dbData.address = clientData.address;
        if (clientData.careLevel !== undefined) dbData.care_level = clientData.careLevel;
        if (clientData.status !== undefined) dbData.status = clientData.status;
        if (clientData.fundingDetails?.source !== undefined) 
          dbData.funding_source = clientData.fundingDetails.source;
        if (clientData.fundingDetails?.contractId !== undefined) 
          dbData.contract_id = clientData.fundingDetails.contractId;
        if (clientData.fundingDetails?.budgetLimit !== undefined) 
          dbData.budget_limit = clientData.fundingDetails.budgetLimit;
        if (clientData.emergencyContact?.name !== undefined) 
          dbData.emergency_contact_name = clientData.emergencyContact.name;
        if (clientData.emergencyContact?.relation !== undefined) 
          dbData.emergency_contact_relation = clientData.emergencyContact.relation;
        if (clientData.emergencyContact?.phone !== undefined) 
          dbData.emergency_contact_phone = clientData.emergencyContact.phone;
        if (clientData.dietaryRequirements !== undefined) 
          dbData.dietary_requirements = clientData.dietaryRequirements;
        if (clientData.allergies !== undefined) 
          dbData.allergies = clientData.allergies;

        const { data, error } = await supabase
          .from('clients')
          .update(dbData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to update client');
        return transformClient(data);
      } catch (error) {
        throw handleError(error, 'useUpdateClient mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.clients.detail(data.id), data);
      invalidateQueries(queryKeys.clients.all);
      log.track('client_updated', { clientId: data.id });
    },
  });
}

/**
 * Delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);

        if (error) throw handleError(error, 'Failed to delete client');
        return id;
      } catch (error) {
        throw handleError(error, 'useDeleteClient mutation failed');
      }
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.clients.detail(id) });
      invalidateQueries(queryKeys.clients.all);
      log.track('client_deleted', { clientId: id });
    },
  });
}

/**
 * Soft delete (deactivate) a client
 */
export function useDeactivateClient() {
  const updateClient = useUpdateClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return updateClient.mutateAsync({
        id,
        data: { status: 'Inactive' },
      });
    },
    onSuccess: (data) => {
      log.track('client_deactivated', { clientId: data.id });
    },
  });
}
