"use client";

import { useState, useTransition } from "react";

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

function isValidUsername(value: string) {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(value);
}

function isValidIdentifier(value: string) {
  return isValidEmail(value) || isValidUsername(value);
}

export default function AddFriendClient() {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (!isValidIdentifier(trimmed)) {
      setMessage("Enter a valid username or email address");
      return;
    }

    setMessage(null);
    const form = new FormData();
    form.set("identifier", trimmed);

    startTransition(async () => {
      const res = await fetch("/api/friends/add", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || "Failed to add friend");
      } else {
        setMessage("Friend request sent ✅");
        setQuery("");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-4" style={{ backdropFilter: "blur(8px)" as any }}>
      <div className="text-white/70 text-sm mb-2">Add by username or email</div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="username or friend@email.com"
          className="flex-1 rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white placeholder-white/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || !isValidIdentifier(query.trim())}
          className="rounded-xl bg-[#FAD659] text-black font-semibold px-4 py-2 disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </div>
      {message && <div className="mt-2 text-sm text-white/80">{message}</div>}
    </form>
  );
}
