-- Migration: create_messaging_tables
-- Created at: 1762971155

-- Conversations table for internal messaging system
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    conversation_type VARCHAR(50) DEFAULT 'direct',
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS message_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    role_in_conversation VARCHAR(50) DEFAULT 'member',
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_participants_conversation_id ON message_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_participants_user_id ON message_participants(user_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT
    USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM message_participants 
            WHERE conversation_id = conversations.id 
            AND user_id = auth.uid()
            AND is_active = TRUE
        )
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Conversation owners can update" ON conversations
    FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM message_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
            AND is_active = TRUE
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM message_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
            AND is_active = TRUE
        )
    );

CREATE POLICY "Senders can update their own messages" ON messages
    FOR UPDATE
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can view participants in their conversations" ON message_participants
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM message_participants mp 
            WHERE mp.conversation_id = message_participants.conversation_id 
            AND mp.user_id = auth.uid()
            AND mp.is_active = TRUE
        )
    );

CREATE POLICY "Conversation owners can add participants" ON message_participants
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update their own participant record" ON message_participants
    FOR UPDATE
    USING (user_id = auth.uid());;