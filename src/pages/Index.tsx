import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Film, TrendingUp, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen">
      <div className="relative h-[400px] bg-gradient-to-br from-primary/20 via-accent/10 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center relative z-10">
          <img 
            src="/logo.png"
            alt="ReverseX"
            className="h-48 w-auto mb-6"
          />
          <p className="text-xl text-muted-foreground mb-8 text-center max-w-2xl">
            Персональный трекер и рекомендации
          </p>
          <div className="relative max-w-2xl w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Поиск фильмов, сериалов и игр..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-card/80 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Перейти к</h2>
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Movies Card */}
          <Link to="/movies" className="group">
            <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                <Film className="w-12 h-12 text-white mb-4" />
                <h3 className="text-2xl font-bold text-white">Фильмы</h3>
                <p className="text-white/80 mt-2">Найди свой любимый фильм</p>
              </div>
            </div>
          </Link>

          {/* Series Card */}
          <Link to="/series" className="group">
            <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-purple-600 to-purple-800 hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                <TrendingUp className="w-12 h-12 text-white mb-4" />
                <h3 className="text-2xl font-bold text-white">Сериалы</h3>
                <p className="text-white/80 mt-2">Смотри лучшие сериалы</p>
              </div>
            </div>
          </Link>

          {/* Games Card */}
          <Link to="/games" className="group">
            <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-pink-600 to-pink-800 hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                <Gamepad2 className="w-12 h-12 text-white mb-4" />
                <h3 className="text-2xl font-bold text-white">Игры</h3>
                <p className="text-white/80 mt-2">Исследуй популярные игры</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
