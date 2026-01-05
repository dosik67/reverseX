import { createClient } from "@supabase/supabase-js";

// Берём URL и ключ из .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mock builder для метод-чейнинга
const createMockQueryBuilder = () => ({
  select: function() {
    return this;
  },
  eq: function() {
    return this;
  },
  single: function() {
    return Promise.resolve({ data: null, error: null });
  },
  update: function() {
    return Promise.resolve({ data: [], error: null });
  },
  delete: function() {
    return Promise.resolve({ data: [], error: null });
  },
  insert: function() {
    return Promise.resolve({ data: [], error: null });
  },
  limit: function() {
    return this;
  },
  then: function(resolve: any) {
    return Promise.resolve({ data: [], error: null }).then(resolve);
  },
  catch: function(reject: any) {
    return Promise.resolve({ data: [], error: null }).catch(reject);
  },
});

// Создаём клиент Supabase только если переменные установлены
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("✅ Supabase клиент инициализирован с URL:", supabaseUrl);
} else {
  console.warn("⚠️  Supabase переменные окружения не установлены. Используется mock клиент.");
  console.warn("📝 Убедитесь что установлены переменные окружения:");
  console.warn("   - VITE_SUPABASE_URL");
  console.warn("   - VITE_SUPABASE_ANON_KEY");
  
  // Полноценный mock объект для случаев когда нет переменных
  supabase = {
    from: () => createMockQueryBuilder(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signUp: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: { message: "Supabase not configured - Check environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)" } }),
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
