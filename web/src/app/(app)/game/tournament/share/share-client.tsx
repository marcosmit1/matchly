"use client";

export default function ShareClient({ name, url }: { name: string; url: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Invite link copied to clipboard");
    } catch {}
  };

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-6 text-white">
      <div className="text-2xl font-bold">Share Tournament</div>
      <div className="mt-1 text-white/70">{name}</div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 break-all" style={{ backdropFilter: "blur(8px)" as any }}>
        {url}
      </div>
      <button onClick={copy} className="mt-3 h-10 px-4 rounded-xl bg-white/10 border border-white/10 active:scale-95">Copy Link</button>
    </main>
  );
}


