export const COMMON_SHADER_FUNCTIONS = `
float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0, 1.0) * max(1.0, round(u_size)));
  return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 coord) {
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}

float fbm(vec2 coord, int octaves) {
  float value = 0.0;
  float scale = 0.5;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}

vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float k = max(0.0001, 1.0 - dot(centered, centered));
  float z = sqrt(k);
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}

vec2 pixelate(vec2 uv, float pixels) {
  return floor(uv * pixels) / pixels;
}

float bayer4(vec2 pix) {
  vec2 p = mod(floor(pix), 4.0);
  if (p.x < 1.0) {
    if (p.y < 1.0) return 0.0 / 16.0;
    if (p.y < 2.0) return 12.0 / 16.0;
    if (p.y < 3.0) return 3.0 / 16.0;
    return 15.0 / 16.0;
  }
  if (p.x < 2.0) {
    if (p.y < 1.0) return 8.0 / 16.0;
    if (p.y < 2.0) return 4.0 / 16.0;
    if (p.y < 3.0) return 11.0 / 16.0;
    return 7.0 / 16.0;
  }
  if (p.x < 3.0) {
    if (p.y < 1.0) return 2.0 / 16.0;
    if (p.y < 2.0) return 14.0 / 16.0;
    if (p.y < 3.0) return 1.0 / 16.0;
    return 13.0 / 16.0;
  }
  if (p.y < 1.0) return 10.0 / 16.0;
  if (p.y < 2.0) return 6.0 / 16.0;
  if (p.y < 3.0) return 9.0 / 16.0;
  return 5.0 / 16.0;
}

vec3 ditherPosterize(vec3 color, vec2 pix, float levels, float strength) {
  float threshold = bayer4(pix) - 0.5;
  vec3 adjusted = clamp(color + vec3(threshold * strength), 0.0, 1.0);
  return floor(adjusted * levels) / levels;
}
`;
