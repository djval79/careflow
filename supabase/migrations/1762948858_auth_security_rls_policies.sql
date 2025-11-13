-- Migration: auth_security_rls_policies
-- Created at: 1762948858

-- Enable RLS on all security tables
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- login_attempts policies
CREATE POLICY "Allow edge functions to insert login attempts"
  ON login_attempts FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Admins can view all login attempts"
  ON login_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- account_lockouts policies
CREATE POLICY "Allow edge functions to manage lockouts"
  ON account_lockouts FOR ALL
  USING (auth.role() IN ('anon', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Admins can view all lockouts"
  ON account_lockouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- password_reset_tokens policies
CREATE POLICY "Allow edge functions to manage reset tokens"
  ON password_reset_tokens FOR ALL
  USING (auth.role() IN ('anon', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- user_sessions policies
CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Allow edge functions to manage sessions"
  ON user_sessions FOR ALL
  USING (auth.role() IN ('anon', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- security_events policies
CREATE POLICY "Allow edge functions to insert security events"
  ON security_events FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Admins can view all security events"
  ON security_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );;