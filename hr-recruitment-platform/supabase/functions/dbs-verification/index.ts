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
            case 'CREATE_CERTIFICATE': {
                const createResponse = await fetch(`${supabaseUrl}/rest/v1/dbs_certificates`, {
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
                        status: 'pending',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(`Failed to create DBS certificate: ${errorText}`);
                }

                result = await createResponse.json();
                break;
            }

            case 'UPDATE_CERTIFICATE': {
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/dbs_certificates?id=eq.${data.id}`, {
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
                    throw new Error(`Failed to update DBS certificate: ${errorText}`);
                }

                result = await updateResponse.json();
                break;
            }

            case 'VERIFY_ONLINE': {
                const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/dbs_certificates?id=eq.${data.certificate_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        verification_method: 'online_check',
                        online_check_code: data.online_code,
                        document_verified: true,
                        verification_date: new Date().toISOString().split('T')[0],
                        verified_by: userId,
                        status: 'approved',
                        updated_at: new Date().toISOString()
                    })
                });

                if (!verifyResponse.ok) {
                    const errorText = await verifyResponse.text();
                    throw new Error(`Failed to verify DBS certificate: ${errorText}`);
                }

                const verifiedCert = await verifyResponse.json();

                await fetch(`${supabaseUrl}/rest/v1/dbs_verification_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dbs_certificate_id: data.certificate_id,
                        verification_action: 'online_verification',
                        verification_method: 'online_check',
                        verification_result: 'success',
                        verification_details: `Verified with code: ${data.online_code}`,
                        verified_by: userId,
                        verified_at: new Date().toISOString()
                    })
                });

                result = verifiedCert;
                break;
            }

            case 'UPLOAD_DOCUMENT': {
                if (!data.fileData || !data.fileName) {
                    throw new Error('File data and filename are required');
                }

                const base64Data = data.fileData.split(',')[1];
                const mimeType = data.fileData.split(';')[0].split(':')[1];
                const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                const timestamp = Date.now();
                const storagePath = `${timestamp}-${data.fileName}`;

                const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/dbs-certificates/${storagePath}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': mimeType,
                        'x-upsert': 'true'
                    },
                    body: binaryData
                });

                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text();
                    throw new Error(`Upload failed: ${errorText}`);
                }

                const publicUrl = `${supabaseUrl}/storage/v1/object/public/dbs-certificates/${storagePath}`;

                const docUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/dbs_certificates?id=eq.${data.certificate_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        document_url: publicUrl,
                        verification_method: 'document_upload',
                        status: 'submitted',
                        updated_at: new Date().toISOString()
                    })
                });

                if (!docUpdateResponse.ok) {
                    const errorText = await docUpdateResponse.text();
                    throw new Error(`Failed to update certificate: ${errorText}`);
                }

                result = await docUpdateResponse.json();
                result[0].document_url = publicUrl;
                break;
            }

            case 'GET_BY_EMPLOYEE': {
                const getResponse = await fetch(`${supabaseUrl}/rest/v1/dbs_certificates?employee_id=eq.${data.employee_id}&order=created_at.desc`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!getResponse.ok) {
                    const errorText = await getResponse.text();
                    throw new Error(`Failed to fetch DBS certificates: ${errorText}`);
                }

                result = await getResponse.json();
                break;
            }

            case 'CHECK_EXPIRY': {
                const expiryResponse = await fetch(`${supabaseUrl}/rest/v1/dbs_certificates?expiry_date=lte.${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!expiryResponse.ok) {
                    const errorText = await expiryResponse.text();
                    throw new Error(`Failed to check DBS expiry: ${errorText}`);
                }

                result = await expiryResponse.json();
                break;
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('DBS verification error:', error);

        const errorResponse = {
            error: {
                code: 'DBS_VERIFICATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
