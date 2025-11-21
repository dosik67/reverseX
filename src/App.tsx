import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, ScrollRestoration } from "react-router-dom";
import { Gamepad, Music, Book } from "lucide-react";

import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import Movies from "./pages/Movies";
import MovieDetail from "./pages/MovieDetail";
import Series from "./pages/Series";
import SeriesDetail from "./pages/SeriesDetail";
import Profile from "./pages/Profile";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

import supabase from "@/utils/supabase";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    async function checkSupabase() {
      try {
        const { data, error } = await supabase.from("comments").select("*").limit(1);
        if (error) {
          console.error("Supabase error:", error.message);
        } else {
          console.log("Подключение к Supabase успешно:", data);
        }
      } catch (err) {
        console.error("Ошибка при подключении к Supabase:", err);
      }
    }

    checkSupabase();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollRestoration />

          <Routes>
            <Route path="/auth" element={<Auth />} />

            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/series" element={<Series />} />
              <Route path="/series/:id" element={<SeriesDetail />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/games" element={<PlaceholderPage title="Games" icon={Gamepad} />} />
              <Route path="/music" element={<PlaceholderPage title="Music" icon={Music} />} />
              <Route path="/books" element={<PlaceholderPage title="Books" icon={Book} />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;