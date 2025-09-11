import { createClient } from "@/supabase/server";
import ShareClient from "./share-client";
import { notFound } from "next/navigation";

export default async function ShareTournamentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : undefined;
  const token = typeof sp.token === "string" ? sp.token : undefined;
  if (!id && !token) return notFound();

  const supabase = await createClient();
  let data: any = null;
  if (id) {
    const res = await supabase.from("tournaments").select("id, name, join_token").eq("id", id).single();
    data = res.data;
  }
  // Fallback by public token (works even if not owner)
  if (!data && token) {
    const { data: rows } = await supabase.rpc("get_tournament_by_token", { p_token: token });
    if (rows && rows.length > 0) {
      data = { id: rows[0].id, name: rows[0].name, join_token: token };
    }
  }
  if (!data) return notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const shareUrl = `${base}/game/tournament/join?token=${encodeURIComponent(data.join_token)}`;
  return <ShareClient name={data.name} url={shareUrl} />;
}


