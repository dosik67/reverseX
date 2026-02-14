import { createClient } from '@supabase/supabase-js';

// Use PinkGlass-specific env first, fallback to main app Supabase so Google OAuth works
const SUPABASE_URL = import.meta.env.VITE_PINKGLASS_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_PINKGLASS_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'https://placeholder.supabase.co';

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : ({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithOAuth: async () => ({ error: { message: 'Supabase not configured.' } }),
        signInWithPassword: async () => ({ error: { message: 'Supabase not configured.' } }),
        signUp: async () => ({ error: { message: 'Supabase not configured.' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        upsert: async () => ({ error: null }),
        update: () => ({ eq: async () => ({ error: null }) }),
      }),
      storage: {
        from: () => ({
          upload: async () => ({ error: { message: 'Storage not configured' } }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    } as ReturnType<typeof createClient>);
