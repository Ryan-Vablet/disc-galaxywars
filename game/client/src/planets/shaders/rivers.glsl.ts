import { COMMON_SHADER_FUNCTIONS } from "@/planets/shaders/common.glsl";

export const RIVERS_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform float u_time;
uniform float u_seed;
uniform float u_pixels;
uniform float u_size;
uniform vec2 u_light_origin;
uniform vec4 u_colors[4];
${COMMON_SHADER_FUNCTIONS}
void main() {
  vec2 uv = pixelate(v_uv, u_pixels);
  if (distance(uv, vec2(0.5)) > 0.5) { fragColor = vec4(0.0); return; }
  vec2 suv = spherify(uv);
  vec2 nUv = suv * u_size + vec2(u_seed + u_time * 0.03, u_seed);
  float t = fbm(nUv, 6);
  float r = fbm(nUv * 1.8 + 40.0, 5);
  vec3 color = t < 0.45 ? mix(u_colors[0].rgb, u_colors[1].rgb, smoothstep(0.1, 0.45, t)) : mix(u_colors[2].rgb, u_colors[3].rgb, smoothstep(0.45, 1.0, t));
  if (t > 0.5 && r < 0.42) color = mix(color, u_colors[1].rgb, 0.85);
  float lit = smoothstep(0.12, 0.92, distance(uv, u_light_origin));
  color = mix(color, color * 0.5, lit);
  color = ditherPosterize(color, uv * u_pixels, 7.0, 0.09);
  fragColor = vec4(color, 1.0);
}`;
