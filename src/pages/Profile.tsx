// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import ProfileSidebar from "@/components/ProfileSidebar";

// Интерфейсы
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

// Временные компоненты-заглушки (замените на ваши реальные компоненты)
const FavoriteMovies = ({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) => (
  <div className="text-center py-12">
    <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
    <h3 className="text-xl font-semibold mb-2">Любимые фильмы</h3>
    <p className="text-muted-foreground">Раздел в разработке</p>
  </div>
);

const UserActivity = ({ userId, showOnlyWatched }: { userId: string; showOnlyWatched: boolean }) => (
  <div className="text-center py-12">
    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
    <h3 className="text-xl font-semibold mb-2">Активность</h3>
    <p className="text-muted-foreground">Раздел в разработке</p>
  </div>
);

const TopListsManager = ({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) => (
  <div className="text-center py-12">
    <List className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
    <h3 className="text-xl font-semibold mb-2">Списки</h3>
    <p className="text-muted-foreground">Раздел в разработке</p>
  </div>
);

const ProfileCustomizations = ({ level }: { level: number }) => (
  <div className="text-center py-12">
    <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
    <h3 className="text-xl font-semibold mb-2">Оформление профиля</h3>
    <p className="text-muted-foreground">Доступно с уровня {Math.max(5, level + 1)}</p>
  </div>
);

const ProfileStats = ({ userId }: { userId: string }) => (
  <div className="text-center py-12">
    <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
    <h3 className="text-xl font-semibold mb-2">Статистика</h3>
    <p className="text-muted-foreground">Раздел в разработке</p>
  </div>
);

const FriendsSystem = ({ userId, currentUserId, onMessage }: { userId: string; currentUserId: string | null; onMessage: () => void }) => (
  <div className="space-y-4">
    <div className="text-center py-8">
      <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
      <h3 className="text-xl font-semibold mb-2">Система друзей</h3>
      <p className="text-muted-foreground">Находите друзей и общайтесь</p>
    </div>
  </div>
);

const WatchedInteractive = ({ userId }: { userId: string }) => (
  <div className="text-center py-12">
    <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
    <h3 className="text-xl font-semibold mb-2">Просмотрено</h3>
    <p className="text-muted-foreground">Раздел в разработке</p>
  </div>
);

const ProfileEditor = ({ profile, open, onClose, onUpdate }: { profile: Profile; open: boolean; onClose: () => void; onUpdate: () => void }) => (
  <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 ${open ? 'block' : 'hidden'}`}>
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Редактирование профиля</h2>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>
          <p className="text-muted-foreground mb-4">Редактор профиля будет здесь</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={onUpdate}>Сохранить</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const ChatWindow = ({ open, onClose, friendId, friendUsername, friendAvatar, currentUserId }: { open: boolean; onClose: () => void; friendId: string; friendUsername: string; friendAvatar: string | null; currentUserId: string }) => (
  <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 ${open ? 'block' : 'hidden'}`}>
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Чат с {friendUsername}</h2>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>
          <p className="text-muted-foreground text-center py-8">Чат будет реализован позже</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Основной компонент профиля
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
  const [activeTab, setActiveTab] = useState("favorites");

  // Загрузка данных
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

  // Функции работы с данными
  const getCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    } catch (e) {
      setCurrentUserId(null);
    }
  };

  const fetchProfile = async () => {
    if (!userId) return;
    
    try {
      // Временные данные для демонстрации
      const demoProfile: Profile = {
        id: userId,
        username: "zhandosturabal",
        display_name: "Zhandos Turabal",
        bio: "Любитель кино и сериалов. Особенно ценю качественное повествование и глубоких персонажей.",
        avatar_url: null,
        background_gif_url: null,
        profile_color: "#3B82F6",
        profile_accent: "#8B5CF6",
        status: "online",
        level: 12,
        xp: 3450,
        location: "Алматы, Казахстан"
      };
      
      setProfile(demoProfile);
      
      // Для реального использования раскомментируйте:
      // const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      // if (error) throw error;
      // setProfile(data);
    } catch (err) {
      console.error(err);
      toast.error("Ошибка загрузки профиля");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStats({
      movies: 127,
      followers: 456,
      following: 234,
      comments: 89
    });
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      // Временные данные комментариев
      const demoComments: Comment[] = [
        {
          id: "1",
          content: "Отличный вкус в кино! Мне тоже нравятся твои подборки.",
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          author_id: "2",
          author: {
            username: "cinemalover",
            display_name: "Киноман",
            avatar_url: null
          }
        },
        {
          id: "2", 
          content: "Привет! Как тебе новый сезон твоего любимого сериала?",
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          author_id: "3",
          author: {
            username: "seriesfan",
            display_name: "Фанат сериалов",
            avatar_url: null
          }
        }
      ];
      
      setComments(demoComments);
      
      // Для реального использования раскомментируйте:
      // const { data, error } = await supabase
      //   .from("profile_comments")
      //   .select(`id, content, created_at, author_id, author:profiles(username, display_name, avatar_url)`)
      //   .eq("profile_id", userId)
      //   .order("created_at", { ascending: false });
      // if (error) throw error;
      // setComments(data || []);
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
      // Временная имитация отправки
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        author_id: currentUserId,
        author: {
          username: "currentuser",
          display_name: "Текущий пользователь", 
          avatar_url: null
        }
      };
      
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment("");
      toast.success("Комментарий добавлен");
      
      // Для реального использования раскомментируйте:
      // const { error } = await supabase.from("profile_comments").insert({
      //   profile_id: userId,
      //   author_id: currentUserId,
      //   content: newComment.trim(),
      // });
      // if (error) throw error;
      // setNewComment("");
      // toast.success("Комментарий добавлен");
      // fetchComments();
    } catch (err) {
      console.error(err);
      toast.error("Ошибка добавления комментария");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast.success("Комментарий удален");
      
      // Для реального использования раскомментируйте:
      // const { error } = await supabase.from("profile_comments").delete().eq("id", commentId);
      // if (error) throw error;
      // toast.success("Комментарий удален");
      // fetchComments();
    } catch (err) {
      console.error(err);
      toast.error("Ошибка удаления комментария");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", { 
      day: "numeric", 
      month: "short", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const checkFollowStatus = async () => {
    setIsFollowing(false); // Временная заглушка
  };

  const checkFriendshipStatus = async () => {
    setFriendshipStatus(null); // Временная заглушка
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        toast.success("Отписано");
      } else {
        toast.success("Подписано");
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error(err);
      toast.error("Ошибка обновления подписки");
    }
  };

  const handleFriendRequest = async () => {
    try {
      toast.success("Запрос на дружбу отправлен");
      setFriendshipStatus("pending");
    } catch (err) {
      console.error("Error sending friend request:", err);
      toast.error("Ошибка отправки запроса");
    }
  };

  const handleSearchFriends = (query: string) => {
    console.log("Searching friends:", query);
  };

  // Вспомогательные функции
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "idle": return "bg-yellow-500";
      case "dnd": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "🟢 Онлайн";
      case "idle": return "🟡 Неактивен";
      case "dnd": return "🔴 Не беспокоить";
      default: return "⚪ Оффлайн";
    }
  };

  // Состояния загрузки
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Загружаем профиль...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Users className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Профиль не найден</h2>
          <p className="text-muted-foreground">Пользователь с таким ID не существует</p>
          <Button asChild>
            <Link to="/">На главную</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserId === userId;

  const backgroundStyle = profile.background_gif_url
    ? { 
        backgroundImage: `url(${profile.background_gif_url})`, 
        backgroundSize: "cover", 
        backgroundPosition: "center",
      }
    : {
        background: `linear-gradient(135deg, ${profile.profile_color}15, ${profile.profile_accent}15)`,
      };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden" style={backgroundStyle}>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-6xl px-4">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-background shadow-2xl" style={{ borderColor: profile.profile_color }}>
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-secondary text-white">
                    {profile.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute bottom-3 right-3 w-6 h-6 rounded-full border-3 border-background ${getStatusColor(profile.status)} shadow-lg`} />
              </div>
              
              <div className="mb-4 text-white">
                <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">
                  {profile.display_name || profile.username}
                </h1>
                <div className="flex items-center gap-4 flex-wrap">
                  <p className="text-lg opacity-90 drop-shadow">@{profile.username}</p>
                  <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Уровень {profile.level}
                  </Badge>
                  {profile.location && (
                    <div className="flex items-center gap-1 text-white/80">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
              {isOwnProfile ? (
                <Button 
                  onClick={() => setShowEditor(true)} 
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30"
                  size="lg"
                >
                  Редактировать профиль
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleFollow} 
                    variant={isFollowing ? "outline" : "default"}
                    className={isFollowing ? "bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20" : ""}
                    size="lg"
                  >
                    {isFollowing ? <UserCheck className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    {isFollowing ? "Подписано" : "Подписаться"}
                  </Button>

                  {!friendshipStatus && (
                    <Button 
                      onClick={handleFriendRequest} 
                      variant="outline"
                      className="bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
                      size="lg"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Добавить в друзья
                    </Button>
                  )}

                  {friendshipStatus === "pending" && (
                    <Button variant="outline" disabled className="bg-white/10 backdrop-blur-sm text-white border-white/20">
                      Запрос отправлен
                    </Button>
                  )}

                  {friendshipStatus === "accepted" && (
                    <>
                      <Button variant="outline" disabled className="bg-white/10 backdrop-blur-sm text-white border-white/20">
                        <Users className="w-4 h-4 mr-2" />
                        Друзья
                      </Button>
                      <Button 
                        onClick={() => setShowChat(true)} 
                        variant="outline"
                        className="bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Сообщение
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column - Main Profile */}
          <div className="lg:col-span-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Film className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{stats.movies}</span>
              </div>
              <p className="text-sm text-muted-foreground">Фильмы</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <span className="text-2xl font-bold block mb-2">{stats.followers}</span>
              <p className="text-sm text-muted-foreground">Подписчики</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <span className="text-2xl font-bold block mb-2">{stats.following}</span>
              <p className="text-sm text-muted-foreground">Подписки</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <span className="text-2xl font-bold block mb-2">{stats.comments}</span>
              <p className="text-sm text-muted-foreground">Комментарии</p>
            </CardContent>
          </Card>
            </div>

            {/* Bio Section */}
            {profile.bio && (
              <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3 text-lg">О себе</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-1 border">
                <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-auto">
                  <TabsTrigger 
                    value="favorites" 
                    className="flex-col h-auto py-3 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all"
                  >
                    <Star className="w-4 h-4 mb-1" />
                    <span className="text-xs">Top 50</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="activity" 
                    className="flex-col h-auto py-3 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all"
                  >
                    <Calendar className="w-4 h-4 mb-1" />
                    <span className="text-xs">Активность</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="watched" 
                    className="flex-col h-auto py-3 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all"
                  >
                    <Eye className="w-4 h-4 mb-1" />
                    <span className="text-xs">Просмотрено</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="stats" 
                    className="flex-col h-auto py-3 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all"
                  >
                    <BarChart3 className="w-4 h-4 mb-1" />
                    <span className="text-xs">Статистика</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Contents */}
              <TabsContent value="favorites" className="animate-fade-in space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <FavoriteMovies userId={userId!} isOwnProfile={isOwnProfile} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="watched" className="animate-fade-in space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <WatchedInteractive userId={userId!} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="animate-fade-in space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <UserActivity userId={userId!} showOnlyWatched={false} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="animate-fade-in space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <ProfileStats userId={userId!} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar with Friends */}
          <div className="lg:col-span-6 h-fit sticky top-24">
            <ProfileSidebar userId={userId!} userLevel={profile.level} userXP={profile.xp} />
          </div>
        </div>

        {/* Full Width Comments Section */}
        <div className="mt-8">
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Комментарии</h2>
                <Badge variant="secondary" className="ml-2">
                  {stats.comments}
                </Badge>
              </div>

              {currentUserId && (
                <form onSubmit={handleSubmitComment} className="space-y-3 mb-8">
                  <div className="relative">
                    <Textarea 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)} 
                      placeholder="Поделитесь своими мыслями..."
                      rows={4} 
                      maxLength={500}
                      className="bg-background/50 backdrop-blur-sm resize-none border-0 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-3">
                      <span className={`text-xs ${newComment.length > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {newComment.length}/500
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={submittingComment || !newComment.trim()} 
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Опубликовать
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {commentsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-muted-foreground">Загружаем комментарии...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-muted-foreground text-lg">Здесь пока нет комментариев</p>
                    <p className="text-sm text-muted-foreground/70">Будьте первым, кто оставит комментарий! 👋</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className="flex gap-4 p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-border transition-all duration-300"
                    >
                      <Link to={`/profile/${comment.author_id}`} className="flex-shrink-0">
                        <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 ring-primary transition-all">
                          <AvatarImage src={comment.author?.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                            {comment.author?.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Link to={`/profile/${comment.author_id}`}>
                              <p className="font-semibold hover:text-primary cursor-pointer transition-colors">
                                {comment.author?.display_name || comment.author?.username || "Unknown"}
                              </p>
                            </Link>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(comment.created_at)}
                            </p>
                          </div>

                          {(isOwnProfile || currentUserId === comment.author_id) && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDeleteComment(comment.id)} 
                              className="text-destructive hover:bg-destructive/20 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Модальные окна */}
      {showEditor && (
        <ProfileEditor profile={profile} open={showEditor} onClose={() => setShowEditor(false)} onUpdate={fetchProfile} />
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