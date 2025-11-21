import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const MovieCard = ({ movie }: { movie: Movie }) => {
  const [imageError, setImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentUser();
    checkIfFavorite();
  }, [movie.id]);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUserId(data.user?.id || null);
  };

  const checkIfFavorite = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    const { data: favorite } = await supabase
      .from('favorite_movies')
      .select('id')
      .eq('user_id', data.user.id)
      .eq('movie_id', movie.id)
      .single();

    setIsFavorite(!!favorite);
  };

  const handleAddToFavorites = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      toast.error('Please sign in to add favorites');
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
          .eq('movie_id', movie.id);

        setIsFavorite(false);
        toast.success('Removed from favorites');
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
          movie_id: movie.id,
          rank: (maxRank?.rank || 0) + 1,
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
  };

  const getPosterUrl = () => {
    if (!movie.poster || imageError) {
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"%3E%3Crect fill="%231a1a2e" width="300" height="450"/%3E%3Ctext x="150" y="225" font-size="20" fill="%23666" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
    }
    return movie.poster;
  };

  return (
    <Link to={`/movie/${movie.id}`}>
      <Card className="overflow-hidden hover-lift cursor-pointer group relative">
        <div className="aspect-[2/3] relative overflow-hidden">
          <img
            src={getPosterUrl()}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Favorite Button */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleAddToFavorites}
              disabled={loading}
              className={`${isFavorite ? 'text-red-500' : 'text-white'}`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-1 text-yellow-400 mb-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-semibold">{movie.rating.toFixed(1)}</span>
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