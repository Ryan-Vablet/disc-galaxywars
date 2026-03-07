import { COMMON_SHADER_FUNCTIONS } from "@/planets/shaders/common.glsl";

export const LAVAWORLD_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 fragColor;
uniform float u_time; uniform float u_seed; uniform float u_pixels; uniform float u_size; uniform vec2 u_light_origin; uniform vec4 u_colors[4];
${COMMON_SHADER_FUNCTIONS}
void main() {
  vec2 uv = pixelate(v_uv, u_pixels);
  if (distance(uv, vec2(0.5)) > 0.5) { fragColor = vec4(0.0); return; }
  vec2 suv = spherify(uv);
  vec2 flowUv = suv * (u_size * 2.0) + vec2(u_seed + u_time * 0.05, u_seed);
  float crust = fbm(flowUv, 5);
  float lava = fbm(flowUv * 2.2 + 9.0, 4);
  vec3 rock = mix(u_colors[0].rgb, u_colors[1].rgb, crust);
  vec3 molten = mix(u_colors[2].rgb, u_colors[3].rgb, lava);
  vec3 color = mix(rock, molten, smoothstep(0.5, 0.8, lava) * 0.8);
  float lit = smoothstep(0.1, 0.9, distance(uv, u_light_origin));
  color = mix(color, color * 0.45, lit);
  color = ditherPosterize(color, uv * u_pixels, 6.0, 0.1);
  fragColor = vec4(color, 1.0);
}`;
