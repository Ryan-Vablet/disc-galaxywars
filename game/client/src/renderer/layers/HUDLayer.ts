import { COLORS, VISUAL_CONSTANTS } from "@/constants/visual";
import type { RenderContext, RenderLayer } from "@/renderer/types";
import type { PlayerId } from "@/types/game";
import { formatUnits } from "@/utils/formatUnits";

export class HUDLayer implements RenderLayer {
  public render(ctx: CanvasRenderingContext2D, state: RenderContext): void {
    const playerCount = state.gameState.planets.filter((p) => p.owner === (0 as PlayerId)).length;
    const enemyCount = state.gameState.planets.filter(
      (p) => p.owner !== null && p.owner !== (0 as PlayerId),
    ).length;
    const neutralCount = state.gameState.planets.filter((p) => p.owner === null).length;
    const totalUnitsP = Math.floor(
      state.gameState.planets.filter((p) => p.owner === (0 as PlayerId)).reduce((sum, p) => sum + p.units, 0),
    );
    const totalUnitsE = Math.floor(
      state.gameState.planets
        .filter((p) => p.owner !== null && p.owner !== (0 as PlayerId))
        .reduce((sum, p) => sum + p.units, 0),
    );

    ctx.fillStyle = "rgba(5,8,15,0.7)";
    ctx.fillRect(0, 0, state.canvasWidth, VISUAL_CONSTANTS.uiBarHeight);
    ctx.strokeStyle = "rgba(0,229,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, VISUAL_CONSTANTS.uiBarHeight);
    ctx.lineTo(state.canvasWidth, VISUAL_CONSTANTS.uiBarHeight);
    ctx.stroke();

    ctx.font = "bold 13px 'Exo 2', sans-serif";
    ctx.textBaseline = "middle";

    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.player.main;
    ctx.fillText("⬡ YOU", 16, 21);
    ctx.fillStyle = "#aaa";
    ctx.fillText(`${playerCount} planets  ·  ${formatUnits(totalUnitsP)} units`, 80, 21);

    ctx.textAlign = "right";
    ctx.fillStyle = COLORS.enemy.main;
    ctx.fillText("BOTS ⬡", state.canvasWidth - 16, 21);
    ctx.fillStyle = "#aaa";
    ctx.fillText(`${enemyCount} planets  ·  ${formatUnits(totalUnitsE)} units`, state.canvasWidth - 80, 21);

    ctx.textAlign = "center";
    ctx.fillStyle = "#546e7a";
    ctx.fillText(`${neutralCount} neutral`, state.canvasWidth / 2, 21);
  }
}
