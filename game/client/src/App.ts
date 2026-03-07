import { COLORS } from "@/constants/visual";
import { GameCanvas } from "@/ui/components/GameCanvas";
import { DemoPlanetPage } from "@/ui/components/DemoPlanetPage";
import {
  createThreePlanetRuntime,
  type ThreePlanetRuntime,
} from "@/planets/ThreePlanetRuntime";
import { ALL_PLANET_TYPE_IDS } from "@/planets/PlanetTypes";
import {
  gameStore,
  getBotCount,
  type Difficulty,
  type GameSpeed,
  type MapSize,
  type PlayerSlot,
  type Screen,
} from "@/ui/store/useGameStore";
import { AudioManager } from "@/audio/AudioManager";
import type { SideStats } from "@/engine/GameStats";
import { formatUnits } from "@/utils/formatUnits";
import type { TelemetryAnalysis } from "@/telemetry/TelemetryTypes";

export class App {
  private gameCanvas: GameCanvas | null = null;
  private demoPage: DemoPlanetPage | null = null;
  private bgPlanet: ThreePlanetRuntime | null = null;
  private bgCanvas: HTMLCanvasElement | null = null;
  private bgAnimId = 0;
  private bgStartTime = 0;
  private readonly audio = new AudioManager();
  private readonly container: HTMLDivElement;
  private readonly canvasEl: HTMLCanvasElement;
  private readonly overlayEl: HTMLDivElement;
  private readonly helpButton: HTMLButtonElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly multiSelectButton: HTMLButtonElement;
  private readonly selectAllButton: HTMLButtonElement;
  private readonly deselectAllButton: HTMLButtonElement;

  public constructor(private readonly root: HTMLDivElement) {
    this.container = document.createElement("div");
    this.container.className = "appRoot";
    this.canvasEl = document.createElement("canvas");
    this.canvasEl.className = "gameCanvas";
    this.overlayEl = document.createElement("div");
    this.overlayEl.className = "overlayLayer";
    this.helpButton = document.createElement("button");
    this.helpButton.className = "ingameHelpButton";
    this.helpButton.textContent = "?";
    this.helpButton.onclick = () => this.openHelp();
    this.muteButton = document.createElement("button");
    this.muteButton.className = "hudToggleButton";
    this.muteButton.onclick = () => {
      this.audio.init();
      gameStore.getState().toggleMuted();
      this.audio.play("uiClick");
    };
    this.multiSelectButton = document.createElement("button");
    this.multiSelectButton.className = "hudToggleButton selectModeBtn";
    this.multiSelectButton.onclick = () => {
      this.audio.init();
      gameStore.getState().setMultiSelectMode(!gameStore.getState().multiSelectMode);
      this.audio.play("uiClick");
    };
    this.selectAllButton = document.createElement("button");
    this.selectAllButton.className = "hudToggleButton selectAllBtn";
    this.selectAllButton.textContent = "[ALL]";
    this.selectAllButton.onclick = () => {
      this.audio.init();
      this.gameCanvas?.selectAll();
      this.audio.play("uiClick");
    };
    this.deselectAllButton = document.createElement("button");
    this.deselectAllButton.className = "hudToggleButton deselectAllBtn";
    this.deselectAllButton.textContent = "[NONE]";
    this.deselectAllButton.onclick = () => {
      this.audio.init();
      this.gameCanvas?.deselectAll();
      this.audio.play("uiClick");
    };
    this.container.append(
      this.canvasEl,
      this.overlayEl,
      this.helpButton,
      this.muteButton,
      this.selectAllButton,
      this.deselectAllButton,
      this.multiSelectButton,
    );
  }

  public mount(): void {
    this.root.replaceChildren(this.container);
    gameStore.subscribe((state) => this.renderFromState(state));
    window.addEventListener("keydown", this.handleKeyDown);
    this.renderFromState(gameStore.getState());
  }

  private renderFromState(state: ReturnType<typeof gameStore.getState>): void {
    this.render(
      state.screen,
      state.difficulty,
      state.winner,
      state.gameSpeed,
      state.mapSize,
      state.players,
      state.muted,
      state.multiSelectMode,
      state.endStats,
      state.endTelemetry,
    );
  }

  private render(
    screen: Screen,
    difficulty: Difficulty,
    winner: number | null,
    gameSpeed: GameSpeed,
    mapSize: MapSize,
    players: PlayerSlot[],
    muted: boolean,
    multiSelectMode: boolean,
    endStats: { player: Readonly<SideStats>; enemy: Readonly<SideStats> } | null,
    endTelemetry: TelemetryAnalysis | null,
  ): void {
    this.audio.setMuted(muted);
    const botCount = players.filter((p) => p.isBot).length;

    if (screen === "playing" && !this.gameCanvas) {
      this.gameCanvas = new GameCanvas(
        this.canvasEl,
        difficulty,
        gameSpeed,
        mapSize,
        botCount,
        this.audio,
        {
          onGameOver: (gameWinner, stats) => {
            gameStore.getState().setWinner(gameWinner);
            gameStore.getState().setEndStats(stats);
            gameStore.getState().setScreen(gameWinner === 0 ? "victory" : "defeat");
          },
        },
      );
      this.gameCanvas.mount();
    }
    if (screen !== "playing" && this.gameCanvas) {
      this.gameCanvas.destroy();
      this.gameCanvas = null;
    }

    if (screen === "demo" && !this.demoPage) {
      this.demoPage = new DemoPlanetPage(this.overlayEl, () => {
        gameStore.getState().setScreen("menu");
      });
    }
    if (screen !== "demo" && this.demoPage) {
      this.demoPage.destroy();
      this.demoPage = null;
    }

    if (screen === "menu") {
      this.ensureBgPlanet();
    } else {
      this.destroyBgPlanet();
    }

    this.helpButton.style.display = screen === "playing" ? "block" : "none";
    this.muteButton.style.display = screen === "playing" ? "block" : "none";
    this.muteButton.textContent = muted ? "[SFX OFF]" : "[SFX ON]";
    this.selectAllButton.style.display = screen === "playing" ? "block" : "none";
    this.deselectAllButton.style.display = screen === "playing" ? "block" : "none";
    this.multiSelectButton.style.display = screen === "playing" ? "block" : "none";
    this.multiSelectButton.textContent = multiSelectMode ? "[MULTI ON]" : "[MULTI OFF]";

    if (screen !== "demo") {
      this.overlayEl.replaceChildren(
        this.buildScreen(screen, winner, difficulty, gameSpeed, mapSize, players, endStats, endTelemetry),
      );
    }
  }

  // ─── Background planet ──────────────────────────────────────────

  private ensureBgPlanet(): void {
    if (this.bgPlanet) return;
    const types = ALL_PLANET_TYPE_IDS.filter((t) => t !== "asteroid");
    const typeId = types[Math.floor(Math.random() * types.length)]!;
    const size = 400;
    const frustum =
      typeId === "star" ? 1.3 : typeId === "gasgiantring" ? 1.1 : 0.55;
    this.bgPlanet = createThreePlanetRuntime(typeId, size, {
      variationSeed: Math.random() * 999999,
      frustumScale: frustum,
      pixels: 100,
    });
    if (!this.bgPlanet) return;

    this.bgCanvas = document.createElement("canvas");
    this.bgCanvas.className = "menuBgCanvas";
    this.bgCanvas.width = size;
    this.bgCanvas.height = size;
    this.bgStartTime = performance.now();
    this.animateBg();
  }

  private animateBg = (): void => {
    this.bgAnimId = requestAnimationFrame(this.animateBg);
    if (!this.bgPlanet || !this.bgCanvas) return;
    const t = (performance.now() - this.bgStartTime) * 0.001;
    this.bgPlanet.update(t);
    const ctx = this.bgCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
      ctx.drawImage(this.bgPlanet.image, 0, 0);
    }
  };

  private destroyBgPlanet(): void {
    cancelAnimationFrame(this.bgAnimId);
    this.bgPlanet?.destroy();
    this.bgPlanet = null;
    this.bgCanvas = null;
  }

  // ─── Screen builders ────────────────────────────────────────────

  private buildScreen(
    screen: Screen,
    winner: number | null,
    difficulty: Difficulty,
    gameSpeed: GameSpeed,
    mapSize: MapSize,
    players: PlayerSlot[],
    endStats: { player: Readonly<SideStats>; enemy: Readonly<SideStats> } | null,
    endTelemetry: TelemetryAnalysis | null,
  ): HTMLElement {
    if (screen === "playing" || screen === "demo") {
      return document.createElement("div");
    }
    if (screen === "menu") {
      return this.buildMenuScreen(difficulty, gameSpeed, mapSize, players);
    }
    if (screen === "help") {
      return this.buildHelpScreen();
    }
    return this.buildEndScreen(screen, winner, endStats, endTelemetry);
  }

  private buildMenuScreen(
    difficulty: Difficulty,
    gameSpeed: GameSpeed,
    mapSize: MapSize,
    players: PlayerSlot[],
  ): HTMLElement {
    const wrapper = this.overlay("menuScreen");

    if (this.bgCanvas) {
      const bgWrap = document.createElement("div");
      bgWrap.className = "menuBgWrap";
      bgWrap.append(this.bgCanvas);
      wrapper.append(bgWrap);
    }

    const content = document.createElement("div");
    content.className = "menuContent";

    content.innerHTML = `
      <div class="menuHeader">
        <div class="menuTag">DISCORD ACTIVITY</div>
        <h1 class="menuTitle">NODE WARS</h1>
        <div class="menuSubtitle">Galactic Conquest</div>
        <div class="divider"></div>
      </div>
    `;

    const settingsRow = document.createElement("div");
    settingsRow.className = "menuSettingsRow";
    settingsRow.append(
      this.selectSetting(
        "Difficulty",
        [
          { label: "Easy", value: "passive" },
          { label: "Normal", value: "balanced" },
          { label: "Hard", value: "aggressive" },
        ],
        difficulty,
        (v) => gameStore.getState().setDifficulty(v as Difficulty),
      ),
      this.selectSetting(
        "Speed",
        [
          { label: "Slowest", value: "slowest" },
          { label: "Slow", value: "slow" },
          { label: "Normal", value: "normal" },
          { label: "Fast", value: "fast" },
          { label: "Fastest", value: "fastest" },
        ],
        gameSpeed,
        (v) => gameStore.getState().setGameSpeed(v as GameSpeed),
      ),
      this.selectSetting(
        "Map",
        [
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ],
        mapSize,
        (v) => gameStore.getState().setMapSize(v as MapSize),
      ),
    );
    content.append(settingsRow);

    const playerPanel = this.buildPlayerPanel(players);
    content.append(playerPanel);

    const actions = document.createElement("div");
    actions.className = "menuActions";
    const startBtn = this.button("▶  Start Game", "primary", () => {
      this.audio.init();
      gameStore.getState().startGame();
    });
    if (players.length < 2) {
      startBtn.disabled = true;
      startBtn.title = "Need at least 2 players";
    }
    actions.append(
      startBtn,
      this.button("?  How to Play", "secondary", () =>
        gameStore.getState().setScreen("help"),
      ),
      this.button("◎  Demo Planet", "secondary", () =>
        gameStore.getState().setScreen("demo"),
      ),
    );
    content.append(actions);

    wrapper.append(content);
    return wrapper;
  }

  private buildPlayerPanel(players: PlayerSlot[]): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "playerPanel";

    const header = document.createElement("div");
    header.className = "playerPanelHeader";

    const titleArea = document.createElement("div");
    titleArea.className = "playerPanelTitle";
    titleArea.innerHTML = `<span class="playerPanelLabel">Players</span><span class="playerPanelCount">${players.length} / 8</span>`;

    const botControls = document.createElement("div");
    botControls.className = "botControls";

    const botLabel = document.createElement("span");
    botLabel.className = "botControlsLabel";
    botLabel.textContent = "Bots";

    const minusBtn = document.createElement("button");
    minusBtn.className = "botStepBtn";
    minusBtn.textContent = "−";
    minusBtn.disabled = getBotCount(gameStore.getState()) <= 0;
    minusBtn.onclick = () => {
      this.audio.init();
      this.audio.play("uiClick");
      gameStore.getState().removeBot();
    };

    const countEl = document.createElement("span");
    countEl.className = "botStepCount";
    countEl.textContent = String(getBotCount(gameStore.getState()));

    const plusBtn = document.createElement("button");
    plusBtn.className = "botStepBtn";
    plusBtn.textContent = "+";
    plusBtn.disabled = players.length >= 8;
    plusBtn.onclick = () => {
      this.audio.init();
      this.audio.play("uiClick");
      gameStore.getState().addBot();
    };

    botControls.append(botLabel, minusBtn, countEl, plusBtn);
    header.append(titleArea, botControls);
    panel.append(header);

    const list = document.createElement("div");
    list.className = "playerList";
    for (const p of players) {
      list.append(this.buildPlayerRow(p));
    }
    panel.append(list);
    return panel;
  }

  private buildPlayerRow(slot: PlayerSlot): HTMLElement {
    const teamColor = COLORS.teamColors[slot.colorIndex] ?? COLORS.teamColors[0]!;
    const row = document.createElement("div");
    row.className = "playerRow";

    const avatar = document.createElement("div");
    avatar.className = "playerAvatar";
    avatar.style.background = teamColor.dark;
    avatar.style.borderColor = teamColor.main;
    avatar.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="9" r="4" fill="${teamColor.main}" opacity="0.7"/><path d="M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" fill="${teamColor.main}" opacity="0.5"/></svg>`;

    const name = document.createElement("span");
    name.className = "playerName";
    name.textContent = slot.name;

    const colorBtn = document.createElement("button");
    colorBtn.className = "colorSwatch";
    colorBtn.style.background = teamColor.main;
    colorBtn.title = "Change team color";
    colorBtn.onclick = () => {
      this.audio.init();
      this.audio.play("uiClick");
      gameStore.getState().cyclePlayerColor(slot.id);
    };

    row.append(avatar, name, colorBtn);
    return row;
  }

  private buildHelpScreen(): HTMLElement {
    const wrapper = this.overlay("helpScreen");
    wrapper.innerHTML = `
      <div class="helpBody">
        <h2 class="helpTitle">HOW TO PLAY</h2>
        <ul class="helpList">
          <li><b>CAPTURE PLANETS</b> Planets generate units. Capture all planets to win.</li>
          <li><b>SEND FLEETS</b> Drag from your planet to a target to send 55% units.</li>
          <li><b>COMBAT</b> Attackers subtract defenders. If attackers remain, planet is captured.</li>
          <li><b>STRATEGY</b> Larger planets produce faster, but overextending loses games.</li>
          <li><b>AVATARS</b> Planet interiors are avatar-ready placeholders for Discord integration.</li>
          <li><b>DIFFICULTY</b> Easy teaches flow, Normal is fair, Hard is ruthless AI pressure.</li>
        </ul>
      </div>
    `;
    wrapper.append(
      this.button("← Back", "secondary", () =>
        gameStore.getState().setScreen("menu"),
      ),
    );
    return wrapper;
  }

  private buildEndScreen(
    screen: Screen,
    winner: number | null,
    endStats: { player: Readonly<SideStats>; enemy: Readonly<SideStats> } | null,
    endTelemetry: TelemetryAnalysis | null,
  ): HTMLElement {
    const isVictory = screen === "victory";
    const wrapper = this.overlay(isVictory ? "victoryScreen" : "defeatScreen");
    const accent = isVictory ? COLORS.player.main : COLORS.enemy.main;
    const label = isVictory ? "CONQUEST COMPLETE" : "SYSTEMS OVERWHELMED";
    const title = isVictory ? "VICTORY" : "DEFEAT";
    wrapper.innerHTML = `
      <div class="endTag" style="color:${accent}">${label}</div>
      <h2 class="endTitle">${title}</h2>
      <div class="divider" style="background: linear-gradient(90deg, transparent, ${accent}, transparent)"></div>
      <div class="winnerText">${winner === 0 ? "You dominate the sector." : "Bot controls the sector."}</div>
    `;
    wrapper.append(this.buildStatsReport(endStats));
    wrapper.append(this.buildTelemetryReport(endTelemetry));
    const row = document.createElement("div");
    row.className = "controls";
    row.append(
      this.button(isVictory ? "Play Again" : "Try Again", "secondary", () =>
        gameStore.getState().startGame(),
      ),
      this.button("Menu", "secondary", () =>
        gameStore.getState().setScreen("menu"),
      ),
    );
    wrapper.append(row);
    return wrapper;
  }

  // ─── Reusable UI helpers ─────────────────────────────────────────

  private overlay(extraClass: string): HTMLDivElement {
    const el = document.createElement("div");
    el.className = `screenOverlay ${extraClass}`;
    return el;
  }

  private button(
    text: string,
    variant: "primary" | "secondary",
    onClick: () => void,
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = `actionButton ${variant}`;
    btn.textContent = text;
    btn.onmouseenter = () => this.audio.play("uiHover");
    btn.onclick = () => {
      this.audio.init();
      this.audio.play("uiClick");
      onClick();
    };
    return btn;
  }

  private selectSetting(
    labelText: string,
    options: Array<{ label: string; value: string }>,
    selectedValue: string,
    onChange: (value: string) => void,
  ): HTMLElement {
    const row = document.createElement("label");
    row.className = "settingRow";
    const text = document.createElement("span");
    text.className = "settingLabel";
    text.textContent = labelText;
    const select = document.createElement("select");
    select.className = "settingSelect";
    for (const option of options) {
      const el = document.createElement("option");
      el.value = option.value;
      el.text = option.label;
      el.selected = option.value === selectedValue;
      select.append(el);
    }
    select.onchange = () => {
      this.audio.init();
      this.audio.play("uiClick");
      onChange(select.value);
    };
    row.append(text, select);
    return row;
  }

  private startGameWithDifficulty(difficulty: Difficulty): void {
    this.audio.init();
    gameStore.getState().setDifficulty(difficulty);
    gameStore.getState().startGame();
  }

  private openHelp(): void {
    this.audio.init();
    gameStore.getState().setScreen("help");
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const state = gameStore.getState();
    if (event.key === "Escape") {
      if (state.screen === "help" || state.screen === "demo") {
        gameStore.getState().setScreen("menu");
        return;
      }
      if (state.screen === "victory" || state.screen === "defeat") {
        gameStore.getState().setScreen("menu");
        return;
      }
      this.gameCanvas?.clearSelection();
      return;
    }
    if (event.key === " " && state.screen === "playing") {
      event.preventDefault();
      // Spacebar now recenters camera (fit-all view)
      this.gameCanvas?.recenterCamera();
      return;
    }
    if (event.key.toLowerCase() === "p" && state.screen === "playing") {
      event.preventDefault();
      gameStore.getState().togglePaused();
      return;
    }
    if (event.key.toLowerCase() === "m") {
      gameStore.getState().toggleMuted();
      return;
    }
    if (event.key.toLowerCase() === "h") {
      if (state.screen === "help") {
        gameStore.getState().setScreen("menu");
      } else {
        gameStore.getState().setScreen("help");
      }
      return;
    }
    if (event.key.toLowerCase() === "a" && event.ctrlKey && state.screen === "playing") {
      event.preventDefault();
      this.audio.init();
      this.gameCanvas?.selectAll();
      this.audio.play("uiClick");
      return;
    }
    if (event.key.toLowerCase() === "d" && event.ctrlKey && state.screen === "playing") {
      event.preventDefault();
      this.audio.init();
      this.gameCanvas?.deselectAll();
      this.audio.play("uiClick");
      return;
    }
  };

  private buildStatsReport(
    stats: { player: Readonly<SideStats>; enemy: Readonly<SideStats> } | null,
  ): HTMLElement {
    const report = document.createElement("div");
    report.className = "statsReport";
    if (!stats) return report;
    const rows = [
      ["Duration", this.fmtDur(stats.player.gameDuration), ""],
      ["Fleets", String(stats.player.fleetsLaunched), `Bot: ${stats.enemy.fleetsLaunched}`],
      ["Units Produced", formatUnits(stats.player.unitsProduced), `Bot: ${formatUnits(stats.enemy.unitsProduced)}`],
      ["Units Destroyed", formatUnits(stats.player.unitsKilled), `Bot: ${formatUnits(stats.enemy.unitsKilled)}`],
      ["Planets Captured", String(stats.player.planetsCaptured), `Bot: ${stats.enemy.planetsCaptured}`],
      ["Peak Control", `${stats.player.peakPlanets}`, `Bot: ${stats.enemy.peakPlanets}`],
    ];
    const title = document.createElement("div");
    title.className = "statsTitle";
    title.textContent = "BATTLE REPORT";
    report.append(title);
    rows.forEach(([label, value, compare], index) => {
      const row = document.createElement("div");
      row.className = "statsRow";
      row.style.animationDelay = `${index * 150}ms`;
      row.innerHTML = `<span class="statsLabel">${label}</span><span class="statsValue">${value}</span><span class="statsCompare">${compare}</span>`;
      report.append(row);
    });
    return report;
  }

  private buildTelemetryReport(analysis: TelemetryAnalysis | null): HTMLElement {
    const wrap = document.createElement("details");
    wrap.className = "telemetryReport";
    if (!analysis) {
      return wrap;
    }
    const summary = document.createElement("summary");
    summary.textContent = "Balance Data";
    wrap.append(summary);

    const verdicts = document.createElement("div");
    verdicts.className = "telemetryVerdicts";
    for (const [label, value] of Object.entries(analysis.verdicts)) {
      const row = document.createElement("div");
      row.className = "telemetryRow";
      row.innerHTML = `<span class="telemetryLabel">${label}</span><span class="telemetryValue">${value}</span>`;
      verdicts.append(row);
    }

    const notes = document.createElement("div");
    notes.className = "telemetryNotes";
    for (const line of analysis.summaryLines) {
      const item = document.createElement("div");
      item.className = "telemetryNote";
      item.textContent = line;
      notes.append(item);
    }

    wrap.append(verdicts, notes);
    return wrap;
  }

  private fmtDur(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }
}
