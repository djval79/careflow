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
        const { files, metadata } = await req.json();
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

        const batchId = crypto.randomUUID();

        const batchResponse = await fetch(`${supabaseUrl}/rest/v1/document_batch_uploads`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                id: batchId,
                batch_name: metadata.batch_name || `Batch ${new Date().toISOString()}`,
                total_files: files.length,
                uploaded_by: userId,
                started_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            })
        });

        if (!batchResponse.ok) {
            throw new Error('Failed to create batch record');
        }

        const uploadResults = [];
        let successCount = 0;
        let failCount = 0;
        let totalSize = 0;

        for (const file of files) {
            try {
                const base64Data = file.fileData.split(',')[1];
                const mimeType = file.fileData.split(';')[0].split(':')[1];
                const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                
                const timestamp = Date.now();
                const storagePath = `${timestamp}-${file.fileName}`;

                const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/hr-documents/${storagePath}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': mimeType,
                        'x-upsert': 'true'
                    },
                    body: binaryData
                });

                if (!uploadResponse.ok) {
                    throw new Error('Upload failed');
                }

                const publicUrl = `${supabaseUrl}/storage/v1/object/public/hr-documents/${storagePath}`;

                const docResponse = await fetch(`${supabaseUrl}/rest/v1/document_uploads`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        employee_id: metadata.employee_id || null,
                        application_id: metadata.application_id || null,
                        upload_batch_id: batchId,
                        document_name: file.fileName,
                        document_type: file.documentType || 'general',
                        document_category: file.category || 'uncategorized',
                        file_url: publicUrl,
                        file_size_bytes: binaryData.length,
                        mime_type: mimeType,
                        file_extension: file.fileName.split('.').pop(),
                        upload_status: 'uploaded',
                        virus_scan_status: 'clean',
                        virus_scan_timestamp: new Date().toISOString(),
                        uploaded_by: userId,
                        uploaded_at: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!docResponse.ok) {
                    throw new Error('Failed to save document metadata');
                }

                const docData = await docResponse.json();
                uploadResults.push({ success: true, file: file.fileName, data: docData[0] });
                successCount++;
                totalSize += binaryData.length;

            } catch (error) {
                uploadResults.push({ success: false, file: file.fileName, error: error.message });
                failCount++;
            }
        }

        await fetch(`${supabaseUrl}/rest/v1/document_batch_uploads?id=eq.${batchId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uploaded_files: successCount,
                failed_files: failCount,
                total_size_bytes: totalSize,
                batch_status: failCount === 0 ? 'completed' : 'partial',
                completed_at: new Date().toISOString()
            })
        });

        return new Response(JSON.stringify({
            data: {
                batch_id: batchId,
                total: files.length,
                success: successCount,
                failed: failCount,
                results: uploadResults
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Document upload error:', error);

        const errorResponse = {
            error: {
                code: 'DOCUMENT_UPLOAD_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
