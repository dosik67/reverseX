import { useEffect, useLayoutEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, Home, Tv, Gamepad, Music, Book } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

// Хук для сохранения и восстановления позиции скролла
const useScrollRestoration = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem(`scroll-pos:${pathname}`);
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll, 10));
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    const saveScrollPosition = () => {
      sessionStorage.setItem(`scroll-pos:${pathname}`, window.scrollY.toString());
    };

    window.addEventListener("scroll", saveScrollPosition);
    const handleBeforeUnload = () => saveScrollPosition();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname]);
};

const Layout = () => {
  const { t } = useTranslation();

  useScrollRestoration();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <Film className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold gradient-text">Reverse</span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    {t('nav.home')}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/movies" className="flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    {t('nav.movies')}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/series" className="flex items-center gap-2">
                    <Tv className="w-4 h-4" />
                    {t('nav.series')}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/games" className="flex items-center gap-2">
                    <Gamepad className="w-4 h-4" />
                    {t('nav.games')}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/music" className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    {t('nav.music')}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/books" className="flex items-center gap-2">
                    <Book className="w-4 h-4" />
                    {t('nav.books')}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button asChild size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
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