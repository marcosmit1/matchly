"use client";

interface TEAM_BUTTON_PROPS {
  title: string;
  playercount: number;
  maxplayers: number;
  disabled: boolean;
  onPress: () => void;
}

export function TeamButton({ title, playercount, maxplayers, disabled, onPress }: TEAM_BUTTON_PROPS) {
  return (
    <button
      onClick={onPress}
      disabled={disabled}
      className={`flex-1 p-4 rounded-lg border transition-colors ${
        disabled
          ? "bg-white/10 border-white/20 cursor-not-allowed opacity-50"
          : "bg-white/20 border-white/30 hover:bg-white/30 hover:border-white/40"
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="font-medium text-white">{title}</span>
        <span className="text-sm text-white/70">
          {playercount}/{maxplayers} Players
        </span>
      </div>
    </button>
  );
}
