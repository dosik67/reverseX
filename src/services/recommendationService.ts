import supabase from '@/lib/supabase';
import { Recommendation, RecommendationMedia, RecommendationReply } from '@/types/recommendations';

const STORAGE_BUCKET = 'recommendations';

/**
 * Get all recommendations with pagination
 */
export async function getRecommendations(page = 1, pageSize = 10) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    // Get recommendations
    const { data: recommendations, error, count } = await supabase
      .from('recommendations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Get full data with media and author info
    const enrichedRecommendations = await Promise.all(
      (recommendations || []).map(async (rec) => {
        const [media, author, likes, replies] = await Promise.all([
          getRecommendationMedia(rec.id),
          getUserInfo(rec.user_id),
          getRecommendationLikesCount(rec.id),
          getRecommendationRepliesCount(rec.id),
        ]);

        return {
          ...rec,
          media,
          author,
          likes_count: likes,
          replies_count: replies,
        };
      })
    );

    return {
      data: enrichedRecommendations,
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}

/**
 * Get single recommendation by ID
 */
export async function getRecommendationById(id: string) {
  try {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const [media, author, likes, replies] = await Promise.all([
      getRecommendationMedia(id),
      getUserInfo(data.user_id),
      getRecommendationLikesCount(id),
      getRecommendationRepliesCount(id),
    ]);

    return {
      ...data,
      media,
      author,
      likes_count: likes,
      replies_count: replies,
    };
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    throw error;
  }
}

/**
 * Create new recommendation
 */
export async function createRecommendation(
  title: string,
  content: string,
  files?: File[]
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Create recommendation
    const { data: recommendation, error: createError } = await supabase
      .from('recommendations')
      .insert([
        {
          user_id: user.id,
          title,
          content,
        },
      ])
      .select()
      .single();

    if (createError) throw createError;

    // Upload media files if provided
    if (files && files.length > 0) {
      await uploadRecommendationMedia(recommendation.id, files);
    }

    return recommendation;
  } catch (error) {
    console.error('Error creating recommendation:', error);
    throw error;
  }
}

/**
 * Upload media for recommendation
 */
export async function uploadRecommendationMedia(
  recommendationId: string,
  files: File[]
) {
  try {
    const mediaRecords = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${recommendationId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      // Determine media type based on file
      const mediaType = file.type.startsWith('image/') ? 'image' : 'drawing';

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('recommendation_media')
        .insert([
          {
            recommendation_id: recommendationId,
            media_type: mediaType,
            media_url: publicUrl.publicUrl,
            storage_path: fileName,
          },
        ]);

      if (dbError) throw dbError;
      mediaRecords.push(uploadData);
    }

    return mediaRecords;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

/**
 * Get media for recommendation
 */
export async function getRecommendationMedia(recommendationId: string) {
  try {
    const { data, error } = await supabase
      .from('recommendation_media')
      .select('*')
      .eq('recommendation_id', recommendationId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recommendation media:', error);
    return [];
  }
}

/**
 * Add reply to recommendation
 */
export async function addReplyToRecommendation(
  recommendationId: string,
  content: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('recommendation_replies')
      .insert([
        {
          recommendation_id: recommendationId,
          user_id: user.id,
          content,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Get author info
    const author = await getUserInfo(user.id);

    return {
      ...data,
      author,
    };
  } catch (error) {
    console.error('Error adding reply:', error);
    throw error;
  }
}

/**
 * Get replies for recommendation
 */
export async function getRecommendationReplies(
  recommendationId: string,
  limit = 50
) {
  try {
    const { data, error } = await supabase
      .from('recommendation_replies')
      .select('*')
      .eq('recommendation_id', recommendationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Get author info for each reply
    const enrichedReplies = await Promise.all(
      (data || []).map(async (reply) => {
        const author = await getUserInfo(reply.user_id);
        return {
          ...reply,
          author,
        };
      })
    );

    return enrichedReplies;
  } catch (error) {
    console.error('Error fetching replies:', error);
    return [];
  }
}

/**
 * Get count of replies for recommendation
 */
export async function getRecommendationRepliesCount(recommendationId: string) {
  try {
    const { count, error } = await supabase
      .from('recommendation_replies')
      .select('id', { count: 'exact' })
      .eq('recommendation_id', recommendationId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching replies count:', error);
    return 0;
  }
}

/**
 * Like recommendation
 */
export async function likeRecommendation(recommendationId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('recommendation_likes')
      .insert([
        {
          recommendation_id: recommendationId,
          user_id: user.id,
        },
      ]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error liking recommendation:', error);
    throw error;
  }
}

/**
 * Unlike recommendation
 */
export async function unlikeRecommendation(recommendationId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('recommendation_likes')
      .delete()
      .eq('recommendation_id', recommendationId)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unliking recommendation:', error);
    throw error;
  }
}

/**
 * Get count of likes for recommendation
 */
export async function getRecommendationLikesCount(recommendationId: string) {
  try {
    const { count, error } = await supabase
      .from('recommendation_likes')
      .select('id', { count: 'exact' })
      .eq('recommendation_id', recommendationId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching likes count:', error);
    return 0;
  }
}

/**
 * Check if user liked recommendation
 */
export async function isRecommendationLikedByUser(recommendationId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('recommendation_likes')
      .select('id')
      .eq('recommendation_id', recommendationId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
}

/**
 * Delete recommendation
 */
export async function deleteRecommendation(recommendationId: string) {
  try {
    // Delete media files from storage
    const media = await getRecommendationMedia(recommendationId);
    for (const item of media) {
      if (item.storage_path) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([item.storage_path]);
      }
    }

    // Delete recommendation (cascade will delete media, replies, likes)
    const { error } = await supabase
      .from('recommendations')
      .delete()
      .eq('id', recommendationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    throw error;
  }
}

/**
 * Get user info by ID
 */
export async function getUserInfo(userId: string) {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) throw error;

    return {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    // Return basic info if admin call fails
    return {
      id: userId,
      email: undefined,
      user_metadata: {},
    };
  }
}

/**
 * Update recommendation
 */
export async function updateRecommendation(
  recommendationId: string,
  title: string,
  content: string
) {
  try {
    const { error } = await supabase
      .from('recommendations')
      .update({
        title,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recommendationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating recommendation:', error);
    throw error;
  }
}

/**
 * Delete reply
 */
export async function deleteReply(replyId: string) {
  try {
    const { error } = await supabase
      .from('recommendation_replies')
      .delete()
      .eq('id', replyId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting reply:', error);
    throw error;
  }
}
