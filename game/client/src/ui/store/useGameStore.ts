import { createStore } from "zustand/vanilla";
import type { SideStats } from "@/engine/GameStats";
import type { TelemetryAnalysis } from "@/telemetry/TelemetryTypes";

export type Screen = "menu" | "playing" | "help" | "victory" | "defeat" | "demo";
export type Difficulty = "passive" | "balanced" | "aggressive";
export type GameSpeed = "slowest" | "slow" | "normal" | "fast" | "fastest";
export type MapSize = "small" | "medium" | "large";

export interface PlayerSlot {
  id: number;
  name: string;
  colorIndex: number;
  isBot: boolean;
}

const MAX_PLAYERS = 8;

function defaultPlayers(): PlayerSlot[] {
  return [
    { id: 0, name: "Player", colorIndex: 0, isBot: false },
    { id: 1, name: "Bot 1", colorIndex: 1, isBot: true },
  ];
}

function nextAvailableColor(players: PlayerSlot[], skip: number): number {
  const taken = new Set(players.filter((p) => p.id !== skip).map((p) => p.colorIndex));
  for (let i = 0; i < MAX_PLAYERS; i++) {
    if (!taken.has(i)) return i;
  }
  return 0;
}

export interface UIState {
  screen: Screen;
  difficulty: Difficulty;
  gameSpeed: GameSpeed;
  mapSize: MapSize;
  players: PlayerSlot[];
  winner: number | null;
  muted: boolean;
  paused: boolean;
  multiSelectMode: boolean;
  endStats: { player: Readonly<SideStats>; enemy: Readonly<SideStats> } | null;
  endTelemetry: TelemetryAnalysis | null;
}

export interface UIActions {
  setScreen: (screen: Screen) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setGameSpeed: (speed: GameSpeed) => void;
  setMapSize: (size: MapSize) => void;
  addBot: () => void;
  removeBot: () => void;
  cyclePlayerColor: (playerId: number) => void;
  setWinner: (winner: number | null) => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  setMultiSelectMode: (enabled: boolean) => void;
  setEndStats: (stats: { player: Readonly<SideStats>; enemy: Readonly<SideStats> } | null) => void;
  setEndTelemetry: (telemetry: TelemetryAnalysis | null) => void;
  startGame: () => void;
}

export type GameStore = UIState & UIActions;

export function getBotCount(state: UIState): number {
  return state.players.filter((p) => p.isBot).length;
}

export const gameStore = createStore<GameStore>((set) => ({
  screen: "menu",
  difficulty: "balanced",
  gameSpeed: "normal",
  mapSize: "medium",
  players: defaultPlayers(),
  winner: null,
  muted: false,
  paused: false,
  multiSelectMode: false,
  endStats: null,
  endTelemetry: null,
  setScreen: (screen) => set({ screen }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setGameSpeed: (gameSpeed) => set({ gameSpeed }),
  setMapSize: (mapSize) => set({ mapSize }),
  addBot: () =>
    set((state) => {
      if (state.players.length >= MAX_PLAYERS) return state;
      const nextId = Math.max(...state.players.map((p) => p.id)) + 1;
      const botNum = state.players.filter((p) => p.isBot).length + 1;
      const colorIdx = nextAvailableColor(state.players, -1);
      return {
        players: [
          ...state.players,
          { id: nextId, name: `Bot ${botNum}`, colorIndex: colorIdx, isBot: true },
        ],
      };
    }),
  removeBot: () =>
    set((state) => {
      const bots = state.players.filter((p) => p.isBot);
      if (bots.length <= 0) return state;
      const lastBot = bots[bots.length - 1]!;
      return { players: state.players.filter((p) => p.id !== lastBot.id) };
    }),
  cyclePlayerColor: (playerId: number) =>
    set((state) => {
      const taken = new Set(state.players.filter((p) => p.id !== playerId).map((p) => p.colorIndex));
      const current = state.players.find((p) => p.id === playerId);
      if (!current) return state;
      let next = (current.colorIndex + 1) % MAX_PLAYERS;
      let attempts = 0;
      while (taken.has(next) && attempts < MAX_PLAYERS) {
        next = (next + 1) % MAX_PLAYERS;
        attempts++;
      }
      return {
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, colorIndex: next } : p,
        ),
      };
    }),
  setWinner: (winner) => set({ winner }),
  setMuted: (muted) => set({ muted }),
  toggleMuted: () => set((state) => ({ muted: !state.muted })),
  setPaused: (paused) => set({ paused }),
  togglePaused: () => set((state) => ({ paused: !state.paused })),
  setMultiSelectMode: (multiSelectMode) => set({ multiSelectMode }),
  setEndStats: (endStats) => set({ endStats }),
  setEndTelemetry: (endTelemetry) => set({ endTelemetry }),
  startGame: () => set({ screen: "playing", winner: null, paused: false, endStats: null, endTelemetry: null }),
}));
