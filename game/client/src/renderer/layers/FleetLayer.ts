import type { RenderContext, RenderLayer } from "@/renderer/types";
import { toRadians } from "@/camera/Camera";
import { ownerColors } from "@/utils/ownerColors";
import { formatUnits } from "@/utils/formatUnits";

/**
 * Check if a point is visible within the camera frustum.
 * Uses a radius for glow/visual effects around the point.
 */
function isVisible(
  x: number,
  y: number,
  radius: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
): boolean {
  return (
    x + radius >= bounds.minX &&
    x - radius <= bounds.maxX &&
    y + radius >= bounds.minY &&
    y - radius <= bounds.maxY
  );
}

export class FleetLayer implements RenderLayer {
  public render(ctx: CanvasRenderingContext2D, state: RenderContext): void {
    const counterRotation = -toRadians(state.camera.getState().rotation);
    // Get visible world bounds for frustum culling
    const visibleBounds = state.camera.getWorldBoundsVisible();

    const groupedBadges = new Set<number>();
    for (const fleet of state.gameState.fleets) {
      // Frustum culling: skip fleets outside visible bounds
      // Calculate max visual radius based on unit count
      const unitScale = Math.min(Math.sqrt(fleet.units) * 1.5, 30);
      const maxRadius = Math.max(20, unitScale + 10);
      if (!isVisible(fleet.x, fleet.y, maxRadius, visibleBounds)) {
        continue;
      }
      const c = ownerColors(fleet.owner);
      const target = state.gameState.planets.find((planet) => planet.id === fleet.toId);
      const isReinforce = target?.owner === fleet.owner;
      // Scale glow size based on unit count
      const baseGlowSize = isReinforce ? 6 : 8;
      const glowSize = baseGlowSize + Math.min(Math.sqrt(fleet.units) * 3.5, 35);
      const grad = ctx.createRadialGradient(fleet.x, fleet.y, 0, fleet.x, fleet.y, glowSize);
      grad.addColorStop(0, c.main);
      grad.addColorStop(0.4, isReinforce ? "rgba(0,0,0,0.2)" : c.glow);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fleet.x, fleet.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Scale core circle size based on unit count
      const coreRadius = 1.5 + Math.min(Math.sqrt(fleet.units) * 0.5, 6);
      ctx.fillStyle = c.main;
      ctx.beginPath();
      ctx.arc(fleet.x, fleet.y, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      if (!isReinforce) {
        ctx.save();
        ctx.translate(fleet.x, fleet.y);
        ctx.rotate(fleet.angle);
        ctx.fillStyle = c.main;
        ctx.beginPath();
        const arrowSize = 7 + Math.min(Math.sqrt(fleet.units) * 0.3, 4);
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(1, -3);
        ctx.lineTo(1, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < state.gameState.fleets.length; i += 1) {
      if (groupedBadges.has(i)) {
        continue;
      }
      const base = state.gameState.fleets[i];
      if (!base) {
        continue;
      }
      let sumUnits = base.units;
      let cx = base.x;
      let cy = base.y;
      let count = 1;
      groupedBadges.add(i);
      for (let j = i + 1; j < state.gameState.fleets.length; j += 1) {
        const other = state.gameState.fleets[j];
        if (!other || groupedBadges.has(j)) {
          continue;
        }
        if (other.owner === base.owner && other.toId === base.toId) {
          const d = Math.hypot(base.x - other.x, base.y - other.y);
          if (d <= 40) {
            groupedBadges.add(j);
            sumUnits += other.units;
            cx += other.x;
            cy += other.y;
            count += 1;
          }
        }
      }

      const x = cx / count;
      const y = cy / count;
      ctx.save();
      ctx.translate(x, y - 10);
      ctx.rotate(counterRotation);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${count > 1 ? 12 : 10}px 'Exo 2', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(formatUnits(sumUnits), 0, 0);
      ctx.restore();

    }
  }
}
