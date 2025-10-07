"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { USER } from "@/types/game";
import { Button } from "@/blocks/button";
import { Plus, ArrowLeft, Play, Shuffle, Users } from "lucide-react";
import { AddPlayerSheet } from "../../game/blocks/add-player-sheet";

type Team = { id: string; name: string; players: Array<{ name: string; email?: string; userId?: string; isRegistered?: boolean }> };

function seedBracket(teams: Team[]): Team[] {
  // Basic shuffle seeding; can be replaced with @Bracket logic later
  const arr = [...teams];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function TournamentSetup({ user }: { user: USER }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeam, setNewTeam] = useState("");
  const [newTeamP1, setNewTeamP1] = useState("");
  const [newTeamP2, setNewTeamP2] = useState("");
  const [autoSeed, setAutoSeed] = useState(true);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [createTargetIndex, setCreateTargetIndex] = useState<0 | 1>(0);
  const [isCreating, setIsCreating] = useState(false);

  // Prevent scrolling on main screen, but allow it within teams list and when drawer is open
  useEffect(() => {
    // Don't apply scroll prevention when the AddPlayerSheet is open
    if (showCreateSheet) return;

    const preventDefault = (e: Event) => {
      // Check if we're inside a drawer/modal
      const target = e.target as Element;
      const drawer = document.querySelector('[data-vaul-drawer]');
      if (drawer) {
        return; // Allow normal behavior when drawer is open
      }

      // Only prevent scroll if it's not coming from the teams list container
      const teamsContainer = document.querySelector('.teams-scroll-container');
      if (teamsContainer && teamsContainer.contains(target)) {
        return; // Allow scrolling in teams list
      }
      e.preventDefault();
    };
    
    const preventTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) return; // Allow pinch zoom
      
      // Check if we're inside a drawer/modal
      const target = e.target as Element;
      const drawer = document.querySelector('[data-vaul-drawer]');
      if (drawer) {
        return; // Allow normal behavior when drawer is open
      }
      
      // Allow scrolling in teams list
      const teamsContainer = document.querySelector('.teams-scroll-container');
      if (teamsContainer && teamsContainer.contains(target)) {
        return; // Allow touch scrolling in teams list
      }
      
      e.preventDefault();
    };


    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    window.addEventListener('scroll', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventTouch, { passive: false });
    window.addEventListener('wheel', preventDefault, { passive: false });
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      
      window.removeEventListener('scroll', preventDefault);
      window.removeEventListener('touchmove', preventTouch);
      window.removeEventListener('wheel', preventDefault);
    };
  }, [showCreateSheet]); // Add showCreateSheet as dependency

  const allowedTeamSizes = [4, 6, 8];
  const canStart = allowedTeamSizes.includes(teams.length);
  
  // Helper text for team count validation
  const getTeamCountMessage = () => {
    if (teams.length < 4) {
      return `Add ${4 - teams.length} more team${4 - teams.length === 1 ? '' : 's'} (need 4, 6, or 8 total)`;
    } else if (teams.length === 5) {
      return "Add 1 more team or remove 1 team (need 4, 6, or 8 total)";
    } else if (teams.length === 7) {
      return "Add 1 more team or remove 1 team (need 4, 6, or 8 total)";
    } else if (teams.length > 8) {
      return `Remove ${teams.length - 8} team${teams.length - 8 === 1 ? '' : 's'} (max 8 teams)`;
    } else if (allowedTeamSizes.includes(teams.length)) {
      return `✓ ${teams.length} teams - Ready to start!`;
    }
    return "Need 4, 6, or 8 teams to start tournament";
  };

  const seeded = useMemo(() => (autoSeed ? seedBracket(teams) : teams), [autoSeed, teams]);

  return (
    <div className="absolute-no-scroll" style={{ height: '100vh', position: 'relative' }}>
      {/* Header */}
      <div className="relative pt-8 sm:pt-12 pb-6 text-center" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        <Link
          href="/game"
          className="absolute top-8 sm:top-12 h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95"
          style={{ left: '16px' }}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-4xl font-bold mb-2 text-white">Tournament</h1>
        <p className="text-md opacity-70 text-white">Create your bracket</p>
        

      </div>

      {/* Team entry */}
      <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-xl" style={{ backdropFilter: "blur(10px)" as any }}>
          <div className="flex items-center gap-2">
            <input
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              placeholder="Team name"
              className="flex-1 bg-transparent outline-none placeholder-white/50"
              style={{ fontSize: '16px' }}
              maxLength={30}
            />
            <button
              onClick={() => {
                const name = newTeam.trim();
                if (!name) return;
                
                // Collect player info from temp storage and form inputs
                const players: Array<{ name: string; email?: string; userId?: string; isRegistered?: boolean }> = [];
                if (newTeamP1.trim()) {
                  const p1Info = (window as any).tempPlayerP1 || { name: newTeamP1.trim(), isRegistered: false };
                  players.push(p1Info);
                }
                if (newTeamP2.trim()) {
                  const p2Info = (window as any).tempPlayerP2 || { name: newTeamP2.trim(), isRegistered: false };
                  players.push(p2Info);
                }
                
                setTeams((t) => [...t, { id: Math.random().toString(36).substr(2, 9), name, players }]);
                setNewTeam("");
                setNewTeamP1("");
                setNewTeamP2("");
                // Clear temp storage
                delete (window as any).tempPlayerP1;
                delete (window as any).tempPlayerP2;
              }}
              className="h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95"
              aria-label="Add team"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateTargetIndex(0);
                setShowCreateSheet(true);
              }}
              className="bg-transparent border border-white/10 rounded-xl px-3 py-2 w-full text-left flex items-center gap-2 hover:bg-white/5 transition-colors"
            >
              <Users size={16} className="text-white/60" />
              <span className={newTeamP1 ? "text-white" : "text-white/50"}>
                {newTeamP1 || "Player 1 (optional)"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateTargetIndex(1);
                setShowCreateSheet(true);
              }}
              className="bg-transparent border border-white/10 rounded-xl px-3 py-2 w-full text-left flex items-center gap-2 hover:bg-white/5 transition-colors"
            >
              <Users size={16} className="text-white/60" />
              <span className={newTeamP2 ? "text-white" : "text-white/50"}>
                {newTeamP2 || "Player 2 (optional)"}
              </span>
            </button>
          </div>
          <div className={`mt-3 text-xs ${canStart ? 'text-green-400' : 'text-white/60'}`}>
            {getTeamCountMessage()}
          </div>
        </div>
      </div>

      {/* Teams list - SCROLLABLE AREA */}
      <div className="py-6 teams-scroll-container" style={{
        paddingLeft: '16px',
        paddingRight: '16px',
        position: 'absolute',
        top: '340px', // Increased from 300px to add more spacing between input and teams
        bottom: '180px', // Adjust based on controls height
        left: '0',
        right: '0',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div className="space-y-6">
          {teams.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-lg" style={{ backdropFilter: "blur(8px)" as any }}>
              <div className="flex items-center justify-between gap-2">
                <div className="truncate font-semibold">{t.name}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingTeamId(t.id)} className="text-white/70 text-xs">Edit</button>
                  <button onClick={() => setTeams((arr) => arr.filter((x) => x.id !== t.id))} className="text-white/60 text-xs">Remove</button>
                </div>
              </div>
              <div className="mt-2 text-white/70 text-xs">Players</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {t.players.map((p, idx) => (
                  <span key={idx} className="rounded-full bg-white/10 border border-white/10 px-2 py-1 text-xs">
                    {p.name}{p.isRegistered ? " (reg)" : ""}
                  </span>
                ))}
                {t.players.length === 0 && <span className="text-white/50 text-xs">No players yet</span>}
              </div>

              {editingTeamId === t.id && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Player name"
                    className="flex-1 bg-transparent outline-none placeholder-white/50"
                    style={{ fontSize: '16px' }}
                    maxLength={40}
                  />
                  <button
                    onClick={() => {
                      const name = newPlayerName.trim();
                      if (!name) return;
                      setTeams((arr) => arr.map((x) => (x.id === t.id ? { ...x, players: [...x.players, { name, isRegistered: false }] } : x)));
                      setNewPlayerName("");
                    }}
                    className="h-8 px-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs"
                  >
                    Add
                  </button>
                  <button onClick={() => setEditingTeamId(null)} className="h-8 px-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs">
                    Done
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls - FIXED AT BOTTOM */}
      <div className="tournament-bottom-controls pb-8 sm:pb-12 space-y-3" style={{
        paddingLeft: '16px',
        paddingRight: '16px',
        background: 'linear-gradient(to top, rgba(44, 44, 44, 1) 70%, rgba(44, 44, 44, 0.8) 100%)',
        paddingTop: '16px'
      }}>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-lg flex items-center justify-between" style={{ backdropFilter: "blur(8px)" as any }}>
          <div className="flex items-center gap-2">
            <Shuffle size={16} className="text-white/70" />
            <div className="text-sm">Auto-seed</div>
          </div>
          <button
            onClick={() => setAutoSeed((v) => !v)}
            className="h-8 px-3 rounded-lg bg-white/10 border border-white/10 text-white text-xs active:scale-95"
          >
            {autoSeed ? "On" : "Off"}
          </button>
        </div>

        <Button
          disabled={!canStart || isCreating}
          className={`h-[50px] w-full py-3 ${!canStart || isCreating ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
          variant="default"
          onClick={async () => {
            if (isCreating) return;
            
            setIsCreating(true);
            try {
              const res = await fetch("/api/tournament/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: "Beer Pong Tournament",
                  teams: seeded.map((t) => ({
                    name: t.name,
                    players: (teams.find((x) => x.name === t.name)?.players || []).map((p) => ({
                      name: p.name,
                      email: p.email,
                      userId: p.userId,
                      isRegistered: p.isRegistered
                    })),
                  })),
                }),
              });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error || "Failed to create tournament");
              window.location.href = `/game/tournament/view?id=${encodeURIComponent(json.id)}`;
            } catch (e) {
              console.error(e);
              alert("Failed to create tournament");
              setIsCreating(false);
            }
          }}
        >
          <div className="flex items-center justify-center gap-2">
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Tournament...</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>Start Tournament</span>
              </>
            )}
          </div>
        </Button>
      </div>
      {/* Add Player Sheet for initial team player pick */}
      {showCreateSheet && (
        <AddPlayerSheet
          isopen={showCreateSheet}
          onClose={() => setShowCreateSheet(false)}
          onPlayerAdded={(player) => {
            // Store the full player info for notifications
            const playerInfo = {
              name: player.name,
              email: player.name.includes('@') ? player.name : undefined,
              userId: player.userId,
              isRegistered: player.isRegisteredUser
            };
            
            if (createTargetIndex === 0) {
              setNewTeamP1(player.name);
              // Store player info for later use
              (window as any).tempPlayerP1 = playerInfo;
            } else {
              setNewTeamP2(player.name);
              // Store player info for later use  
              (window as any).tempPlayerP2 = playerInfo;
            }
            setShowCreateSheet(false);
          }}
          existingplayers={[]}
          maxplayers={1}
          currentteamcount={0}
          user={user}
        />
      )}
    </div>
  );
}


