import { useState, useEffect } from 'react';
import { Trash2, Star, Search, Filter, MoreVertical, BookmarkIcon, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import * as bookmarkService from '@/services/bookmarkService';
import { ContentBookmark, ContentStatus, CONTENT_STATUS_CONFIG } from '@/types/anime';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

const BookmarkCard = ({ 
  bookmark, 
  onDelete, 
  onStatusChange,
  onRatingChange
}: { 
  bookmark: ContentBookmark; 
  onDelete: () => void;
  onStatusChange: (newStatus: ContentStatus) => void;
  onRatingChange: (newRating: number) => void;
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState<string>((bookmark.userRating || 0).toString());
  const config = CONTENT_STATUS_CONFIG[bookmark.status];
  const statuses: ContentStatus[] = ['favorite', 'watching', 'planned', 'watched', 'postponed', 'dropped'];

  const handlePosterClick = () => {
    const contentTypeRoute = bookmark.contentType === 'movie' ? 'movie' : 
                           bookmark.contentType === 'series' ? 'series' : 'game';
    navigate(`/${contentTypeRoute}/${bookmark.contentId}`);
  };

  const handleRatingSubmit = async () => {
    try {
      const rating = parseFloat(userRating);
      if (isNaN(rating) || rating < 0 || rating > 10) {
        toast.error('Рейтинг должен быть от 0 до 10');
        return;
      }
      await onRatingChange(rating);
      setShowRatingModal(false);
      toast.success('Рейтинг обновлён');
    } catch (error) {
      toast.error('Ошибка при обновлении рейтинга');
    }
  };

  const handleStatusChange = async (newStatus: ContentStatus) => {
    try {
      await onStatusChange(newStatus);
      setShowMenu(false);
      toast.success('Статус обновлён');
    } catch (error) {
      toast.error('Ошибка при обновлении статуса');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Вы уверены? Закладка будет удалена.');
    if (confirmed) {
      try {
        await onDelete();
        setShowMenu(false);
        toast.success('Закладка удалена');
      } catch (error) {
        toast.error('Ошибка при удалении');
      }
    }
  };

  return (
    <Card className="overflow-visible hover:shadow-lg transition-all duration-300 bg-zinc-900 border-zinc-800 hover:border-purple-500/30">
      <div className="flex gap-4 p-4">
        {/* Poster - Clickable */}
        <div className="flex-shrink-0">
          {bookmark.posterUrl ? (
            <img
              src={bookmark.posterUrl}
              alt={bookmark.title}
              onClick={handlePosterClick}
              className="w-[80px] h-[120px] object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="120"%3E%3Crect fill="%23333" width="80" height="120"/%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="w-[80px] h-[120px] bg-zinc-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-700 transition-colors">
              <span className="text-xs text-zinc-500">Нет постера</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col relative">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base leading-tight line-clamp-2 mb-1">
                {bookmark.title}
              </h3>
              {bookmark.releaseYear && (
                <p className="text-xs text-zinc-500 font-medium">{bookmark.releaseYear}</p>
              )}
            </div>
            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white flex-shrink-0 ml-2"
                title="Меню"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {/* Dropdown Menu - positioned to left to avoid cutoff */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-20 min-w-[200px]">
                  <div className="py-1">
                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Мой рейтинг ({(bookmark.userRating || 0).toFixed(1)}/10)
                    </button>
                    
                    <div className="border-t border-zinc-700 my-1" />
                    
                    <div className="px-2 py-1">
                      <p className="text-xs text-zinc-400 font-semibold px-2 py-1">Изменить статус:</p>
                      {statuses.map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`w-full text-left px-4 py-2 text-xs transition-colors rounded ${
                            bookmark.status === status
                              ? 'bg-purple-500/30 text-purple-400 font-semibold'
                              : 'text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {CONTENT_STATUS_CONFIG[status].label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="border-t border-zinc-700 my-1" />
                    
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Удалить закладку
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Genre */}
          {bookmark.genre && (
            <p className="text-xs text-zinc-400 mb-2 line-clamp-1">{bookmark.genre}</p>
          )}

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mb-2">
            {bookmark.totalItems && (
              <span className="flex items-center gap-1">
                <span className="text-zinc-500">•</span>
                <span>{bookmark.totalItems} эп.</span>
              </span>
            )}
            {bookmark.isFavorite && (
              <span className="flex items-center gap-1 text-amber-400">
                <BookmarkIcon className="w-3 h-3 fill-current" />
                <span>Избранное</span>
              </span>
            )}
            {bookmark.progress !== undefined && bookmark.totalItems && (
              <span className="flex items-center gap-1">
                <span className="text-zinc-500">•</span>
                <span>{bookmark.progress}/{bookmark.totalItems}</span>
              </span>
            )}
            {bookmark.externalRating && (
              <span className="flex items-center gap-1">
                <span className="text-zinc-500">•</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-yellow-400">{bookmark.externalRating.toFixed(1)}</span>
              </span>
            )}
          </div>

          {/* Description - Show if available */}
          {bookmark.synopsis && (
            <p className="text-xs text-zinc-400 line-clamp-2 mb-2 leading-relaxed">
              {bookmark.synopsis}
            </p>
          )}

          {/* User Notes */}
          {bookmark.notes && bookmark.notes !== bookmark.synopsis && (
            <p className="text-xs text-zinc-500 italic line-clamp-1 mb-2 border-l-2 border-purple-500/30 pl-2">
              &quot;{bookmark.notes}&quot;
            </p>
          )}

          {/* Status Badge - Bottom */}
          <div className="mt-auto pt-2 border-t border-zinc-800/50">
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold w-fit ${config.bgColor} ${config.color}`}>
              {config.label}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRatingModal(false)}>
          <Card className="bg-zinc-900 border-zinc-800 w-80 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Ваш рейтинг</h3>
            
            <div className="mb-6">
              <div className="mb-4">
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={userRating}
                  onChange={(e) => setUserRating(e.target.value)}
                  placeholder="Введите рейтинг (0-10)"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-center text-2xl font-bold"
                />
              </div>
              <p className="text-center text-sm text-zinc-400">
                Введите значение от 0 до 10 (например: 5.5, 7.6, 8.0)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors text-sm font-medium"
              >
                Отмена
              </button>
              <button
                onClick={handleRatingSubmit}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
              >
                Сохранить
              </button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default function BookmarksNew() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<ContentBookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<ContentBookmark[]>([]);
  const [activeTab, setActiveTab] = useState<ContentStatus>('planned');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('date');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<ContentStatus, number>>({
    favorite: 0,
    watching: 0,
    planned: 0,
    watched: 0,
    postponed: 0,
    dropped: 0
  });

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const loadBookmarks = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await bookmarkService.getUserBookmarks(user.id);
        setBookmarks(data);

        const newStats = {
          favorite: 0,
          watching: 0,
          planned: 0,
          watched: 0,
          postponed: 0,
          dropped: 0
        };

        data.forEach(bookmark => {
          newStats[bookmark.status]++;
        });

        setStats(newStats);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [user?.id]);

  useEffect(() => {
    let filtered = bookmarks.filter(b => b.status === activeTab);

    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.externalRating || 0) - (a.externalRating || 0));
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    setFilteredBookmarks(filtered);
  }, [activeTab, searchQuery, sortBy, bookmarks]);

  const handleDelete = async (id: string) => {
    try {
      await bookmarkService.deleteBookmark(id);
      setBookmarks(bookmarks.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ContentStatus) => {
    try {
      const updatedBookmark = await bookmarkService.updateBookmarkStatus(id, newStatus);
      setBookmarks(bookmarks.map(b => b.id === id ? updatedBookmark : b));
    } catch (error) {
      console.error('Error updating bookmark status:', error);
      throw error;
    }
  };

  const handleRatingChange = async (id: string, newRating: number) => {
    try {
      const updatedBookmark = await bookmarkService.updateBookmarkRating(id, newRating);
      setBookmarks(bookmarks.map(b => b.id === id ? updatedBookmark : b));
    } catch (error) {
      console.error('Error updating bookmark rating:', error);
      throw error;
    }
  };

  const config = CONTENT_STATUS_CONFIG;
  const statuses: ContentStatus[] = ['favorite', 'watching', 'planned', 'watched', 'postponed', 'dropped'];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-white">Требуется вход</h2>
          <p className="text-zinc-400">Пожалуйста, войдите чтобы просмотреть свои закладки</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Material Design 3 AppBar */}
      <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white">В планах</h1>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Tab Bar */}
        <div className="border-t border-zinc-800 overflow-x-auto">
          <div className="container mx-auto px-4 flex gap-0">
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === status
                    ? `text-white border-b-2`
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
                style={activeTab === status ? { borderBottomColor: '#a78bfa' } : {}}
              >
                {config[status].label}
                <span className="ml-2 text-xs bg-zinc-800 text-zinc-300 rounded-full px-2 py-0.5">
                  {stats[status]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
          <div className="text-sm font-medium text-zinc-400">
            {filteredBookmarks.length} ВСЕГО
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-zinc-800 text-white text-sm font-medium rounded hover:bg-zinc-700 transition-colors cursor-pointer border border-zinc-700"
            >
              <option value="date">По добавлению</option>
              <option value="rating">По рейтингу</option>
              <option value="title">По названию</option>
            </select>
            <button className="p-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors border border-zinc-700">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-2">Нет элементов в этой категории</p>
            <p className="text-sm text-zinc-500">Добавьте контент чтобы начать</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookmarks.map(bookmark => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={() => handleDelete(bookmark.id)}
                onStatusChange={(newStatus) => handleStatusChange(bookmark.id, newStatus)}
                onRatingChange={(newRating) => handleRatingChange(bookmark.id, newRating)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
