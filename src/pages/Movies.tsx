import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import { getPopularMovies, searchMovies } from "@/utils/tmdbApi";
import { useTranslation } from "react-i18next";

interface Movie {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
}

const MOVIES_PER_PAGE = 20;

const Movies = () => {
  const { t } = useTranslation();
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [displayMovies, setDisplayMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Restore scroll after content loads (50ms delay for DOM to render)
  useScrollRestore(!loading ? 0 : 50);

  useEffect(() => {
    fetchPopularMovies();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      // Reset to popular movies
      const source = allMovies;
      setDisplayMovies(source.slice(0, MOVIES_PER_PAGE));
      setPage(1);
      setHasMore(source.length > MOVIES_PER_PAGE);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const fetchPopularMovies = async () => {
    try {
      setLoading(true);
      const { movies } = await getPopularMovies(1);
      
      const transformedMovies: Movie[] = movies
        .filter(m => m.poster_path) // Only movies with posters
        .map(m => ({
          id: m.id,
          title: m.title,
          year: m.release_date?.split('-')[0] || 'Unknown',
          rating: Math.round(m.vote_average * 10) / 10,
          poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
          description: m.overview || ''
        }));

      setAllMovies(transformedMovies);
      setDisplayMovies(transformedMovies.slice(0, MOVIES_PER_PAGE));
      setHasMore(transformedMovies.length > MOVIES_PER_PAGE);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setLoading(true);
      const { movies } = await searchMovies(query, 1);
      
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
      setDisplayMovies(transformedMovies.slice(0, MOVIES_PER_PAGE));
      setPage(1);
      setHasMore(transformedMovies.length > MOVIES_PER_PAGE);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const start = page * MOVIES_PER_PAGE;
    const end = start + MOVIES_PER_PAGE;

    const source = allMovies;
    setDisplayMovies((prev) => [...prev, ...source.slice(start, end)]);
    setPage(nextPage);
    setHasMore(end < source.length);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 gradient-text">{t('movies.explore')}</h1>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder={t('movies.searchPlaceholder') || 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button onClick={loadMore}>{t('movies.loadMore')}</Button>
            </div>
          )}
        </>
      )}

      {!loading && displayMovies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('movies.noResults')}</p>
        </div>
      )}
    </div>
  );
};

export default Movies;