import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import supabase from "@/utils/supabase";
import { toast } from "sonner";

interface Series {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
}

const FALLBACK_IMAGE = 'https://placehold.co/342x513/1a1a2e/ffffff?text=No+Image';

const SeriesCard = ({ series }: { series: Series }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const checkIfFavorite = useCallback(async (userId?: string | null) => {
    const userIdToUse = userId || currentUserId;
    if (!userIdToUse) return;

    try {
      const { data: favorite } = await supabase
        .from('favorite_movies')
        .select('id')
        .eq('user_id', userIdToUse)
        .eq('movie_id', series.id)
        .single();

      setIsFavorite(!!favorite);
    } catch (error) {
      if ((error as any).code !== 'PGRST116') {
        console.error('Error checking favorite:', error);
      }
    }
  }, [series.id, currentUserId]);

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
          await supabase
            .from('favorite_movies')
            .delete()
            .eq('user_id', currentUserId)
            .eq('movie_id', series.id);
          setIsFavorite(false);
          toast.success('Removed from favorites');
        } else {
          // Add to favorites - use timestamp for instant rank
          await supabase.from('favorite_movies').insert({
            user_id: currentUserId,
            movie_id: series.id,
            rank: Date.now(),
          });
          setIsFavorite(true);
          toast.success('Added to favorites');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to update favorites');
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, isFavorite, series.id]
  );

  const posterUrl = useMemo(() => {
    if (!series.poster) return FALLBACK_IMAGE;
    return series.poster.replace('/w500/', '/w342/');
  }, [series.poster]);

  return (
    <Link to={`/series/${series.id}`}>
      <Card className="overflow-hidden hover-lift cursor-pointer group relative">
        <div className="aspect-[2/3] relative overflow-hidden bg-muted">
          <img
            src={posterUrl}
            alt={series.title}
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
              <span className="text-sm font-semibold">{Number(series.rating).toFixed(1)}</span>
            </div>
            <h3 className="text-sm font-semibold text-white line-clamp-2">{series.title}</h3>
            <p className="text-xs text-white/70">{series.year}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default SeriesCard;
