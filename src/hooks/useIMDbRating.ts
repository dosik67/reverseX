import { useState, useEffect } from 'react';
import { getIMDbRating, OMDbRating } from '@/utils/omdbApi';
import { getImdbIdFromTMDB, getImdbIdFromTMDBSeries } from '@/utils/ratingService';
import { getCachedIMDbRating, saveIMDbRating } from '@/utils/imdbCache';

interface UseIMDbRatingOptions {
  tmdbId?: number;
  imdbId?: string;
  mediaType?: 'movie' | 'tv';
}

export const useIMDbRating = (options: UseIMDbRatingOptions) => {
  const [rating, setRating] = useState<OMDbRating | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRating = async () => {
      if (!options.imdbId && !options.tmdbId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let imdbId = options.imdbId;
        let tmdbId = options.tmdbId;

        // Try to get from cache first if we have TMDB ID
        if (tmdbId && !imdbId) {
          const cached = await getCachedIMDbRating(tmdbId);
          if (cached) {
            imdbId = cached.imdb_id || undefined;
            setRating(cached.imdb_rating ? {
              imdbId: cached.imdb_id || '',
              imdbRating: cached.imdb_rating,
              imdbVotes: cached.imdb_votes,
              imdbType: options.mediaType === 'tv' ? 'series' : 'movie'
            } : null);
            setLoading(false);
            return;
          }
        }

        // If we don't have IMDb ID, fetch it from TMDB
        if (!imdbId && tmdbId) {
          if (options.mediaType === 'tv') {
            imdbId = await getImdbIdFromTMDBSeries(tmdbId);
          } else {
            imdbId = await getImdbIdFromTMDB(tmdbId);
          }
        }

        // Now fetch the rating from OMDb
        if (imdbId) {
          const fetchedRating = await getIMDbRating(imdbId);
          setRating(fetchedRating);

          // Cache the result if we have TMDB ID
          if (tmdbId) {
            await saveIMDbRating(
              tmdbId,
              imdbId,
              fetchedRating,
              options.mediaType || 'movie'
            );
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch rating');
        console.error('Error fetching IMDb rating:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [options.imdbId, options.tmdbId, options.mediaType]);

  return { rating, loading, error };
};

export default useIMDbRating;
