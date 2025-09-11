"use client";

import { useState } from "react";

export default function JoinClient({ token }: { token: string }) {
  const [teamName, setTeamName] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const submit = async () => {
    if (!teamName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tournament/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, team_name: teamName.trim(), players: [p1.trim(), p2.trim()].filter(Boolean) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to join");
      setResult("Team added successfully. You can close this page.");
    } catch (e: any) {
      setResult(e?.message || "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-6 text-white">
      <div className="text-2xl font-bold">Join Tournament</div>
      <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5" style={{ backdropFilter: "blur(10px)" as any }}>
        <div className="grid gap-3">
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name" className="bg-transparent outline-none placeholder-white/50 border border-white/10 rounded-xl px-3 py-2" />
          <div className="grid grid-cols-2 gap-2">
            <input value={p1} onChange={(e) => setP1(e.target.value)} placeholder="Player 1 (optional)" className="bg-transparent outline-none placeholder-white/50 border border-white/10 rounded-xl px-3 py-2" />
            <input value={p2} onChange={(e) => setP2(e.target.value)} placeholder="Player 2 (optional)" className="bg-transparent outline-none placeholder-white/50 border border-white/10 rounded-xl px-3 py-2" />
          </div>
          <button onClick={submit} disabled={loading || !teamName.trim()} className={`h-10 rounded-xl ${loading || !teamName.trim() ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'} bg-white/10 border border-white/10`}>{loading ? 'Joining...' : 'Join Tournament'}</button>
          {result && <div className="text-sm text-white/70">{result}</div>}
        </div>
      </div>
    </main>
  );
}


