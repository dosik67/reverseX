import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import supabase from "@/utils/supabase";
import { toast } from "sonner";

interface Movie {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  russian?: string;
  description?: string;
}

const FALLBACK_IMAGE = 'https://placehold.co/342x513/1a1a2e/ffffff?text=No+Image';

const MovieCard = ({ movie }: { movie: Movie }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Memoize the current user getter
  const getCurrentUser = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
      return data.user?.id;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }, []);

  // Memoize the favorite checker
  const checkIfFavorite = useCallback(async (userId?: string | null) => {
    const userIdToUse = userId || currentUserId;
    if (!userIdToUse) return;

    try {
      const { data: topList } = await supabase
        .from('top_lists')
        .select('id')
        .eq('user_id', userIdToUse)
        .eq('media_type', 'movie')
        .single();

      if (!topList) {
        setIsFavorite(false);
        return;
      }

      const { data: item } = await supabase
        .from('top_list_items')
        .select('id')
        .eq('top_list_id', topList.id)
        .eq('item_id', movie.id.toString())
        .single();

      setIsFavorite(!!item);
    } catch (error) {
      // Handle not found errors gracefully
      if ((error as any).code !== 'PGRST116') {
        console.error('Error checking favorite:', error);
      }
      setIsFavorite(false);
    }
  }, [movie.id, currentUserId]);

  // Initialize user and check favorite status
  useEffect(() => {
    const initializeUser = async () => {
      const userId = await getCurrentUser();
      if (userId) {
        checkIfFavorite(userId);
      }
    };

    initializeUser();
  }, [getCurrentUser, checkIfFavorite]);

  const handleAddToFavorites = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!currentUserId) {
        toast.error('Please sign in to add favorites');
        return;
      }

      setLoading(true);
      try {
        if (isFavorite) {
          // Remove from top list
          const { data: topList } = await supabase
            .from('top_lists')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('media_type', 'movie')
            .single();

          if (topList) {
            await supabase
              .from('top_list_items')
              .delete()
              .eq('top_list_id', topList.id)
              .eq('item_id', movie.id.toString());
          }

          setIsFavorite(false);
          toast.success('Removed from Top 50');
        } else {
          // Get or create top list
          const { data: existingList } = await supabase
            .from('top_lists')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('media_type', 'movie')
            .single();

          let topListId = existingList?.id;

          if (!topListId) {
            const { data: newList } = await supabase
              .from('top_lists')
              .insert({
                user_id: currentUserId,
                title: 'Top 50 Movies',
                media_type: 'movie',
              })
              .select('id')
              .single();

            topListId = newList?.id;
          }

          if (topListId) {
            // Get next rank
            const { data: items } = await supabase
              .from('top_list_items')
              .select('rank')
              .eq('top_list_id', topListId)
              .order('rank', { ascending: false })
              .limit(1);

            const nextRank = (items?.[0]?.rank || 0) + 1;

            await supabase.from('top_list_items').insert({
              top_list_id: topListId,
              item_id: movie.id.toString(),
              rank: nextRank,
              title: movie.title,
              poster_url: movie.poster,
            });
          }

          setIsFavorite(true);
          toast.success('Added to Top 50');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to update Top 50');
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, isFavorite, movie.id]
  );

  // Memoize poster URL
  const posterUrl = useMemo(() => {
    if (!movie.poster) return FALLBACK_IMAGE;
    // Use smaller image size from TMDB for faster loading
    return movie.poster.replace('/w500/', '/w342/');
  }, [movie.poster]);

  return (
    <Link to={`/movie/${movie.id}`}>
      <Card className="overflow-hidden hover-lift cursor-pointer group relative">
        <div className="aspect-[2/3] relative overflow-hidden bg-muted">
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <button
            onClick={handleAddToFavorites}
            disabled={loading}
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
          >
            <Heart
              className="w-5 h-5 transition-colors"
              fill={isFavorite ? "#ef4444" : "none"}
              color={isFavorite ? "#ef4444" : "white"}
            />
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-1 text-yellow-400 mb-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-semibold">{Number(movie.rating).toFixed(1)}</span>
            </div>
            <h3 className="text-sm font-semibold text-white line-clamp-2">{movie.title}</h3>
            <p className="text-xs text-white/70">{movie.year}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default MovieCard;
