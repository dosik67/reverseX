import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getPopularMovies, searchMovies } from "@/utils/tmdbApi";

interface Movie {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
}

const MOVIES_PER_PAGE = 20;

interface GenreCategory {
  name: string;
  englishName: string;
  filter: (m: Movie) => boolean;
  bgImage: string;
  bgColor: string;
  tmdbGenreId?: number;
}

const GENRE_CATEGORIES: GenreCategory[] = [
  { 
    name: "Аниме", 
    englishName: "anime",
    filter: (m: Movie) => m.description?.toLowerCase().includes("анима"),
    bgImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&h=400&fit=crop",
    bgColor: "from-pink-600/80 to-purple-600/80"
  },
  { 
    name: "Дорамы", 
    englishName: "kdrama",
    filter: (m: Movie) => m.description?.toLowerCase().includes("корейск"),
    bgImage: "https://images.unsplash.com/photo-1522869635100-ce306e08c5d0?w=1200&h=400&fit=crop",
    bgColor: "from-red-600/80 to-orange-600/80"
  },
  { 
    name: "Драммы", 
    englishName: "drama",
    filter: (m: Movie) => m.description?.toLowerCase().includes("драма"),
    bgImage: "https://images.unsplash.com/photo-1559833481-92f0a3d03c80?w=1200&h=400&fit=crop",
    bgColor: "from-blue-600/80 to-indigo-600/80",
    tmdbGenreId: 18
  },
  { 
    name: "Боевик", 
    englishName: "action",
    filter: (m: Movie) => m.description?.toLowerCase().includes("боевик"),
    bgImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&h=400&fit=crop",
    bgColor: "from-red-700/80 to-orange-700/80",
    tmdbGenreId: 28
  },
  { 
    name: "Комедия", 
    englishName: "comedy",
    filter: (m: Movie) => m.description?.toLowerCase().includes("комед"),
    bgImage: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=400&fit=crop",
    bgColor: "from-yellow-600/80 to-orange-600/80",
    tmdbGenreId: 35
  },
  { 
    name: "Фантастика", 
    englishName: "scifi",
    filter: (m: Movie) => m.description?.toLowerCase().includes("фантаст"),
    bgImage: "https://images.unsplash.com/photo-1533890228405-fe22868d4d0f?w=1200&h=400&fit=crop",
    bgColor: "from-cyan-600/80 to-blue-600/80",
    tmdbGenreId: 878
  },
];

const Index = () => {
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const { movies } = await getPopularMovies(1);
      
      const transformedMovies: Movie[] = movies
        .filter(m => m.poster_path)
        .map(m => ({
          id: m.id,
          title: m.title,
          year: m.release_date?.split('-')[0] || 'Unknown',
          rating: Math.round(m.vote_average * 10) / 10,
          poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
          description: m.overview || ''
        }));

      setAllMovies(transformedMovies);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative h-[400px] bg-gradient-to-br from-primary/20 via-accent/10 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center relative z-10">
          <img 
            src="/logo.png"
            alt="ReverseX"
            className="h-32 w-auto mb-6"
          />
          <p className="text-xl text-muted-foreground mb-8 text-center max-w-2xl">
            Персональный трекер и рекомендации
          </p>
          <div className="relative max-w-2xl w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-card/80 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Links */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/movies" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              All Movies
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/series" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Series
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/profile" className="flex items-center gap-2">
              My Profile
            </Link>
          </Button>
        </div>

        {/* Genre Sections */}
        {!loading && (
          <div className="space-y-16">
            {GENRE_CATEGORIES.map((category) => {
              const categoryMovies = allMovies.filter(category.filter).slice(0, 12);
              
              return (
                <div key={category.englishName} className="space-y-4">
                  {/* Genre Header */}
                  <div className="relative h-48 rounded-xl overflow-hidden group cursor-pointer">
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${category.bgImage}')`,
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${category.bgColor}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                      <h2 className="text-4xl font-bold text-white mb-2">{category.name}</h2>
                      <p className="text-white/80">{categoryMovies.length} titles available</p>
                    </div>

                    {/* Hover overlay */}
                    <Link 
                      to="/movies" 
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                    >
                      <div className="text-white flex items-center gap-2">
                        <span>View All</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </Link>
                  </div>

                  {/* Movies Grid */}
                  {categoryMovies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                      {categoryMovies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No movies in this category
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {loading && (
          <div className="space-y-16">
            {[...Array(3)].map((_, categoryIdx) => (
              <div key={categoryIdx} className="space-y-4">
                <div className="h-48 bg-muted animate-pulse rounded-xl" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
