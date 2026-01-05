import { useEffect, useState } from "react";
import { ContentBookmark, ContentType } from "@/types/anime";
import { checkBookmarkExists, addToBookmarks as addBookmark } from "@/services/bookmarkService";

interface UseBookmarkParams {
  contentId: string;
  contentType: ContentType;
  userId?: string;
}

export const useBookmark = ({
  contentId,
  contentType,
  userId,
}: UseBookmarkParams) => {
  const [bookmark, setBookmark] = useState<ContentBookmark | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && contentId) {
      checkBookmark();
    }
  }, [userId, contentId, contentType]);

  const checkBookmark = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const existing = await checkBookmarkExists(userId, contentId, contentType);
      setBookmark(existing);
    } catch (error) {
      console.error("Error checking bookmark:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToBookmark = async (bookmarkData: Omit<ContentBookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return null;
    try {
      setLoading(true);
      const newBookmark = await addBookmark(userId, bookmarkData);
      setBookmark(newBookmark);
      return newBookmark;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    bookmark,
    loading,
    isBookmarked: !!bookmark,
    addToBookmark,
    checkBookmark,
  };
};
