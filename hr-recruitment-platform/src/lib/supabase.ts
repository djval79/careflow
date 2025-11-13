import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = "https://kvtdyttgthbeomyvtmbj.supabase.co";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGR5dHRndGhiZW9teXZ0bWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODkwMjIsImV4cCI6MjA3ODQ2NTAyMn0.H2d19-9u0gqWea004sq4ZCWDzsIWv8iujRWW5ugmKXU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'hr_manager' | 'recruiter' | 'employee';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  department: string | null;
  position: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
