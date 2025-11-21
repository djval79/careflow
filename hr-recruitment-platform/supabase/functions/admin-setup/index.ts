import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { user_id, email } = await req.json()

        if (!user_id) {
            throw new Error('User ID is required')
        }

        // Upsert the user profile with Admin role using Service Role Key
        const { data, error } = await supabaseClient
            .from('users_profiles')
            .upsert({
                user_id: user_id,
                email: email,
                full_name: 'System Administrator',
                role: 'Admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                permissions: JSON.stringify([
                    'create_jobs',
                    'manage_applications',
                    'schedule_interviews',
                    'manage_employees',
                    'create_announcements',
                    'manage_documents',
                    'generate_letters',
                    'access_reports',
                    'manage_settings',
                    'admin_access'
                ])
            })
            .select()
            .single()

        if (error) throw error

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
