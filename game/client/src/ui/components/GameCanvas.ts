import { GAME_CONSTANTS } from "@/constants/game";
import { GAME_SPEED_MULTIPLIERS } from "@/constants/game";
import { AI_PERSONALITIES } from "@/constants/ai";
import type { PlanetId, PlayerId } from "@/types/game";
import { dist } from "@/utils/math";
import { resizeCanvasToDisplaySize } from "@/utils/canvas";
import { GameEngine } from "@/engine/GameEngine";
import { CanvasRenderer } from "@/renderer/CanvasRenderer";
import { InputManager } from "@/input/InputManager";
import { CameraController } from "@/camera/CameraController";
import { ZoomControls } from "@/ui/components/ZoomControls";
import { RotationControls } from "@/ui/components/RotationControls";
import { gameStore, type Difficulty, type GameSpeed, type MapSize } from "@/ui/store/useGameStore";
import { AudioManager } from "@/audio/AudioManager";
import type { SideStats } from "@/engine/GameStats";
import { normalizeAngle, type WorldBounds } from "@/camera/Camera";
import { TelemetryTracker } from "@/telemetry/TelemetryTracker";
import { TelemetryAnalyzer } from "@/telemetry/TelemetryAnalyzer";

export interface GameCanvasCallbacks {
  onGameOver: (winner: number, stats: { player: Readonly<SideStats>; enemy: Readonly<SideStats> }) => void;
}

export class GameCanvas {
  private engine: GameEngine | null = null;
  private renderer: CanvasRenderer | null = null;
  private input: InputManager | null = null;
  private cameraController: CameraController | null = null;
  private zoomControls: ZoomControls | null = null;
  private rotationControls: RotationControls | null = null;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private lastTs = performance.now();
  private worldBounds: WorldBounds | null = null;
  private autoOrientAngle = 0;
  private telemetryTracker: TelemetryTracker | null = null;
  private telemetryFinalized = false;
  private readonly suppressContextMenu = (event: MouseEvent): void => event.preventDefault();

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly difficulty: Difficulty,
    private readonly gameSpeed: GameSpeed,
    private readonly mapSize: MapSize,
    private readonly botCount: number,
    private readonly audio: AudioManager,
    private readonly callbacks: GameCanvasCallbacks,
  ) {}

  public mount(): void {
    const initial = resizeCanvasToDisplaySize(this.canvas);
    this.engine = new GameEngine(
      {
        width: initial.width,
        height: initial.height,
        playerId: 0 as PlayerId,
        botCount: this.botCount,
        mapSize: this.mapSize,
        homeUnits: 30,
      },
      this.difficulty in AI_PERSONALITIES ? this.difficulty : "balanced",
    );

    this.renderer = new CanvasRenderer(this.canvas, this.engine.getState());
    this.telemetryTracker = new TelemetryTracker();
    this.telemetryFinalized = false;

    const planets = this.engine.getState().planets;
    if (planets.length > 0) {
      this.worldBounds = this.calculateWorldBounds(planets);
      const sun = planets.find((planet) => planet.isSun);
      if (sun) {
        this.renderer.getCamera().setPivot(sun.x, sun.y);
      }
      this.autoOrientAngle = this.calculateAutoOrientAngle(this.engine.getState());
      this.applyAutoOrientView();
      this.telemetryTracker.configure(
        {
          ...this.engine.getMapMetadata(),
          autoOrientAngle: this.autoOrientAngle,
          worldBounds: this.worldBounds,
        },
        this.engine.getState(),
      );
    }

    this.engine.on((event) => {
      this.renderer?.handleEvent(event);
      const currentState = this.engine?.getState();
      if (currentState) {
        this.telemetryTracker?.recordEvent(event, currentState);
      }
      if (event.type === "fleet_launched") {
        this.audio.play("fleetLaunch");
      }
      if (event.type === "fleet_arrived") {
        if (event.result.captured) {
          this.audio.play(event.fleet.owner === (0 as PlayerId) ? "planetCaptured" : "planetLost");
        } else if (event.target.owner === event.fleet.owner) {
          this.audio.play("fleetArriveReinforce");
        } else {
          this.audio.play("fleetArriveCombat");
        }
      }
      if (event.type === "game_over") {
        this.audio.play(event.winner === (0 as PlayerId) ? "victory" : "defeat");
        this.finalizeTelemetry();
        this.callbacks.onGameOver(Number(event.winner), this.engine!.getStats());
      }
    });

    this.input = new InputManager(this.canvas, {
      onFleetDispatch: (fromIds, to) => this.engine?.dispatchMultiFleet(fromIds, to, 0 as PlayerId),
      getPlanetAt: (pos) => {
        const planets = this.engine?.getState().planets ?? [];
        for (const planet of planets) {
          if (dist(pos, planet) < planet.radius + 10) {
            return planet.id;
          }
        }
        return null;
      },
      isOwnedByPlayer: (planetId: PlanetId) => {
        const planet = this.engine?.getState().planets.find((entry) => entry.id === planetId);
        return planet?.owner === (0 as PlayerId);
      },
      getPlanetsInBox: (minX: number, minY: number, maxX: number, maxY: number) => {
        const planets = this.engine?.getState().planets ?? [];
        const inBox: PlanetId[] = [];
        for (const planet of planets) {
          if (planet.owner === (0 as PlayerId) &&
              planet.x >= minX && planet.x <= maxX &&
              planet.y >= minY && planet.y <= maxY) {
            inBox.push(planet.id);
          }
        }
        return inBox;
      },
      getAllOwnedPlanetIds: () => {
        const planets = this.engine?.getState().planets ?? [];
        const ownedIds: PlanetId[] = [];
        for (const planet of planets) {
          if (planet.owner === (0 as PlayerId)) {
            ownedIds.push(planet.id);
          }
        }
        return ownedIds;
      },
      screenToWorld: (screenX: number, screenY: number) => {
        const camera = this.renderer?.getCamera();
        if (!camera) {
          return { x: screenX, y: screenY };
        }
        return camera.screenToWorld(screenX, screenY);
      },
    });
    this.input.setSelectMode(gameStore.getState().multiSelectMode);
    this.input.attach();
    this.canvas.addEventListener("contextmenu", this.suppressContextMenu);

    // Create and attach camera controller after input is ready
    if (this.renderer) {
      this.cameraController = new CameraController(
        this.renderer.getCamera(),
        this.canvas,
        this.input,
        { onResetView: () => this.applyAutoOrientView() },
      );
      this.cameraController.attach();

      const container = this.canvas.parentElement ?? document.body;
      this.zoomControls = new ZoomControls(this.renderer.getCamera(), container, () => this.applyAutoOrientView());
      this.rotationControls = new RotationControls(
        this.renderer.getCamera(),
        container,
        () => this.applyAutoOrientView(),
      );
    }

    this.startLoop();
    this.startResizeObserver();
  }

  private calculateWorldBounds(planets: Array<{ x: number; y: number; radius: number }>): WorldBounds {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const planet of planets) {
      minX = Math.min(minX, planet.x - planet.radius);
      minY = Math.min(minY, planet.y - planet.radius);
      maxX = Math.max(maxX, planet.x + planet.radius);
      maxY = Math.max(maxY, planet.y + planet.radius);
    }

    return { minX, minY, maxX, maxY };
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.zoomControls?.destroy();
    this.zoomControls = null;
    this.rotationControls?.destroy();
    this.rotationControls = null;
    this.cameraController?.detach();
    this.cameraController = null;
    this.input?.detach();
    this.canvas.removeEventListener("contextmenu", this.suppressContextMenu);
    this.input = null;
    this.renderer?.destroy();
    this.renderer = null;
    this.engine = null;
    this.telemetryTracker = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  public clearSelection(): void {
    this.input?.clearSelection();
  }

  public selectAll(): void {
    this.input?.selectAll();
  }

  public deselectAll(): void {
    this.input?.deselectAll();
  }

  public recenterCamera(): void {
    this.applyAutoOrientView();
  }

  private startLoop(): void {
    const frame = (ts: number): void => {
      const dt = Math.min(34, ts - this.lastTs);
      this.lastTs = ts;
      const paused = gameStore.getState().paused;
      this.input?.setSelectMode(gameStore.getState().multiSelectMode);

      // Update arrow key pan (continuous while keys held)
      this.cameraController?.updateArrowKeys(dt);

      if (!paused) {
        const simulationDt = dt * GAME_SPEED_MULTIPLIERS[this.gameSpeed];
        this.engine?.tick(simulationDt);
      }
      if (this.engine) {
        this.telemetryTracker?.tick(this.engine.getState());
      }
      if (this.engine && this.renderer) {
        this.renderer.render(
          this.engine.getState(),
          dt || GAME_CONSTANTS.frameDurationMs,
          this.input?.getDragState() ?? null,
          this.input?.getSelectedPlanetIds() ?? new Set<PlanetId>(),
          this.input?.getHoverPlanetId() ?? null,
          this.input?.getHoverPos() ?? null,
          this.input?.getHoverDurationMs(performance.now()) ?? 0,
          paused,
          this.input?.getLassoState() ?? null,
        );
        this.zoomControls?.sync();
        this.rotationControls?.sync();
      }
      this.rafId = requestAnimationFrame(frame);
    };
    this.rafId = requestAnimationFrame(frame);
  }

  private startResizeObserver(): void {
    const parent = this.canvas.parentElement;
    if (!parent) {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => {
      const { width, height } = resizeCanvasToDisplaySize(this.canvas);
      if (this.engine && this.renderer) {
        this.renderer.resize(width, height, this.engine.getState());
        this.applyAutoOrientView();
      }
    });
    this.resizeObserver.observe(parent);
  }

  private applyAutoOrientView(): void {
    if (!this.renderer || !this.worldBounds) {
      return;
    }
    this.renderer.getCamera().fitBounds(this.worldBounds, 100, this.autoOrientAngle);
  }

  private calculateAutoOrientAngle(state: Readonly<ReturnType<GameEngine["getState"]>>): number {
    const sun = state.planets.find((planet) => planet.isSun);
    const homeworld = state.planets.find(
      (planet) => planet.isHomeworld && planet.owner === (0 as PlayerId),
    );
    if (!sun || !homeworld) {
      return 0;
    }
    const angleDeg = (Math.atan2(homeworld.y - sun.y, homeworld.x - sun.x) * 180) / Math.PI;
    return normalizeAngle(180 - angleDeg);
  }

  private finalizeTelemetry(): void {
    if (!this.engine || !this.telemetryTracker || this.telemetryFinalized) {
      return;
    }
    this.telemetryFinalized = true;
    const raw = this.telemetryTracker.finalize(this.engine.getState());
    const analysis = new TelemetryAnalyzer().analyze(raw);
    console.log("[Telemetry] Balance Summary");
    for (const line of analysis.summaryLines) {
      console.log(line);
    }
    console.log("[Telemetry] JSON", analysis);
    gameStore.getState().setEndTelemetry(analysis);
  }
}
