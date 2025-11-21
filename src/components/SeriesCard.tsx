import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Series {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
}

const SeriesCard = ({ series }: { series: Series }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      checkIfFavorite();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const checkIfFavorite = async () => {
    if (!currentUserId) return;
    try {
      const { data } = await supabase
        .from('favorite_movies')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('movie_id', series.id)
        .limit(1);
      setIsFavorite(data && data.length > 0);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const handleAddToFavorites = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      toast({
        title: "Error",
        description: "Please sign in to add favorites",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorite_movies')
          .delete()
          .eq('user_id', currentUserId)
          .eq('movie_id', series.id);
        setIsFavorite(false);
        toast({
          title: "Success",
          description: "Removed from favorites",
        });
      } else {
        // Add to favorites
        const { data: maxRank } = await supabase
          .from('favorite_movies')
          .select('rank')
          .eq('user_id', currentUserId)
          .order('rank', { ascending: false })
          .limit(1)
          .single();

        await supabase.from('favorite_movies').insert({
          user_id: currentUserId,
          movie_id: series.id,
          rank: (maxRank?.rank || 0) + 1,
        });
        setIsFavorite(true);
        toast({
          title: "Success",
          description: "Added to favorites",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
      <Card className="overflow-hidden hover-lift cursor-pointer group relative">
        <div className="aspect-[2/3] relative overflow-hidden">
          <img
            src={series.poster}
            alt={series.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image';
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
              <span className="text-sm font-semibold">{series.rating.toFixed(1)}</span>
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