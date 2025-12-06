import { useState, useEffect, useRef } from 'react';
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
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchRating = async () => {
      if (!options.imdbId && !options.tmdbId) {
        setRating(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let imdbId = options.imdbId;
        const tmdbId = options.tmdbId;

        // Try to get from cache first if we have TMDB ID
        if (tmdbId && !imdbId) {
          const cached = await getCachedIMDbRating(tmdbId);
          if (cached && cached.imdb_rating && isMountedRef.current) {
            const ratingObj: OMDbRating = {
              imdbId: cached.imdb_id || '',
              imdbRating: cached.imdb_rating,
              imdbVotes: cached.imdb_votes,
              imdbType: options.mediaType === 'tv' ? 'series' : 'movie'
            };
            setRating(ratingObj);
            setLoading(false);
            return;
          }
          
          // If no cache but we have imdb_id, use it
          if (cached && cached.imdb_id) {
            imdbId = cached.imdb_id;
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
        if (imdbId && isMountedRef.current) {
          const fetchedRating = await getIMDbRating(imdbId);
          
          if (isMountedRef.current) {
            setRating(fetchedRating);

            // Cache the result if we have TMDB ID
            if (tmdbId && fetchedRating) {
              await saveIMDbRating(
                tmdbId,
                imdbId,
                fetchedRating,
                options.mediaType || 'movie'
              );
            }
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch rating');
          console.error('Error fetching IMDb rating:', err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchRating();
  }, [options.tmdbId, options.imdbId, options.mediaType]);

  return { rating, loading, error };
};

export default useIMDbRating;
