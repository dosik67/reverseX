// src/components/FriendsSystem.tsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/utils/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, X, MessageSquare } from "lucide-react";

interface ProfileMini {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface FriendshipRow {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  user?: ProfileMini;
  friend?: ProfileMini;
}

interface FriendsSystemProps {
  userId: string; // profile being viewed
  currentUserId: string | null; // logged in user (nullable)
  onMessage?: (friendId: string) => void;
}

const FriendsSystem = ({ userId, currentUserId, onMessage }: FriendsSystemProps) => {
  const [friends, setFriends] = useState<ProfileMini[]>([]);
  const [incoming, setIncoming] = useState<FriendshipRow[]>([]);
  const [outgoing, setOutgoing] = useState<FriendshipRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      // accepted friendships (either side)
      const { data: acceptedData, error: acceptedErr } = await supabase
        .from("friendships")
        .select(
          `id,user_id,friend_id,status,created_at,user:profiles(id,username,display_name,avatar_url),friend:profiles(id,username,display_name,avatar_url)`
        )
        .eq("status", "accepted")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (acceptedErr) throw acceptedErr;

      const mappedFriends: ProfileMini[] = (acceptedData || []).map((row: any) => {
        const other = row.user_id === userId ? row.user : row.friend;
        return {
          id: other?.id,
          username: other?.username ?? "unknown",
          display_name: other?.display_name ?? null,
          avatar_url: other?.avatar_url ?? null,
        };
      });

      // incoming pending (others -> viewing user)
      const { data: incomingData, error: incomingErr } = await supabase
        .from("friendships")
        .select(
          `id,user_id,friend_id,status,created_at,user:profiles(id,username,display_name,avatar_url),friend:profiles(id,username,display_name,avatar_url)`
        )
        .eq("status", "pending")
        .eq("friend_id", userId);

      if (incomingErr) throw incomingErr;

      // outgoing pending (viewing user -> others)
      const { data: outgoingData, error: outgoingErr } = await supabase
        .from("friendships")
        .select(
          `id,user_id,friend_id,status,created_at,user:profiles(id,username,display_name,avatar_url),friend:profiles(id,username,display_name,avatar_url)`
        )
        .eq("status", "pending")
        .eq("user_id", userId);

      if (outgoingErr) throw outgoingErr;

      setFriends(mappedFriends || []);
      setIncoming(incomingData || []);
      setOutgoing(outgoingData || []);
    } catch (err) {
      console.error("FriendsSystem fetch error:", err);
      toast.error("Ошибка загрузки друзей");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFriends();

    // subscribe to changes for realtime updates
    if (!userId) return;
    const channel = supabase
      .channel(`friends_system_profile_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        (payload) => {
          const row: any = (payload as any).new || (payload as any).old;
          if (!row) return;
          if (row.user_id === userId || row.friend_id === userId) {
            // refetch when any related change occurs
            fetchFriends();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchFriends]);

  const handleAccept = async (id: string) => {
    if (!currentUserId) return toast.error("Нужно войти в аккаунт");
    try {
      const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
      if (error) throw error;
      toast.success("Запрос принят");
      fetchFriends();
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при принятии запроса");
    }
  };

  const handleReject = async (id: string) => {
    if (!currentUserId) return toast.error("Нужно войти в аккаунт");
    try {
      const { error } = await supabase.from("friendships").delete().eq("id", id);
      if (error) throw error;
      toast.success("Запрос отклонен");
      fetchFriends();
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при отклонении запроса");
    }
  };

  const handleCancel = async (id: string) => {
    if (!currentUserId) return toast.error("Нужно войти в аккаунт");
    try {
      const { error } = await supabase.from("friendships").delete().eq("id", id);
      if (error) throw error;
      toast.success("Запрос отменен");
      fetchFriends();
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при отмене запроса");
    }
  };

  const renderFriendRow = (friend: ProfileMini) => (
    <div
      key={friend.id}
      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
    >
      <Link to={`/profile/${friend.id}`} className="flex items-center gap-3 flex-1">
        <Avatar className="w-12 h-12">
          <AvatarImage src={friend.avatar_url || undefined} />
          <AvatarFallback>{(friend.username?.[0] ?? "U").toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium hover:underline cursor-pointer">{friend.display_name || friend.username}</p>
          <p className="text-xs text-muted-foreground">@{friend.username}</p>
        </div>
      </Link>

      <div className="flex gap-2">
        {currentUserId && (
          <Button size="sm" variant="outline" onClick={() => onMessage?.(friend.id)}>
            <MessageSquare className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const renderIncomingRow = (row: FriendshipRow) => {
    const other = row.user ?? null; // incoming: user -> profile
    if (!other) return null;
    return (
      <div
        key={row.id}
        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <Link to={`/profile/${other.id}`} className="flex items-center gap-3 flex-1">
          <Avatar className="w-12 h-12">
            <AvatarImage src={other.avatar_url || undefined} />
            <AvatarFallback>{(other.username?.[0] ?? "U").toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium hover:underline cursor-pointer">{other.display_name || other.username}</p>
            <p className="text-xs text-muted-foreground">@{other.username}</p>
          </div>
        </Link>

        <div className="flex gap-2">
          {/* only profile owner can accept/reject */}
          {currentUserId === userId && (
            <>
              <Button size="sm" onClick={() => handleAccept(row.id)}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleReject(row.id)}>
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderOutgoingRow = (row: FriendshipRow) => {
    const other = row.friend ?? null; // outgoing: profile -> friend
    if (!other) return null;
    return (
      <div
        key={row.id}
        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <Link to={`/profile/${other.id}`} className="flex items-center gap-3 flex-1">
          <Avatar className="w-12 h-12">
            <AvatarImage src={other.avatar_url || undefined} />
            <AvatarFallback>{(other.username?.[0] ?? "U").toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium hover:underline cursor-pointer">{other.display_name || other.username}</p>
            <p className="text-xs text-muted-foreground">@{other.username}</p>
          </div>
        </Link>

        <div className="flex gap-2">
          {currentUserId === userId && (
            <Button size="sm" variant="outline" onClick={() => handleCancel(row.id)}>
              <X className="w-4 h-4 mr-1" />
              Отменить
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="card-glow">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  const showRequests = currentUserId === userId;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">Друзья ({friends.length})</TabsTrigger>
          {showRequests && (
            <>
              <TabsTrigger value="incoming">Входящие ({incoming.length})</TabsTrigger>
              <TabsTrigger value="outgoing">Исходящие ({outgoing.length})</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="friends" className="mt-6 space-y-3">
          {friends.length === 0 ? (
            <Card className="card-glow">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Нет друзей</p>
              </CardContent>
            </Card>
          ) : (
            friends.map((f) => renderFriendRow(f))
          )}
        </TabsContent>

        {showRequests && (
          <>
            <TabsContent value="incoming" className="mt-6 space-y-3">
              {incoming.length === 0 ? (
                <Card className="card-glow">
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">Нет входящих запросов</p>
                  </CardContent>
                </Card>
              ) : (
                incoming.map((r) => renderIncomingRow(r))
              )}
            </TabsContent>

            <TabsContent value="outgoing" className="mt-6 space-y-3">
              {outgoing.length === 0 ? (
                <Card className="card-glow">
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">Нет исходящих запросов</p>
                  </CardContent>
                </Card>
              ) : (
                outgoing.map((r) => renderOutgoingRow(r))
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export { FriendsSystem };
export { FriendsSystem as default };
