"use client";

import { usePathname } from "next/navigation";
import NavMenu from "@/app/(app)/nav-menu";

export function NavWrapper() {
  const pathname = usePathname();

  // Hide navigation when in active game, golf scorecard, or specific game flows
  const SHOULD_HIDE_NAV = () => {
    if (pathname.includes("/game") || pathname.includes("/golf") && pathname.includes("/play")) {
      return true;
    }
    return false;
  };

  if (SHOULD_HIDE_NAV()) {
    return null;
  }

  return <NavMenu />;
}
