import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import MovieCard from "./MovieCard";
import SeriesCard from "./SeriesCard";

interface Movie {
  id: number;
  title: string;
  russian?: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
}

interface Series {
  id: number;
  title: string;
  russian?: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
}

const CATEGORIES = [
  { id: 'movies', label: 'Movies', icon: '🎬' },
  { id: 'series', label: 'Series', icon: '📺' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'books', label: 'Books', icon: '📚' },
];

interface Top50ProfileProps {
  userId: string;
}

const Top50Profile = ({ userId }: Top50ProfileProps) => {
  const [activeCategory, setActiveCategory] = useState('movies');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [showExpanded, setShowExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [moviesRes, seriesRes] = await Promise.all([
        fetch('/data/movies.json'),
        fetch('/data/tmdb_series.json'),
      ]);

      const moviesData = await moviesRes.json();
      const seriesData = await seriesRes.json();

      setMovies(
        moviesData
          .sort((a: Movie, b: Movie) => b.rating - a.rating)
          .slice(0, 50)
      );

      setSeries(
        seriesData
          .sort((a: Series, b: Series) => b.rating - a.rating)
          .slice(0, 50)
      );
    } catch (error) {
      console.error('Error loading top 50:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryContent = () => {
    if (activeCategory === 'movies') {
      return movies.slice(0, 3).map((movie, idx) => (
        <div key={movie.id} className="flex items-center gap-3">
          <span className="font-bold text-lg text-primary w-8">#{idx + 1}</span>
          {movie.poster && (
            <img 
              src={movie.poster.replace('/w500/', '/w342/')} 
              alt={movie.title}
              className="w-12 h-16 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{movie.title}</h4>
            <p className="text-sm text-muted-foreground">⭐ {movie.rating.toFixed(1)}</p>
          </div>
        </div>
      ));
    } else if (activeCategory === 'series') {
      return series.slice(0, 3).map((s, idx) => (
        <div key={s.id} className="flex items-center gap-3">
          <span className="font-bold text-lg text-primary w-8">#{idx + 1}</span>
          {s.poster && (
            <img 
              src={s.poster.replace('/w500/', '/w342/')} 
              alt={s.title}
              className="w-12 h-16 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{s.title}</h4>
            <p className="text-sm text-muted-foreground">⭐ {s.rating.toFixed(1)}</p>
          </div>
        </div>
      ));
    } else {
      return (
        <p className="text-muted-foreground text-center py-8">
          Coming soon: {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
        </p>
      );
    }
  };

  const getCategoryData = () => {
    if (activeCategory === 'movies') return movies;
    if (activeCategory === 'series') return series;
    return [];
  };

  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20">
        <div className="mb-6">
          <h3 className="text-2xl font-bold gradient-text mb-4 flex items-center gap-2">
            ⭐ Top 50 {CATEGORIES.find(c => c.id === activeCategory)?.label}
            <span className="text-sm text-muted-foreground font-normal">({getCategoryData().length} available)</span>
          </h3>

          {/* Category Carousel */}
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                const currentIdx = CATEGORIES.findIndex(c => c.id === activeCategory);
                const prevIdx = (currentIdx - 1 + CATEGORIES.length) % CATEGORIES.length;
                setActiveCategory(CATEGORIES[prevIdx].id);
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-2 flex-1 overflow-x-auto pb-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className="whitespace-nowrap"
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </Button>
              ))}
            </div>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                const currentIdx = CATEGORIES.findIndex(c => c.id === activeCategory);
                const nextIdx = (currentIdx + 1) % CATEGORIES.length;
                setActiveCategory(CATEGORIES[nextIdx].id);
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Top 3 Preview */}
        <div className="space-y-4 mb-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : getCategoryData().length > 0 ? (
            renderCategoryContent()
          ) : (
            <p className="text-muted-foreground text-center py-8">No data available</p>
          )}
        </div>

        {/* Show More Button */}
        <Button
          onClick={() => setShowExpanded(true)}
          className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg"
          size="lg"
        >
          <Expand className="w-4 h-4" />
          Show All 50 Items
        </Button>
      </Card>

      {/* Expanded Modal */}
      <Dialog open={showExpanded} onOpenChange={setShowExpanded}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-3xl gradient-text">
              ⭐ Top 50 {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
                {[...Array(30)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
                {getCategoryData().map((item, idx) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute -top-3 -left-3 z-10 w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg">
                      {idx + 1}
                    </div>
                    {activeCategory === 'movies' ? (
                      <MovieCard movie={item as Movie} />
                    ) : (
                      <SeriesCard series={item as Series} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground text-center pt-4 border-t">
            Click on any item to view details • Sorted by rating
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Top50Profile;
