import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import MovieActionMenu from "@/components/MovieActionMenu";
import MovieSortFilter, { SortOption } from "@/components/MovieSortFilter";
import { getPopularMovies } from "@/utils/tmdbApi";
import { useTranslation } from "react-i18next";
import supabase from "@/lib/supabase";

interface Movie {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
  genre_ids?: number[];
}

interface UserMovieStatus {
  movieId: number;
  rating: number;
  status: 'watched' | 'planned' | 'abandoned' | null;
}

const MOVIES_PER_PAGE = 20;

const ExploreMovies = () => {
  const { t } = useTranslation();
  const observerTarget = useRef<HTMLDivElement>(null);

  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [displayMovies, setDisplayMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [userMovieStatus, setUserMovieStatus] = useState<Map<number, UserMovieStatus>>(new Map());

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, page]);

  // Load user's movie statuses from Supabase
  const loadUserMovieStatuses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_movies')
        .select('movie_id, rating, status')
        .eq('user_id', user.id);

      if (data) {
        const statusMap = new Map(
          data.map((item) => [
            item.movie_id,
            {
              movieId: item.movie_id,
              rating: item.rating || 0,
              status: item.status
            }
          ])
        );
        setUserMovieStatus(statusMap);
      }
    } catch (error) {
      console.error('Error loading movie statuses:', error);
    }
  };

  // Fetch all popular movies
  const fetchAllMovies = async () => {
    try {
      setLoading(true);
      const allMoviesData: Movie[] = [];

      // Fetch first 5 pages of popular movies
      for (let p = 1; p <= 5; p++) {
        const { movies } = await getPopularMovies(p);
        const transformed = movies
          .filter(m => m.poster_path)
          .map(m => ({
            id: m.id,
            title: m.title,
            year: m.release_date?.split('-')[0] || 'Unknown',
            rating: Math.round(m.vote_average * 10) / 10,
            poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
            description: m.overview || '',
            genre_ids: m.genre_ids || []
          }));

        allMoviesData.push(...transformed);
      }

      setAllMovies(allMoviesData);
      setDisplayMovies(allMoviesData.slice(0, MOVIES_PER_PAGE));
      setHasMore(allMoviesData.length > MOVIES_PER_PAGE);
      setPage(1);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    fetchAllMovies();
    loadUserMovieStatuses();
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    const start = page * MOVIES_PER_PAGE;
    const end = start + MOVIES_PER_PAGE;

    setDisplayMovies((prev) => [...prev, ...allMovies.slice(start, end)]);
    setPage(nextPage);
    setHasMore(end < allMovies.length);
  };

  const handleRatingChange = async (movieId: number, rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentStatus = userMovieStatus.get(movieId)?.status;

      // Update or insert
      const { error } = await supabase
        .from('user_movies')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          rating: rating,
          status: rating > 0 ? 'watched' : (currentStatus || null),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,movie_id'
        });

      if (!error) {
        const updated = userMovieStatus.get(movieId) || { movieId, rating: 0, status: null };
        updated.rating = rating;
        if (rating > 0) {
          updated.status = 'watched';
        }
        setUserMovieStatus(new Map(userMovieStatus.set(movieId, updated)));
      }
    } catch (error) {
      console.error('Error updating movie rating:', error);
    }
  };

  const handleStatusChange = async (
    movieId: number,
    status: 'watched' | 'planned' | 'abandoned' | null
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_movies')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          status: status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,movie_id'
        });

      if (!error) {
        const updated = userMovieStatus.get(movieId) || { movieId, rating: 0, status: null };
        updated.status = status;
        setUserMovieStatus(new Map(userMovieStatus.set(movieId, updated)));
      }
    } catch (error) {
      console.error('Error updating movie status:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Исследовать фильмы</h1>
        <p className="text-gray-400">Оценивайте и отслеживайте все популярные фильмы</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Поиск фильмов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
        <MovieSortFilter sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {displayMovies.map((movie) => {
          const status = userMovieStatus.get(movie.id);
          return (
            <div key={movie.id} className="flex flex-col gap-3">
              <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-[2/3] group">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {status?.rating && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold">
                    ⭐ {status.rating}
                  </div>
                )}
                {status?.status && (
                  <div className="absolute top-2 left-2 bg-gray-900/80 text-xs px-2 py-1 rounded">
                    {status.status === 'watched' && <span className="text-green-400">✓ Просмотрено</span>}
                    {status.status === 'planned' && <span className="text-blue-400">⏱ В планах</span>}
                    {status.status === 'abandoned' && <span className="text-red-400">✗ Отложено</span>}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white truncate">{movie.title}</h3>
                <p className="text-xs text-gray-400">{movie.year}</p>
              </div>

              <MovieActionMenu
                movieId={movie.id}
                movieTitle={movie.title}
                currentRating={status?.rating || 0}
                currentStatus={status?.status || null}
                onRatingChange={(rating) => handleRatingChange(movie.id, rating)}
                onStatusChange={(status) => handleStatusChange(movie.id, status)}
              />
            </div>
          );
        })}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      )}

      {/* Infinite scroll target */}
      <div ref={observerTarget} className="mt-12 h-4" />
    </div>
  );
};

export default ExploreMovies;
