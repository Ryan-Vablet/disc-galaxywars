import { COMMON_SHADER_FUNCTIONS } from "@/planets/shaders/common.glsl";

export const GASPLANET_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 fragColor;
uniform float u_time; uniform float u_seed; uniform float u_pixels; uniform float u_size; uniform vec2 u_light_origin; uniform vec4 u_colors[4];
${COMMON_SHADER_FUNCTIONS}
void main() {
  vec2 uv = pixelate(v_uv, u_pixels);
  if (distance(uv, vec2(0.5)) > 0.5) { fragColor = vec4(0.0); return; }
  vec2 suv = spherify(uv);
  float bands = sin((suv.y + u_time * 0.02) * 28.0 + u_seed) * 0.5 + 0.5;
  float turbulence = fbm(suv * (u_size * 2.0) + vec2(u_seed, 0.0), 4);
  float k = clamp(bands * 0.7 + turbulence * 0.3, 0.0, 1.0);
  vec3 color = mix(u_colors[0].rgb, u_colors[3].rgb, k);
  float lit = smoothstep(0.16, 0.94, distance(uv, u_light_origin));
  color = mix(color, color * 0.55, lit);
  color = ditherPosterize(color, uv * u_pixels, 7.0, 0.08);
  fragColor = vec4(color, 1.0);
}`;
