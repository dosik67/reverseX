import supabase from '@/lib/supabase';
import { ContentBookmark, ContentStatus, ContentType } from '@/types/anime';

/**
 * Add content to bookmarks
 */
export const addToBookmarks = async (
  userId: string,
  bookmark: Omit<ContentBookmark, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ContentBookmark | null> => {
  try {
    const { data, error } = await supabase
      .from('content_bookmarks')
      .insert([
        {
          user_id: userId,
          content_type: bookmark.contentType,
          content_id: bookmark.contentId,
          title: bookmark.title,
          poster_url: bookmark.posterUrl,
          status: bookmark.status,
          user_rating: bookmark.userRating,
          external_rating: bookmark.externalRating,
          progress: bookmark.progress,
          total_items: bookmark.totalItems,
          is_favorite: bookmark.isFavorite,
          notes: bookmark.notes,
          genre: bookmark.genre,
          release_year: bookmark.releaseYear,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data ? transformBookmark(data) : null;
  } catch (error) {
    console.error('Error adding to bookmarks:', error);
    throw error;
  }
};

/**
 * Get bookmarks for user with optional filters
 */
export const getUserBookmarks = async (
  userId: string,
  contentType?: ContentType,
  status?: ContentStatus
): Promise<ContentBookmark[]> => {
  try {
    let query = supabase
      .from('content_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(transformBookmark);
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
};

/**
 * Get bookmarks by status
 */
export const getBookmarksByStatus = async (
  userId: string,
  status: ContentStatus
): Promise<ContentBookmark[]> => {
  try {
    const { data, error } = await supabase
      .from('content_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformBookmark);
  } catch (error) {
    console.error('Error getting bookmarks by status:', error);
    return [];
  }
};

/**
 * Get bookmark count by status
 */
export const getBookmarkStats = async (
  userId: string
): Promise<Record<ContentStatus, number>> => {
  try {
    const { data, error } = await supabase
      .from('content_bookmarks')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    const stats: Record<ContentStatus, number> = {
      favorite: 0,
      watching: 0,
      planned: 0,
      watched: 0,
      postponed: 0,
      dropped: 0,
    };

    (data || []).forEach((item: any) => {
      stats[item.status as ContentStatus]++;
    });

    return stats;
  } catch (error) {
    console.error('Error getting bookmark stats:', error);
    return {
      favorite: 0,
      watching: 0,
      planned: 0,
      watched: 0,
      postponed: 0,
      dropped: 0,
    };
  }
};

/**
 * Update bookmark
 */
export const updateBookmark = async (
  bookmarkId: string,
  updates: Partial<ContentBookmark>
): Promise<ContentBookmark | null> => {
  try {
    const updateData: any = { updated_at: new Date().toISOString() };

    // Map field names from ContentBookmark to database columns
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.userRating !== undefined) updateData.user_rating = updates.userRating;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('content_bookmarks')
      .update(updateData)
      .eq('id', bookmarkId)
      .select()
      .single();

    if (error) throw error;

    return data ? transformBookmark(data) : null;
  } catch (error) {
    console.error('Error updating bookmark:', error);
    throw error;
  }
};

/**
 * Toggle favorite status
 */
export const toggleFavorite = async (
  bookmarkId: string,
  isFavorite: boolean
): Promise<ContentBookmark | null> => {
  return updateBookmark(bookmarkId, { isFavorite });
};

/**
 * Delete bookmark
 */
export const deleteBookmark = async (bookmarkId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('content_bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return false;
  }
};

/**
 * Check if content is already bookmarked
 */
export const checkBookmarkExists = async (
  userId: string,
  contentId: string,
  contentType: ContentType
): Promise<ContentBookmark | null> => {
  try {
    const { data, error } = await supabase
      .from('content_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .single();

    if (error?.code === 'PGRST116') return null; // Not found is not an error

    if (error) throw error;

    return data ? transformBookmark(data) : null;
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return null;
  }
};

/**
 * Search bookmarks by title
 */
export const searchBookmarks = async (
  userId: string,
  query: string,
  contentType?: ContentType
): Promise<ContentBookmark[]> => {
  try {
    let dbQuery = supabase
      .from('content_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .ilike('title', `%${query}%`)
      .order('updated_at', { ascending: false });

    if (contentType) {
      dbQuery = dbQuery.eq('content_type', contentType);
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    return (data || []).map(transformBookmark);
  } catch (error) {
    console.error('Error searching bookmarks:', error);
    return [];
  }
};

/**
 * Transform database record to ContentBookmark interface
 */
function transformBookmark(data: any): ContentBookmark {
  return {
    id: data.id,
    userId: data.user_id,
    contentType: data.content_type as ContentType,
    contentId: data.content_id,
    title: data.title,
    posterUrl: data.poster_url,
    status: data.status as ContentStatus,
    userRating: data.user_rating,
    externalRating: data.external_rating,
    progress: data.progress,
    totalItems: data.total_items,
    isFavorite: data.is_favorite,
    notes: data.notes,
    genre: data.genre,
    releaseYear: data.release_year,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
