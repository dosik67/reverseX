import { createClient } from "@supabase/supabase-js";

// Берём URL и ключ из .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Создаём клиент Supabase только если переменные установлены
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("✅ Supabase клиент инициализирован с URL:", supabaseUrl);
} else {
  console.warn("⚠️  Supabase переменные окружения не установлены. Используется mock клиент.");
  
  // Полноценный mock объект для случаев когда нет переменных
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      eq: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
      }),
      limit: () => Promise.resolve({ data: [], error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ data: null, error: { message: "Auth not configured" } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Auth not configured" } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
    },
    realtime: {
      on: () => ({ unsubscribe: () => {} }),
    },
  };
}

export default supabase;
