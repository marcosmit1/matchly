"use client";

import { usePathname } from "next/navigation";
import NavMenu from "@/app/(app)/nav-menu";

export function NavWrapper() {
  const pathname = usePathname();

  // Hide navigation when in active game or specific game flows
  const SHOULD_HIDE_NAV = () => {
    if (pathname.includes("/game")) {
      return true;
    }
    return false;
  };

  if (SHOULD_HIDE_NAV()) {
    return null;
  }

  return <NavMenu />;
}
