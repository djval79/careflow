/**
 * CareFlow React Query Hooks
 * 
 * Centralized exports for all data hooks.
 * Import from '@/hooks' for convenient access.
 */

// Client hooks
export {
  useClients,
  useClientsByTenant,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useDeactivateClient,
} from './useClients';

// Staff hooks
export {
  useStaff,
  useStaffByTenant,
  useStaffMember,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  useAddTrainingRecord,
  useStaffCompliance,
} from './useStaff';

// Visit hooks
export {
  useVisits,
  useVisitsByDateRange,
  useUpcomingVisits,
  useUnassignedVisits,
  useVisit,
  useCreateVisit,
  useUpdateVisit,
  useDeleteVisit,
  useAssignStaffToVisit,
  useCompleteVisit,
  useCancelVisit,
} from './useVisits';

// Medication hooks
export {
  useMedicationsByClient,
  useMedications,
  useMedication,
  useMarRecords,
  useCreateMedication,
  useUpdateMedication,
  useDeactivateMedication,
  useSignMarRecord,
  useUpdateMedicationStock,
} from './useMedications';

// Incident hooks
export {
  useIncidents,
  useOpenIncidents,
  useIncident,
  useCreateIncident,
  useUpdateIncident,
  useCloseIncident,
  useEscalateIncident,
  useReportIncidentToCQC,
  useIncidentStats,
} from './useIncidents';

// Dashboard hooks
export {
  useDashboardStats,
  useRecentActivity,
  useComplianceOverview,
  useVisitTrends,
} from './useDashboard';

// Re-export types
export type { DashboardStats } from './useDashboard';

// Re-export query utilities
export { 
  queryKeys, 
  invalidateQueries, 
  STALE_TIMES,
  getQueryClient,
  clearQueryCache,
} from '@/lib/queryClient';
