"use client";

import { ReactNode, useEffect, useMemo, memo } from "react";
import Link from "next/link";
import { HomeIcon, SettingsIcon, PlusCircleIcon, UsersIcon, ClockIcon, BellIcon, Target, MessageCircle, Trophy, Play, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type AppRoute = "/" | "/social" | "/analytics" | "/game" | "/account" | "/history" | "/invites" | "/community" | "/play" | "/chats" | "/create-league" | "/leagues" | "/discover" | "/matches";

type TabItem = {
  path: AppRoute;
  icon: ReactNode;
  label: string;
};

const Menu = memo(function Menu() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const idle = (cb: () => void) => ("requestIdleCallback" in window ? (window as any).requestIdleCallback(cb) : setTimeout(cb, 200));
    idle(() => {
      ["/", "/social", "/game", "/history", "/account"].forEach((p) => {
        try {
          router.prefetch(p);
        } catch {}
      });
    });
  }, [router]);

  const isrouteactive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    return path !== "/" && pathname.startsWith(path);
  };

  const TAB_ITEMS: TabItem[] = useMemo(
    () => [
      { path: "/", icon: <HomeIcon size={24} color={isrouteactive("/") ? "#1F2937" : "#9CA3AF"} />, label: "Home" },
      { path: "/leagues", icon: <Trophy size={24} color={isrouteactive("/leagues") ? "#1F2937" : "#9CA3AF"} />, label: "Leagues" },
      { path: "/discover", icon: <Search size={24} color={isrouteactive("/discover") ? "#1F2937" : "#9CA3AF"} />, label: "Discover" },
      { path: "/matches", icon: <Play size={24} color={isrouteactive("/matches") ? "#1F2937" : "#9CA3AF"} />, label: "Matches" },
      { path: "/account", icon: <SettingsIcon size={24} color={isrouteactive("/account") ? "#1F2937" : "#9CA3AF"} />, label: "Profile" },
    ], [pathname]
  );

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-white border-t border-gray-200" aria-label="Primary">
      <div className="flex flex-row justify-between mx-auto p-2 max-w-md">
        {TAB_ITEMS.map((item) => (
          <Link 
            key={item.path} 
            href={item.path} 
            className="flex flex-col items-center justify-center p-2 min-w-0 flex-1" 
            aria-label={item.label}
          >
            <div className="mb-1">
              {item.icon}
            </div>
            <span className={`text-xs font-medium ${isrouteactive(item.path) ? 'text-gray-900' : 'text-gray-500'}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
});

export default Menu;
