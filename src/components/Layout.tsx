import { useState, useEffect, useLayoutEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import supabase from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Film, Bell, MessageSquare, User, LogOut, Home, Gamepad, Music, Book, Tv, Shield } from "lucide-react";
import NotificationsPanel from "./NotificationsPanel";
import MessagesPanel from "./MessagesPanel";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

// Хук для сохранения и восстановления позиции скролла
const useScrollRestoration = () => {
  const { pathname } = useLocation();

  // Восстанавливаем позицию сразу после смены маршрута
  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem(`scroll-pos:${pathname}`);
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll, 10));
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // Сохраняем позицию при скролле
  useEffect(() => {
    const saveScrollPosition = () => {
      sessionStorage.setItem(`scroll-pos:${pathname}`, window.scrollY.toString());
    };

    window.addEventListener("scroll", saveScrollPosition);
    // Сохраняем также перед уходом со страницы
    const handleBeforeUnload = () => saveScrollPosition();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname]);
};

const Layout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [loading, setLoading] = useState(true);

  // Добавляем хук восстановления скролла
  useScrollRestoration();

  useEffect(() => {
    console.log("🔄 Layout: Проверка сессии...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("📋 Сессия:", session ? "Найдена" : "Не найдена");
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        console.log("⚠️ Нет авторизации, но показываем контент");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔄 Auth state changed:", session ? "Авторизован" : "Не авторизован");
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();
    
    setIsAdmin(!!roleData);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <Film className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold gradient-text">Reverse</span>
              </Link>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild><Link to="/" className="flex items-center gap-2"><Home className="w-4 h-4" />{t('nav.home')}</Link></Button>
                <Button variant="ghost" size="sm" asChild><Link to="/movies" className="flex items-center gap-2"><Film className="w-4 h-4" />{t('nav.movies')}</Link></Button>
                <Button variant="ghost" size="sm" asChild><Link to="/series" className="flex items-center gap-2"><Tv className="w-4 h-4" />{t('nav.series')}</Link></Button>
                <Button variant="ghost" size="sm" asChild><Link to="/games" className="flex items-center gap-2"><Gamepad className="w-4 h-4" />{t('nav.games')}</Link></Button>
                <Button variant="ghost" size="sm" asChild><Link to="/music" className="flex items-center gap-2"><Music className="w-4 h-4" />{t('nav.music')}</Link></Button>
                <Button variant="ghost" size="sm" asChild><Link to="/books" className="flex items-center gap-2"><Book className="w-4 h-4" />{t('nav.books')}</Link></Button>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Админ
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowMessages(!showMessages)}>
                <MessageSquare className="w-5 h-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.display_name || profile?.username || 'Guest'}</p>
                      <p className="text-xs text-muted-foreground">Level {profile?.level || 1}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {session?.user?.id && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={`/profile/${profile?.id}`} className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {t('nav.profile')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        {t('nav.signOut')}
                      </DropdownMenuItem>
                    </>
                  )}
                  {!session?.user?.id && (
                    <DropdownMenuItem asChild>
                      <Link to="/auth" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      {session?.user?.id && (
        <>
          <NotificationsPanel
            open={showNotifications}
            onClose={() => setShowNotifications(false)}
            userId={session.user.id}
          />
          
          <MessagesPanel
            open={showMessages}
            onClose={() => setShowMessages(false)}
            userId={session.user.id}
          />
        </>
      )}
    </div>
  );
};

export default Layout;