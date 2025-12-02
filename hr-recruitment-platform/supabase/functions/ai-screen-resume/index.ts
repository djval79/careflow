import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

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
        const googleApiKey = Deno.env.get('GOOGLE_API_KEY')!;
        
        const { application_id } = await req.json();

        // 1. Fetch application data
        const { data: application, error: appError } = await supabase
            .from('applications')
            .select('*, job_postings(*)')
            .eq('id', application_id)
            .single();

        if (appError || !application) {
            throw new Error('Application not found');
        }

        // 2. Fetch resume content from storage
        const { data: resumeFile, error: resumeError } = await supabase.storage
            .from('documents') // Assuming resumes are in a 'documents' bucket
            .download(application.cv_url); // Assuming cv_url is the path in the bucket

        if (resumeError || !resumeFile) {
            throw new Error('Resume not found in storage');
        }
        
        const resumeText = await new Response(resumeFile).text();

        // 3. Construct prompt for LLM
        const prompt = `
            Please act as an expert recruitment consultant.
            Analyze the following resume against the provided job description.
            Provide a suitability score from 1 to 100, and a brief summary of the candidate's strengths and weaknesses.

            **Job Description:**
            ${application.job_postings.description}

            **Candidate's Resume:**
            ${resumeText}

            **Output Format (JSON):**
            {
                "score": <score_number>,
                "summary": "<summary_text>"
            }
        `;

        // 4. Call Google Generative AI API (Gemini)
        const genAI = new GoogleGenerativeAI(googleApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        const aiResponse = JSON.parse(text);

        // 5. Update application with AI score and summary
        const { data: updatedApplication, error: updateError } = await supabase
            .from('applications')
            .update({
                ai_score: aiResponse.score,
                ai_summary: aiResponse.summary,
            })
            .eq('id', application_id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return new Response(JSON.stringify({ success: true, data: updatedApplication }), {
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
