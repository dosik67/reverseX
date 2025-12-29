import { createClient } from "@supabase/supabase-js";

// Берём URL и ключ из .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Создаём клиент Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("✅ Supabase клиент инициализирован с URL:", supabaseUrl);

export default supabase;
