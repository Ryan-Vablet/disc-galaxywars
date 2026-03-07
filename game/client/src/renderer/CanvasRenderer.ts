import { VISUAL_CONSTANTS } from "@/constants/visual";
import type { DragState, LassoState } from "@/types/input";
import type { GameEvent, GameState, PlanetId, PlayerId } from "@/types/game";
import type { Particle, Trail, VisualState, SphereStar, FlatStar } from "@/types/visual";
import { rand, flip } from "@/utils/math";
import { ownerColors } from "@/utils/ownerColors";
import type { RenderLayer } from "@/renderer/types";
import { BackgroundLayer } from "@/renderer/layers/BackgroundLayer";
import { SelectionLayer } from "@/renderer/layers/SelectionLayer";
import { ParticleLayer } from "@/renderer/layers/ParticleLayer";
import { FleetLayer } from "@/renderer/layers/FleetLayer";
import { PlanetLayer } from "@/renderer/layers/PlanetLayer";
import { HUDLayer } from "@/renderer/layers/HUDLayer";
import { PlanetTextureGenerator } from "@/planets/PlanetTextureGenerator";
import {
  createStarfieldBackground,
  type StarfieldBackgroundAPI,
} from "@/renderer/StarfieldBackground";
import { Camera } from "@/camera/Camera";
import { formatExactUnits } from "@/utils/formatUnits";

/** Legacy sphere stars (kept for type compat). */
function createSphereStars(_count: number): SphereStar[] {
  return [];
}

/** Flat screen stars: random 2D positions, dot/cross/sparkle styles, two colors, random opacity. */
function createFlatStars(width: number, height: number, count: number): FlatStar[] {
  const out: FlatStar[] = [];
  for (let i = 0; i < count; i++) {
    const x = rand(0, width);
    const y = rand(0, height);
    const isSpecial = flip();
    const type: FlatStar["type"] = isSpecial ? "sparkle" : flip() ? "cross" : "dot";
    const color = flip() ? "#ffef9e" : "#ffffff";
    const opacity = rand(0.1, 1);
    out.push({ x, y, type, color, opacity });
  }
  return out;
}

export class CanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private visualState: VisualState;
  private readonly layers: RenderLayer[];
  private readonly trailLayer: RenderLayer;
  private readonly particleLayer: RenderLayer;
  private readonly textureGenerator: PlanetTextureGenerator;
  private readonly starfield: StarfieldBackgroundAPI | null;
  private readonly camera: Camera;
  private timeMs = 0;

  public constructor(private readonly canvas: HTMLCanvasElement, initialState: Readonly<GameState>) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context unavailable");
    }
    this.ctx = context;
    this.visualState = this.createInitialVisualState(canvas.width, canvas.height, initialState);
    this.textureGenerator = new PlanetTextureGenerator();
    this.textureGenerator.init(initialState);
    const seed = (initialState.planets.length * 31 + 17) % 999999;
    this.starfield = createStarfieldBackground(canvas.width, canvas.height, seed);
    this.layers = [new BackgroundLayer(), new SelectionLayer(), new FleetLayer(), new PlanetLayer(), new HUDLayer()];
    this.trailLayer = new ParticleLayer(true);
    this.particleLayer = new ParticleLayer(false);
    this.camera = new Camera(canvas.width, canvas.height);
  }

  public render(
    gameState: Readonly<GameState>,
    dtMs: number,
    dragState: DragState | null,
    selectedPlanetIds: Set<PlanetId>,
    hoverPlanetId: PlanetId | null,
    hoverPos: { x: number; y: number } | null,
    hoverDurationMs: number,
    paused: boolean,
    lassoState: LassoState | null,
  ): void {
    this.timeMs += dtMs;
    this.textureGenerator.update(this.timeMs);
    this.starfield?.update(this.timeMs);
    this.tickVisuals(gameState, dtMs);

    // Update camera interpolation
    this.camera.update(dtMs);

    this.ctx.save();
    if (this.visualState.screenShake.timeRemainingMs > 0) {
      this.ctx.translate(
        rand(-this.visualState.screenShake.intensity, this.visualState.screenShake.intensity),
        rand(-this.visualState.screenShake.intensity, this.visualState.screenShake.intensity),
      );
    }

    const context = {
      gameState,
      visualState: this.visualState,
      planetTextures: this.textureGenerator.getCache(),
      starfieldCanvas: this.starfield?.getCanvas() ?? null,
      camera: this.camera,
      dragState,
      selectedPlanetIds,
      hoverPlanetId,
      hoverPos,
      hoverDurationMs,
      paused,
      lassoState,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      timeMs: this.timeMs,
    };

    // Background layer (NO camera transform - parallax later)
    this.layers[0]?.render(this.ctx, context);

    // Apply camera transform for world-space layers
    this.camera.applyTransform(this.ctx);

    // World-space layers
    this.layers[1]?.render(this.ctx, context); // Selection
    this.trailLayer.render(this.ctx, context); // Trails
    this.layers[2]?.render(this.ctx, context); // Fleet
    this.layers[3]?.render(this.ctx, context); // Planet
    this.particleLayer.render(this.ctx, context); // Particles

    // Reset transform for screen-space HUD
    this.camera.resetTransform(this.ctx);

    // HUD layer (screen space)
    this.layers[4]?.render(this.ctx, context);

    // Tooltip and pause overlay (screen space)
    if (hoverPlanetId !== null && hoverDurationMs >= 500 && hoverPos) {
      this.renderTooltip(gameState, hoverPlanetId, hoverPos);
    }
    if (paused) {
      this.ctx.fillStyle = "rgba(0,0,0,0.4)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "#e0f7fa";
      this.ctx.font = "bold 42px 'Orbitron', 'Exo 2', sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
    }
    this.ctx.restore();
  }

  public handleEvent(event: GameEvent): void {
    if (event.type === "fleet_launched") {
      const c = ownerColors(event.fleet.owner);
      for (let i = 0; i < 12; i += 1) {
        const a = event.fleet.angle + rand(-0.6, 0.6);
        this.visualState.particles.push({
          x: event.from.x + Math.cos(event.fleet.angle) * event.from.radius,
          y: event.from.y + Math.sin(event.fleet.angle) * event.from.radius,
          vx: Math.cos(a) * rand(1, 3),
          vy: Math.sin(a) * rand(1, 3),
          life: 1,
          decay: rand(0.02, 0.04),
          size: rand(1.5, 4),
          color: c.main,
        });
      }
    }

    if (event.type === "planet_captured") {
      const visual = this.visualState.planetVisuals.get(event.planet.id);
      if (visual) {
        visual.captureFlash = 1;
        visual.colorTransitionMs = 300;
        visual.previousOwner = event.previousOwner === null ? null : Number(event.previousOwner);
      }
      this.visualState.screenShake.timeRemainingMs = 200;
      this.visualState.screenShake.intensity = 4;
      const c = ownerColors(event.newOwner);
      for (let j = 0; j < 30; j += 1) {
        const a = rand(0, Math.PI * 2);
        const speed = rand(1, 5);
        this.visualState.particles.push({
          x: event.planet.x,
          y: event.planet.y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          life: 1,
          decay: rand(0.015, 0.035),
          size: rand(2, 6),
          color: c.main,
        });
      }
    }

    if (event.type === "fleet_arrived" && !event.result.captured) {
      const c = ownerColors(event.fleet.owner);
      for (let j = 0; j < 10; j += 1) {
        const a = rand(0, Math.PI * 2);
        this.visualState.particles.push({
          x: event.target.x + Math.cos(a) * event.target.radius,
          y: event.target.y + Math.sin(a) * event.target.radius,
          vx: Math.cos(a) * rand(0.5, 2),
          vy: Math.sin(a) * rand(0.5, 2),
          life: 1,
          decay: rand(0.03, 0.06),
          size: rand(1, 3),
          color: c.main,
        });
      }
    }
  }

  public resize(width: number, height: number, gameState: Readonly<GameState>): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.starfield?.resize(width, height);
    this.camera.setViewport(width, height);
    const next = this.createInitialVisualState(width, height, gameState);
    this.visualState.stars = next.stars;
    this.visualState.nebulae = next.nebulae;
    this.visualState.flatStars = next.flatStars;
  }

  public getCamera(): Camera {
    return this.camera;
  }

  public destroy(): void {
    this.visualState.particles = [];
    this.visualState.trails = [];
    this.textureGenerator.destroy();
    this.starfield?.destroy();
  }

  private createInitialVisualState(width: number, height: number, gameState: Readonly<GameState>): VisualState {
    const planetVisuals = new Map();
    for (const planet of gameState.planets) {
      planetVisuals.set(planet.id, {
        pulse: rand(0, Math.PI * 2),
        captureFlash: 0,
        productionFlash: 0,
        colorTransitionMs: 0,
        previousOwner: planet.owner === null ? null : Number(planet.owner),
      });
    }
    return {
      particles: [],
      trails: [],
      stars: Array.from({ length: VISUAL_CONSTANTS.starCount }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        size: rand(0.4, 2),
        brightness: rand(0.2, 0.8),
        twinkleSpeed: rand(0.005, 0.03),
        twinklePhase: rand(0, Math.PI * 2),
      })),
      sphereStars: createSphereStars(0),
      flatStars: createFlatStars(width, height, 1100),
      nebulae: Array.from({ length: VISUAL_CONSTANTS.nebulaCount }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        radius: rand(100, 300),
        color: Math.random() > 0.5 ? "cyan" : "red",
        alpha: rand(0.015, 0.04),
      })),
      screenShake: { timeRemainingMs: 0, intensity: 0 },
      planetVisuals,
    };
  }

  private tickVisuals(gameState: Readonly<GameState>, dtMs: number): void {
    for (const planet of gameState.planets) {
      let visual = this.visualState.planetVisuals.get(planet.id);
      if (!visual) {
        visual = { pulse: 0, captureFlash: 0, productionFlash: 0, colorTransitionMs: 0, previousOwner: null };
        this.visualState.planetVisuals.set(planet.id, visual);
      }
      visual.pulse = 0;
      if (planet.owner !== null && Math.random() < 0.02) {
        visual.productionFlash = 0.3;
      }
      if (visual.productionFlash > 0) {
        visual.productionFlash = Math.max(0, visual.productionFlash - 0.02);
      }
      if (visual.captureFlash > 0) {
        visual.captureFlash -= 0.03;
      }
      if (visual.colorTransitionMs > 0) {
        visual.colorTransitionMs = Math.max(0, visual.colorTransitionMs - dtMs);
      }
    }

    for (const fleet of gameState.fleets) {
      if (this.visualState.trails.length < VISUAL_CONSTANTS.trailLimit) {
        const c = ownerColors(fleet.owner);
        this.visualState.trails.push({
          x: fleet.x + rand(-4, 4),
          y: fleet.y + rand(-4, 4),
          life: 1,
          decay: rand(0.025, 0.05),
          size: rand(1, 2.5),
          color: c.trail,
        } satisfies Trail);
      }
    }

    for (let i = this.visualState.particles.length - 1; i >= 0; i -= 1) {
      const p = this.visualState.particles[i] as Particle | undefined;
      if (!p) {
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.visualState.particles.splice(i, 1);
      }
    }
    while (this.visualState.particles.length > VISUAL_CONSTANTS.particleLimit) {
      this.visualState.particles.shift();
    }

    for (let i = this.visualState.trails.length - 1; i >= 0; i -= 1) {
      const trail = this.visualState.trails[i];
      if (!trail) {
        continue;
      }
      trail.life -= trail.decay;
      if (trail.life <= 0) {
        this.visualState.trails.splice(i, 1);
      }
    }

    while (this.visualState.trails.length > VISUAL_CONSTANTS.trailLimit) {
      this.visualState.trails.shift();
    }

    if (this.visualState.screenShake.timeRemainingMs > 0) {
      this.visualState.screenShake.timeRemainingMs = Math.max(
        0,
        this.visualState.screenShake.timeRemainingMs - dtMs,
      );
    }
  }

  private renderTooltip(
    gameState: Readonly<GameState>,
    planetId: PlanetId,
    pos: { x: number; y: number },
  ): void {
    const planet = gameState.planets.find((entry) => entry.id === planetId);
    if (!planet) {
      return;
    }
    const owner =
      planet.owner === null
        ? "Neutral"
        : planet.owner === (0 as PlayerId)
          ? "You"
          : `Bot ${Number(planet.owner)}`;
    const typeLabel =
      {
        sun: "☀ Sun",
        homeworld: "Homeworld",
        gasGiant: "Gas Giant",
        lavaWorld: "Lava World",
        terran: "Terran Planet",
        iceWorld: "Ice World",
        dryTerran: "Dry Terran",
        barren: "Barren Planet",
      }[planet.type] ?? planet.type;
    const productionLine =
      planet.type !== "sun" && planet.effectiveProductionRate > planet.productionRate + 0.001
        ? `Production: ${formatExactUnits(planet.effectiveProductionRate)}/sec (+10% ☀)`
        : `Production: ${formatExactUnits(planet.effectiveProductionRate)}/sec`;
    const shieldLine =
      planet.shield > 0
        ? `Shield: ${Math.round(planet.shield * 100)}% (${(1 / (1 - planet.shield)).toFixed(1)}x to capture)`
        : "Shield: None";
    const tooltipLines = planet.isSun
      ? [
          typeLabel,
          `Owner: ${owner}`,
          `Units: ${formatExactUnits(planet.units)} / ${formatExactUnits(planet.maxUnits)}`,
          productionLine,
          shieldLine,
          "Buff: +10% production to all planets",
        ]
      : [
          typeLabel,
          `Owner: ${owner}`,
          `Units: ${formatExactUnits(planet.units)} / ${formatExactUnits(planet.maxUnits)}`,
          productionLine,
          shieldLine,
        ];
    const h = 6 + tooltipLines.length * 16;
    const width = 250;
    const x = Math.min(this.canvas.width - width, pos.x + 16);
    const y = Math.min(this.canvas.height - h - 10, pos.y + 16);
    this.ctx.fillStyle = "rgba(5,8,15,0.85)";
    this.ctx.strokeStyle = "rgba(0,229,255,0.25)";
    this.ctx.lineWidth = 1;
    this.ctx.fillRect(x, y, width, h);
    this.ctx.strokeRect(x, y, width, h);
    this.ctx.fillStyle = "#e0f7fa";
    this.ctx.font = "12px 'Exo 2', sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    for (let i = 0; i < tooltipLines.length; i += 1) {
      this.ctx.fillText(tooltipLines[i] ?? "", x + 8, y + 6 + i * 16);
    }
  }
}
