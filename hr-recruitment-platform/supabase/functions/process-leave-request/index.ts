import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            throw new Error('Invalid token');
        }

        const { leaveRequest } = await req.json();

        // Fetch active approval rules
        const { data: rules, error: rulesError } = await supabase
            .from('leave_approval_rules')
            .select('*')
            .eq('is_active', true)
            .order('priority', { ascending: true }); // Order by priority

        if (rulesError) {
            throw new Error(`Failed to fetch leave approval rules: ${rulesError.message}`);
        }

        let finalStatus = 'pending'; // Default status
        let ruleApplied = null;

        // Evaluate rules
        for (const rule of rules) {
            const criteria = rule.criteria;
            let ruleMatches = true;

            // Simple criteria evaluation (can be expanded for more complex logic)
            if (criteria.max_days && leaveRequest.total_days > criteria.max_days) {
                ruleMatches = false;
            }
            if (criteria.leave_type && leaveRequest.leave_type !== criteria.leave_type) {
                ruleMatches = false;
            }
            // Additional criteria can be added here (e.g., employee_status, department)

            if (ruleMatches) {
                finalStatus = rule.action;
                ruleApplied = rule.rule_name;
                break; // Apply the first matching rule based on priority
            }
        }

        // Insert leave request with determined status
        const { data: insertedLeave, error: insertError } = await supabase
            .from('leave_requests')
            .insert({
                ...leaveRequest,
                status: finalStatus,
                requested_by: user.id,
                requested_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            throw new Error(`Failed to insert leave request: ${insertError.message}`);
        }

        // Log audit
        await supabase.from('audit_logs').insert({
            user_id: user.id,
            action: 'SUBMIT_LEAVE_REQUEST',
            entity_type: 'leave_requests',
            entity_id: insertedLeave.id,
            details: `Status: ${finalStatus}${ruleApplied ? `, Rule: ${ruleApplied}` : ''}`,
            timestamp: new Date().toISOString()
        });

        return new Response(
            JSON.stringify({ data: insertedLeave, status: finalStatus, ruleApplied }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({
                error: {
                    message: error.message
                }
            }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
