export const COLORS = {
  player: { main: "#00e5ff", glow: "rgba(0,229,255,0.4)", dark: "#006064", trail: "#00bcd4" },
  enemy: { main: "#ff1744", glow: "rgba(255,23,68,0.4)", dark: "#7f0000", trail: "#ff5252" },
  botPalettes: [
    { main: "#ff1744", glow: "rgba(255,23,68,0.4)", dark: "#7f0000", trail: "#ff5252" },
    { main: "#ff9100", glow: "rgba(255,145,0,0.4)", dark: "#6d3a00", trail: "#ffb74d" },
    { main: "#7c4dff", glow: "rgba(124,77,255,0.38)", dark: "#311b92", trail: "#b388ff" },
    { main: "#00c853", glow: "rgba(0,200,83,0.35)", dark: "#1b5e20", trail: "#69f0ae" },
    { main: "#f50057", glow: "rgba(245,0,87,0.35)", dark: "#880e4f", trail: "#ff80ab" },
    { main: "#00b8d4", glow: "rgba(0,184,212,0.35)", dark: "#006064", trail: "#84ffff" },
    { main: "#c6ff00", glow: "rgba(198,255,0,0.3)", dark: "#827717", trail: "#eeff41" },
  ],
  teamColors: [
    { main: "#00e5ff", dark: "#006064" },
    { main: "#ff1744", dark: "#7f0000" },
    { main: "#ff9100", dark: "#6d3a00" },
    { main: "#7c4dff", dark: "#311b92" },
    { main: "#00c853", dark: "#1b5e20" },
    { main: "#f50057", dark: "#880e4f" },
    { main: "#00b8d4", dark: "#006064" },
    { main: "#c6ff00", dark: "#827717" },
  ],
  neutral: { main: "#78909c", glow: "rgba(120,144,156,0.25)", dark: "#37474f", trail: "#90a4ae" },
  bg: "#05080f",
  stars: "#ffffff",
  grid: "rgba(0,229,255,0.03)",
  text: "#e0f7fa",
  accent: "#00e5ff",
} as const;

export const VISUAL_CONSTANTS = {
  particleLimit: 600,
  trailLimit: 1200,
  starCount: 180,
  nebulaCount: 5,
  gridStep: 60,
  uiBarHeight: 42,
  /** Avatar diameter in screen pixels (homeworld) - constant at all zoom levels. */
  avatarScreenDiameterHomeworld: 36,
  /** Avatar diameter in screen pixels (center sun). */
  avatarScreenDiameterSun: 48,
  /** Non-homeworld avatar diameter range (smallest planet → biggest). Still varies by planet size. */
  avatarScreenDiameterNonHomeMin: 18,
  avatarScreenDiameterNonHomeMax: 26,
} as const;
