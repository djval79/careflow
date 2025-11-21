import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const dbUrl = Deno.env.get('SUPABASE_DB_URL');
        if (!dbUrl) {
            return new Response(JSON.stringify({ error: 'SUPABASE_DB_URL is not set' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const client = new Client(dbUrl);
        try {
            await client.connect();
            await client.queryArray(`
        CREATE TABLE IF NOT EXISTS reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID,
          reviewer_id UUID,
          review_period_start DATE,
          review_period_end DATE,
          status TEXT,
          overall_rating NUMERIC,
          department TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS goals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID,
          title TEXT,
          description TEXT,
          status TEXT,
          progress INTEGER,
          due_date DATE,
          priority TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add foreign key constraints if employees table exists, otherwise skip or handle gracefully
        -- For now, we keep it simple to avoid errors if employees table is missing or has different structure
      `);
        } catch (dbError) {
            return new Response(JSON.stringify({ error: 'Database error: ' + dbError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        } finally {
            await client.end();
        }

        return new Response(JSON.stringify({ success: true, message: 'Schema created successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: 'General error: ' + error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
