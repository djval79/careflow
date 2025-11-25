import { supabase } from '@/lib/supabase';
import { auditService } from './AuditService';

export interface RightToWorkCheck {
    id: string;
    tenant_id: string;
    user_id?: string;
    staff_name: string;
    document_type: 'passport_uk' | 'passport_non_uk' | 'biometric_residence_permit' | 'birth_certificate_ni_number' | 'share_code' | 'other';
    document_number?: string;
    nationality?: string;
    visa_type?: string;
    visa_expiry?: string;
    share_code?: string;
    check_date: string;
    next_check_date?: string;
    status: 'verified' | 'expired' | 'renewal_required';
    checked_by?: string;
    document_url?: string;
    notes?: string;
    created_at: string;
}

class RightToWorkService {
    async addCheck(data: Partial<RightToWorkCheck>): Promise<RightToWorkCheck | null> {
        const { data: result, error } = await supabase
            .from('right_to_work_checks')
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error('Error adding RTW check:', error);
            return null;
        }

        // Log to audit trail
        await auditService.log({
            action: 'CREATE',
            entity_type: 'rtw_check',
            entity_id: result.id,
            entity_name: `RTW Check for ${data.staff_name}`,
            changes: { after: result }
        });

        return result;
    }

    async getCheck(userId: string): Promise<RightToWorkCheck | null> {
        const { data, error } = await supabase
            .from('right_to_work_checks')
            .select('*')
            .eq('user_id', userId)
            .order('check_date', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // It's common to not have a check, so don't log as error unless it's a real failure
            if (error.code !== 'PGRST116') {
                console.error('Error fetching RTW check:', error);
            }
            return null;
        }

        return data;
    }

    async getExpiringChecks(daysAhead: number = 60): Promise<RightToWorkCheck[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const { data, error } = await supabase
            .from('right_to_work_checks')
            .select('*')
            .lte('next_check_date', futureDate.toISOString().split('T')[0])
            .in('status', ['verified', 'renewal_required'])
            .order('next_check_date', { ascending: true });

        if (error) {
            console.error('Error fetching expiring RTW checks:', error);
            return [];
        }

        return data || [];
    }

    async verifyShareCode(shareCode: string, dob: string): Promise<{ valid: boolean; details?: any }> {
        // In a real app, this would call the Home Office API.
        // For now, we simulate a check.
        console.log(`Verifying Share Code: ${shareCode} for DOB: ${dob}`);

        // Mock response
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    valid: true,
                    details: {
                        name: 'Mock User',
                        right_to_work: 'Yes',
                        expiry: '2026-01-01'
                    }
                });
            }, 1000);
        });
    }
}

export const rtwService = new RightToWorkService();
