"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/supabase/client";

import { formatUserDisplayName } from "@/lib/player-utils";

type FriendUser = {
  id: string;
  username?: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

function toDisplayName(user: FriendUser): string {
  return formatUserDisplayName(user as any);
}

function avatarInitials(user: FriendUser): string {
  const name = toDisplayName(user);
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function FriendsClient({ userId, initialFriends }: { userId: string; initialFriends: FriendUser[] }) {
  const [friends, setFriends] = useState<FriendUser[]>(initialFriends);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchFriends() {
      // Outgoing
      const { data: outgoing } = await supabase
        .from("friends")
        .select("friend_id, users:friend_id(id, username, first_name, last_name, email)")
        .eq("user_id", userId);
      // Incoming
      const { data: incoming } = await supabase
        .from("friends")
        .select("user_id, users:user_id(id, username, first_name, last_name, email)")
        .eq("friend_id", userId);

      const outMapped = (outgoing || []).map((r: any) => r.users).filter(Boolean);
      const inMapped = (incoming || []).map((r: any) => r.users).filter(Boolean);
      const merged = [...outMapped, ...inMapped].filter(Boolean);
      // Deduplicate by id
      const unique = Array.from(new Map(merged.map((u) => [u.id, u])).values());
      setFriends(unique as FriendUser[]);
    }

    const channel = supabase
      .channel(`friends-${userId}`)
      // Changes where current user is the owner
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friends", filter: `user_id=eq.${userId}` },
        () => fetchFriends()
      )
      // Changes where current user is the friend
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friends", filter: `friend_id=eq.${userId}` },
        () => fetchFriends()
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (!pollingRef.current) pollingRef.current = setInterval(fetchFriends, 15000);
        }
      });

    // Initial load
    fetchFriends();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (friends.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4" style={{ backdropFilter: "blur(8px)" as any }}>
        <div className="text-white/70 text-sm mb-2">Your Friends</div>
        <div className="text-white/50 text-sm">No friends yet</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4" style={{ backdropFilter: "blur(8px)" as any }}>
      <div className="text-white/70 text-sm mb-2">Your Friends</div>
      <ul className="divide-y divide-white/10">
        {friends.map((f) => (
          <li key={f.id} className="py-3 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FAD659] to-[#caa32f] text-black font-bold flex items-center justify-center text-xs">
                {avatarInitials(f)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{toDisplayName(f)}</div>
                <div className="text-white/60 text-xs truncate">{f.email}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
