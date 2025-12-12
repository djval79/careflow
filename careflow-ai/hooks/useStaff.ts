/**
 * Staff/Employee Data Hooks using React Query
 * 
 * Provides type-safe data fetching and mutations for staff entities.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries, STALE_TIMES } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';
import type { StaffMember, ComplianceRecord } from '@/types';

/**
 * Transform database row to StaffMember type
 */
function transformStaff(row: Record<string, unknown>): StaffMember {
  const name = (row.name as string) || 
    `${(row.first_name as string) || ''} ${(row.last_name as string) || ''}`.trim() || 
    'Unknown';
  
  const trainingRecords = (row.training_records as Record<string, unknown>[] | undefined) || [];
  
  return {
    id: row.id as string,
    userId: row.user_id as string | undefined,
    name,
    role: (row.role as string) || 'Staff',
    status: (row.status as string) || 'Active',
    avatar: name.charAt(0).toUpperCase(),
    phone: (row.phone as string) || 'N/A',
    email: (row.email as string) || 'N/A',
    joinedDate: row.created_at 
      ? new Date(row.created_at as string).toLocaleDateString() 
      : 'N/A',
    availability: (row.availability as string) || 'Flexible',
    skills: (row.skills as string[]) || ['Care Certificate', 'First Aid'],
    dbsStatus: (row.dbs_status as string) || 'Pending',
    rtwStatus: (row.right_to_work_status as string) || 'Pending',
    compliance: trainingRecords.map((t): ComplianceRecord => ({
      id: t.id as string,
      name: t.training_name as string,
      expiryDate: t.expiry_date as string,
      status: t.status as ComplianceRecord['status'],
    })),
    tenant_id: row.tenant_id as string | undefined,
  };
}

/**
 * Fetch all staff members
 */
export function useStaff(filters?: { status?: string; role?: string }) {
  return useQuery({
    queryKey: queryKeys.staff.list(filters),
    queryFn: async () => {
      try {
        let query = supabase
          .from('employees')
          .select('*, training_records(*)')
          .order('name');

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.role) {
          query = query.eq('role', filters.role);
        }

        const { data, error } = await query;
        if (error) throw handleError(error, 'Failed to fetch staff');

        return (data || []).map(transformStaff);
      } catch (error) {
        throw handleError(error, 'useStaff query failed');
      }
    },
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Fetch staff by tenant ID
 */
export function useStaffByTenant(tenantId: string | null) {
  return useQuery({
    queryKey: queryKeys.staff.list({ tenantId }),
    queryFn: async () => {
      if (!tenantId) throw createError.validation('Tenant ID is required');

      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*, training_records(*)')
          .eq('tenant_id', tenantId)
          .order('name');

        if (error) throw handleError(error, 'Failed to fetch tenant staff');
        return (data || []).map(transformStaff);
      } catch (error) {
        throw handleError(error, 'useStaffByTenant query failed');
      }
    },
    enabled: !!tenantId,
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Fetch single staff member by ID
 */
export function useStaffMember(id: string | null) {
  return useQuery({
    queryKey: queryKeys.staff.detail(id || ''),
    queryFn: async () => {
      if (!id) throw createError.validation('Staff ID is required');

      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*, training_records(*)')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Staff member', { id });
          }
          throw handleError(error, 'Failed to fetch staff member');
        }

        return transformStaff(data);
      } catch (error) {
        throw handleError(error, 'useStaffMember query failed');
      }
    },
    enabled: !!id,
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Create a new staff member
 */
export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffData: Partial<StaffMember>) => {
      try {
        const dbData = {
          name: staffData.name,
          email: staffData.email,
          phone: staffData.phone,
          role: staffData.role || 'Carer',
          status: staffData.status || 'Active',
          availability: staffData.availability,
          skills: staffData.skills,
          dbs_status: staffData.dbsStatus,
          right_to_work_status: staffData.rtwStatus,
          tenant_id: staffData.tenant_id,
        };

        const { data, error } = await supabase
          .from('employees')
          .insert(dbData)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to create staff member');
        log.info('Staff member created successfully', { id: data.id });
        return transformStaff(data);
      } catch (error) {
        throw handleError(error, 'useCreateStaff mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.staff.all);
      queryClient.setQueryData(queryKeys.staff.detail(data.id), data);
      log.track('staff_created', { staffId: data.id });
    },
  });
}

/**
 * Update a staff member
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: staffData }: { id: string; data: Partial<StaffMember> }) => {
      try {
        const dbData: Record<string, unknown> = {};
        
        if (staffData.name !== undefined) dbData.name = staffData.name;
        if (staffData.email !== undefined) dbData.email = staffData.email;
        if (staffData.phone !== undefined) dbData.phone = staffData.phone;
        if (staffData.role !== undefined) dbData.role = staffData.role;
        if (staffData.status !== undefined) dbData.status = staffData.status;
        if (staffData.availability !== undefined) dbData.availability = staffData.availability;
        if (staffData.skills !== undefined) dbData.skills = staffData.skills;
        if (staffData.dbsStatus !== undefined) dbData.dbs_status = staffData.dbsStatus;
        if (staffData.rtwStatus !== undefined) dbData.right_to_work_status = staffData.rtwStatus;

        const { data, error } = await supabase
          .from('employees')
          .update(dbData)
          .eq('id', id)
          .select('*, training_records(*)')
          .single();

        if (error) throw handleError(error, 'Failed to update staff member');
        return transformStaff(data);
      } catch (error) {
        throw handleError(error, 'useUpdateStaff mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.staff.detail(data.id), data);
      invalidateQueries(queryKeys.staff.all);
      log.track('staff_updated', { staffId: data.id });
    },
  });
}

/**
 * Delete a staff member
 */
export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', id);

        if (error) throw handleError(error, 'Failed to delete staff member');
        return id;
      } catch (error) {
        throw handleError(error, 'useDeleteStaff mutation failed');
      }
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.staff.detail(id) });
      invalidateQueries(queryKeys.staff.all);
      log.track('staff_deleted', { staffId: id });
    },
  });
}

/**
 * Add a training record for a staff member
 */
export function useAddTrainingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: {
      userId: string;
      trainingName: string;
      expiryDate: string;
      status: string;
      certificateUrl?: string;
    }) => {
      try {
        // First get the employee ID from the user ID
        const { data: employee, error: empError } = await supabase
          .from('employees')
          .select('id, tenant_id')
          .eq('user_id', record.userId)
          .single();

        if (empError) throw handleError(empError, 'Failed to find employee');

        const { data, error } = await supabase
          .from('training_records')
          .insert({
            tenant_id: employee.tenant_id,
            employee_id: employee.id,
            training_name: record.trainingName,
            expiry_date: record.expiryDate,
            status: record.status,
            certificate_url: record.certificateUrl,
            completion_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to add training record');
        log.info('Training record added', { employeeId: employee.id });
        return data;
      } catch (error) {
        throw handleError(error, 'useAddTrainingRecord mutation failed');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate staff queries to refresh training records
      invalidateQueries(queryKeys.staff.all);
      log.track('training_record_added', { userId: variables.userId });
    },
  });
}

/**
 * Fetch compliance summary for a staff member
 */
export function useStaffCompliance(staffId: string | null) {
  return useQuery({
    queryKey: queryKeys.staff.compliance(staffId || ''),
    queryFn: async () => {
      if (!staffId) throw createError.validation('Staff ID is required');

      try {
        const { data, error } = await supabase
          .from('training_records')
          .select('*')
          .eq('employee_id', staffId)
          .order('expiry_date', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch compliance records');

        return (data || []).map((record): ComplianceRecord => ({
          id: record.id,
          name: record.training_name,
          expiryDate: record.expiry_date,
          status: record.status,
        }));
      } catch (error) {
        throw handleError(error, 'useStaffCompliance query failed');
      }
    },
    enabled: !!staffId,
    staleTime: STALE_TIMES.frequent,
  });
}
