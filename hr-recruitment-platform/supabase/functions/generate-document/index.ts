import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { template_id, employee_id, application_id } = await req.json();

        // 1. Fetch template
        const { data: template, error: templateError } = await supabase
            .from('document_templates')
            .select('*')
            .eq('id', template_id)
            .single();

        if (templateError || !template) {
            throw new Error('Template not found');
        }

        // 2. Fetch data (employee or application)
        let data: any;
        if (employee_id) {
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('id', employee_id)
                .single();
            if (empError) throw new Error('Employee not found');
            data = empData;
        } else if (application_id) {
            const { data: appData, error: appError } = await supabase
                .from('applications')
                .select('*, job_postings(*)')
                .eq('id', application_id)
                .single();
            if (appError) throw new Error('Application not found');
            data = appData;
        } else {
            throw new Error('Either employee_id or application_id is required');
        }

        // 3. Merge data with template
        let mergedContent = template.template_content;
        for (const key in data) {
            mergedContent = mergedContent.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
        }
        if (data.job_postings) {
            for (const key in data.job_postings) {
                mergedContent = mergedContent.replace(new RegExp(`{{job_${key}}}`, 'g'), data.job_postings[key]);
            }
        }

        // 4. Generate PDF (simple version)
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        page.drawText(mergedContent, {
            x: 50,
            y: page.getHeight() - 50,
            size: 12,
            color: rgb(0, 0, 0),
        });

        const pdfBytes = await pdfDoc.save();

        // 5. Upload to storage
        const fileName = `${template.template_type}_${data.id}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, pdfBytes, {
                contentType: 'application/pdf',
                upsert: true,
            });

        if (uploadError) {
            throw uploadError;
        }

        // 6. Create document record
        const { data: docRecord, error: docError } = await supabase
            .from('documents')
            .insert({
                document_name: fileName,
                document_type: template.template_type,
                employee_id: employee_id,
                application_id: application_id,
                file_path: uploadData.path,
                uploaded_by: 'system',
            })
            .select()
            .single();

        if (docError) {
            throw docError;
        }

        return new Response(JSON.stringify({ success: true, data: docRecord }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
