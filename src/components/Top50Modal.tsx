import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Film, Tv, Gamepad, Book, Music, X } from "lucide-react";
import { Link } from "react-router-dom";
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

interface Top50ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Top50Modal = ({ open, onOpenChange }: Top50ModalProps) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [activeTab, setActiveTab] = useState("movies");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [moviesRes, seriesRes] = await Promise.all([
        fetch('/data/movies.json'),
        fetch('/data/tmdb_series.json'),
      ]);

      const moviesData = await moviesRes.json();
      const seriesData = await seriesRes.json();

      // Sort by rating and take top 50
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-3xl gradient-text flex items-center gap-2">
            ⭐ Top 50 Lists
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="movies" className="flex items-center gap-2">
              <Film className="w-4 h-4" />
              Movies
            </TabsTrigger>
            <TabsTrigger value="series" className="flex items-center gap-2">
              <Tv className="w-4 h-4" />
              Series
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="movies" className="h-full overflow-y-auto m-0">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
                  {[...Array(30)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
                  {movies.map((movie, idx) => (
                    <div key={movie.id} className="relative group">
                      <div className="absolute -top-3 -left-3 z-10 w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg">
                        {idx + 1}
                      </div>
                      <MovieCard movie={movie} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="series" className="h-full overflow-y-auto m-0">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
                  {[...Array(30)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
                  {series.map((s, idx) => (
                    <div key={s.id} className="relative group">
                      <div className="absolute -top-3 -left-3 z-10 w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg">
                        {idx + 1}
                      </div>
                      <SeriesCard series={s} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="text-sm text-muted-foreground text-center pt-4 border-t">
          Click on any item to view details • Sorted by rating
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Top50Modal;
