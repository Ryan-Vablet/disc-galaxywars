export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): { width: number; height: number } {
  const container = canvas.parentElement;
  if (!container) {
    return { width: canvas.width, height: canvas.height };
  }
  const dpr = window.devicePixelRatio || 1;
  const width = Math.floor(container.clientWidth * dpr);
  const height = Math.floor(container.clientHeight * dpr);
  canvas.width = width;
  canvas.height = height;
  return { width, height };
}
