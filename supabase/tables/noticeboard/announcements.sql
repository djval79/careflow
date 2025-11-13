-- Announcements table for notice board module
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general', -- general, urgent, job-related, policy, compliance
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    visibility_level VARCHAR(50) DEFAULT 'company-wide', -- company-wide, department, role-based
    target_audience JSONB DEFAULT '[]'::jsonb, -- Array of role names or department IDs
    attachment_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Announcement views table for tracking who has seen announcements
CREATE TABLE IF NOT EXISTS announcement_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(announcement_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcement_views_announcement_id ON announcement_views(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_views_user_id ON announcement_views(user_id);

-- Row Level Security Policies
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;

-- Announcements policies: All authenticated users can view non-expired announcements
CREATE POLICY "Users can view announcements" ON announcements
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (is_archived = FALSE) AND
        (expires_at IS NULL OR expires_at > NOW()) AND
        (
            visibility_level = 'company-wide' OR
            (visibility_level = 'role-based' AND 
             EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = ANY(SELECT jsonb_array_elements_text(target_audience))
             ))
        )
    );

-- Only admins and HR managers can create announcements
CREATE POLICY "Admins and HR can create announcements" ON announcements
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Admin', 'HR Manager')
        )
    );

-- Creators and admins can update announcements
CREATE POLICY "Creators and admins can update announcements" ON announcements
    FOR UPDATE
    USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'Admin'
        )
    );

-- Announcement views policies
CREATE POLICY "Users can view their own views" ON announcement_views
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can record their views" ON announcement_views
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their views" ON announcement_views
    FOR UPDATE
    USING (user_id = auth.uid());
