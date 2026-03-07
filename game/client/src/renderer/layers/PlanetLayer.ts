import type { RenderContext, RenderLayer } from "@/renderer/types";
import { toRadians } from "@/camera/Camera";
import { clamp } from "@/utils/math";
import { ownerColors } from "@/utils/ownerColors";
import type { PlayerId } from "@/types/game";
import { VISUAL_CONSTANTS } from "@/constants/visual";
import { GAME_CONSTANTS } from "@/constants/game";
import { formatUnits } from "@/utils/formatUnits";

/**
 * Check if a circle is visible within the camera frustum.
 * Adds a small buffer to ensure objects at edges aren't clipped.
 */
function isVisible(
  x: number,
  y: number,
  radius: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  buffer = 50,
): boolean {
  return (
    x + radius + buffer >= bounds.minX &&
    x - radius - buffer <= bounds.maxX &&
    y + radius + buffer >= bounds.minY &&
    y - radius - buffer <= bounds.maxY
  );
}

/**
 * Screen-up unit vector in world space (so status ring stays avatar-on-top, count-on-bottom).
 * Uses camera worldToScreen/screenToWorld so it respects pivot and zoom.
 */
function getScreenUpInWorld(state: RenderContext): { x: number; y: number } {
  const planetScreen = state.camera.worldToScreen(0, 0);
  const aboveWorld = state.camera.screenToWorld(planetScreen.x, planetScreen.y - 1);
  const dx = aboveWorld.x;
  const dy = aboveWorld.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export class PlanetLayer implements RenderLayer {
  public render(ctx: CanvasRenderingContext2D, state: RenderContext): void {
    const counterRotation = -toRadians(state.camera.getState().rotation);
    const screenUp = getScreenUpInWorld(state);
    // Get visible world bounds for frustum culling
    const visibleBounds = state.camera.getWorldBoundsVisible();

    for (const planet of state.gameState.planets) {
      // Frustum culling: skip planets outside visible bounds
      // Use larger buffer for planets due to avatar, selection rings, etc.
      if (!isVisible(planet.x, planet.y, planet.radius, visibleBounds, 100)) {
        continue;
      }
      const visual = state.visualState.planetVisuals.get(planet.id);
      if (!visual) {
        continue;
      }
      const c = ownerColors(planet.owner);
      const pulseScale = 1;
      const isSelected = state.selectedPlanetIds.has(planet.id);
      const isHover = state.hoverPlanetId === planet.id;
      const threatIncoming = state.gameState.fleets.some(
        (fleet) => fleet.toId === planet.id && fleet.owner !== planet.owner && planet.owner === (0 as PlayerId),
      );
      const hasSunBuff =
        planet.owner !== null &&
        planet.type !== "sun" &&
        planet.effectiveProductionRate > planet.productionRate + 0.001;
      const ownerColor = c.main;
      const previousOwnerColor =
        visual.previousOwner === null ? ownerColor : ownerColors(visual.previousOwner as PlayerId).main;
      const blend = clamp(visual.colorTransitionMs / 300, 0, 1);
      const ringColor = blend > 0 ? this.mixHex(previousOwnerColor, ownerColor, 1 - blend) : ownerColor;
      const texture = state.planetTextures?.get(planet.id);
      const textureColor = texture
        ? `rgba(${Math.floor(texture.dominantColor[0] * 255)}, ${Math.floor(texture.dominantColor[1] * 255)}, ${Math.floor(texture.dominantColor[2] * 255)}, 0.5)`
        : c.glow;

      const glowR = planet.isSun
        ? planet.radius * (2.05 + 0.08 * Math.sin(state.timeMs * 0.002))
        : planet.radius * 1.8 * pulseScale;
      const grad = ctx.createRadialGradient(planet.x, planet.y, planet.radius * 0.6, planet.x, planet.y, glowR);
      grad.addColorStop(0, textureColor);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      if (visual.captureFlash > 0) {
        ctx.globalAlpha = visual.captureFlash * 0.5;
        ctx.fillStyle = c.main;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius * 2.5 * (1 - visual.captureFlash * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (texture) {
        // Sun sprite is drawn 2x larger so the star shader fills the entity circle
        const spriteScale = planet.isSun ? 2 : 1;
        const size = planet.radius * 2 * pulseScale * spriteScale;
        ctx.save();
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius * pulseScale, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(texture.image, planet.x - size / 2, planet.y - size / 2, size, size);
        ctx.restore();
      } else {
        ctx.fillStyle = planet.owner === null ? "#1a2333" : c.dark;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius * pulseScale, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = ringColor;
      ctx.lineWidth = isSelected ? 3.5 : isHover ? 2.5 : 1.8;
      ctx.globalAlpha = isSelected ? 1 : 0.8;
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.radius * pulseScale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (isSelected) {
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(state.timeMs * 0.0065);
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius * 1.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (planet.owner !== null) {
        // Constant screen size at all zoom levels: world radius = screenRadiusPx / zoom
        const zoom = state.camera.getState().zoom;
        const screenRadiusHome = VISUAL_CONSTANTS.avatarScreenDiameterHomeworld / 2;
        const screenRadiusSun = VISUAL_CONSTANTS.avatarScreenDiameterSun / 2;
        const minR = VISUAL_CONSTANTS.avatarScreenDiameterNonHomeMin / 2;
        const maxR = VISUAL_CONSTANTS.avatarScreenDiameterNonHomeMax / 2;
        const t =
          (planet.radius - GAME_CONSTANTS.planetMinRadius) /
          (GAME_CONSTANTS.planetMaxRadius - GAME_CONSTANTS.planetMinRadius);
        const screenRadiusNonHome = minR + (maxR - minR) * clamp(t, 0, 1);
        const desiredScreenRadiusPx = planet.isSun
          ? screenRadiusSun
          : planet.isHomeworld
            ? screenRadiusHome
            : screenRadiusNonHome;
        const avatarRadius = desiredScreenRadiusPx / zoom;
        const avatarOffset = planet.radius + avatarRadius + 16;
        const avatarWorldX = planet.x + screenUp.x * avatarOffset;
        const avatarWorldY = planet.y + screenUp.y * avatarOffset;
        const planetEdgeX = planet.x + screenUp.x * planet.radius;
        const planetEdgeY = planet.y + screenUp.y * planet.radius;
        ctx.save();
        ctx.translate(avatarWorldX, avatarWorldY);
        ctx.rotate(counterRotation);
        ctx.strokeStyle = c.main;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(planetEdgeX - avatarWorldX, planetEdgeY - avatarWorldY);
        ctx.lineTo(0, avatarRadius);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.fillStyle = c.dark;
        ctx.beginPath();
        ctx.arc(0, 0, avatarRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = c.main;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, avatarRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = c.main;
        ctx.globalAlpha = 0.4;
        const iconR = avatarRadius * 0.55;
        ctx.beginPath();
        ctx.arc(0, -iconR * 0.2, iconR * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, iconR * 0.45, iconR * 0.6, Math.PI, 0);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      if (planet.owner !== null) {
        const pct = clamp(planet.units / planet.maxUnits, 0, 1);
        const rotationRad = toRadians(state.camera.getState().rotation);
        const arcStart = -Math.PI / 2 - rotationRad;
        const arcEnd = arcStart + Math.PI * 2 * pct;
        ctx.strokeStyle = c.main;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.5 + visual.productionFlash;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius + 6, arcStart, arcEnd);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (planet.isSun) {
        const pulse = 0.55 + 0.15 * Math.sin(state.timeMs * 0.003);
        ctx.strokeStyle = "rgba(255,215,64,0.85)";
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,244,200,0.5)";
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = pulse * 0.8;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius + 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (hasSunBuff) {
        ctx.fillStyle = "rgba(255,215,64,0.9)";
        ctx.beginPath();
        ctx.arc(planet.x + planet.radius * 0.7, planet.y - planet.radius * 0.72, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (threatIncoming) {
        ctx.strokeStyle = "rgba(255,23,68,0.35)";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(state.timeMs * 0.01);
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius + 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (planet.isHomeworld) {
        ctx.save();
        ctx.translate(planet.x, planet.y);
        ctx.rotate(counterRotation);
        ctx.font = "bold 56px 'Exo 2', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.strokeText("♛", 0, 0);
        ctx.fillStyle = "rgba(255,215,64,0.95)";
        ctx.fillText("♛", 0, 0);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.restore();
      }

      const unitCountOffset = planet.radius + 28;
      const unitCountX = planet.x - screenUp.x * unitCountOffset;
      const unitCountY = planet.y - screenUp.y * unitCountOffset;
      ctx.save();
      ctx.translate(unitCountX, unitCountY);
      ctx.rotate(counterRotation);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${planet.radius > 35 ? 40 : 32}px 'Exo 2', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(formatUnits(planet.units), 0, 0);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.restore();
    }
  }

  private mixHex(from: string, to: string, t: number): string {
    const a = this.hexToRgb(from);
    const b = this.hexToRgb(to);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bch = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r}, ${g}, ${bch})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleaned = hex.replace("#", "");
    const value = Number.parseInt(cleaned, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }
}
