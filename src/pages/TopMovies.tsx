import { useState, useEffect, useMemo } from 'react';
import { Star, Search, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Movie {
  rank: number;
  Series_Title: string;
  Released_Year: number;
  Runtime: string;
  Genre: string;
  IMDB_Rating: number;
  Overview: string;
  Meta_score: number;
  Director: string;
  No_of_Votes: number;
  Gross: string;
}

const TopMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [minRating, setMinRating] = useState(7.0);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const response = await fetch('/data/imdb_top_1000.csv');
        const text = await response.text();
        const lines = text.split('\n');
        const headers = lines[0].split('\t');

        const parsedMovies: Movie[] = lines.slice(1)
          .filter(line => line.trim())
          .map((line, idx) => {
            const values = line.split('\t');
            return {
              rank: idx + 1,
              Series_Title: values[1] || '',
              Released_Year: parseInt(values[2]) || 0,
              Runtime: values[4] || '',
              Genre: values[5]?.split(',')?.[0]?.trim() || '',
              IMDB_Rating: parseFloat(values[6]) || 0,
              Overview: values[7] || '',
              Meta_score: parseFloat(values[8]) || 0,
              Director: values[9] || '',
              No_of_Votes: parseInt(values[14]?.replace(/,/g, '')) || 0,
              Gross: values[15] || '',
            };
          });

        setMovies(parsedMovies);
        setLoading(false);
      } catch (error) {
        console.error('Error loading movies:', error);
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    movies.forEach(movie => {
      if (movie.Genre) {
        genreSet.add(movie.Genre);
      }
    });
    return Array.from(genreSet).sort();
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesSearch = movie.Series_Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           movie.Director.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = !selectedGenre || movie.Genre === selectedGenre;
      const matchesRating = movie.IMDB_Rating >= minRating;
      return matchesSearch && matchesGenre && matchesRating;
    });
  }, [movies, searchTerm, selectedGenre, minRating]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">IMDb Top 1000 Movies</h1>
          <p className="text-gray-400 text-lg">The greatest films of all time according to IMDb</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Movie title or director..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">Min Rating: {minRating.toFixed(1)}</label>
            <input
              type="range"
              min="7"
              max="10"
              step="0.1"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-400">
              Showing <span className="font-bold text-yellow-400">{filteredMovies.length}</span> movies
            </div>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredMovies.map((movie) => (
            <Card key={movie.rank} className="overflow-hidden hover:bg-slate-800/50 transition-all duration-300 border-slate-700 bg-slate-800/30">
              <div className="p-6 flex gap-6">
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">#{movie.rank}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2 line-clamp-1">{movie.Series_Title}</h2>
                      <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-gray-400">
                        <span>{movie.Released_Year}</span>
                        <span>•</span>
                        <span>{movie.Runtime}</span>
                        <span>•</span>
                        <span className="text-yellow-400 font-semibold">{movie.Genre}</span>
                      </div>
                      <p className="text-gray-400 line-clamp-2 mb-3">{movie.Overview}</p>
                      <div className="text-sm text-gray-500">
                        <span>Director: <span className="text-gray-300">{movie.Director}</span></span>
                      </div>
                    </div>

                    {/* Ratings */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-4">
                        {/* IMDb Rating */}
                        <div className="bg-yellow-600 text-black px-4 py-3 rounded-lg text-center shadow-lg">
                          <div className="text-xs font-bold mb-1">IMDb</div>
                          <div className="flex items-center gap-1 justify-center">
                            <Star className="w-5 h-5 fill-current" />
                            <span className="text-2xl font-bold">{movie.IMDB_Rating.toFixed(1)}</span>
                          </div>
                          <div className="text-xs text-gray-700 mt-1">
                            {(movie.No_of_Votes / 1000).toFixed(0)}K votes
                          </div>
                        </div>

                        {/* Meta Score */}
                        {movie.Meta_score > 0 && (
                          <div className="bg-slate-700 text-white px-4 py-3 rounded-lg text-center">
                            <div className="text-xs font-bold mb-1">Meta</div>
                            <div className="text-2xl font-bold">{Math.round(movie.Meta_score)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredMovies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">No movies found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopMovies;
