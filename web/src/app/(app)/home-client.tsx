"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export type StatItem = {
  title: string;
  value: string;
};

export function HomeHero({ username }: { username: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-5 py-6 text-white shadow-xl" style={{ backdropFilter: "blur(10px)" as any }}>
      {/* Glow accents */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-[#FAD659]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-[#22c55e]/20 blur-3xl" />

      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-white/10" />
          <Image src="/logo.png" alt="PongBros" fill priority className="object-contain" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-white/70">Welcome back</div>
          <div className="truncate text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
            {username}
          </div>
          <div className="mt-1 text-xs text-white/60">Let’s raise the bar today 🍻</div>
        </div>
      </div>
    </div>
  );
}

export function StatCarousel({ items, intervalMs = 4500 }: { items: StatItem[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const safeItems = useMemo(() => items.filter(Boolean), [items]);

  useEffect(() => {
    if (safeItems.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % safeItems.length), intervalMs);
    return () => clearInterval(id);
  }, [safeItems.length, intervalMs]);

  if (safeItems.length === 0) return null;

  const current = safeItems[index];
  const next = safeItems[(index + 1) % safeItems.length];

  return (
    <div className="relative h-28 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 text-white shadow-xl" style={{ backdropFilter: "blur(10px)" as any }}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
      {/* Current */}
      <div key={`${current.title}-${current.value}`} className="animate-in fade-in zoom-in duration-500">
        <div className="text-sm text-white/70">{current.title}</div>
        <div className="mt-1 text-3xl font-extrabold tracking-tight">{current.value}</div>
      </div>
      {/* Peek of next */}
      <div className="pointer-events-none absolute bottom-2 right-4 text-xs text-white/40">
        Next: {next.title}
      </div>
    </div>
  );
}

export function StatGrid({ items }: { items: StatItem[] }) {
  if (!items?.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((s) => (
        <div key={`${s.title}-${s.value}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-lg" style={{ backdropFilter: "blur(8px)" as any }}>
          <div className="text-xs text-white/60">{s.title}</div>
          <div className="text-lg font-bold">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
