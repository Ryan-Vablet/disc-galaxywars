import { describe, expect, it } from "vitest";
import { WebGLShaderRenderer } from "@/planets/WebGLShaderRenderer";

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
void main() {
  fragColor = vec4(v_uv, 0.3, 1.0);
}`;

describe("WebGLShaderRenderer", () => {
  it("initializes and can render without throwing", () => {
    const renderer = new WebGLShaderRenderer(64, 64);
    const program = renderer.compileShader(FRAGMENT);
    expect(() =>
      renderer.render(program, {
        u_time: { type: "1f", value: 0 },
      }),
    ).not.toThrow();
    const canvas = renderer.getCanvasSnapshot();
    expect(canvas.width).toBe(64);
    renderer.destroy();
  });
});
