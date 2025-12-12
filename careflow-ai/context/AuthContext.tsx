/**
 * Authentication Context for CareFlow
 * 
 * Provides authentication state and methods throughout the application.
 * Uses Supabase for authentication and profile management.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';
import { log } from '../lib/logger';
import { clearQueryCache } from '../lib/queryClient';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName: string, role?: 'admin' | 'carer') => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Scoped logger for auth context
const authLog = log.scope('AuthProvider');

/**
 * Fetch or create user profile
 */
async function fetchOrCreateProfile(userId: string, email: string, fullName?: string): Promise<UserProfile | null> {
    try {
        // First try to fetch existing profile
        const { data: profileData, error: profileError } = await supabase
            .from('users_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (profileError) {
            authLog.error('Failed to fetch profile', { error: profileError.message, userId });
            return null;
        }

        if (profileData) {
            authLog.debug('Profile loaded', { userId, role: profileData.role });
            return profileData;
        }

        // Profile doesn't exist, try to create one
        authLog.info('Profile missing, attempting to auto-create', { userId });
        
        const { data: newProfile, error: createError } = await supabase
            .from('users_profiles')
            .insert({
                user_id: userId,
                email: email,
                full_name: fullName || email?.split('@')[0] || 'New User',
                role: 'carer',
                status: 'Active'
            })
            .select()
            .single();

        if (createError) {
            authLog.error('Failed to auto-create profile', { error: createError.message, userId });
            return null;
        }

        authLog.info('Profile auto-created successfully', { userId });
        return newProfile;
    } catch (error) {
        authLog.error('Profile fetch/create exception', { error: String(error), userId });
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const initRef = React.useRef(false);

    useEffect(() => {
        authLog.debug('AuthProvider mounted');

        // Prevent double initialization in React strict mode
        if (initRef.current) return;
        initRef.current = true;

        let mounted = true;

        // Safety timeout to prevent infinite loading state
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                authLog.warn('Safety timeout triggered - forcing loading false');
                setLoading(false);
            }
        }, 15000);

        async function loadUser() {
            try {
                authLog.debug('Loading user session...');
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                
                if (userError) {
                    authLog.debug('No active session', { error: userError.message });
                }

                if (mounted) {
                    setUser(user);
                    
                    if (user) {
                        authLog.debug('User found, loading profile', { email: user.email });
                        const profileData = await fetchOrCreateProfile(
                            user.id, 
                            user.email!, 
                            user.user_metadata?.full_name
                        );
                        if (mounted) {
                            setProfile(profileData);
                        }
                    }
                }
            } catch (error) {
                authLog.error('LoadUser exception', { error: String(error) });
            } finally {
                if (mounted) {
                    authLog.debug('Initial load complete');
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                }
            }
        }

        loadUser();

        // Subscribe to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            authLog.debug('Auth state change', { event, email: session?.user?.email });

            if (!mounted) return;

            setUser(session?.user || null);

            if (session?.user) {
                const profileData = await fetchOrCreateProfile(
                    session.user.id,
                    session.user.email!,
                    session.user.user_metadata?.full_name
                );
                
                if (mounted) {
                    setProfile(profileData);
                    setLoading(false);
                }
            } else {
                if (mounted) {
                    setProfile(null);
                    setLoading(false);
                    // Clear query cache on sign out
                    if (event === 'SIGNED_OUT') {
                        clearQueryCache();
                    }
                }
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    async function signIn(email: string, password: string) {
        authLog.debug('Sign in attempt', { email });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            authLog.error('Sign in failed', { error: error.message, email });
        } else {
            authLog.info('Sign in successful', { email });
            log.track('user_signed_in', { email });
        }
        
        return { error };
    }

    async function signUp(email: string, password: string, fullName: string, role: 'admin' | 'carer' = 'carer') {
        authLog.debug('Sign up attempt', { email, role });
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                }
            }
        });

        if (error) {
            authLog.error('Sign up failed', { error: error.message, email });
        } else {
            authLog.info('Sign up successful', { email });
            log.track('user_signed_up', { email, role });
        }

        // Profile creation is handled by a Database Trigger
        return { error };
    }

    async function signOut() {
        authLog.debug('Sign out initiated');
        
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                authLog.error('Sign out error', { error: error.message });
            } else {
                authLog.info('Sign out successful');
                log.track('user_signed_out');
                // Clear query cache
                clearQueryCache();
            }
        } catch (err) {
            authLog.error('Sign out exception', { error: String(err) });
        }
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
