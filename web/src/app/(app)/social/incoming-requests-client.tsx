"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createClient } from "@/supabase/client";
import { formatUserDisplayName } from "@/lib/player-utils";

type RequestSender = {
  id: string;
  username?: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

export type IncomingRequest = {
  id: string;
  created_at: string;
  status: "pending" | "accepted" | "declined";
  sender: RequestSender;
};

function toDisplayName(sender: RequestSender): string {
  return formatUserDisplayName(sender as any);
}

export default function IncomingRequestsClient({ userId, initialRequests }: { userId: string; initialRequests: IncomingRequest[] }) {
  const [requests, setRequests] = useState<IncomingRequest[]>(initialRequests);
  const [isPending, startTransition] = useTransition();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchLatest() {
      const { data } = await supabase
        .from("friend_requests")
        .select("id, sender:sender_id(id, username, first_name, last_name, email), created_at, status")
        .eq("recipient_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (data) setRequests(data as IncomingRequest[]);
    }

    // Realtime subscription (INSERT/UPDATE)
    const channel = supabase
      .channel(`friend-requests-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friend_requests", filter: `recipient_id=eq.${userId}` },
        async (payload: { eventType: string; new: { id: string; sender_id: string; created_at: string; status: "pending" | "accepted" | "declined" } }) => {
          const action = (payload.eventType || "").toString();
          if (action === "INSERT") {
            // fetch sender for the new request
            const { data: sender } = await supabase
              .from("users")
              .select("id, username, first_name, last_name, email")
              .eq("id", payload.new.sender_id)
              .maybeSingle() as unknown as { data: RequestSender | null };
            if (sender) {
              setRequests((prev) => [
                { id: payload.new.id, created_at: payload.new.created_at, status: payload.new.status, sender },
                ...prev,
              ]);
            } else {
              fetchLatest();
            }
          } else if (action === "UPDATE") {
            // If status changed from pending, remove from list
            if (payload.new.status !== "pending") {
              setRequests((prev) => prev.filter((r) => r.id !== payload.new.id));
            }
          } else {
            fetchLatest();
          }
        }
      )
      .subscribe((status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED') => {
        // If RT fails, start fallback polling
        if (status === "SUBSCRIBED") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (!pollingRef.current) {
            pollingRef.current = setInterval(fetchLatest, 15000);
          }
        }
      });

    // Visibility refresh
    const onVis = () => {
      if (document.visibilityState === "visible") fetchLatest();
    };
    document.addEventListener("visibilitychange", onVis);

    // Kickstart a fetch to sync
    fetchLatest();

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (pollingRef.current) clearInterval(pollingRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const list = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);

  const respond = (id: string, action: "accept" | "decline") => {
    startTransition(async () => {
      const form = new FormData();
      form.set("id", id);
      form.set("action", action);
      const res = await fetch("/api/friends/respond", { method: "POST", body: form });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      }
    });
  };

  if (list.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4" style={{ backdropFilter: "blur(8px)" as any }}>
      <div className="text-white/70 text-sm mb-2">Incoming requests</div>
      <ul className="divide-y divide-white/10">
        {list.map((r) => (
          <li key={r.id} className="py-3 text-white flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate text-[15px] leading-5">{toDisplayName(r.sender)}</div>
              <div className="text-white/60 text-xs truncate">{r.sender.email}</div>
            </div>
            <div className="flex-shrink-0 flex gap-2">
              <button
                onClick={() => respond(r.id, "accept")}
                disabled={isPending}
                className="h-8 rounded-lg bg-[#FAD659] text-black font-semibold px-3 text-sm disabled:opacity-50 whitespace-nowrap"
              >
                Accept
              </button>
              <button
                onClick={() => respond(r.id, "decline")}
                disabled={isPending}
                className="h-8 rounded-lg bg-white/10 border border-white/20 text-white font-semibold px-3 text-sm disabled:opacity-50 whitespace-nowrap"
              >
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
