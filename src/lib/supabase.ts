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
  console.warn("⚠️  Supabase переменные окружения не установлены. Создан mock клиент.");
  // Mock объект для случаев когда нет переменных
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
    }),
  };
}

export default supabase;
