import type { Vec2 } from "@/types/input";

export function eventToCanvasPosition(canvas: HTMLCanvasElement, event: MouseEvent | TouchEvent): Vec2 {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const pointer = "touches" in event ? event.touches[0] ?? event.changedTouches[0] : event;
  if (!pointer) {
    return { x: 0, y: 0 };
  }
  return {
    x: (pointer.clientX - rect.left) * scaleX,
    y: (pointer.clientY - rect.top) * scaleY,
  };
}
