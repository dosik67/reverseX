// OMDb API configuration for IMDb ratings
// Using Vercel API proxy to bypass CORS
const OMDB_PROXY_URL = '/api/omdb-proxy';

export interface OMDbRating {
  imdbId: string;
  imdbRating: number | null;
  imdbVotes: number | null;
  imdbType: string;
}

export interface OMDbResponse {
  imdbID: string;
  imdbRating: string;
  imdbVotes: string;
  Type: string;
  Response: string;
}

// Cache for ratings to avoid excessive API calls
const ratingCache = new Map<string, OMDbRating>();
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Get IMDb rating for a specific IMDb ID
 */
export const getIMDbRating = async (imdbId: string): Promise<OMDbRating | null> => {
  if (!imdbId || !imdbId.startsWith('tt')) {
    return null;
  }

  // Check cache first
  const cached = ratingCache.get(imdbId);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(OMDB_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imdbId })
    });

    if (!response.ok) {
      console.error(`OMDb API error: ${response.status}`);
      return null;
    }

    const data: OMDbResponse = await response.json();

    if (data.Response === 'False') {
      console.warn(`IMDb ID not found: ${imdbId}`);
      return null;
    }

    const rating: OMDbRating = {
      imdbId,
      imdbRating: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null,
      imdbVotes: data.imdbVotes !== 'N/A' ? parseInt(data.imdbVotes.replace(/,/g, '')) : null,
      imdbType: data.Type
    };

    // Cache the result
    ratingCache.set(imdbId, rating);

    return rating;
  } catch (error) {
    console.error('Error fetching IMDb rating:', error);
    return null;
  }
};

/**
 * Get ratings for multiple IMDb IDs (with rate limiting)
 */
export const getMultipleIMDbRatings = async (
  imdbIds: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, OMDbRating>> => {
  const results = new Map<string, OMDbRating>();
  const delayBetweenRequests = 100; // 100ms delay between requests to avoid rate limiting

  for (let i = 0; i < imdbIds.length; i++) {
    const imdbId = imdbIds[i];
    const rating = await getIMDbRating(imdbId);

    if (rating) {
      results.set(imdbId, rating);
    }

    if (onProgress) {
      onProgress(i + 1, imdbIds.length);
    }

    // Add delay between requests except for the last one
    if (i < imdbIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
    }
  }

  return results;
};

/**
 * Clear the rating cache
 */
export const clearRatingCache = () => {
  ratingCache.clear();
};

/**
 * Get cache size
 */
export const getCacheSize = () => {
  return ratingCache.size;
};

export default {
  getIMDbRating,
  getMultipleIMDbRatings,
  clearRatingCache,
  getCacheSize
};
