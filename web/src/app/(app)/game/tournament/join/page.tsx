import JoinClient from "./join-client";
import { notFound } from "next/navigation";

export default async function JoinTournamentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : undefined;
  if (!token) return notFound();
  return <JoinClient token={token} />;
}


