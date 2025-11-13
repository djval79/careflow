import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get admin user
        const { data: adminUser, error: adminError } = await supabase
            .from('users_profiles')
            .select('user_id')
            .eq('email', 'admin@hrsuite.com')
            .single();

        if (adminError || !adminUser) {
            return new Response(JSON.stringify({ error: 'Admin user not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Create sample announcements
        const sampleAnnouncements = [
            {
                title: 'Welcome to the Notice Board',
                content: 'This is the new company notice board where all important announcements will be posted. Please check regularly for updates.',
                category: 'general',
                priority: 'normal',
                created_by: adminUser.user_id,
                is_pinned: true,
                visibility_level: 'company-wide'
            },
            {
                title: 'Updated HR Policy',
                content: 'Our HR policy has been updated to include new remote work guidelines. Please review the changes in the documents section.',
                category: 'policy',
                priority: 'high',
                created_by: adminUser.user_id,
                visibility_level: 'company-wide'
            },
            {
                title: 'New Job Opening: Senior Developer',
                content: 'We are hiring a Senior Full-Stack Developer. If you know anyone qualified, please refer them to the recruitment team.',
                category: 'job-related',
                priority: 'normal',
                created_by: adminUser.user_id,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                visibility_level: 'company-wide'
            },
            {
                title: 'Visa Renewal Deadline Approaching',
                content: 'All employees with work visas expiring within the next 90 days must submit renewal applications immediately.',
                category: 'compliance',
                priority: 'urgent',
                created_by: adminUser.user_id,
                is_pinned: true,
                visibility_level: 'company-wide'
            },
            {
                title: 'Team Building Event - Next Friday',
                content: 'Join us for a team building event next Friday at 2 PM. Location will be announced soon. RSVP required.',
                category: 'general',
                priority: 'normal',
                created_by: adminUser.user_id,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                visibility_level: 'company-wide'
            }
        ];

        const { data: announcements, error: annError } = await supabase
            .from('announcements')
            .insert(sampleAnnouncements)
            .select();

        if (annError) {
            console.error('Announcement creation error:', annError);
            throw annError;
        }

        // Get all users for conversations
        const { data: allUsers, error: usersError } = await supabase
            .from('users_profiles')
            .select('user_id, full_name, email')
            .limit(5);

        if (usersError || !allUsers || allUsers.length < 2) {
            console.error('Not enough users for conversations');
        } else {
            // Create sample conversation
            const { data: conversation, error: convError } = await supabase
                .from('conversations')
                .insert({
                    title: 'HR Team Discussion',
                    created_by: adminUser.user_id,
                    conversation_type: 'group'
                })
                .select()
                .single();

            if (convError) {
                console.error('Conversation creation error:', convError);
            } else {
                // Add participants
                const participants = allUsers.slice(0, 3).map(user => ({
                    conversation_id: conversation.id,
                    user_id: user.user_id,
                    role_in_conversation: user.user_id === adminUser.user_id ? 'owner' : 'member'
                }));

                const { error: partError } = await supabase
                    .from('message_participants')
                    .insert(participants);

                if (partError) {
                    console.error('Participants creation error:', partError);
                } else {
                    // Add sample messages
                    const messages = [
                        {
                            conversation_id: conversation.id,
                            sender_id: adminUser.user_id,
                            content: 'Welcome everyone to the HR team discussion group!'
                        },
                        {
                            conversation_id: conversation.id,
                            sender_id: allUsers[1].user_id,
                            content: 'Thanks for creating this group. Looking forward to collaborating here.'
                        }
                    ];

                    const { error: msgError } = await supabase
                        .from('messages')
                        .insert(messages);

                    if (msgError) {
                        console.error('Messages creation error:', msgError);
                    }
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Sample data created successfully',
            announcements_created: announcements?.length || 0,
            conversations_created: 1
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
