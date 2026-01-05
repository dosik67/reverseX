import { useState, useEffect } from 'react';
import { Trash2, Star, Search, Filter, MoreVertical, BookmarkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import * as bookmarkService from '@/services/bookmarkService';
import { ContentBookmark, ContentStatus, CONTENT_STATUS_CONFIG } from '@/types/anime';
import supabase from '@/lib/supabase';

const BookmarkCard = ({ bookmark, onDelete }: { bookmark: ContentBookmark; onDelete: () => void }) => {
  const config = CONTENT_STATUS_CONFIG[bookmark.status];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-zinc-900 border-zinc-800">
      <div className="flex gap-4 p-4">
        {/* Poster */}
        <div className="flex-shrink-0">
          {bookmark.posterUrl ? (
            <img
              src={bookmark.posterUrl}
              alt={bookmark.title}
              className="w-[80px] h-[120px] object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="120"%3E%3Crect fill="%23333" width="80" height="120"/%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="w-[80px] h-[120px] bg-zinc-800 rounded-lg flex items-center justify-center">
              <span className="text-xs text-zinc-500">Нет</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm leading-tight line-clamp-2">
                {bookmark.title}
              </h3>
              {bookmark.genre && (
                <p className="text-xs text-zinc-400 mt-1">{bookmark.genre}</p>
              )}
            </div>
            <button
              onClick={onDelete}
              className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-red-500"
              title="Удалить"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Rating and Episodes */}
          <div className="flex items-center gap-4 mb-2 text-xs text-zinc-400">
            {bookmark.totalItems && (
              <span>{bookmark.totalItems} эп.</span>
            )}
            {bookmark.externalRating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-yellow-400">{bookmark.externalRating.toFixed(1)}</span>
              </div>
            )}
            {bookmark.isFavorite && (
              <BookmarkIcon className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            )}
          </div>

          {/* Description */}
          {bookmark.notes && (
            <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
              {bookmark.notes}
            </p>
          )}

          {/* Status Badge and Progress */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
              {config.label}
            </div>
            {bookmark.progress !== undefined && bookmark.totalItems && (
              <div className="text-xs text-zinc-400">
                {bookmark.progress}/{bookmark.totalItems}
              </div>
            )}
          </div>
        </div>
      </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookmarks.map(bookmark => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={() => handleDelete(bookmark.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
