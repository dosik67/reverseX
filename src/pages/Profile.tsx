// src/pages/Profile.tsx — улучшенная версия
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import ProfileEditor from "@/components/ProfileEditor";
import FavoriteMovies from "@/components/FavoriteMovies";
import UserActivity from "@/components/UserActivity";
import ChatWindow from "@/components/ChatWindow";
import TopListsManager from "@/components/TopListsManager";
import ProfileCustomizations from "@/components/ProfileCustomizations";
import ProfileStats from "@/components/ProfileStats";
import FriendsList from "@/components/FriendsList";
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({ movies: 0, followers: 0, following: 0, comments: 0 });
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showChat, setShowChat] = useState(false);
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

  useEffect(() => {
    if (!currentUserId || !userId) return;
    const channel = supabase
      .channel("friendship_status")
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
      setCurrentUserId(null);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error(err);
      toast.error("Ошибка загрузки профиля");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [moviesData, followersData, followingData, commentsData] = await Promise.all([
        supabase.from("user_movies").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("follows").select("id", { count: "exact" }).eq("following_id", userId),
        supabase.from("follows").select("id", { count: "exact" }).eq("follower_id", userId),
        supabase.from("profile_comments").select("id", { count: "exact" }).eq("profile_id", userId),
      ]);

      setStats({
        movies: (moviesData as any).count || 0,
        followers: (followersData as any).count || 0,
        following: (followingData as any).count || 0,
        comments: (commentsData as any).count || 0,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComments = async () => {
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
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase.from("profile_comments").insert({
        profile_id: userId,
        author_id: currentUserId,
        content: newComment.trim(),
      });
      if (error) throw error;
      setNewComment("");
      toast.success("Комментарий добавлен");
      fetchComments();
    } catch (err) {
      console.error(err);
      toast.error("Ошибка добавления комментария");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from("profile_comments").delete().eq("id", commentId);
      if (error) throw error;
      toast.success("Комментарий удален");
      fetchComments();
    } catch (err) {
      console.error(err);
      toast.error("Ошибка удаления комментария");
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const checkFollowStatus = async () => {
    if (!currentUserId) return setIsFollowing(false);
    try {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", userId)
        .maybeSingle();
      setIsFollowing(!!data);
    } catch (err) {
      console.error(err);
    }
  };

  const checkFriendshipStatus = async () => {
    if (!currentUserId || !userId) return setFriendshipStatus(null);
    try {
      const { data } = await supabase
        .from("friendships")
        .select("status")
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`)
        .maybeSingle();

      setFriendshipStatus((data as any)?.status || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) return;
    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", userId);
        toast.success("Отписано");
      } else {
        await supabase.from("follows").insert({ follower_id: currentUserId, following_id: userId });
        toast.success("Подписано");
      }
      setIsFollowing(!isFollowing);
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Ошибка обновления подписки");
    }
  };

  const handleFriendRequest = async () => {
    if (!currentUserId || !userId) return toast.error("Нужно войти в аккаунт");

    try {
      const { data: existing, error: existingErr } = await supabase
        .from("friendships")
        .select("id,status,user_id,friend_id")
        .or(
          `and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (existingErr) throw existingErr;

      if (existing) {
        if ((existing as any).status === "pending") {
          toast("Запрос уже отправлен или ожидает подтверждения");
          setFriendshipStatus("pending");
          return;
        }
        if ((existing as any).status === "accepted") {
          toast("Вы уже в друзьях");
          setFriendshipStatus("accepted");
          return;
        }
      }

      const { error } = await supabase.from("friendships").insert({
        user_id: currentUserId,
        friend_id: userId,
        status: "pending",
      });

      if (error) throw error;
      toast.success("Запрос на дружбу отправлен");
      setFriendshipStatus("pending");
    } catch (err) {
      console.error("Error sending friend request:", err);
      toast.error("Ошибка отправки запроса");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Профиль не найден</p>
      </div>
    );
  }

  const isOwnProfile = currentUserId === userId;

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

  const backgroundStyle = profile.background_gif_url
    ? { backgroundImage: `url(${profile.background_gif_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {
        background: `linear-gradient(135deg, ${profile.profile_color}20, ${profile.profile_accent}20)`,
      };

  const filteredComments = comments.filter(c =>
    c.content.toLowerCase().includes(commentFilter.toLowerCase()) ||
    c.author?.username.toLowerCase().includes(commentFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-48 md:h-64" style={backgroundStyle}>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 -mt-28 md:-mt-32 relative z-10">
        {/* Карточка профиля */}
        <Card className="card-glow border-2 mb-6 shadow-lg" style={{ borderColor: profile.profile_color + "40" }}>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
              {/* Аватар и статус */}
              <div className="relative flex-shrink-0">
                <Avatar className="w-24 sm:w-32 h-24 sm:h-32 border-4" style={{ borderColor: profile.profile_color }}>
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl sm:text-3xl">{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={`absolute bottom-2 right-2 w-4 sm:w-5 h-4 sm:h-5 rounded-full border-2 border-background ${getStatusColor(profile.status)}`} />
              </div>

              {/* Инфо и кнопки */}
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1 truncate">{profile.display_name || profile.username}</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3">@{profile.username}</p>

                    <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                      <span className="px-2 sm:px-3 py-1 rounded-full font-medium text-white inline-flex items-center gap-1 whitespace-nowrap" style={{ backgroundColor: profile.profile_color }}>
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
                      <Button onClick={() => setShowEditor(true)} className="flex-1 sm:flex-none" style={{ backgroundColor: profile.profile_color }}>
                        Редактировать
                      </Button>
                    ) : (
                      <>
                        <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"} className="flex-1 sm:flex-none">
                          {isFollowing ? (
                            <>
                              <UserCheck className="w-4 h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Подписано</span>
                              <span className="sm:hidden">Подписано</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
                              Подписаться
                            </>
                          )}
                        </Button>

                        {!friendshipStatus && (
                          <Button onClick={handleFriendRequest} variant="outline" className="flex-1 sm:flex-none">
                            <Users className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Добавить</span>
                            <span className="sm:hidden">+</span>
                          </Button>
                        )}

                        {friendshipStatus === "pending" && (
                          <Button variant="outline" disabled className="flex-1 sm:flex-none">
                            Ожидание...
                          </Button>
                        )}

                        {friendshipStatus === "accepted" && (
                          <>
                            <Button variant="outline" disabled className="hidden sm:inline-flex">
                              <Users className="w-4 h-4 mr-2" />
                              Друзья
                            </Button>
                            <Button onClick={() => setShowChat(true)} variant="outline" className="flex-1 sm:flex-none">
                              <MessageSquare className="w-4 h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Сообщение</span>
                              <span className="sm:hidden">Чат</span>
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {profile.bio && <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap line-clamp-3">{profile.bio}</p>}

                {/* Статистика */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                  {[
                    { icon: Film, label: "Фильмы", value: stats.movies },
                    { icon: Users, label: "Подписчики", value: stats.followers },
                    { icon: Users, label: "Подписки", value: stats.following },
                    { icon: MessageSquare, label: "Комментарии", value: stats.comments },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <stat.icon className="w-4 h-4 text-muted-foreground" />
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
        <Tabs defaultValue="favorites" className="mb-8">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1">
            <TabsTrigger value="favorites" className="text-xs sm:text-sm">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Top 50</span>
              <span className="sm:hidden">Top</span>
            </TabsTrigger>
            <TabsTrigger value="lists" className="text-xs sm:text-sm">
              <List className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Списки</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="text-xs sm:text-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Друзья</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Активность</span>
              <span className="sm:hidden">Акт</span>
            </TabsTrigger>
            <TabsTrigger value="watched" className="text-xs sm:text-sm">
              <Film className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Просмотрено</span>
              <span className="sm:hidden">Пр</span>
            </TabsTrigger>
            <TabsTrigger value="customizations" className="hidden lg:inline-flex text-xs sm:text-sm">
              Кастомизация
            </TabsTrigger>
            <TabsTrigger value="stats" className="hidden lg:inline-flex text-xs sm:text-sm">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Статистика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-6 animate-fade-in">
            <FavoriteMovies userId={userId!} isOwnProfile={isOwnProfile} />
          </TabsContent>

          <TabsContent value="lists" className="mt-6 animate-fade-in">
            <TopListsManager userId={userId!} isOwnProfile={isOwnProfile} />
          </TabsContent>

          <TabsContent value="friends" className="mt-6 animate-fade-in">
            <FriendsSystem userId={userId!} currentUserId={currentUserId} onMessage={() => setShowChat(true)} />
          </TabsContent>

          <TabsContent value="watched" className="mt-6 animate-fade-in">
            <WatchedInteractive userId={userId!} />
          </TabsContent>

          <TabsContent value="activity" className="mt-6 animate-fade-in">
            <UserActivity userId={userId!} showOnlyWatched={false} />
          </TabsContent>

          <TabsContent value="customizations" className="mt-6 animate-fade-in">
            <ProfileCustomizations level={profile.level} />
          </TabsContent>

          <TabsContent value="stats" className="mt-6 animate-fade-in">
            <ProfileStats userId={userId!} />
          </TabsContent>
        </Tabs>

        {/* Комментарии */}
        <Card className="card-glow shadow-lg">
          <CardContent className="pt-4 sm:pt-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">💬 Комментарии</h2>

            {currentUserId && (
              <form onSubmit={handleSubmitComment} className="space-y-3 mb-6">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Напиши комментарий..."
                  rows={3}
                  maxLength={500}
                  className="text-sm resize-none"
                />
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-xs text-muted-foreground">{newComment.length}/500</span>
                  <Button type="submit" disabled={submittingComment || !newComment.trim()} size="sm" className="w-full sm:w-auto">
                    <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Отправить
                  </Button>
                </div>
              </form>
            )}

            {/* Поиск комментариев */}
            {comments.length > 0 && (
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Поиск по комментариям..."
                  value={commentFilter}
                  onChange={(e) => setCommentFilter(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            )}

            {/* Список комментариев */}
            <div className="space-y-3">
              {commentsLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Загрузка...</p>
              ) : filteredComments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  {comments.length === 0 ? "Комментариев еще нет. Будь первым! 👋" : "Комментарии не найдены"}
                </p>
              ) : (
                filteredComments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 sm:gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <Link to={`/profile/${comment.author_id}`} className="flex-shrink-0">
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 cursor-pointer hover:ring-2 ring-primary">
                        <AvatarImage src={comment.author?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{comment.author?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${comment.author_id}`}>
                        <p className="font-medium text-sm hover:underline cursor-pointer truncate">
                          {comment.author?.display_name || comment.author?.username || "Unknown"}
                        </p>
                      </Link>
                      <p className="text-xs text-muted-foreground mb-1">{formatDate(comment.created_at)}</p>
                      <p className="text-sm break-words whitespace-pre-wrap">{comment.content}</p>
                    </div>

                    {(isOwnProfile || currentUserId === comment.author_id) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-destructive hover:bg-destructive/20 flex-shrink-0 h-8 w-8 p-0"
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

      {showEditor && (
        <ProfileEditor profile={profile} open={showEditor} onClose={() => setShowEditor(false)} onUpdate={fetchProfile} />
      )}

      {showChat && !isOwnProfile && profile && (
        <ChatWindow open={showChat} onClose={() => setShowChat(false)} friendId={userId!} friendUsername={profile.username} friendAvatar={profile.avatar_url} currentUserId={currentUserId!} />
      )}
    </div>
  );
};

export default Profile;