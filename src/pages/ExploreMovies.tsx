import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown } from "lucide-react";
import MovieActionMenu from "@/components/MovieActionMenu";
import MovieSortFilter, { SortOption } from "@/components/MovieSortFilter";
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

const DISPLAY_PER_BATCH = 50; // Show 50 at a time in UI

const ExploreMovies = () => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(DISPLAY_PER_BATCH);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [userMovieStatus, setUserMovieStatus] = useState<Map<number, UserMovieStatus>>(new Map());
  const [apiPage, setApiPage] = useState(1);
  const [totalApiPages, setTotalApiPages] = useState(50); // Load up to 50 pages (~1000+ movies)

  // Load user's movie statuses
  const loadUserMovieStatuses = useCallback(async () => {
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
  }, []);

  // Fetch movies with pagination from TMDB
  const fetchMoviesPage = useCallback(async (page: number) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=c33c648c0d8f45c494af8da025d7b862&sort_by=popularity.desc&page=${page}&language=ru-RU&vote_count.gte=100`
      );
      
      const data = await response.json();
      
      const transformed: Movie[] = (data.results || [])
        .filter((m: any) => m.poster_path)
        .map((m: any) => ({
          id: m.id,
          title: m.title || m.original_title,
          year: m.release_date?.split('-')[0] || 'Unknown',
          rating: Math.round(m.vote_average * 10) / 10,
          poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
          description: m.overview || '',
          genre_ids: m.genre_ids || []
        }));

      return transformed;
    } catch (error) {
      console.error('Error fetching movies page:', error);
      return [];
    }
  }, []);

  // Initialize - load first movies in background
  useEffect(() => {
    const loadInitialMovies = async () => {
      try {
        setLoading(true);
        const allMoviesData: Movie[] = [];

        // Load first 3 pages initially
        for (let page = 1; page <= 3; page++) {
          const pageMovies = await fetchMoviesPage(page);
          allMoviesData.push(...pageMovies);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setAllMovies(allMoviesData);
        setApiPage(4);
        
        // Load more pages in background
        loadMoreMoviesInBackground(4);
        
        await loadUserMovieStatuses();
      } catch (error) {
        console.error('Error loading movies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialMovies();
  }, [fetchMoviesPage, loadUserMovieStatuses]);

  // Load more pages in the background
  const loadMoreMoviesInBackground = async (startPage: number) => {
    try {
      setLoadingMore(true);
      for (let page = startPage; page < startPage + 5; page++) {
        const pageMovies = await fetchMoviesPage(page);
        setAllMovies(prev => [...prev, ...pageMovies]);
        setApiPage(page + 1);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } catch (error) {
      console.error('Error loading more movies:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Virtual scroll - load more when reaching bottom
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollHeight, scrollTop, clientHeight } = container;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    // Load more pages if we need them and we're close to end
    if (distanceFromBottom < 500 && !loadingMore && apiPage <= totalApiPages) {
      loadMoreMoviesInBackground(apiPage);
    }

    // Show more items when scrolling down
    if (displayedCount < allMovies.length && distanceFromBottom < 1500) {
      setDisplayedCount(prev => Math.min(prev + DISPLAY_PER_BATCH, allMovies.length));
    }
  }, [loadingMore, apiPage, displayedCount, allMovies.length, totalApiPages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleRatingChange = async (movieId: number, rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_movies')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          rating: rating,
          status: rating > 0 ? 'watched' : (userMovieStatus.get(movieId)?.status || null),
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

  const displayedMovies = allMovies.slice(0, displayedCount);

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Исследовать фильмы</h1>
        <p className="text-gray-400 text-sm md:text-base">
          Оценивайте и отслеживайте популярные фильмы • Загружено: {allMovies.length.toLocaleString()} фильмов
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Поиск фильмов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm"
          />
        </div>
        <MovieSortFilter sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      {/* Movies Grid with Virtual Scroll */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pr-2"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 md:gap-3 pb-8">
          {displayedMovies.map((movie) => {
            const status = userMovieStatus.get(movie.id);
            return (
              <div key={movie.id} className="flex flex-col gap-2">
                <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-[2/3] group hover:shadow-lg hover:shadow-yellow-600/20 transition-shadow">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {status?.rating ? (
                    <div className="absolute top-1 right-1 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-xs font-bold">
                      ⭐ {status.rating}
                    </div>
                  ) : null}
                  {status?.status ? (
                    <div className="absolute bottom-1 left-1 bg-gray-900/90 text-xs px-1 py-0.5 rounded font-semibold">
                      {status.status === 'watched' && <span className="text-green-400">✓</span>}
                      {status.status === 'planned' && <span className="text-blue-400">⏱</span>}
                      {status.status === 'abandoned' && <span className="text-red-400">✗</span>}
                    </div>
                  ) : null}
                </div>

                <div className="min-h-[35px]">
                  <h3 className="text-xs font-semibold text-white line-clamp-2 leading-tight">{movie.title}</h3>
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
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            <p className="ml-4 text-gray-400 text-sm">Загрузка фильмов...</p>
          </div>
        )}

        {/* Scroll indicator */}
        {!loading && displayedCount < allMovies.length && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <ChevronDown size={16} className="animate-bounce" />
              <p>
                Показано: {displayedCount.toLocaleString()} / {allMovies.length.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* End of list indicator */}
        {allMovies.length > 0 && displayedCount >= allMovies.length && (
          <div className="flex justify-center py-8">
            <p className="text-gray-500 text-sm">Все загруженные фильмы показаны</p>
          </div>
        )}

        {/* Background loading indicator */}
        {loadingMore && !loading && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-yellow-400 text-xs">
              <div className="animate-spin rounded-full h-4 w-4 border-b border-yellow-400"></div>
              <p>Загрузка еще фильмов...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreMovies;
