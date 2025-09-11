"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button
      onClick={onClick}
      disabled={isPending}
      aria-label="Refresh"
      className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15 active:scale-[0.98] transition disabled:opacity-60"
      title={isPending ? "Refreshing..." : "Refresh"}
    >
      <RotateCcw size={18} className={isPending ? "animate-spin" : ""} />
    </button>
  );
}
