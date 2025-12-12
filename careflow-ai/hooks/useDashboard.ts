/**
 * Dashboard Data Hooks using React Query
 * 
 * Provides aggregated data for dashboard displays.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, STALE_TIMES } from '@/lib/queryClient';
import { handleError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';

export interface DashboardStats {
  activeClients: number;
  totalStaff: number;
  todayVisits: number;
  completedVisits: number;
  openIncidents: number;
  pendingTasks: number;
  upcomingExpiries: number;
  overdueInvoices: number;
}

/**
 * Fetch dashboard statistics
 */
export function useDashboardStats(tenantId?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Run all queries in parallel
        const [
          clientsResult,
          staffResult,
          todayVisitsResult,
          completedVisitsResult,
          incidentsResult,
        ] = await Promise.all([
          // Active clients count
          supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Active'),
          
          // Total staff count
          supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Active'),
          
          // Today's visits count
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('date', today),
          
          // Completed visits today
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('date', today)
            .eq('status', 'Completed'),
          
          // Open incidents
          supabase
            .from('incidents')
            .select('*', { count: 'exact', head: true })
            .in('status', ['Open', 'Investigating']),
        ]);

        const stats: DashboardStats = {
          activeClients: clientsResult.count || 0,
          totalStaff: staffResult.count || 0,
          todayVisits: todayVisitsResult.count || 0,
          completedVisits: completedVisitsResult.count || 0,
          openIncidents: incidentsResult.count || 0,
          pendingTasks: 0, // Placeholder - implement when tasks table exists
          upcomingExpiries: 0, // Placeholder - implement with training records
          overdueInvoices: 0, // Placeholder - implement with invoices table
        };

        log.debug('Dashboard stats fetched', stats);
        return stats;
      } catch (error) {
        throw handleError(error, 'useDashboardStats query failed');
      }
    },
    staleTime: STALE_TIMES.realtime,
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Fetch recent activity for dashboard
 */
export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivity(),
    queryFn: async () => {
      try {
        // Fetch recent visits
        const { data: recentVisits, error: visitsError } = await supabase
          .from('visits')
          .select('id, date, status, clients(name), employees(name)')
          .order('updated_at', { ascending: false })
          .limit(limit);

        if (visitsError) {
          log.warn('Failed to fetch recent visits', { error: visitsError.message });
        }

        // Fetch recent incidents
        const { data: recentIncidents, error: incidentsError } = await supabase
          .from('incidents')
          .select('id, date, type, severity, status, clients(name)')
          .order('created_at', { ascending: false })
          .limit(5);

        if (incidentsError) {
          log.warn('Failed to fetch recent incidents', { error: incidentsError.message });
        }

        return {
          visits: recentVisits || [],
          incidents: recentIncidents || [],
        };
      } catch (error) {
        throw handleError(error, 'useRecentActivity query failed');
      }
    },
    staleTime: STALE_TIMES.frequent,
  });
}

/**
 * Fetch compliance overview for dashboard
 */
export function useComplianceOverview() {
  return useQuery({
    queryKey: [...queryKeys.training.all, 'overview'],
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        const [expiredResult, expiringSoonResult, validResult] = await Promise.all([
          // Expired certifications
          supabase
            .from('training_records')
            .select('*', { count: 'exact', head: true })
            .lt('expiry_date', today)
            .eq('status', 'Valid'),
          
          // Expiring in 30 days
          supabase
            .from('training_records')
            .select('*', { count: 'exact', head: true })
            .gte('expiry_date', today)
            .lte('expiry_date', thirtyDaysFromNow),
          
          // Valid certifications
          supabase
            .from('training_records')
            .select('*', { count: 'exact', head: true })
            .gt('expiry_date', thirtyDaysFromNow),
        ]);

        return {
          expired: expiredResult.count || 0,
          expiringSoon: expiringSoonResult.count || 0,
          valid: validResult.count || 0,
          complianceRate: validResult.count 
            ? Math.round((validResult.count / ((validResult.count || 0) + (expiredResult.count || 0) + (expiringSoonResult.count || 0))) * 100)
            : 100,
        };
      } catch (error) {
        throw handleError(error, 'useComplianceOverview query failed');
      }
    },
    staleTime: STALE_TIMES.standard,
  });
}

/**
 * Fetch visit trends for charts
 */
export function useVisitTrends(days = 7) {
  return useQuery({
    queryKey: [...queryKeys.visits.all, 'trends', days],
    queryFn: async () => {
      try {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        const { data, error } = await supabase
          .from('visits')
          .select('date, status')
          .gte('date', startDate)
          .order('date', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch visit trends');

        // Group by date
        const grouped = (data || []).reduce((acc, visit) => {
          const date = visit.date;
          if (!acc[date]) {
            acc[date] = { date, total: 0, completed: 0, cancelled: 0 };
          }
          acc[date].total++;
          if (visit.status === 'Completed') acc[date].completed++;
          if (visit.status === 'Cancelled') acc[date].cancelled++;
          return acc;
        }, {} as Record<string, { date: string; total: number; completed: number; cancelled: number }>);

        return Object.values(grouped);
      } catch (error) {
        throw handleError(error, 'useVisitTrends query failed');
      }
    },
    staleTime: STALE_TIMES.frequent,
  });
}
