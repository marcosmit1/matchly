import { createClient } from "@/supabase/server";
import AddFriendClient from "./social-client";
import IncomingRequestsClient from "./incoming-requests-client";
import FriendsClient from "./friends-client";
import RefreshButton from "./refresh-button";

async function fetchFriendsAndRequests() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, friends: [] as any[], incoming: [] as any[] } as const;

  const { data: outgoing } = await supabase
    .from("friends")
    .select("friend_id, users:friend_id(id, username, first_name, last_name, email)")
    .eq("user_id", user.id);
  const { data: incomingFriends } = await supabase
    .from("friends")
    .select("user_id, users:user_id(id, username, first_name, last_name, email)")
    .eq("friend_id", user.id);

  const outMapped = (outgoing || []).map((r: any) => r.users).filter(Boolean);
  const inMapped = (incomingFriends || []).map((r: any) => r.users).filter(Boolean);
  const merged = [...outMapped, ...inMapped];
  const friends = Array.from(new Map(merged.map((u) => [u.id, u])).values());

  const { data: incoming } = await supabase
    .from("friend_requests")
    .select("id, sender:sender_id(id, username, first_name, last_name, email), created_at, status")
    .eq("recipient_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return { user, friends, incoming: incoming || [] } as const;
}

export default async function SocialPage() {
  const { user, friends, incoming } = await fetchFriendsAndRequests();

  return (
    <main className="relative h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold">Friends</h1>
          <RefreshButton />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="space-y-4">
          <AddFriendClient />
          {user && <IncomingRequestsClient userId={user.id} initialRequests={incoming as any} />}
          {user && <FriendsClient userId={user.id} initialFriends={friends as any} />}
        </div>
      </div>
    </main>
  );
}
