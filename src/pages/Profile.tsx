// src/pages/Profile.tsx — полная улучшенная версия
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
  Share2,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import ProfileEditor from "@/components/ProfileEditor";
import FavoriteMovies from "@/components/FavoriteMovies";
import UserActivity from "@/components/UserActivity";
import ChatWindow from "@/components/ChatWindow";
import TopListsManager from "@/components/TopListsManager";
import ProfileCustomizations from "@/components/ProfileCustomizations";
import ProfileStats from "@/components/ProfileStats";
import { FriendsSystem } from "@/components/FriendsSystem";
import WatchedInteractive from "@/components/WatchedInteractive";

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
  created_at?: string;
  updated_at?: string;
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

interface ProfileStats {
  movies: number;
  followers: number;
  following: number;
  comments: number;
  likes: number;
}

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // State основной профиль
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // State взаимодействия
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  
  // State статистика
  const [stats, setStats] = useState<ProfileStats>({
    movies: 0,
    followers: 0,
    following: 0,
    comments: 0,
    likes: 0,
  });
  
  // State комментарии
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentFilter, setCommentFilter] = useState("");
  
  // State активная вкладка
  const [activeTab, setActiveTab] = useState("favorites");

  // Получить текущего пользователя
  useEffect(() => {
    getCurrentUser();
  }, []);

  // Загрузить данные профиля при изменении userId
  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchStats();
      fetchComments();
      checkFollowStatus();
      checkFriendshipStatus();
    }
  }, [userId, currentUserId]);

  // Real-time подписка на изменения дружбы
  useEffect(() => {
    if (!currentUserId || !userId) return;
    
    const channel = supabase
      .channel(`friendship_${currentUserId}_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        (payload) => {
          const row: any = (payload as any).new || (payload as any).old;
          if (!row) return;
          const involvesPair =
            (row.user_id === currentUserId && row.friend_id === userId) ||
            (row.user_id === userId && row.friend_id === currentUserId);
          if (involvesPair) {
            checkFriendshipStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, userId]);

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
    
    if (!userId) {
      toast.error("Ошибка: пользователь не найден");
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

  const handleLike = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("profile_likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("profile_id", userId);
        toast.success("❤️ Лайк удален");
      } else {
        await supabase
          .from("profile_likes")
          .insert({ user_id: currentUserId, profile_id: userId });
        toast.success("❤️ Профиль понравился");
      }

      setIsLiked(!isLiked);
      fetchStats();
    } catch (err) {
      console.error("Error liking profile:", err);
      toast.error("Ошибка при лайке");
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
    switch (status) {
      case "online":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "dnd":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "🟢 Онлайн";
      case "idle":
        return "🟡 Неактивен";
      case "dnd":
        return "🔴 Не беспокоить";
      default:
        return "⚪ Оффлайн";
    }
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
              {/* Аватар и статус */}
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

              {/* Основная информация */}
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 truncate">
                      {profile.display_name || profile.username}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3">@{profile.username}</p>

                    <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                      <span
                        className="px-2 sm:px-3 py-1 rounded-full font-medium text-white inline-flex items-center gap-1 whitespace-nowrap"
                        style={{ backgroundColor: profile.profile_color }}
                      >
                        <Sparkles className="w-3 h-3" />
                        Lvl {profile.level}
                      </span>
                      <span className="text-muted-foreground">{profile.xp} XP</span>
                      {profile.location && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{profile.location}</span>
                        </div>
                      )}
                      <span className="text-xs">{getStatusText(profile.status)}</span>
                    </div>
                  </div>

                  {/* Кнопки действия */}
                  <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                    {isOwnProfile ? (
                      <Button
                        onClick={() => setShowEditor(true)}
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
                              <span className="hidden sm:inline">Подписано</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Подписаться
                            </>
                          )}
                        </Button>

                        <Button onClick={handleLike} variant={isLiked ? "default" : "outline"} size="icon" className="flex-shrink-0">
                          <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                        </Button>

                        <Button onClick={() => setShowChat(true)} variant="outline" className="flex-1 sm:flex-none">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Сообщение
                        </Button>

                        {!friendshipStatus && (
                          <Button onClick={handleFriendRequest} variant="outline" className="flex-1 sm:flex-none">
                            <Users className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Добавить</span>
                          </Button>
                        )}

                        {friendshipStatus === "pending" && (
                          <Button variant="outline" disabled className="flex-1 sm:flex-none">
                            ⏳ Ожидание...
                          </Button>
                        )}

                        {friendshipStatus === "accepted" && (
                          <Button variant="outline" disabled className="flex-1 sm:flex-none">
                            <Users className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Друзья</span>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-6 whitespace-pre-wrap line-clamp-4 leading-relaxed">
                    {profile.bio}
                  </p>
                )}

                {/* Статистика */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                  {[
                    { icon: Film, label: "Фильмы", value: stats.movies },
                    { icon: Users, label: "Подписчики", value: stats.followers },
                    { icon: TrendingUp, label: "Подписки", value: stats.following },
                    { icon: MessageSquare, label: "Комментарии", value: stats.comments },
                    { icon: Heart, label: "Лайки", value: stats.likes },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
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

        {/* Вкладки контента */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1 h-auto p-1">
            <TabsTrigger value="favorites" className="text-xs sm:text-sm py-2">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Top 50</span>
            </TabsTrigger>
            <TabsTrigger value="lists" className="text-xs sm:text-sm py-2">
              <List className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Списки</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="text-xs sm:text-sm py-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Друзья</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Активность</span>
              <span className="sm:hidden">Акт</span>
            </TabsTrigger>
            <TabsTrigger value="watched" className="text-xs sm:text-sm py-2">
              <Film className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Просмотрено</span>
            </TabsTrigger>
            <TabsTrigger value="customizations" className="hidden lg:inline-flex text-xs py-2">
              ✨ Кастомизация
            </TabsTrigger>
            <TabsTrigger value="stats" className="hidden lg:inline-flex text-xs py-2">
              <BarChart3 className="w-3 h-3 mr-2" />
              Статистика
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 animate-fade-in">
            <TabsContent value="favorites" className="m-0">
              <FavoriteMovies userId={userId!} isOwnProfile={isOwnProfile} />
            </TabsContent>

            <TabsContent value="lists" className="m-0">
              <TopListsManager userId={userId!} isOwnProfile={isOwnProfile} />
            </TabsContent>

            <TabsContent value="friends" className="m-0">
              <FriendsSystem userId={userId!} currentUserId={currentUserId} onMessage={() => setShowChat(true)} />
            </TabsContent>

            <TabsContent value="watched" className="m-0">
              <WatchedInteractive userId={userId!} />
            </TabsContent>

            <TabsContent value="activity" className="m-0">
              <UserActivity userId={userId!} showOnlyWatched={false} />
            </TabsContent>

            <TabsContent value="customizations" className="m-0">
              <ProfileCustomizations level={profile.level} />
            </TabsContent>

            <TabsContent value="stats" className="m-0">
              <ProfileStats userId={userId!} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Комментарии */}
        <Card className="card-glow shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Комментарии ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Форма добавления комментария */}
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
            ) : isOwnProfile && currentUserId ? (
              <div className="p-4 rounded-lg bg-secondary/30 text-center">
                <p className="text-sm text-muted-foreground">Ты не можешь комментировать свой профиль</p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-secondary/30 text-center">
                <p className="text-sm text-muted-foreground mb-3">Войди, чтобы оставить комментарий</p>
                <Button size="sm" onClick={() => navigate("/login")} className="w-full">
                  Войти
                </Button>
              </div>
            )}

            {/* Поиск комментариев */}
            {comments.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Поиск по комментариям..."
                  value={commentFilter}
                  onChange={(e) => setCommentFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {/* Список комментариев */}
            <div className="space-y-3">
              {commentsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Загрузка комментариев...</p>
                </div>
              ) : filteredComments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {comments.length === 0 ? "Комментариев еще нет. Будь первым! 👋" : "Комментарии не найдены"}
                  </p>
                </div>
              ) : (
                filteredComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200"
                  >
                    <Link to={`/profile/${comment.author_id}`} className="flex-shrink-0">
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 cursor-pointer hover:ring-2 ring-primary transition-all">
                        <AvatarImage src={comment.author?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {comment.author?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link to={`/profile/${comment.author_id}`}>
                            <p className="font-medium text-sm hover:underline cursor-pointer truncate">
                              {comment.author?.display_name || comment.author?.username || "Unknown"}
                            </p>
                          </Link>
                          <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
                        </div>

                        {(isOwnProfile || currentUserId === comment.author_id) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-destructive hover:bg-destructive/20 flex-shrink-0 h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm break-words whitespace-pre-wrap mt-2">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Модальные окна */}
      {showEditor && (
        <ProfileEditor
          profile={profile}
          open={showEditor}
          onClose={() => setShowEditor(false)}
          onUpdate={fetchProfile}
        />
      )}

      {showChat && !isOwnProfile && profile && (
        <ChatWindow
          open={showChat}
          onClose={() => setShowChat(false)}
          friendId={userId!}
          friendUsername={profile.username}
          friendAvatar={profile.avatar_url}
          currentUserId={currentUserId!}
        />
      )}
    </div>
  );
};

export default Profile;