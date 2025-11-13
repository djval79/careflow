Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { action, data } = await req.json();
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        let result;

        switch (action) {
            case 'CREATE_VISA_RECORD':
                const createVisaResponse = await fetch(`${supabaseUrl}/rest/v1/visa_records`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        ...data,
                        created_by: userId,
                        current_status: 'active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!createVisaResponse.ok) {
                    const errorText = await createVisaResponse.text();
                    throw new Error(`Failed to create visa record: ${errorText}`);
                }

                result = await createVisaResponse.json();
                break;

            case 'CREATE_RTW_CHECK':
                const createRTWResponse = await fetch(`${supabaseUrl}/rest/v1/right_to_work_checks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        ...data,
                        checked_by: userId,
                        created_at: new Date().toISOString()
                    })
                });

                if (!createRTWResponse.ok) {
                    const errorText = await createRTWResponse.text();
                    throw new Error(`Failed to create RTW check: ${errorText}`);
                }

                result = await createRTWResponse.json();
                break;

            case 'CREATE_ALERT':
                const createAlertResponse = await fetch(`${supabaseUrl}/rest/v1/compliance_alerts`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        ...data,
                        status: 'active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!createAlertResponse.ok) {
                    const errorText = await createAlertResponse.text();
                    throw new Error(`Failed to create alert: ${errorText}`);
                }

                result = await createAlertResponse.json();
                break;

            case 'GENERATE_AUDIT_PACK':
                const createAuditResponse = await fetch(`${supabaseUrl}/rest/v1/audit_packs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        pack_name: data.pack_name,
                        pack_type: data.pack_type,
                        employee_ids: JSON.stringify(data.employee_ids || []),
                        date_range_start: data.date_range_start,
                        date_range_end: data.date_range_end,
                        generated_by: userId,
                        pack_status: 'draft',
                        includes_visa_records: true,
                        includes_rtw_checks: true,
                        includes_dbs_certificates: true,
                        includes_compliance_history: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!createAuditResponse.ok) {
                    const errorText = await createAuditResponse.text();
                    throw new Error(`Failed to generate audit pack: ${errorText}`);
                }

                result = await createAuditResponse.json();
                break;

            case 'GET_ALERTS':
                const alertsResponse = await fetch(`${supabaseUrl}/rest/v1/compliance_alerts?status=eq.active&order=alert_priority.asc,due_date.asc`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!alertsResponse.ok) {
                    const errorText = await alertsResponse.text();
                    throw new Error(`Failed to fetch alerts: ${errorText}`);
                }

                result = await alertsResponse.json();
                break;

            case 'ACKNOWLEDGE_ALERT':
                const acknowledgeResponse = await fetch(`${supabaseUrl}/rest/v1/compliance_alerts?id=eq.${data.alert_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        status: 'acknowledged',
                        acknowledged_by: userId,
                        acknowledged_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!acknowledgeResponse.ok) {
                    const errorText = await acknowledgeResponse.text();
                    throw new Error(`Failed to acknowledge alert: ${errorText}`);
                }

                result = await acknowledgeResponse.json();
                break;

            case 'RESOLVE_ALERT':
                const resolveResponse = await fetch(`${supabaseUrl}/rest/v1/compliance_alerts?id=eq.${data.alert_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        status: 'resolved',
                        resolved_by: userId,
                        resolved_at: new Date().toISOString(),
                        resolution_notes: data.resolution_notes || '',
                        updated_at: new Date().toISOString()
                    })
                });

                if (!resolveResponse.ok) {
                    const errorText = await resolveResponse.text();
                    throw new Error(`Failed to resolve alert: ${errorText}`);
                }

                result = await resolveResponse.json();
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Compliance monitoring error:', error);

        const errorResponse = {
            error: {
                code: 'COMPLIANCE_MONITORING_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
