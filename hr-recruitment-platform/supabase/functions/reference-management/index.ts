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
            case 'CREATE': {
                const createResponse = await fetch(`${supabaseUrl}/rest/v1/applicant_references`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        ...data,
                        verification_status: 'pending',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(`Failed to create reference: ${errorText}`);
                }

                result = await createResponse.json();
                break;
            }

            case 'UPDATE': {
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/applicant_references?id=eq.${data.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        ...data,
                        updated_at: new Date().toISOString()
                    })
                });

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update reference: ${errorText}`);
                }

                result = await updateResponse.json();
                break;
            }

            case 'REQUEST_VERIFICATION': {
                const requestResponse = await fetch(`${supabaseUrl}/rest/v1/applicant_references?id=eq.${data.reference_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        verification_status: 'requested',
                        verification_request_sent_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!requestResponse.ok) {
                    const errorText = await requestResponse.text();
                    throw new Error(`Failed to request verification: ${errorText}`);
                }

                result = await requestResponse.json();
                break;
            }

            case 'SUBMIT_RESPONSE': {
                const responseSubmit = await fetch(`${supabaseUrl}/rest/v1/applicant_references?id=eq.${data.reference_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        verification_status: 'received',
                        verification_received_at: new Date().toISOString(),
                        ref_response: data.response,
                        ref_score: data.score,
                        ref_rating: data.rating,
                        would_rehire: data.would_rehire,
                        updated_at: new Date().toISOString()
                    })
                });

                if (!responseSubmit.ok) {
                    const errorText = await responseSubmit.text();
                    throw new Error(`Failed to submit response: ${errorText}`);
                }

                result = await responseSubmit.json();
                break;
            }

            case 'VERIFY': {
                const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/applicant_references?id=eq.${data.reference_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        verification_status: 'verified',
                        verified_by: userId,
                        verified_at: new Date().toISOString(),
                        verification_notes: data.notes || '',
                        updated_at: new Date().toISOString()
                    })
                });

                if (!verifyResponse.ok) {
                    const errorText = await verifyResponse.text();
                    throw new Error(`Failed to verify reference: ${errorText}`);
                }

                result = await verifyResponse.json();
                break;
            }

            case 'GET_BY_APPLICATION': {
                const getResponse = await fetch(`${supabaseUrl}/rest/v1/applicant_references?application_id=eq.${data.application_id}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!getResponse.ok) {
                    const errorText = await getResponse.text();
                    throw new Error(`Failed to fetch references: ${errorText}`);
                }

                result = await getResponse.json();
                break;
            }

            case 'DELETE': {
                const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/applicant_references?id=eq.${data.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!deleteResponse.ok) {
                    const errorText = await deleteResponse.text();
                    throw new Error(`Failed to delete reference: ${errorText}`);
                }

                result = { success: true, message: 'Reference deleted successfully' };
                break;
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Reference management error:', error);

        const errorResponse = {
            error: {
                code: 'REFERENCE_MANAGEMENT_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
