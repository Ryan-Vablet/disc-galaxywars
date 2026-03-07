import type { RenderContext, RenderLayer } from "@/renderer/types";
import type { PlayerId } from "@/types/game";
import { ownerColors } from "@/utils/ownerColors";

export class SelectionLayer implements RenderLayer {
  public render(ctx: CanvasRenderingContext2D, state: RenderContext): void {
    const dragState = state.dragState;
    if (!dragState && !state.lassoState) {
      return;
    }
    ctx.save();
    const playerColor = ownerColors(0 as PlayerId).main;
    ctx.strokeStyle = "rgba(0,229,255,0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -state.timeMs * 0.03;
    if (dragState) {
      for (const fromId of dragState.fromPlanetIds) {
        const from = state.gameState.planets.find((planet) => planet.id === fromId);
        if (!from) {
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(dragState.current.x, dragState.current.y);
        ctx.stroke();
      }
    }

    // Render box selection if active (in screen space)
    let drewBox = false;
    if (state.lassoState) {
      const box = state.lassoState;

      // Reset transform to draw in screen space (canvas backing-store pixels)
      state.camera.resetTransform(ctx);
      ctx.setLineDash([]);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const x = Math.min(box.startScreen.x, box.currentScreen.x);
      const y = Math.min(box.startScreen.y, box.currentScreen.y);
      const w = Math.abs(box.currentScreen.x - box.startScreen.x);
      const h = Math.abs(box.currentScreen.y - box.startScreen.y);

      ctx.strokeStyle = playerColor;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = playerColor;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;

      state.camera.applyTransform(ctx);
      drewBox = true;
    }

    if (!drewBox) {
      ctx.restore();
    }
  }
}
