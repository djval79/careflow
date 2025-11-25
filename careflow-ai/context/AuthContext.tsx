import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    const { data: profileData } = await supabase
                        .from('users_profiles')
                        .select('*')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    setProfile(profileData);
                }
            } finally {
                setLoading(false);
            }
        }

        loadUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                supabase
                    .from('users_profiles')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .maybeSingle()
                    .then(({ data }) => setProfile(data));
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    }

    async function signOut() {
        await supabase.auth.signOut();
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
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
