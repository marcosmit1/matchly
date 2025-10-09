"use client";

import { GolfTournamentDetails } from "./golf-tournament-details";
import type { GolfTournament } from "@/types/golf";

interface ClientWrapperProps {
  tournament: GolfTournament;
  userId: string;
}

export function ClientWrapper({ tournament, userId }: ClientWrapperProps) {
  return <GolfTournamentDetails tournament={tournament} userId={userId} />;
}
