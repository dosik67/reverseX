import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, Home, Tv } from "lucide-react";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Film className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold gradient-text">Reverse</span>
            </Link>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">Home</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/movies">Movies</Link>
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