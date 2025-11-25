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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Copy,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import { Link } from "react-router-dom";
import ProfileSidebar from "@/components/ProfileSidebar";
import FavoriteMovies from "@/components/FavoriteMovies";
import Top50Profile from "@/components/Top50Profile";

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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
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
    if (!userId) return;
    
    try {
      // Получаем статистику из базы
      const { data: userMovies } = await supabase
        .from('user_movies')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { data: followers } = await supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('friend_id', userId)
        .eq('status', 'accepted');

      const { data: following } = await supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'accepted');

      const { data: comments } = await supabase
        .from('profile_comments')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', userId);

      setStats({
        movies: userMovies?.length || 0,
        followers: followers?.length || 0,
        following: following?.length || 0,
        comments: comments?.length || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({ movies: 0, followers: 0, following: 0, comments: 0 });
    }
  };

  const fetchComments = async () => {
    if (!userId) return;
    
    try {
      setCommentsLoading(true);
      const { data, error } = await supabase
        .from("profile_comments")
        .select(`id, content, created_at, author_id, author:profiles(username, display_name, avatar_url)`)
        .eq("profile_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error(err);
      setComments([]);
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

  const handleShareProfile = async (platform?: string) => {
    const profileUrl = `${window.location.origin}/profile/${userId}`;
    const shareText = `Посмотри мой профиль на reverseX! ${profile?.display_name || profile?.username}`;
    
    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Ссылка скопирована в буфер обмена");
      } else if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + profileUrl)}`, '_blank');
      } else if (platform === 'telegram') {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`, '_blank');
      } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`, '_blank');
      } else if (navigator.share) {
        await navigator.share({
          title: 'reverseX Профиль',
          text: shareText,
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Ссылка скопирована в буфер обмена");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share error:', err);
        toast.error("Ошибка при поделении профилем");
      }
    }
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
            <div className="flex gap-3 mb-4 flex-wrap">
              {isOwnProfile ? (
                <>
                  <Button 
                    onClick={() => setShowEditor(true)} 
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30"
                    size="lg"
                  >
                    Редактировать профиль
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30"
                        size="lg"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Поделиться
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => handleShareProfile('copy')} className="cursor-pointer">
                        <Copy className="w-4 h-4 mr-2" />
                        <span>Копировать ссылку</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareProfile('whatsapp')} className="cursor-pointer">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-1.557.821-2.989 2.01-4.085 3.481A9.776 9.776 0 002.002 20.5c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 0 12 0zm0 18.52c-4.687 0-8.52-3.802-8.52-8.52 0-1.528.399-3.029 1.154-4.334l.834 1.441c-.728 1.127-1.147 2.458-1.147 3.893 0 4.105 3.292 7.456 7.355 7.456a7.41 7.41 0 003.512-.848l.868 1.495c-1.258.744-2.693 1.17-4.187 1.17z"/>
                        </svg>
                        <span>WhatsApp</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareProfile('telegram')} className="cursor-pointer">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.02c.242-.213-.054-.33-.373-.117l-6.869 4.332-2.97-.924c-.644-.213-.658-.644.136-.954l11.566-4.461c.54-.213 1.009.131.832.941z"/>
                        </svg>
                        <span>Telegram</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareProfile('facebook')} className="cursor-pointer">
                        <Facebook className="w-4 h-4 mr-2" />
                        <span>Facebook</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareProfile('twitter')} className="cursor-pointer">
                        <Twitter className="w-4 h-4 mr-2" />
                        <span>Twitter/X</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline"
                        className="bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
                        size="lg"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Поделиться
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => handleShareProfile('copy')} className="cursor-pointer">
                        <Copy className="w-4 h-4 mr-2" />
                        <span>Копировать ссылку</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareProfile('whatsapp')} className="cursor-pointer">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-1.557.821-2.989 2.01-4.085 3.481A9.776 9.776 0 002.002 20.5c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 0 12 0zm0 18.52c-4.687 0-8.52-3.802-8.52-8.52 0-1.528.399-3.029 1.154-4.334l.834 1.441c-.728 1.127-1.147 2.458-1.147 3.893 0 4.105 3.292 7.456 7.355 7.456a7.41 7.41 0 003.512-.848l.868 1.495c-1.258.744-2.693 1.17-4.187 1.17z"/>
                        </svg>
                        <span>WhatsApp</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareProfile('telegram')} className="cursor-pointer">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.02c.242-.213-.054-.33-.373-.117l-6.869 4.332-2.97-.924c-.644-.213-.658-.644.136-.954l11.566-4.461c.54-.213 1.009.131.832.941z"/>
                        </svg>
                        <span>Telegram</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareProfile('facebook')} className="cursor-pointer">
                        <Facebook className="w-4 h-4 mr-2" />
                        <span>Facebook</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareProfile('twitter')} className="cursor-pointer">
                        <Twitter className="w-4 h-4 mr-2" />
                        <span>Twitter/X</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                <TabsList className="grid w-full grid-cols-5 bg-transparent p-0 h-auto">
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
                    value="customizations" 
                    className="flex-col h-auto py-3 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all"
                  >
                    <Sparkles className="w-4 h-4 mb-1" />
                    <span className="text-xs">Оформление</span>
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
                <Top50Profile userId={userId!} isOwnProfile={isOwnProfile} />
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

              <TabsContent value="customizations" className="animate-fade-in space-y-6">
                {isOwnProfile ? (
                  <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-bold mb-3 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Основной цвет
                          </h3>
                          <div className="grid grid-cols-4 gap-3">
                            {['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#EF4444', '#6366F1'].map((color) => (
                              <button
                                key={color}
                                className="w-12 h-12 rounded-lg border-2 border-transparent hover:border-foreground transition-all"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold mb-3">Акцентный цвет</h3>
                          <div className="grid grid-cols-4 gap-3">
                            {['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF', '#06FFA5', '#FF006E', '#FB5607'].map((color) => (
                              <button
                                key={color}
                                className="w-12 h-12 rounded-lg border-2 border-transparent hover:border-foreground transition-all"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold mb-3">Стиль карточек</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <Card className="p-4 cursor-pointer hover:border-primary border-2 transition-all">
                              <p className="text-sm">Минимальный</p>
                            </Card>
                            <Card className="p-4 cursor-pointer hover:border-primary border-2 transition-all border-current">
                              <p className="text-sm">С контуром</p>
                            </Card>
                            <Card className="p-4 cursor-pointer hover:border-primary border-2 transition-all shadow-lg">
                              <p className="text-sm">Приподнятый</p>
                            </Card>
                            <Card className="p-4 cursor-pointer hover:border-primary border-2 transition-all bg-gradient-to-br from-primary/20 to-accent/20">
                              <p className="text-sm">Градиент</p>
                            </Card>
                          </div>
                        </div>

                        <Button className="w-full bg-primary hover:bg-primary/90">
                          <Send className="w-4 h-4 mr-2" />
                          Сохранить оформление
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-12 text-center">
                      <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">Оформление видно только на собственном профиле</p>
                    </CardContent>
                  </Card>
                )}
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