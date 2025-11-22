import { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Film, Home, Tv, Gamepad, Music, Book, Bell, MessageSquare, User, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import supabase from "@/utils/supabase";
import NotificationsPanelComponent from "./NotificationsPanelComponent";
import MessagesPanelComponent from "./MessagesPanelComponent";

const Layout = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => {
    // Проверяем сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Подписываемся на изменения auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 80'%3E%3Ctext x='50' y='60' font-size='48' font-weight='bold' fill='%23d946ef' font-family='Arial'%3Ereverse%3C/text%3E%3C/svg%3E"
                alt="Reverse"
                className="h-10 w-auto"
              />
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Home
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/movies" className="flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  Movies
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/series" className="flex items-center gap-2">
                  <Tv className="w-4 h-4" />
                  Series
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/games" className="flex items-center gap-2">
                  <Gamepad className="w-4 h-4" />
                  Games
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/music" className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Music
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/books" className="flex items-center gap-2">
                  <Book className="w-4 h-4" />
                  Books
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {session?.user ? (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowNotifications(!showNotifications)}
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowMessages(!showMessages)}
                    title="Messages"
                  >
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
                          <p className="text-sm font-medium">{profile?.display_name || profile?.username || 'User'}</p>
                          <p className="text-xs text-muted-foreground">Level {profile?.level || 1}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={`/profile/${session.user.id}`} className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/profile/${session.user.id}/edit`} className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Edit Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Notifications Panel */}
                  {showNotifications && (
                    <NotificationsPanelComponent 
                      onClose={() => setShowNotifications(false)}
                    />
                  )}

                  {/* Messages Panel */}
                  {showMessages && (
                    <MessagesPanelComponent 
                      onClose={() => setShowMessages(false)}
                    />
                  )}
                </>
              ) : (
                <Button asChild size="sm">
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;