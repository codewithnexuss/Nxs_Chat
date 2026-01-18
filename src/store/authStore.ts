import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    session: { access_token: string; user: { id: string; email: string } } | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setSession: (session: AuthState['session']) => void;
    setLoading: (loading: boolean) => void;
    signOut: () => Promise<void>;
    fetchUser: (userId: string) => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            session: null,
            isLoading: true,
            isAuthenticated: false,

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            setSession: (session) => set({ session, isAuthenticated: !!session }),

            setLoading: (isLoading) => set({ isLoading }),

            signOut: async () => {
                console.log('authStore: signOut initiated');
                try {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                        console.error('authStore: signOut error from supabase:', error);
                    }
                    set({ user: null, session: null, isAuthenticated: false });
                    console.log('authStore: signOut state cleared');
                } catch (err) {
                    console.error('authStore: signOut catch error:', err);
                    // Still clear local state even if supabase fails
                    set({ user: null, session: null, isAuthenticated: false });
                }
            },

            fetchUser: async (userId) => {
                console.log('authStore: fetchUser started for', userId);
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (error) {
                        console.error('authStore: fetchUser error from supabase:', error);
                        throw error;
                    }
                    console.log('authStore: fetchUser success, user profile retrieved');
                    set({ user: data as unknown as User, isAuthenticated: true });
                } catch (error) {
                    console.error('authStore: fetchUser caught error:', error);
                    // On error, we still want to move out of loading but maybe not authenticated
                    set({ isAuthenticated: false });
                }
            },

            updateUser: async (updates) => {
                const { user } = get();
                if (!user) return;

                try {
                    const { error } = await supabase
                        .from('users')
                        .update({ ...updates, updated_at: new Date().toISOString() } as any)
                        .eq('id', user.id);

                    if (error) throw error;
                    set({ user: { ...user, ...updates } });
                } catch (error) {
                    console.error('Error updating user:', error);
                    throw error;
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ session: state.session }),
            onRehydrateStorage: () => {
                console.log('authStore: hydration starting');
                return (state, error) => {
                    if (error) {
                        console.error('authStore: hydration error:', error);
                    } else {
                        console.log('authStore: hydration finished', state ? 'state restored' : 'no state');
                    }
                };
            },
        }
    )
);
