import type { RenderContext, RenderLayer } from "@/renderer/types";

/**
 * Check if a point is visible within the camera frustum.
 * Particles are small, so use a small radius.
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

export class ParticleLayer implements RenderLayer {
  private readonly renderTrails: boolean;

  public constructor(renderTrails: boolean) {
    this.renderTrails = renderTrails;
  }

  public render(ctx: CanvasRenderingContext2D, state: RenderContext): void {
    // Get visible world bounds for frustum culling
    const visibleBounds = state.camera.getWorldBoundsVisible();

    if (this.renderTrails) {
      for (const trail of state.visualState.trails) {
        // Frustum culling: skip trails outside visible bounds
        // Trail size varies, use max size of 8 with buffer
        if (!isVisible(trail.x, trail.y, 8, visibleBounds)) {
          continue;
        }
        ctx.globalAlpha = trail.life * 0.6;
        ctx.fillStyle = trail.color;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.size * trail.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }

    for (const particle of state.visualState.particles) {
      // Frustum culling: skip particles outside visible bounds
      // Particle size varies, use max size of 6 with buffer
      if (!isVisible(particle.x, particle.y, 6, visibleBounds)) {
        continue;
      }
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
