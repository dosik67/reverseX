// TMDB API configuration
const TMDB_API_KEY = 'a981b3ba0b345f578fb917ee74a90bf3';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhOTgxYjNiYTBiMzQ1ZjU3OGZiOTE3ZWU3NGE5MGJmMyIsIm5iZiI6MTc1MjUyMjUxMy40MjcsInN1YiI6IjY4NzU1ZjExNzUzYjVjNTYwM2Y5MWJkMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Trm6p4NqL6VPKlvUkGkRMKVjeH2KAklTAllVbnolV8w';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  runtime: number;
  budget: number;
  revenue: number;
}

export interface TMDBMovieResponse {
  results: Array<{
    id: number;
    title: string;
    original_title: string;
    release_date: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
  }>;
  total_pages: number;
  total_results: number;
  page: number;
}

const headers = {
  'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
  'Accept': 'application/json'
};

/**
 * Fetch movies by genre with pagination and sorting
 */
export const fetchMoviesByGenre = async (
  genreId: number,
  sortBy: 'popularity.desc' | 'rating.desc' | 'release_date.desc' = 'popularity.desc',
  page: number = 1
): Promise<{ movies: TMDBMovieResponse['results']; totalPages: number }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?with_genres=${genreId}&sort_by=${sortBy}&page=${page}&language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieResponse = await response.json();
    return {
      movies: data.results,
      totalPages: data.total_pages
    };
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    throw error;
  }
};

/**
 * Search movies by title
 */
export const searchMovies = async (
  query: string,
  page: number = 1
): Promise<{ movies: TMDBMovieResponse['results']; totalPages: number }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}&language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieResponse = await response.json();
    return {
      movies: data.results,
      totalPages: data.total_pages
    };
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};

/**
 * Get movie details including runtime, budget, revenue
 */
export const getMovieDetails = async (movieId: number): Promise<TMDBMovie> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovie = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
};

/**
 * Get popular movies
 */
export const getPopularMovies = async (
  page: number = 1
): Promise<{ movies: TMDBMovieResponse['results']; totalPages: number }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?page=${page}&language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieResponse = await response.json();
    return {
      movies: data.results,
      totalPages: data.total_pages
    };
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw error;
  }
};

/**
 * Get top-rated movies
 */
export const getTopRatedMovies = async (
  page: number = 1
): Promise<{ movies: TMDBMovieResponse['results']; totalPages: number }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/top_rated?page=${page}&language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieResponse = await response.json();
    return {
      movies: data.results,
      totalPages: data.total_pages
    };
  } catch (error) {
    console.error('Error fetching top-rated movies:', error);
    throw error;
  }
};

/**
 * Get movie poster URL
 */
export const getMoviePosterUrl = (posterPath: string | null, size: 'w342' | 'w500' | 'w780' = 'w342'): string => {
  if (!posterPath) {
    return 'https://placehold.co/342x513/1a1a2e/ffffff?text=No+Image';
  }
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
};

/**
 * Get TMDB genres
 */
export const getGenres = async (): Promise<Array<{ id: number; name: string }>> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/genre/movie/list?language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return data.genres || [];
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
};
