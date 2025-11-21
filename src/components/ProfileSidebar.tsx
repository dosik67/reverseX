import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import supabase from "@/utils/supabase";
import { Users, TrendingUp, Trophy, Crown } from "lucide-react";
import { Link } from "react-router-dom";

interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
}

interface ProfileSidebarProps {
  userId: string;
  userLevel?: number;
  userXP?: number;
}

const ProfileSidebar = ({ userId, userLevel = 1, userXP = 0 }: ProfileSidebarProps) => {
  const [topFriends, setTopFriends] = useState<Friend[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Демо данные для друзей
      const demoFriends: Friend[] = [
        {
          id: "1",
          username: "friend1",
          display_name: "Friend One",
          avatar_url: null,
          level: 8,
        },
        {
          id: "2",
          username: "friend2",
          display_name: "Friend Two",
          avatar_url: null,
          level: 6,
        },
        {
          id: "3",
          username: "friend3",
          display_name: "Friend Three",
          avatar_url: null,
          level: 5,
        },
        {
          id: "4",
          username: "friend4",
          display_name: "Friend Four",
          avatar_url: null,
          level: 4,
        },
        {
          id: "5",
          username: "friend5",
          display_name: "Friend Five",
          avatar_url: null,
          level: 3,
        },
      ];

      setTopFriends(demoFriends);

      // Демо данные для топ списков
      const demoTopRated = [
        { id: 1, title: "The Shawshank Redemption", rating: 9.3 },
        { id: 2, title: "The Godfather", rating: 9.2 },
        { id: 3, title: "The Dark Knight", rating: 9.0 },
        { id: 4, title: "Pulp Fiction", rating: 8.9 },
        { id: 5, title: "Forrest Gump", rating: 8.8 },
      ];

      setTopRated(demoTopRated);
    } catch (error) {
      console.error("Error fetching sidebar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextLevelXP = (userLevel + 1) * 500;
  const xpProgress = ((userXP % 500) / 500) * 100;

  return (
    <div className="space-y-4">
      {/* Level Card */}
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Level {userLevel}</h3>
          </div>
          <Badge variant="outline" className="text-primary">
            {userXP % 500} / 500 XP
          </Badge>
        </div>

        <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-2">
          <div
            className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300"
            style={{ width: `${xpProgress}%` }}
          />
        </div>

        <div className="text-xs text-muted-foreground">
          Next level in {500 - (userXP % 500)} XP
        </div>
      </Card>

      {/* Top Friends */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Top Friends</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {topFriends.length}
          </span>
        </div>

        <ScrollArea className="h-64 pr-4">
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <p className="text-xs text-muted-foreground">Loading...</p>
              </div>
            ) : topFriends.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No friends yet
              </p>
            ) : (
              topFriends.map((friend, index) => (
                <Link
                  key={friend.id}
                  to={`/profile/${friend.id}`}
                  className="group"
                >
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback>
                          {friend.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs font-bold">
                          1
                        </div>
                      )}
                      {index === 1 && (
                        <div className="absolute -top-1 -right-1 bg-gray-400 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs font-bold">
                          2
                        </div>
                      )}
                      {index === 2 && (
                        <div className="absolute -top-1 -right-1 bg-orange-600 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs font-bold">
                          3
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary">
                        {friend.display_name || friend.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lvl {friend.level}
                      </p>
                    </div>

                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      Lvl {friend.level}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Top Rated Movies */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h3 className="font-bold text-sm">Top 50 Lists</h3>
        </div>

        <ScrollArea className="h-64 pr-4">
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <p className="text-xs text-muted-foreground">Loading...</p>
              </div>
            ) : topRated.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No lists yet
              </p>
            ) : (
              topRated.map((item, index) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-accent">★</span>
                        <span className="text-xs text-muted-foreground">
                          {item.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Quick Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">42</div>
            <div className="text-xs text-muted-foreground">Movies</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-accent">8</div>
            <div className="text-xs text-muted-foreground">Series</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">12</div>
            <div className="text-xs text-muted-foreground">Favorites</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-accent">5</div>
            <div className="text-xs text-muted-foreground">Friends</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfileSidebar;
