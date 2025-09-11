"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, User, Plus, Loader2, Check, X } from "lucide-react";
import { createClient } from "@/supabase/client";
import { PLAYER, USER } from "@/types/game";
import { FIND_USER_BY_EMAIL } from "../actions";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/blocks/drawer";
import { formatUserDisplayName } from "@/lib/player-utils";

interface ADD_PLAYER_SHEET_PROPS {
  isopen: boolean;
  onClose: () => void;
  onPlayerAdded: (player: PLAYER) => void;
  existingplayers: PLAYER[];
  maxplayers: number;
  currentteamcount: number;
  user: USER;
}

export function AddPlayerSheet({
  isopen,
  onClose,
  onPlayerAdded,
  existingplayers,
  maxplayers,
  currentteamcount,
  user,
}: ADD_PLAYER_SHEET_PROPS) {
  const [searchemail, setsearchemail] = useState("");
  const [customplayername, setcustomplayername] = useState("");
  const [isloadingsearch, setisloadingsearch] = useState(false);
  const [founduser, setfounduser] = useState<USER | null>(null);
  const [searchstatus, setsearchstatus] = useState<"none" | "found" | "notfound">("none");
  const [friends, setFriends] = useState<USER[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const drawerContentRef = useRef<HTMLDivElement>(null);

  const SEARCH_USER_BY_EMAIL = useCallback(async () => {
    if (!searchemail.trim() || !searchemail.includes("@")) {
      setfounduser(null);
      setsearchstatus("none");
      return;
    }

    setisloadingsearch(true);
    try {
      const searcheduser = await FIND_USER_BY_EMAIL(searchemail.trim());

      if (searcheduser) {
        setfounduser(searcheduser);
        setsearchstatus("found");
      } else {
        setfounduser(null);
        setsearchstatus("notfound");
      }
    } catch (error) {
      console.error("❌ Error searching user:", error);
      setfounduser(null);
      setsearchstatus("notfound");
    } finally {
      setisloadingsearch(false);
    }
  }, [searchemail]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchemail.trim() && searchemail.includes("@")) {
        SEARCH_USER_BY_EMAIL();
      } else {
        setfounduser(null);
        setsearchstatus("none");
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchemail, SEARCH_USER_BY_EMAIL]);

  // Smooth keyboard handling for iOS
  useEffect(() => {
    if (!isopen) return;

    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    let isKeyboardShowing = false;

    const handleViewportChange = () => {
      if (!window.visualViewport) return;
      
      const currentHeight = window.visualViewport.height;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Keyboard is considered visible if viewport shrunk by more than 150px
      const keyboardVisible = heightDifference > 150;
      
      if (keyboardVisible !== isKeyboardShowing) {
        isKeyboardShowing = keyboardVisible;
        setIsKeyboardVisible(keyboardVisible);
        setKeyboardHeight(keyboardVisible ? heightDifference : 0);
        
        // Smooth transition for drawer content
        if (drawerContentRef.current) {
          drawerContentRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          
          if (keyboardVisible) {
            // Move drawer up smoothly when keyboard appears
            const offset = Math.min(heightDifference * 0.3, 200);
            drawerContentRef.current.style.transform = `translateY(-${offset}px)`;
          } else {
            // Return to original position when keyboard disappears
            drawerContentRef.current.style.transform = 'translateY(0)';
          }
        }
      }
    };

    // Handle input focus events for additional smoothness
    const handleInputFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === 'INPUT') {
        // Scroll the focused input into view smoothly
        setTimeout(() => {
          target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }, 300); // Wait for keyboard animation
      }
    };

    const handleInputBlur = () => {
      // Reset any manual scrolling when input loses focus
      if (drawerContentRef.current && !isKeyboardShowing) {
        drawerContentRef.current.style.transform = 'translateY(0)';
      }
    };

    // Use visualViewport API for better keyboard detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleViewportChange);
    }
    
    document.addEventListener('focusin', handleInputFocus);
    document.addEventListener('focusout', handleInputBlur);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
      document.removeEventListener('focusin', handleInputFocus);
      document.removeEventListener('focusout', handleInputBlur);
      
      // Reset transform when component unmounts - capture ref value to avoid stale closure
      const currentRef = drawerContentRef.current;
      if (currentRef) {
        currentRef.style.transform = 'translateY(0)';
        currentRef.style.transition = '';
      }
    };
  }, [isopen]);

  // Load friends for quick select
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    async function loadFriends() {
      try {
        // Outgoing
        const { data: outgoing } = await supabase
          .from("friends")
          .select("friend_id, users:friend_id(id, username, first_name, last_name, email)")
          .eq("user_id", user.id);
        // Incoming
        const { data: incoming } = await supabase
          .from("friends")
          .select("user_id, users:user_id(id, username, first_name, last_name, email)")
          .eq("friend_id", user.id);
        const outMapped = (outgoing || []).map((r: any) => r.users).filter(Boolean);
        const inMapped = (incoming || []).map((r: any) => r.users).filter(Boolean);
        const merged = [...outMapped, ...inMapped].filter(Boolean);
        const unique = Array.from(new Map(merged.map((u: USER) => [u.id, u])).values()) as USER[];
        if (!cancelled) setFriends(unique);
      } catch (e) {
        console.error("Failed to load friends", e);
      }
    }
    loadFriends();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const GET_USER_DISPLAY_NAME = (user: USER): string => {
    return formatUserDisplayName(user);
  };

  const IS_PLAYER_ALREADY_ADDED = (userid: string): boolean => {
    return existingplayers.some((player) => player.userId === userid);
  };

  const CAN_ADD_MORE_PLAYERS = (): boolean => {
    return currentteamcount < maxplayers;
  };

  const ADD_CURRENT_USER = () => {
    if (!user || IS_PLAYER_ALREADY_ADDED(user.id) || !CAN_ADD_MORE_PLAYERS()) {
      return;
    }

    const newplayer: PLAYER = {
      id: user.id,
      name: GET_USER_DISPLAY_NAME(user),
      isRegisteredUser: true,
      userId: user.id,
    };

    onPlayerAdded(newplayer);
    onClose();
  };

  const ADD_FOUND_USER = () => {
    if (!founduser || IS_PLAYER_ALREADY_ADDED(founduser.id) || !CAN_ADD_MORE_PLAYERS()) {
      return;
    }

    const newplayer: PLAYER = {
      id: founduser.id,
      name: GET_USER_DISPLAY_NAME(founduser),
      isRegisteredUser: true,
      userId: founduser.id,
    };

    onPlayerAdded(newplayer);
    setsearchemail("");
    setfounduser(null);
    setsearchstatus("none");
    onClose();
  };

  const ADD_CUSTOM_PLAYER = () => {
    if (!customplayername.trim() || !CAN_ADD_MORE_PLAYERS()) {
      return;
    }

    const newplayer: PLAYER = {
      id: `guest-${Date.now()}`,
      name: customplayername.trim(),
      isRegisteredUser: false,
      userId: undefined,
    };

    onPlayerAdded(newplayer);
    setcustomplayername("");
    onClose();
  };

  const RENDER_SEARCH_ICON = () => {
    if (isloadingsearch) {
      return <Loader2 size={20} className="text-white/50 animate-spin" />;
    }

    if (searchstatus === "found" && founduser && !IS_PLAYER_ALREADY_ADDED(founduser.id)) {
      return <Check size={20} className="text-green-500" />;
    }

    if (searchstatus === "found" && founduser && IS_PLAYER_ALREADY_ADDED(founduser.id)) {
      return <X size={20} className="text-red-500" />;
    }

    if (searchstatus === "notfound") {
      return <X size={20} className="text-red-500" />;
    }

    return null;
  };

  const CAN_ADD_FOUND_USER = (): boolean => {
    return (
      searchstatus === "found" && founduser !== null && !IS_PLAYER_ALREADY_ADDED(founduser.id) && CAN_ADD_MORE_PLAYERS()
    );
  };

  return (
    <Drawer open={isopen} onOpenChange={onClose}>
      <DrawerContent>
        <div 
          ref={drawerContentRef}
          className="relative"
          style={{
            maxHeight: isKeyboardVisible ? '70vh' : '90vh',
            transition: 'max-height 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          <DrawerHeader>
            <DrawerTitle>Add Player</DrawerTitle>
            <DrawerClose className="absolute right-4 top-4 text-white/70 hover:text-white" />
          </DrawerHeader>

          <div 
            className="p-4 space-y-4 overflow-y-auto"
            style={{
              maxHeight: isKeyboardVisible ? 'calc(70vh - 80px)' : 'calc(90vh - 80px)',
              scrollBehavior: 'smooth'
            }}
          >
          {/* Team Status */}
          <div className="bg-black/20 rounded-lg p-3 border border-white/10">
            <p className="text-sm text-white/70">
              Players: {currentteamcount}/{maxplayers}
            </p>
          </div>

          {/* Friends quick select */}
          {friends.length > 0 && CAN_ADD_MORE_PLAYERS() && (
            <div className="space-y-2">
              <h3 className="font-medium text-white">Your Friends</h3>
              <div className="flex flex-wrap gap-2">
                {friends.map((f) => {
                  const already = IS_PLAYER_ALREADY_ADDED(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        if (already || !CAN_ADD_MORE_PLAYERS()) return;
                        const newplayer: PLAYER = {
                          id: f.id,
                          name: GET_USER_DISPLAY_NAME(f),
                          isRegisteredUser: true,
                          userId: f.id,
                        };
                        onPlayerAdded(newplayer);
                        onClose();
                      }}
                      disabled={already}
                      className={`px-3 py-1.5 rounded-full border text-sm ${already ? 'border-white/15 text-white/40 cursor-not-allowed' : 'border-white/25 text-white hover:bg-white/10'}`}
                    >
                      {GET_USER_DISPLAY_NAME(f)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Current User */}
          {user && CAN_ADD_MORE_PLAYERS() && (
            <div className="space-y-3">
              <button
                onClick={ADD_CURRENT_USER}
                disabled={IS_PLAYER_ALREADY_ADDED(user.id)}
                className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors ${
                  IS_PLAYER_ALREADY_ADDED(user.id)
                    ? "border-white/20 bg-black/20 cursor-not-allowed"
                    : "border-white/30 hover:border-white/50 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <User size={20} className={IS_PLAYER_ALREADY_ADDED(user.id) ? "text-white/40" : "text-white"} />
                  <span className={`font-medium ${IS_PLAYER_ALREADY_ADDED(user.id) ? "text-white/40" : "text-white"}`}>
                    {IS_PLAYER_ALREADY_ADDED(user.id) ? "Already Added" : "Add Yourself"}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Find Registered User by Email */}
          {CAN_ADD_MORE_PLAYERS() && (
            <div className="space-y-3">
              <h3 className="font-medium text-white">Add Players</h3>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                  <input
                    type="email"
                    value={searchemail}
                    onChange={(e) => setsearchemail(e.target.value)}
                    placeholder="Enter email address..."
                    className="w-full pl-10 pr-12 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/40"
                    style={{ fontSize: '16px' }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">{RENDER_SEARCH_ICON()}</div>
                </div>
                <button
                  onClick={ADD_FOUND_USER}
                  disabled={!CAN_ADD_FOUND_USER()}
                  className="px-4 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/20"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Add Custom Player */}
          {CAN_ADD_MORE_PLAYERS() && (
            <div className="space-y-3">
              <h3 className="font-medium text-white">Add Guest Player</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customplayername}
                  onChange={(e) => setcustomplayername(e.target.value)}
                  placeholder="Enter player name..."
                  className="flex-1 px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/40"
                  style={{ fontSize: '16px' }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      ADD_CUSTOM_PLAYER();
                    }
                  }}
                />
                <button
                  onClick={ADD_CUSTOM_PLAYER}
                  disabled={!customplayername.trim()}
                  className="px-4 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/20"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
