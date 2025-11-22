import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Expand, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import supabase from "@/utils/supabase";
import { toast } from "sonner";

interface Movie {
  id: number;
  title: string;
  russian?: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
}

interface TopList {
  id: string;
  title: string;
  media_type: 'movie' | 'anime';
  items?: TopListItem[];
}

interface TopListItem {
  id: string;
  rank: number;
  title?: string;
  poster_url?: string;
  item_id: string;
}

const CATEGORIES = [
  { id: 'movie', label: 'Movies', icon: '🎬' },
  { id: 'anime', label: 'Series', icon: '📺' },
];

interface Top50ProfileProps {
  userId: string;
  isOwnProfile: boolean;
}

const Top50Profile = ({ userId, isOwnProfile }: Top50ProfileProps) => {
  const [activeCategory, setActiveCategory] = useState<'movie' | 'anime'>('movie');
  const [lists, setLists] = useState<TopList[]>([]);
  const [selectedList, setSelectedList] = useState<TopList | null>(null);
  const [showExpanded, setShowExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadLists();
    loadAllMovies();
  }, [userId]);

  useEffect(() => {
    const list = lists.find(l => l.media_type === activeCategory);
    setSelectedList(list || null);
  }, [activeCategory, lists]);

  const loadLists = async () => {
    try {
      setLoading(true);
      const { data: listsData } = await supabase
        .from('top_lists')
        .select('*')
        .eq('user_id', userId);

      if (!listsData) {
        setLists([]);
        return;
      }

      const listsWithItems = await Promise.all(
        listsData.map(async (list) => {
          const { data: items } = await supabase
            .from('top_list_items')
            .select('*')
            .eq('top_list_id', list.id)
            .order('rank');
          return { ...list, items: items || [] };
        })
      );

      setLists(listsWithItems);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllMovies = async () => {
    try {
      const response = await fetch('/data/movies.json');
      const data = await response.json();
      setAllMovies(data);
    } catch (error) {
      console.error('Error loading movies:', error);
    }
  };

  const addItemToList = async (movie: Movie) => {
    if (!selectedList || !isOwnProfile) return;

    try {
      const nextRank = (selectedList.items?.length || 0) + 1;

      await supabase.from('top_list_items').insert({
        top_list_id: selectedList.id,
        item_id: movie.id.toString(),
        rank: nextRank,
        title: movie.title,
        poster_url: movie.poster,
      });

      toast.success('Added to top list');
      loadLists();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const removeItemFromList = async (itemId: string) => {
    if (!selectedList || !isOwnProfile) return;

    try {
      await supabase.from('top_list_items').delete().eq('id', itemId);
      toast.success('Removed from list');
      loadLists();
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const createDefaultLists = async () => {
    try {
      for (const category of CATEGORIES) {
        const { data: existing } = await supabase
          .from('top_lists')
          .select('id')
          .eq('user_id', userId)
          .eq('media_type', category.id)
          .single();

        if (!existing) {
          await supabase.from('top_lists').insert({
            user_id: userId,
            title: `Top 50 ${category.label}`,
            media_type: category.id,
          });
        }
      }
      loadLists();
      toast.success('Lists created!');
    } catch (error) {
      console.error('Error creating lists:', error);
    }
  };

  const filteredMovies = allMovies.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.russian?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDisplayItems = () => {
    return (selectedList?.items || []).slice(0, 3);
  };

  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold gradient-text">
              ⭐ My Top 50
            </h3>
            {isOwnProfile && !lists.length && (
              <Button onClick={createDefaultLists} variant="outline" size="sm">
                Create Lists
              </Button>
            )}
          </div>

          {/* Category Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                const currentIdx = CATEGORIES.findIndex(c => c.id === activeCategory);
                const prevIdx = (currentIdx - 1 + CATEGORIES.length) % CATEGORIES.length;
                setActiveCategory(CATEGORIES[prevIdx].id as any);
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-2 flex-1">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id as any)}
                  className="flex-1"
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </Button>
              ))}
            </div>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                const currentIdx = CATEGORIES.findIndex(c => c.id === activeCategory);
                const nextIdx = (currentIdx + 1) % CATEGORIES.length;
                setActiveCategory(CATEGORIES[nextIdx].id as any);
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Top 3 Preview */}
        <div className="space-y-3 mb-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : getDisplayItems().length > 0 ? (
            getDisplayItems().map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-border hover:border-primary transition-colors">
                <span className="font-bold text-lg text-primary w-8">#{item.rank}</span>
                {item.poster_url && (
                  <img 
                    src={item.poster_url.replace('/w500/', '/w342/')} 
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{item.title}</h4>
                </div>
                {isOwnProfile && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeItemFromList(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {isOwnProfile ? 'Empty list. Click "Add Items" to get started!' : 'No items yet'}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isOwnProfile && (
            <Button 
              onClick={() => setShowAddDialog(true)}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Items
            </Button>
          )}
          {(selectedList?.items?.length || 0) > 3 && (
            <Button
              onClick={() => setShowExpanded(true)}
              className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg"
            >
              <Expand className="w-4 h-4" />
              Show All {selectedList?.items?.length}
            </Button>
          )}
        </div>
      </Card>

      {/* Add Items Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Items to {selectedList?.title}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <Input
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {filteredMovies.map((movie) => {
                  const isAdded = selectedList?.items?.some(i => i.item_id === movie.id.toString());
                  return (
                    <div 
                      key={movie.id}
                      className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors"
                    >
                      {movie.poster && (
                        <img 
                          src={movie.poster.replace('/w500/', '/w342/')} 
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{movie.title}</h4>
                        <p className="text-sm text-muted-foreground">⭐ {movie.rating.toFixed(1)}</p>
                      </div>
                      <Button
                        onClick={() => {
                          addItemToList(movie);
                        }}
                        disabled={isAdded}
                        variant={isAdded ? 'secondary' : 'default'}
                        size="sm"
                      >
                        {isAdded ? '✓ Added' : 'Add'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded View Modal */}
      <Dialog open={showExpanded} onOpenChange={setShowExpanded}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-3xl gradient-text">
              ⭐ {selectedList?.title} - All {selectedList?.items?.length} Items
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2 p-4">
              {selectedList?.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-card/50 rounded-lg border border-border hover:border-primary transition-colors group"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
                      {item.rank}
                    </div>
                  </div>

                  {item.poster_url && (
                    <img
                      src={item.poster_url.replace('/w500/', '/w342/')}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>

                  {isOwnProfile && (
                    <Button
                      onClick={() => removeItemFromList(item.id)}
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Top50Profile;
