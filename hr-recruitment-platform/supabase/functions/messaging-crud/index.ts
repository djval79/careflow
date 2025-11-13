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

        const { action, data } = await req.json();

        switch (action) {
            case 'CREATE_CONVERSATION': {
                const { title, participantIds, conversationType } = data;

                const { data: conversation, error: convError } = await supabase
                    .from('conversations')
                    .insert({
                        title,
                        created_by: user.id,
                        conversation_type: conversationType || 'direct'
                    })
                    .select()
                    .single();

                if (convError) throw convError;

                const participants = [user.id, ...participantIds].map(userId => ({
                    conversation_id: conversation.id,
                    user_id: userId,
                    role_in_conversation: userId === user.id ? 'owner' : 'member'
                }));

                const { error: partError } = await supabase
                    .from('message_participants')
                    .insert(participants);

                if (partError) throw partError;

                return new Response(JSON.stringify({ success: true, conversation }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'SEND_MESSAGE': {
                const { conversationId, content, attachmentUrl } = data;

                const { data: message, error: msgError } = await supabase
                    .from('messages')
                    .insert({
                        conversation_id: conversationId,
                        sender_id: user.id,
                        content,
                        attachment_url: attachmentUrl
                    })
                    .select()
                    .single();

                if (msgError) throw msgError;

                await supabase
                    .from('conversations')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', conversationId);

                return new Response(JSON.stringify({ success: true, message }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'GET_CONVERSATIONS': {
                const { data: conversations, error: convError } = await supabase
                    .from('conversations')
                    .select(`
                        *,
                        message_participants!inner(user_id, last_read_at),
                        messages(content, sent_at)
                    `)
                    .eq('message_participants.user_id', user.id)
                    .eq('message_participants.is_active', true)
                    .eq('is_archived', false)
                    .order('updated_at', { ascending: false });

                if (convError) throw convError;

                const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
                    const participant = conv.message_participants.find(p => p.user_id === user.id);
                    const lastReadAt = participant?.last_read_at || new Date(0).toISOString();

                    const { count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', conv.id)
                        .gt('sent_at', lastReadAt)
                        .neq('sender_id', user.id);

                    return {
                        ...conv,
                        unread_count: count || 0,
                        last_message: conv.messages[0]
                    };
                }));

                return new Response(JSON.stringify({ success: true, conversations: conversationsWithUnread }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'GET_MESSAGES': {
                const { conversationId, limit = 50, offset = 0 } = data;

                const { data: messages, error: msgError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .eq('is_deleted', false)
                    .order('sent_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (msgError) throw msgError;

                return new Response(JSON.stringify({ success: true, messages: messages.reverse() }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'MARK_READ': {
                const { conversationId } = data;

                const { error: updateError } = await supabase
                    .from('message_participants')
                    .update({ last_read_at: new Date().toISOString() })
                    .eq('conversation_id', conversationId)
                    .eq('user_id', user.id);

                if (updateError) throw updateError;

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'ARCHIVE_CONVERSATION': {
                const { conversationId, archive } = data;

                const { error: archiveError } = await supabase
                    .from('conversations')
                    .update({ is_archived: archive })
                    .eq('id', conversationId)
                    .eq('created_by', user.id);

                if (archiveError) throw archiveError;

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'PIN_CONVERSATION': {
                const { conversationId, pin } = data;

                const { error: pinError } = await supabase
                    .from('conversations')
                    .update({ is_pinned: pin })
                    .eq('id', conversationId)
                    .eq('created_by', user.id);

                if (pinError) throw pinError;

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'SEARCH_USERS': {
                const { query } = data;

                const { data: users, error: usersError } = await supabase
                    .from('users_profiles')
                    .select('user_id, full_name, email, role')
                    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
                    .neq('user_id', user.id)
                    .limit(10);

                if (usersError) throw usersError;

                return new Response(JSON.stringify({ success: true, users }), {
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
