import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { data: userProfile } = await supabase
            .from('users_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        const { action, data } = await req.json();

        switch (action) {
            case 'CREATE_ANNOUNCEMENT': {
                if (!['Admin', 'HR Manager'].includes(userProfile?.role)) {
                    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const { title, content, category, priority, expiresAt, isPinned, visibilityLevel, targetAudience, attachmentUrl } = data;

                const { data: announcement, error: annError } = await supabase
                    .from('announcements')
                    .insert({
                        title,
                        content,
                        category: category || 'general',
                        priority: priority || 'normal',
                        created_by: user.id,
                        expires_at: expiresAt,
                        is_pinned: isPinned || false,
                        visibility_level: visibilityLevel || 'company-wide',
                        target_audience: targetAudience || [],
                        attachment_url: attachmentUrl
                    })
                    .select()
                    .single();

                if (annError) throw annError;

                return new Response(JSON.stringify({ success: true, announcement }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'GET_ANNOUNCEMENTS': {
                const { category, limit = 50, offset = 0 } = data || {};

                let query = supabase
                    .from('announcements')
                    .select('*, users_profiles!announcements_created_by_fkey(full_name, role)')
                    .eq('is_archived', false)
                    .order('is_pinned', { ascending: false })
                    .order('created_at', { ascending: false });

                if (category && category !== 'all') {
                    query = query.eq('category', category);
                }

                const { data: announcements, error: annError } = await query
                    .range(offset, offset + limit - 1);

                if (annError) throw annError;

                const announcementsWithViews = await Promise.all(announcements.map(async (ann) => {
                    const { data: view } = await supabase
                        .from('announcement_views')
                        .select('viewed_at, acknowledged')
                        .eq('announcement_id', ann.id)
                        .eq('user_id', user.id)
                        .single();

                    const { count: viewCount } = await supabase
                        .from('announcement_views')
                        .select('*', { count: 'exact', head: true })
                        .eq('announcement_id', ann.id);

                    return {
                        ...ann,
                        user_viewed: !!view,
                        user_acknowledged: view?.acknowledged || false,
                        total_views: viewCount || 0
                    };
                }));

                return new Response(JSON.stringify({ success: true, announcements: announcementsWithViews }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'MARK_VIEWED': {
                const { announcementId } = data;

                const { error: viewError } = await supabase
                    .from('announcement_views')
                    .upsert({
                        announcement_id: announcementId,
                        user_id: user.id,
                        viewed_at: new Date().toISOString()
                    }, {
                        onConflict: 'announcement_id,user_id'
                    });

                if (viewError) throw viewError;

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'ACKNOWLEDGE_ANNOUNCEMENT': {
                const { announcementId } = data;

                const { error: ackError } = await supabase
                    .from('announcement_views')
                    .upsert({
                        announcement_id: announcementId,
                        user_id: user.id,
                        viewed_at: new Date().toISOString(),
                        acknowledged: true,
                        acknowledged_at: new Date().toISOString()
                    }, {
                        onConflict: 'announcement_id,user_id'
                    });

                if (ackError) throw ackError;

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'UPDATE_ANNOUNCEMENT': {
                if (!['Admin', 'HR Manager'].includes(userProfile?.role)) {
                    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const { announcementId, title, content, category, priority, expiresAt, isPinned } = data;

                const { error: updateError } = await supabase
                    .from('announcements')
                    .update({
                        title,
                        content,
                        category,
                        priority,
                        expires_at: expiresAt,
                        is_pinned: isPinned,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', announcementId);

                if (updateError) throw updateError;

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'ARCHIVE_ANNOUNCEMENT': {
                if (!['Admin', 'HR Manager'].includes(userProfile?.role)) {
                    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const { announcementId } = data;

                const { error: archiveError } = await supabase
                    .from('announcements')
                    .update({ is_archived: true })
                    .eq('id', announcementId);

                if (archiveError) throw archiveError;

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'GET_UNREAD_COUNT': {
                const { data: userViews } = await supabase
                    .from('announcement_views')
                    .select('announcement_id')
                    .eq('user_id', user.id);

                const viewedIds = userViews?.map(v => v.announcement_id) || [];

                const { count } = await supabase
                    .from('announcements')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_archived', false)
                    .not('id', 'in', `(${viewedIds.join(',') || 'null'})`);

                return new Response(JSON.stringify({ success: true, unread_count: count || 0 }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                return new Response(JSON.stringify({ error: 'Invalid action' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
