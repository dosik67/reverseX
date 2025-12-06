import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Expand, Trash2, GripVertical, Crown, Award } from "lucide-react";
import supabase from "@/utils/supabase";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "@/styles/top50.css";

interface TopList {
  id: string;
  title: string;
  media_type: 'movie' | 'anime' | 'game';
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
  { id: 'game', label: 'Games', icon: '🎮' },
];

interface Top50ProfileProps {
  userId: string;
  isOwnProfile: boolean;
}

const SortableItem = ({ item, isOwnProfile, onRemove, mediaType }: { item: TopListItem; isOwnProfile: boolean; onRemove: () => void; mediaType: 'movie' | 'anime' | 'game' }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-border hover:border-primary transition-colors group"
    >
      {isOwnProfile && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <span className="font-bold text-lg text-primary w-8">#{item.rank}</span>
      {item.poster_url && (
        <Link 
          to={`/${mediaType === 'movie' ? 'movie' : mediaType === 'anime' ? 'series' : 'game'}/${item.item_id}`}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <img 
            src={item.poster_url.replace('/w500/', '/w342/')} 
            alt={item.title}
            className="w-12 h-16 object-cover rounded cursor-pointer hover:scale-105 transition-transform"
          />
        </Link>
      )}
      <Link 
        to={`/${mediaType === 'movie' ? 'movie' : 'series'}/${item.item_id}`}
        className="flex-1 min-w-0 hover:text-primary transition-colors"
      >
        <h4 className="font-semibold truncate cursor-pointer">{item.title}</h4>
      </Link>
      {isOwnProfile && (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

const TopRankItem = ({ item, rank, isOwnProfile, onRemove, mediaType }: { item: TopListItem; rank: number; isOwnProfile: boolean; onRemove: () => void; mediaType: 'movie' | 'anime' | 'game' }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getFrameClass = () => {
    switch (rank) {
      case 1:
        return 'top-rank-1';
      case 2:
        return 'top-rank-2';
      case 3:
        return 'top-rank-3';
      default:
        return 'top-rank-regular';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${rank <= 3 ? 'col-span-1' : ''}`}
    >
      {/* Main Card */}
      <div className={`relative group ${getFrameClass()} overflow-hidden transition-all duration-300 cursor-pointer`}>
        {/* Link Wrapper */}
        <Link 
          to={`/${mediaType === 'movie' ? 'movie' : mediaType === 'anime' ? 'series' : 'game'}/${item.item_id}`}
          className="relative block overflow-hidden h-full"
        >
          {/* Poster */}
          {item.poster_url && (
            <img 
              src={item.poster_url} 
              alt={item.title}
              className="w-full h-auto object-cover"
            />
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
        </Link>

        {/* Rank Badge */}
        <div className={`absolute top-2 right-2 md:top-3 md:right-3 ${
          rank === 1 ? 'rank-badge-1' :
          rank === 2 ? 'rank-badge-2' :
          rank === 3 ? 'rank-badge-3' :
          'rank-badge-regular'
        } rounded-full font-bold shadow-lg flex items-center justify-center z-20`}>
          <span className="relative z-10">
            {rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
          </span>
        </div>

        {/* Title Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
          <Link 
            to={`/${mediaType === 'movie' ? 'movie' : 'series'}/${item.item_id}`}
            className="block hover:text-primary transition-colors"
          >
            <h4 className="font-bold text-white text-sm md:text-base line-clamp-2 drop-shadow-lg">{item.title}</h4>
          </Link>
        </div>

        {/* Delete Button */}
        {isOwnProfile && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onRemove}
            className="absolute top-2 left-2 md:top-3 md:left-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-red-500/80 text-white rounded-full shadow-lg z-20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}

        {/* Drag Handle */}
        {isOwnProfile && (
          <div 
            {...attributes} 
            {...listeners} 
            className="absolute bottom-2 left-2 md:bottom-3 md:left-3 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1.5 md:p-2 rounded-full shadow-lg z-20"
          >
            <GripVertical className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

const Top50Profile = ({ userId, isOwnProfile }: Top50ProfileProps) => {
  const [activeCategory, setActiveCategory] = useState<'movie' | 'anime'>('movie');
  const [lists, setLists] = useState<TopList[]>([]);
  const [selectedList, setSelectedList] = useState<TopList | null>(null);
  const [showExpanded, setShowExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadLists();
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

  const handleDragEnd = async (event: any) => {
    if (!isOwnProfile || !selectedList) return;

    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedList.items?.findIndex(item => item.id === active.id) || 0;
      const newIndex = selectedList.items?.findIndex(item => item.id === over.id) || 0;

      const newItems = arrayMove(selectedList.items || [], oldIndex, newIndex);
      const reorderedItems = newItems.map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

      // Update UI optimistically
      setSelectedList({
        ...selectedList,
        items: reorderedItems,
      });

      // Update database
      try {
        await Promise.all(
          reorderedItems.map(item =>
            supabase
              .from('top_list_items')
              .update({ rank: item.rank })
              .eq('id', item.id)
          )
        );
        toast.success('Order updated');
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error('Failed to update order');
        loadLists();
      }
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

        {/* Info Text */}
        {isOwnProfile && (
          <p className="text-sm text-muted-foreground mb-4 text-center">
            💡 Click heart button on movies to add them here • Drag to reorder
          </p>
        )}

        {/* Top 3 Preview */}
        <div className="space-y-3 mb-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : getDisplayItems().length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={getDisplayItems().map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {getDisplayItems().map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      isOwnProfile={isOwnProfile}
                      mediaType={selectedList?.media_type || 'movie'}
                      onRemove={() => removeItemFromList(item.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {isOwnProfile ? 'Empty list. Add movies from the site by clicking the heart button!' : 'No items yet'}
            </p>
          )}
        </div>

        {/* Show More Button */}
        {(selectedList?.items?.length || 0) > 3 && (
          <Button
            onClick={() => setShowExpanded(true)}
            className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg"
          >
            <Expand className="w-4 h-4" />
            Show All {selectedList?.items?.length}
          </Button>
        )}
      </Card>

      {/* Expanded View Modal */}
      <Dialog open={showExpanded} onOpenChange={setShowExpanded}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0 bg-gradient-to-br from-background via-background to-background/80">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-b from-background to-background/80 backdrop-blur-sm border-b border-primary/20 p-4 md:p-6">
            <DialogTitle className="text-2xl md:text-4xl font-bold gradient-text flex items-center gap-2 md:gap-3">
              <span className="text-4xl md:text-5xl">⭐</span>
              <span className="line-clamp-1">{selectedList?.title}</span>
            </DialogTitle>
            <p className="text-muted-foreground mt-1 md:mt-2 text-xs md:text-sm">
              {selectedList?.items?.length === 0 ? 'Empty list' : `Showing ${selectedList?.items?.length} items`}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6">
              {selectedList?.items && selectedList.items.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedList.items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {/* Top 3 - Premium Display */}
                    <div className="mb-8 md:mb-12">
                      <h3 className="text-lg md:text-xl font-bold text-primary mb-3 md:mb-4 flex items-center gap-2">
                        <span className="text-2xl">🏆</span> Top 3
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {selectedList.items.slice(0, 3).map((item) => (
                          <TopRankItem
                            key={item.id}
                            item={item}
                            rank={item.rank}
                            isOwnProfile={isOwnProfile}
                            mediaType={selectedList?.media_type || 'movie'}
                            onRemove={() => {
                              removeItemFromList(item.id);
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Rest of Items - Grid */}
                    {selectedList.items.length > 3 && (
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-muted-foreground mb-3 md:mb-4">More Titles</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                          {selectedList.items.slice(3).map((item) => (
                            <TopRankItem
                              key={item.id}
                              item={item}
                              rank={item.rank}
                              isOwnProfile={isOwnProfile}
                              mediaType={selectedList?.media_type || 'movie'}
                              onRemove={() => {
                                removeItemFromList(item.id);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <p className="text-muted-foreground text-base md:text-lg">
                    {isOwnProfile ? 'Empty list. Add items by clicking the heart button!' : 'No items yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Top50Profile;
