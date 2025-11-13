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
            case 'ENROLL':
                const enrollResponse = await fetch(`${supabaseUrl}/rest/v1/biometric_enrollment`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        employee_id: data.employee_id,
                        fingerprint_template_encrypted: data.fingerprint_template || null,
                        face_template_encrypted: data.face_template || null,
                        biometric_type: data.biometric_type,
                        enrollment_date: new Date().toISOString().split('T')[0],
                        enrollment_status: 'active',
                        quality_score: data.quality_score || 85,
                        device_id: data.device_id || 'WEB_001',
                        enrolled_by: userId,
                        template_version: '1.0',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!enrollResponse.ok) {
                    const errorText = await enrollResponse.text();
                    throw new Error(`Failed to enroll biometric: ${errorText}`);
                }

                result = await enrollResponse.json();
                break;

            case 'LOG_ATTENDANCE':
                const confidenceScore = 85 + Math.random() * 10;
                const verificationStatus = confidenceScore >= 90 ? 'success' : 'low_confidence';

                const logResponse = await fetch(`${supabaseUrl}/rest/v1/biometric_attendance_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        employee_id: data.employee_id,
                        log_type: data.log_type,
                        log_timestamp: new Date().toISOString(),
                        biometric_type: data.biometric_type || 'fingerprint',
                        verification_status: verificationStatus,
                        confidence_score: confidenceScore.toFixed(2),
                        device_id: data.device_id || 'WEB_001',
                        location: data.location || 'Main Office',
                        ip_address: data.ip_address || '0.0.0.0',
                        anomaly_detected: false,
                        created_at: new Date().toISOString()
                    })
                });

                if (!logResponse.ok) {
                    const errorText = await logResponse.text();
                    throw new Error(`Failed to log attendance: ${errorText}`);
                }

                result = await logResponse.json();
                break;

            case 'LOG_VERIFICATION':
                const verifyLogResponse = await fetch(`${supabaseUrl}/rest/v1/biometric_verification_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        employee_id: data.employee_id,
                        verification_type: data.verification_type,
                        verification_timestamp: new Date().toISOString(),
                        biometric_method: data.biometric_method,
                        verification_result: data.verification_result,
                        confidence_score: data.confidence_score,
                        attempt_count: data.attempt_count || 1,
                        device_id: data.device_id,
                        action_performed: data.action_performed,
                        ip_address: data.ip_address,
                        user_agent: data.user_agent,
                        created_at: new Date().toISOString()
                    })
                });

                if (!verifyLogResponse.ok) {
                    const errorText = await verifyLogResponse.text();
                    throw new Error(`Failed to log verification: ${errorText}`);
                }

                result = await verifyLogResponse.json();
                break;

            case 'LOG_SECURITY_EVENT':
                const securityEventResponse = await fetch(`${supabaseUrl}/rest/v1/biometric_security_events`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        event_type: data.event_type,
                        employee_id: data.employee_id,
                        event_timestamp: new Date().toISOString(),
                        severity_level: data.severity_level,
                        event_description: data.event_description,
                        device_id: data.device_id,
                        ip_address: data.ip_address,
                        action_taken: data.action_taken || '',
                        investigation_status: 'pending',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!securityEventResponse.ok) {
                    const errorText = await securityEventResponse.text();
                    throw new Error(`Failed to log security event: ${errorText}`);
                }

                result = await securityEventResponse.json();
                break;

            case 'GET_ATTENDANCE':
                const attendanceResponse = await fetch(`${supabaseUrl}/rest/v1/biometric_attendance_logs?employee_id=eq.${data.employee_id}&order=log_timestamp.desc&limit=100`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!attendanceResponse.ok) {
                    const errorText = await attendanceResponse.text();
                    throw new Error(`Failed to fetch attendance: ${errorText}`);
                }

                result = await attendanceResponse.json();
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Biometric processing error:', error);

        const errorResponse = {
            error: {
                code: 'BIOMETRIC_PROCESSING_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
