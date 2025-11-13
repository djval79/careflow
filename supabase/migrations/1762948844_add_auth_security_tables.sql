-- Migration: add_auth_security_tables
-- Created at: 1762948844

-- Authentication Security Tables

-- Table: login_attempts
-- Purpose: Track login attempts for account lockout and brute force protection
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  attempt_status VARCHAR(20) CHECK (attempt_status IN ('success', 'failed', 'locked')),
  failure_reason VARCHAR(100),
  attempted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: account_lockouts
-- Purpose: Manage locked accounts with automatic unlock times
CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email VARCHAR(255) NOT NULL,
  locked_at TIMESTAMP DEFAULT NOW(),
  unlock_at TIMESTAMP NOT NULL,
  lock_reason VARCHAR(100),
  locked_by_ip VARCHAR(50),
  unlock_method VARCHAR(50) CHECK (unlock_method IN ('automatic', 'admin', 'password_reset')),
  unlocked_at TIMESTAMP,
  unlocked_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: password_reset_tokens
-- Purpose: Manage secure password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  ip_address VARCHAR(50),
  user_agent TEXT,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: user_sessions
-- Purpose: Track active sessions for timeout management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- Table: security_events
-- Purpose: Log all security-related events for monitoring
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) CHECK (event_category IN ('authentication', 'authorization', 'session', 'password', 'suspicious')),
  severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'critical')),
  description TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);

CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_user_id ON account_lockouts(user_id);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_is_active ON account_lockouts(is_active);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_email ON security_events(email);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);;