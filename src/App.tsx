import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Gamepad, Music, Book } from "lucide-react";

import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import Movies from "./pages/Movies";
import MovieDetail from "./pages/MovieDetail";
import SeriesPage from "./pages/Series";
import SeriesDetail from "./pages/SeriesDetail";
import Games from "./pages/Games";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import ErrorBoundary from "./components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

import supabase from "@/utils/supabase";
import "./App.css";

const queryClient = new QueryClient();

const App = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🚀 App component mounted");
    
    async function checkSupabase() {
      try {
        console.log("🔍 Проверка подключения Supabase...");
        const { data, error } = await supabase.from("comments").select("*").limit(1);
        if (error) {
          console.error("❌ Ошибка Supabase:", error.message);
        } else {
          console.log("✅ Подключение к Supabase успешно:", data);
        }
      } catch (err) {
        console.error("❌ Ошибка при подключении к Supabase:", err);
      }
    }

    checkSupabase();
  }, []);

  if (error) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />

                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/movies" element={<Movies />} />
                  <Route path="/movie/:id" element={<MovieDetail />} />
                  <Route path="/series" element={<SeriesPage />} />
                  <Route path="/series/:id" element={<SeriesDetail />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/profile/:userId/edit" element={<ProfileEdit />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/music" element={<PlaceholderPage title="Music" icon={Music} />} />
                  <Route path="/books" element={<PlaceholderPage title="Books" icon={Book} />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;