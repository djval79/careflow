import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

export interface AuditLog {
    id: string;
    tenant_id: string;
    user_id: string;
    user_email: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
    entity_type: string;
    entity_id: string;
    entity_name: string;
    changes?: {
        before?: any;
        after?: any;
        fields_changed?: string[];
    };
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

export interface AuditLogInput {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
    entity_type: string;
    entity_id: string;
    entity_name: string;
    changes?: {
        before?: any;
        after?: any;
        fields_changed?: string[];
    };
}

export interface AuditSearchFilters {
    entity_type?: string;
    entity_id?: string;
    action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
    user_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
}

// ============================================
// AUDIT SERVICE
// ============================================

class AuditService {
    /**
     * Log an action to the audit trail
     */
    async log(input: AuditLogInput): Promise<boolean> {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated user for audit log');
                return false;
            }

            console.log('AuditService: Attempting to log action', input.action, 'for user', user.id);

            // Get user's tenant_id
            const { data: profile } = await supabase
                .from('users_profiles')
                .select('tenant_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!profile) {
                // Ideally we should have a profile, but if not, we can't log the tenant_id
                // We'll log a warning but not fail the operation if it's critical, 
                // or just return false if audit is required.
                // For now, let's try to proceed without tenant_id if possible, or just return false without error spam
                console.warn('No profile found for user, cannot log audit with tenant_id. User ID:', user.id);
                return false;
            }

            console.log('AuditService: Found profile with tenant_id:', profile.tenant_id);

            // Create audit log entry
            const { error } = await supabase
                .from('audit_logs')
                .insert({
                    tenant_id: profile.tenant_id,
                    user_id: user.id,
                    user_email: user.email,
                    action: input.action,
                    entity_type: input.entity_type,
                    entity_id: input.entity_id,
                    entity_name: input.entity_name,
                    changes: input.changes || null,
                    // IP and user agent would be captured on server-side in production
                });

            if (error) {
                console.error('Error creating audit log:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in audit log:', error);
            return false;
        }
    }

    /**
     * Get audit trail for a specific entity
     */
    async getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching entity history:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get user activity
     */
    async getUserActivity(userId: string, limit: number = 50): Promise<AuditLog[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching user activity:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Search audit logs with filters
     */
    async search(filters: AuditSearchFilters): Promise<AuditLog[]> {
        let query = supabase
            .from('audit_logs')
            .select('*');

        console.log('AuditService: Searching logs with filters:', filters);

        if (filters.entity_type) {
            query = query.eq('entity_type', filters.entity_type);
        }

        if (filters.entity_id) {
            query = query.eq('entity_id', filters.entity_id);
        }

        if (filters.action) {
            query = query.eq('action', filters.action);
        }

        if (filters.user_id) {
            query = query.eq('user_id', filters.user_id);
        }

        if (filters.date_from) {
            query = query.gte('created_at', filters.date_from);
        }

        if (filters.date_to) {
            query = query.lte('created_at', filters.date_to);
        }

        query = query.order('created_at', { ascending: false });

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error searching audit logs:', error);
            return [];
        }

        console.log('AuditService: Search returned logs:', data?.length);
        return data || [];
    }

    /**
     * Get recent activity for dashboard
     */
    async getRecentActivity(limit: number = 20): Promise<AuditLog[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching recent activity:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get audit statistics
     */
    async getStatistics(dateFrom?: string, dateTo?: string): Promise<{
        total: number;
        by_action: Record<string, number>;
        by_entity_type: Record<string, number>;
    }> {
        let query = supabase
            .from('audit_logs')
            .select('action, entity_type');

        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }

        if (dateTo) {
            query = query.lte('created_at', dateTo);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching audit statistics:', error);
            return { total: 0, by_action: {}, by_entity_type: {} };
        }

        const by_action: Record<string, number> = {};
        const by_entity_type: Record<string, number> = {};

        data?.forEach(log => {
            by_action[log.action] = (by_action[log.action] || 0) + 1;
            by_entity_type[log.entity_type] = (by_entity_type[log.entity_type] || 0) + 1;
        });

        return {
            total: data?.length || 0,
            by_action,
            by_entity_type
        };
    }
}

export const auditService = new AuditService();
