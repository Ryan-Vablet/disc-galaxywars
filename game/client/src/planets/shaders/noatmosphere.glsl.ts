import { COMMON_SHADER_FUNCTIONS } from "@/planets/shaders/common.glsl";

export const NOATMOSPHERE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 fragColor;
uniform float u_time; uniform float u_seed; uniform float u_pixels; uniform float u_size; uniform vec2 u_light_origin; uniform vec4 u_colors[4];
${COMMON_SHADER_FUNCTIONS}
void main() {
  vec2 uv = pixelate(v_uv, u_pixels);
  if (distance(uv, vec2(0.5)) > 0.5) { fragColor = vec4(0.0); return; }
  vec2 suv = spherify(uv);
  float base = fbm(suv * u_size + vec2(u_seed, u_seed), 5);
  float craters = fbm(suv * (u_size * 5.0) + 13.0, 3);
  vec3 color = mix(u_colors[0].rgb, u_colors[2].rgb, base);
  color = mix(color, u_colors[3].rgb, smoothstep(0.78, 0.95, craters) * 0.35);
  float lit = smoothstep(0.2, 0.92, distance(uv, u_light_origin));
  color = mix(color, color * 0.5, lit);
  color = ditherPosterize(color, uv * u_pixels, 6.0, 0.085);
  fragColor = vec4(color, 1.0);
}`;
