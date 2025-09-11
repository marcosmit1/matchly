import { REALTIME_GAME_WRAPPER } from "./realtime-game-wrapper";

interface GAME_PAGE_PROPS {
  params: Promise<{
    gameid: string;
  }>;
}

export default async function GAME_PAGE({ params }: GAME_PAGE_PROPS) {
  const { gameid } = await params;
  return <REALTIME_GAME_WRAPPER gameid={gameid} />;
}
