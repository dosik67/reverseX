// src/pages/Profile.tsx — упрощённая рабочая версия
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  UserPlus,
  UserCheck,
  Users,
  Star,
  Film,
  MessageSquare,
  List,
  MapPin,
  Sparkles,
  BarChart3,
  Trash2,
  Send,
  Search,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  background_gif_url: string | null;
  profile_color: string;
  profile_accent: string;
  status: string;
  level: number;
  xp: number;
  location: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({ movies: 0, followers: 0, following: 0, comments: 0, likes: 0 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentFilter, setCommentFilter] = useState("");

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchStats();
      fetchComments();
      if (currentUserId && currentUserId !== userId) {
        checkFollowStatus();
        checkFriendshipStatus();
      }
    }
  }, [userId, currentUserId]);

  const getCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = (data as any)?.user;
      setCurrentUserId(user?.id || null);
    } catch (e) {
      console.error("Error getting current user:", e);
      setCurrentUserId(null);
    }
  };

  const fetchProfile = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
      setIsOwnProfile(currentUserId === userId);
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("Ошибка загрузки профиля");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!userId) return;
    try {
      const [moviesRes, followersRes, followingRes, commentsRes, likesRes] = await Promise.all([
        supabase.from("user_movies").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("follows").select("id", { count: "exact" }).eq("following_id", userId),
        supabase.from("follows").select("id", { count: "exact" }).eq("follower_id", userId),
        supabase.from("profile_comments").select("id", { count: "exact" }).eq("profile_id", userId),
        supabase.from("profile_likes").select("id", { count: "exact" }).eq("profile_id", userId),
      ]);

      setStats({
        movies: (moviesRes as any).count || 0,
        followers: (followersRes as any).count || 0,
        following: (followingRes as any).count || 0,
        comments: (commentsRes as any).count || 0,
        likes: (likesRes as any).count || 0,
      });
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const fetchComments = async () => {
    if (!userId) return;
    try {
      setCommentsLoading(true);
      const { data, error } = await supabase
        .from("profile_comments")
        .select(`
          id,
          content,
          created_at,
          author_id,
          author:profiles(username, display_name, avatar_url)
        `)
        .eq("profile_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !newComment.trim()) {
      toast.error("Необходимо войти и написать комментарий");
      return;
    }

    setSubmittingComment(true);
    try {
      const { error } = await supabase.from("profile_comments").insert({
        profile_id: userId,
        author_id: currentUserId,
        content: newComment.trim(),
      });
      
      if (error) throw error;
      setNewComment("");
      toast.success("✅ Комментарий добавлен");
      fetchComments();
      fetchStats();
    } catch (err) {
      console.error("Error submitting comment:", err);
      toast.error("Ошибка добавления комментария");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Удалить комментарий?")) return;
    
    try {
      const { error } = await supabase
        .from("profile_comments")
        .delete()
        .eq("id", commentId);
      
      if (error) throw error;
      toast.success("✅ Комментарий удален");
      fetchComments();
      fetchStats();
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Ошибка удаления комментария");
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUserId || !userId || currentUserId === userId) {
      setIsFollowing(false);
      return;
    }
    
    try {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", userId)
        .maybeSingle();
      
      setIsFollowing(!!data);
    } catch (err) {
      console.error("Error checking follow status:", err);
    }
  };

  const checkFriendshipStatus = async () => {
    if (!currentUserId || !userId || currentUserId === userId) {
      setFriendshipStatus(null);
      return;
    }
    
    try {
      const { data } = await supabase
        .from("friendships")
        .select("status")
        .or(
          `and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`
        )
        .maybeSingle();

      setFriendshipStatus((data as any)?.status || null);
    } catch (err) {
      console.error("Error checking friendship status:", err);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    
    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);
        toast.success("✅ Отписано");
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: userId });
        toast.success("✅ Подписано");
      }
      
      setIsFollowing(!isFollowing);
      fetchStats();
    } catch (err) {
      console.error("Error updating follow status:", err);
      toast.error("Ошибка обновления подписки");
    }
  };

  const handleFriendRequest = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }

    try {
      const { data: existing } = await supabase
        .from("friendships")
        .select("status")
        .or(
          `and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (existing) {
        const status = (existing as any).status;
        if (status === "pending") {
          toast.info("📤 Запрос уже отправлен");
          return;
        }
        if (status === "accepted") {
          toast.info("👥 Вы уже в друзьях");
          return;
        }
      }

      await supabase.from("friendships").insert({
        user_id: currentUserId,
        friend_id: userId,
        status: "pending",
      });

      toast.success("✅ Запрос на дружбу отправлен");
      setFriendshipStatus("pending");
    } catch (err) {
      console.error("Error sending friend request:", err);
      toast.error("Ошибка отправки запроса");
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      online: "bg-green-500",
      idle: "bg-yellow-500",
      dnd: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusText = (status: string) => {
    const statuses: { [key: string]: string } = {
      online: "🟢 Онлайн",
      idle: "🟡 Неактивен",
      dnd: "🔴 Не беспокоить",
    };
    return statuses[status] || "⚪ Оффлайн";
  };

  const backgroundStyle = profile?.background_gif_url
    ? {
        backgroundImage: `url(${profile.background_gif_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: `linear-gradient(135deg, ${profile?.profile_color}20, ${profile?.profile_accent}20)`,
      };

  const filteredComments = comments.filter((c) =>
    c.content.toLowerCase().includes(commentFilter.toLowerCase()) ||
    c.author?.username.toLowerCase().includes(commentFilter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg text-muted-foreground mb-4">😔 Профиль не найден</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Фон профиля */}
      <div className="relative h-48 md:h-64 w-full" style={backgroundStyle}>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 -mt-28 md:-mt-32 relative z-10 pb-8">
        {/* Карточка профиля */}
        <Card className="card-glow border-2 mb-6 shadow-xl" style={{ borderColor: profile.profile_color + "40" }}>
          <CardContent className="pt-4 sm:pt-6 md:pt-8">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8 items-start">
              {/* Аватар */}
              <div className="relative flex-shrink-0">
                <Avatar
                  className="w-24 sm:w-32 md:w-40 h-24 sm:h-32 md:h-40 border-4"
                  style={{ borderColor: profile.profile_color }}
                >
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                  <AvatarFallback className="text-2xl sm:text-3xl md:text-4xl font-bold">
                    {profile.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute bottom-2 right-2 w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 rounded-full border-2 border-background ${getStatusColor(
                    profile.status
                  )}`}
                />
              </div>

              {/* Информация */}
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                      {profile.display_name || profile.username}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3">@{profile.username}</p>

                    <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                      <span
                        className="px-2 sm:px-3 py-1 rounded-full font-medium text-white inline-flex items-center gap-1"
                        style={{ backgroundColor: profile.profile_color }}
                      >
                        <Sparkles className="w-3 h-3" />
                        Lvl {profile.level}
                      </span>
                      <span className="text-muted-foreground">{profile.xp} XP</span>
                      {profile.location && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 sm:w-4 h-3 sm:h-4" />
                          {profile.location}
                        </div>
                      )}
                      <span className="text-xs">{getStatusText(profile.status)}</span>
                    </div>
                  </div>

                  {/* Кнопки */}
                  <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                    {isOwnProfile ? (
                      <Button
                        onClick={() => toast.info("Редактирование в разработке")}
                        className="flex-1 sm:flex-none"
                        style={{ backgroundColor: profile.profile_color }}
                      >
                        ✏️ Редактировать
                      </Button>
                    ) : (
                      <>
                        <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"} className="flex-1 sm:flex-none">
                          {isFollowing ? (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Подписано
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Подписаться
                            </>
                          )}
                        </Button>

                        <Button onClick={handleFriendRequest} variant="outline" className="flex-1 sm:flex-none">
                          <Users className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Добавить</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-6 whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                )}

                {/* Статистика */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                  {[
                    { icon: Film, label: "Фильмы", value: stats.movies },
                    { icon: Users, label: "Подписчики", value: stats.followers },
                    { icon: Users, label: "Подписки", value: stats.following },
                    { icon: MessageSquare, label: "Комментарии", value: stats.comments },
                    { icon: Heart, label: "Лайки", value: stats.likes },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <stat.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-bold text-base sm:text-lg">{stat.value}</span>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Комментарии */}
        <Card className="card-glow shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Комментарии ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Форма комментария */}
            {currentUserId && !isOwnProfile ? (
              <form onSubmit={handleSubmitComment} className="space-y-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Поделись мыслями об этом профиле..."
                  rows={3}
                  maxLength={500}
                  className="text-sm resize-none"
                />
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-xs text-muted-foreground">{newComment.length}/500</span>
                  <Button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Отправить
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-lg bg-secondary/30 text-center">
                <p className="text-sm text-muted-foreground">
                  {isOwnProfile ? "Ты не можешь комментировать свой профиль" : "Войди, чтобы оставить комментарий"}
                </p>
              </div>
            )}

            {/* Поиск */}
            {comments.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Поиск комментариев..."
                  value={commentFilter}
                  onChange={(e) => setCommentFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {/* Комментарии */}
            <div className="space-y-3">
              {commentsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">⏳ Загрузка...</p>
              ) : filteredComments.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 text-sm">
                  {comments.length === 0 ? "Комментариев еще нет 👋" : "Не найдено"}
                </p>
              ) : (
                filteredComments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 sm:gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                      <AvatarImage src={comment.author?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {comment.author?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{comment.author?.display_name || comment.author?.username}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
                      <p className="text-sm break-words whitespace-pre-wrap mt-1">{comment.content}</p>
                    </div>

                    {(isOwnProfile || currentUserId === comment.author_id) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-destructive flex-shrink-0 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;