import { useState } from 'react';
import { Bookmark, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import * as bookmarkService from '@/services/bookmarkService';
import { ContentStatus, ContentType, CONTENT_STATUS_CONFIG } from '@/types/anime';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

interface AddToBookmarksButtonProps {
  contentId: string;
  contentType: ContentType;
  title: string;
  posterUrl?: string;
  externalRating?: number;
  genre?: string;
  releaseYear?: string;
  totalItems?: number;
}

export default function AddToBookmarksButton({
  contentId,
  contentType,
  title,
  posterUrl,
  externalRating,
  genre,
  releaseYear,
  totalItems,
}: AddToBookmarksButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const statuses: ContentStatus[] = ['watching', 'planned', 'watched', 'postponed', 'dropped', 'favorite'];

  const handleAddToBookmarks = async (status: ContentStatus) => {
    try {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) {
        toast.error('Требуется вход');
        return;
      }

      await bookmarkService.addToBookmarks(userData.user.id, {
        contentType,
        contentId,
        title,
        posterUrl,
        status,
        externalRating,
        genre,
        releaseYear,
        totalItems: totalItems || 0,
        isFavorite: status === 'favorite',
        userRating: 0,
        progress: 0,
        notes: '',
      });

      setIsAdded(true);
      setIsOpen(false);
      toast.success(`Добавлено в "${CONTENT_STATUS_CONFIG[status].label}"`);

      // Reset after 2 seconds
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to bookmarks:', error);
      toast.error('Ошибка при добавлении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant={isAdded ? 'default' : 'outline'}
          className={`gap-2 ${isAdded ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
          disabled={loading}
        >
          <Bookmark className="w-4 h-4" />
          {isAdded ? 'Добавлено' : 'В закладки'}
          {isAdded && <Check className="w-4 h-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-2 text-sm font-semibold text-muted-foreground">
          Выбери статус:
        </div>
        <DropdownMenuSeparator />
        {statuses.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleAddToBookmarks(status)}
            disabled={loading}
            className="cursor-pointer"
          >
            <div
              className={`w-3 h-3 rounded-full mr-2 ${CONTENT_STATUS_CONFIG[status].bgColor}`}
            />
            <span className={CONTENT_STATUS_CONFIG[status].color}>
              {CONTENT_STATUS_CONFIG[status].label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
