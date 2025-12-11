import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Gamepad, Music, Book } from "lucide-react";

import { ThemeProvider } from "@/context/ThemeContext";

import Auth from "./pages/Auth";
import QRAuthPage from "./pages/QRAuthPage";
import Layout from "./components/Layout";
import Movies from "./pages/Movies";
import MovieDetail from "./pages/MovieDetail";
import SeriesPage from "./pages/Series";
import SeriesDetail from "./pages/SeriesDetail";
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import TierLists from "./pages/TierLists";
import ErrorBoundary from "./components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

// Workspace imports
import Workspace from "./pages/Workspace";
import WorkspaceAuth from "./pages/WorkspaceAuth";
import WorkspaceProject from "./pages/WorkspaceProject";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import WorkspaceInvite from "./pages/WorkspaceInvite";

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
        <ThemeProvider>
          <AppProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/qr-auth" element={<QRAuthPage />} />

                {/* Workspace Routes - Hidden/Secret */}
                <Route path="/workspace-auth" element={<WorkspaceAuth />} />
                <Route path="/workspace" element={<Workspace />} />
                <Route path="/workspace/project/:projectId" element={<WorkspaceProject />} />
                <Route path="/workspace/settings" element={<WorkspaceSettings />} />
                <Route path="/workspace/invite/:inviteCode" element={<WorkspaceInvite />} />

                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/movies" element={<Movies />} />
                  <Route path="/movie/:id" element={<MovieDetail />} />
                  <Route path="/series" element={<SeriesPage />} />
                  <Route path="/series/:id" element={<SeriesDetail />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/profile/:userId/edit" element={<ProfileEdit />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/tier-lists" element={<TierLists />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/game/:id" element={<GameDetail />} />
                  <Route path="/music" element={<PlaceholderPage title="Music" icon={Music} />} />
                  <Route path="/books" element={<PlaceholderPage title="Books" icon={Book} />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;