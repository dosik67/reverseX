import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Film, Home, Tv, Gamepad, Music, Book, Bookmark, Bell, MessageSquare, User, LogOut, Settings, Crown, ChevronRight, ChevronLeft } from "lucide-react";
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
  const [scrollPosition, setScrollPosition] = useState(0);
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Film, label: 'Movies', path: '/movies' },
    { icon: Film, label: 'Explore', path: '/explore-movies' },
    { icon: Tv, label: 'Series', path: '/series' },
    { icon: Gamepad, label: 'Games', path: '/games' },
    { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks' },
    { icon: Crown, label: 'Tier Lists', path: '/tier-lists' },
    { icon: Music, label: 'Music', path: '/music' },
    { icon: Book, label: 'Books', path: '/books' },
  ];

  useEffect(() => {
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      }).catch((err) => {
        console.warn("⚠️  Error getting session:", err);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      });

      return () => subscription?.unsubscribe();
    } catch (err) {
      console.warn("⚠️  Auth not available:", err);
    }
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

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('mobile-nav-scroll');
    if (container) {
      const scrollAmount = 100;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      container.scrollLeft = newPosition;
      setScrollPosition(newPosition);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Desktop Header */}
      <nav className="hidden md:flex border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 w-full">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img 
                src="/logo.png"
                alt="ReverseX"
                className="h-16 w-auto"
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
                <Link to="/tier-lists" className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Tier Lists
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/bookmarks" className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Bookmarks
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
                        <Link to="/tier-lists" className="flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          Tier Lists
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

      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50">
        <div className="flex items-center h-20">
          {/* Scroll Left Button */}
          <button
            onClick={() => scroll('left')}
            className="flex-shrink-0 p-2 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Scrollable Navigation */}
          <div
            id="mobile-nav-scroll"
            className="flex-1 overflow-x-auto scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex gap-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-max ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-500'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => scroll('right')}
            className="flex-shrink-0 p-2 hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Profile/Actions */}
          {session ? (
            <div className="flex-shrink-0 flex items-center gap-2 px-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10">
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
            </div>
          ) : (
            <div className="flex-shrink-0 px-2">
              <Button asChild size="sm" className="text-xs">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* CSS для скрытия scrollbar */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Layout;