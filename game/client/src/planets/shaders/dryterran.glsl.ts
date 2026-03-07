import { COMMON_SHADER_FUNCTIONS } from "@/planets/shaders/common.glsl";

export const DRYTERRAN_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 fragColor;
uniform float u_time; uniform float u_seed; uniform float u_pixels; uniform float u_size; uniform vec2 u_light_origin; uniform vec4 u_colors[4];
${COMMON_SHADER_FUNCTIONS}
void main() {
  vec2 uv = pixelate(v_uv, u_pixels);
  if (distance(uv, vec2(0.5)) > 0.5) { fragColor = vec4(0.0); return; }
  vec2 suv = spherify(uv);
  float dunes = fbm(suv * (u_size * 1.6) + vec2(u_seed + u_time * 0.01, u_seed), 5);
  float cracks = fbm(suv * (u_size * 3.5) + 22.0, 3);
  vec3 color = mix(u_colors[0].rgb, u_colors[3].rgb, dunes);
  color = mix(color, u_colors[1].rgb, smoothstep(0.2, 0.5, cracks) * 0.45);
  float lit = smoothstep(0.18, 0.9, distance(uv, u_light_origin));
  color = mix(color, color * 0.48, lit);
  color = ditherPosterize(color, uv * u_pixels, 6.0, 0.095);
  fragColor = vec4(color, 1.0);
}`;
