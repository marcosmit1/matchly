import { GAME_STYLE, GAME_COLORS } from "@/types/game";

export const gamecolors: GAME_COLORS = {
  main: "#8B4513",
  dark: "#463E3F",
  light: "#D2691E",
  accent: "#CD853F",
  secondary: "#F5F5DC",
  cup: "#FFD700",
};

export const gamestyles: Record<GAME_STYLE, { colors: GAME_COLORS; name: string }> = {
  [GAME_STYLE.classic]: {
    name: "Classic",
    colors: {
      main: "#8B4513",
      dark: "#463E3F",
      light: "#D2691E",
      accent: "#CD853F",
      secondary: "#F5F5DC",
      cup: "#FFD700",
    },
  },
  [GAME_STYLE.ipa]: {
    name: "IPA",
    colors: {
      main: "#FFA500",
      dark: "#FF8C00",
      light: "#FFE4B5",
      accent: "#DDA0DD",
      secondary: "#F5F5DC",
      cup: "#FFD700",
    },
  },
  [GAME_STYLE.lager]: {
    name: "Lager",
    colors: {
      main: "#FFD700",
      dark: "#DAA520",
      light: "#FFFACD",
      accent: "#F0E68C",
      secondary: "#F5F5DC",
      cup: "#FFD700",
    },
  },
  [GAME_STYLE.stout]: {
    name: "Stout",
    colors: {
      main: "#2F4F4F",
      dark: "#1C1C1C",
      light: "#696969",
      accent: "#8B4513",
      secondary: "#F5F5DC",
      cup: "#FFD700",
    },
  },
};
