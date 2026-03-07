import { COMMON_SHADER_FUNCTIONS } from "@/planets/shaders/common.glsl";

export const STAR_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 fragColor;
uniform float u_time; uniform float u_seed; uniform float u_pixels; uniform float u_size; uniform vec2 u_light_origin; uniform vec4 u_colors[4];
${COMMON_SHADER_FUNCTIONS}
void main() {
  vec2 uv = pixelate(v_uv, u_pixels);
  float d = distance(uv, vec2(0.5));
  if (d > 0.5) { fragColor = vec4(0.0); return; }
  vec2 suv = spherify(uv);
  float noisePulse = fbm(suv * (u_size * 2.8) + vec2(u_seed, u_time * 0.06), 4);
  float glow = smoothstep(0.5, 0.0, d);
  vec3 core = mix(u_colors[2].rgb, u_colors[3].rgb, noisePulse);
  vec3 outer = mix(u_colors[0].rgb, u_colors[1].rgb, glow);
  vec3 color = mix(outer, core, glow);
  color = ditherPosterize(color, uv * u_pixels, 8.0, 0.075);
  fragColor = vec4(color, 1.0);
}`;
