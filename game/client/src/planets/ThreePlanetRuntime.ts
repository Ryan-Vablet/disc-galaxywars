import {
  DataTexture,
  Group,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  Vector4,
  WebGLRenderer,
} from "three";

// ─── Types ───────────────────────────────────────────────────────────

type SU = Record<string, { value: unknown }>;

export interface ThreePlanetRuntime {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: OrthographicCamera;
  image: HTMLCanvasElement;
  dominantColor: [number, number, number, number];
  materials: ShaderMaterial[];
  update: (timeSec: number) => void;
  destroy: () => void;
}

export interface PlanetCreateOptions {
  variationSeed?: number;
  frustumScale?: number;
  pixels?: number;
  rotation?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function randSeed(): number {
  return Math.random() > 0.5 ? Math.random() * 10 : Math.random() * 100;
}

function v4(r: number, g: number, b: number, a = 1): Vector4 {
  return new Vector4(r, g, b, a);
}

function varyV4(c: Vector4, shift: number): Vector4 {
  return v4(
    Math.min(1, Math.max(0, c.x + shift)),
    Math.min(1, Math.max(0, c.y + shift * 0.8)),
    Math.min(1, Math.max(0, c.z + shift * 0.6)),
    c.w,
  );
}

function createColorRamp(colors: [number, number, number, number][]): DataTexture {
  const w = colors.length;
  const data = new Uint8Array(w * 4);
  for (let i = 0; i < w; i++) {
    const c = colors[i]!;
    data[i * 4] = Math.round(c[0] * 255);
    data[i * 4 + 1] = Math.round(c[1] * 255);
    data[i * 4 + 2] = Math.round(c[2] * 255);
    data[i * 4 + 3] = Math.round(c[3] * 255);
  }
  const tex = new DataTexture(data, w, 1, RGBAFormat, UnsignedByteType);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

function ml(frag: string, uniforms: SU, gw = 1, gh = 1): { mesh: Mesh; mat: ShaderMaterial } {
  const geo = new PlaneGeometry(gw, gh);
  const mat = new ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: frag,
    transparent: true,
  });
  return { mesh: new Mesh(geo, mat), mat };
}

// ─── Shared vertex shader ───────────────────────────────────────────

const VERT = `
varying vec3 vUv;
void main() {
  vUv = position;
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
}`;

// ─── Fragment shaders (verbatim from PixelPlanets reference) ────────

const BASE_PLANET_FRAG = `
varying vec3 vUv;
uniform float lightIntensity;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
float dither_size = 2.0;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform vec4 color1;
uniform vec4 color2;
uniform vec4 color3;
float size = 10.0;
int OCTAVES = 20;
uniform float seed;
uniform float time;
bool should_dither = true;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_circle = distance(uv, vec2(0.5));
  float d_light = distance(uv, vec2(light_origin));
  float a = step(d_circle, 0.49999);
  bool dith = dither(uv, vUv.xy);
  uv = rotate(uv, rotation);
  float fbm1 = fbm(uv);
  d_light += fbm(uv*size+fbm1+vec2(time*0.1+time_speed, 0.0))*lightIntensity;
  float dither_border = (1.0/max(pixels,1.0))*dither_size;
  vec4 col = color1;
  if (d_light > light_border_1) {
    col = color2;
    if (d_light < light_border_1 + dither_border && (dith || !should_dither)) {
      col = color1;
    }
  }
  if (d_light > light_border_2) {
    col = color3;
    if (d_light < light_border_2 + dither_border && (dith || !should_dither)) {
      col = color2;
    }
  }
  gl_FragColor = vec4(col.rgb, a * col.a);
}`;

const LAND_MASS_FRAG = `
varying vec3 vUv;
uniform float lightIntensity;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
uniform float land_cutoff;
float dither_size = 2.0;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform vec4 col1;
uniform vec4 col2;
uniform vec4 col3;
uniform vec4 col4;
float size = 10.0;
int OCTAVES = 6;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_light = distance(uv, light_origin);
  float d_circle = distance(uv, vec2(0.5));
  float a = step(d_circle, 0.49999);
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  vec2 base_fbm_uv = uv * size + vec2(time*time_speed, 0.0);
  float fbm1 = fbm(base_fbm_uv);
  float fbm2 = fbm(base_fbm_uv - light_origin*fbm1);
  float fbm3 = fbm(base_fbm_uv - light_origin*1.5*fbm1);
  float fbm4 = fbm(base_fbm_uv - light_origin*2.0*fbm1);
  if (d_light < light_border_1) { fbm4 *= 0.9; }
  if (d_light > light_border_1) { fbm2 *= 1.05; fbm3 *= 1.05; fbm4 *= 1.05; }
  if (d_light > light_border_2) { fbm2 *= 1.3; fbm3 *= 1.4; fbm4 *= 1.8; }
  d_light = pow(d_light, 2.0)*0.1;
  vec4 col = col4;
  if (fbm4 + d_light < fbm1) { col = col3; }
  if (fbm3 + d_light < fbm1) { col = col2; }
  if (fbm2 + d_light < fbm1) { col = col1; }
  gl_FragColor = vec4(col.rgb, step(land_cutoff, fbm1) * a * col.a);
}`;

const RIVERS_FRAG = `
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform float river_cutoff;
uniform vec4 color1;
uniform vec4 color2;
uniform vec4 color3;
float size = 10.0;
int OCTAVES = 5;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(2.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_light = distance(uv, light_origin);
  float d_circle = distance(uv, vec2(0.5));
  float a = step(d_circle, 0.49999);
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  float fbm1 = fbm(uv*size+vec2(time*time_speed,0.0));
  float river_fbm = fbm(uv + fbm1*2.5);
  river_fbm = step(river_cutoff, river_fbm);
  vec4 col = color1;
  if (d_light > light_border_1) { col = color2; }
  if (d_light > light_border_2) { col = color3; }
  a *= step(river_cutoff, river_fbm);
  gl_FragColor = vec4(col.rgb, a * col.a);
}`;

const CRATER_FRAG = `
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
float dither_size = 2.0;
float light_border = 0.4;
uniform vec4 color1;
uniform vec4 color2;
float size = 5.0;
int OCTAVES = 20;
uniform float seed;
uniform float time;
bool should_dither = true;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return m = smoothstep(r-.10*r,r,m);
}
float crater(vec2 uv) {
  float c = 1.0;
  for (int i = 0; i < 2; i++) {
    c *= circleNoise((uv * size) + (float(i+1)+10.) + vec2((time*0.1)+time_speed,0.0));
  }
  return 1.0 - c;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_circle = distance(uv, vec2(0.5));
  float d_light = distance(uv, vec2(light_origin));
  float a = step(d_circle, 0.49999);
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  float c1 = crater(uv);
  float c2 = crater(uv + (light_origin-0.5)*0.04);
  vec4 col = color1;
  a *= step(0.5, c1);
  if (c2 < c1-(0.5-d_light)*2.0) { col = color2; }
  if (d_light > light_border) { col = color2; }
  a *= step(d_circle, 0.5);
  gl_FragColor = vec4(col.rgb, a * col.a);
}`;

const CLOUD_FRAG = `
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform float cloud_cover;
uniform vec2 light_origin;
uniform float time_speed;
uniform float stretch;
float cloud_curve = 1.3;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform vec4 base_color;
uniform vec4 outline_color;
uniform vec4 shadow_base_color;
uniform vec4 shadow_outline_color;
float size = 4.0;
int OCTAVES = 4;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}
float cloud_alpha(vec2 uv) {
  float c_noise = 0.0;
  for (int i = 0; i < 9; i++) {
    c_noise += circleNoise((uv * size * 0.3) + (float(i+1)+10.) + (vec2(time*time_speed, 0.0)));
  }
  float f = fbm(uv*size+c_noise + vec2(time*time_speed, 0.0));
  return f;
}
bool dither(vec2 uv_pixel, vec2 uv_real) {
  return mod(uv_pixel.x+uv_real.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_light = distance(uv, light_origin);
  float d_circle = distance(uv, vec2(0.5));
  float a = step(d_circle, 0.5);
  float d_to_center = distance(uv, vec2(0.5));
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  uv.y += smoothstep(0.0, cloud_curve, abs(uv.x-0.4));
  float c = cloud_alpha(uv*vec2(1.0, stretch));
  vec4 col = base_color;
  if (c < cloud_cover + 0.03) { col = outline_color; }
  if (d_light + c*0.2 > light_border_1) { col = shadow_base_color; }
  if (d_light + c*0.2 > light_border_2) { col = shadow_outline_color; }
  c *= step(d_to_center, 0.5);
  gl_FragColor = vec4(col.rgb, step(cloud_cover, c) * a * col.a);
}`;

const ATMOSPHERE_FRAG = `
varying vec3 vUv;
uniform vec4 color;
uniform vec4 color2;
uniform vec4 color3;
float pixels = 50.0;

float dist(vec2 p0, vec2 pf){
  return sqrt((pf.x-p0.x)*(pf.x-p0.x)+(pf.y-p0.y)*(pf.y-p0.y));
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  vec2 pos_ndc = 2.0 * uv.xy - 1.0;
  float d = length(pos_ndc);
  float step0 = 0.65;
  float step1 = 0.87;
  float step2 = 0.97;
  float step3 = 1.04;
  float step4 = 1.04;
  vec4 c = mix(vec4(0,0,0,0), color, smoothstep(step0, step1, d));
  c = mix(c, color2, smoothstep(step1, step2, d));
  c = mix(c, color3, smoothstep(step2, step3, d));
  c = mix(c, vec4(0,0,0,0), smoothstep(step3, step4, d));
  gl_FragColor = c;
}`;

const LAKE_FRAG = `
varying vec3 vUv;
uniform float lightIntensity;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform float lake_cutoff;
uniform vec4 color1;
uniform vec4 color2;
uniform vec4 color3;
float size = 10.0;
int OCTAVES = 4;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(2.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_light = distance(uv, vec2(light_origin));
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  float lake = fbm(uv*size+vec2(time*time_speed,0.0));
  vec4 col = color1;
  if (d_light > light_border_1) { col = color2; }
  if (d_light > light_border_2) { col = color3; }
  float a = step(lake_cutoff, lake);
  a *= step(distance(vec2(0.5), uv), 0.5);
  gl_FragColor = vec4(col.rgb, a * col.a);
}`;

const GAS_CLOUD_FRAG = `
varying vec3 vUv;
uniform float pixels;
uniform float cloud_cover;
uniform vec2 light_origin;
uniform float time_speed;
uniform float stretch;
uniform float cloud_curve;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform float rotation;
uniform vec4 base_color;
uniform vec4 outline_color;
uniform vec4 shadow_base_color;
uniform vec4 shadow_outline_color;
float size = 9.0;
int OCTAVES = 5;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
float cloud_alpha(vec2 uv) {
  float c_noise = 0.0;
  for (int i = 0; i < 9; i++) {
    c_noise += circleNoise((uv * size * 0.3) + (float(i+1)+10.) + (vec2(time*time_speed, 0.0)));
  }
  float f = fbm(uv*size+c_noise + vec2(time*time_speed, 0.0));
  return f;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_light = distance(uv, light_origin);
  float d_circle = distance(uv, vec2(0.5));
  float a = step(d_circle, 0.49999);
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  uv.y += smoothstep(0.0, cloud_curve, abs(uv.x-0.4));
  float c = cloud_alpha(uv*vec2(1.0, stretch));
  vec4 col = base_color;
  if (c < cloud_cover + 0.03) { col = outline_color; }
  if (d_light + c*0.2 > light_border_1) { col = shadow_base_color; }
  if (d_light + c*0.2 > light_border_2) { col = shadow_outline_color; }
  gl_FragColor = vec4(col.rgb, step(cloud_cover, c) * a * col.a);
}`;

const DENSE_GAS_FRAG = `
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
uniform float cloud_cover;
float stretch = 2.0;
float cloud_curve = 1.3;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
float bands = 1.0;
bool should_dither = true;
uniform sampler2D colorscheme;
uniform sampler2D dark_colorscheme;
float size = 15.0;
int OCTAVES = 6;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(2.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}
float turbulence(vec2 uv) {
  float c_noise = 0.0;
  for (int i = 0; i < 10; i++) {
    c_noise += circleNoise((uv * size * 0.3) + (float(i+1)+10.) + (vec2(time * time_speed, 0.0)));
  }
  return c_noise;
}
bool dither(vec2 uv_pixel, vec2 uv_real) {
  return mod(uv_pixel.x+uv_real.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float light_d = distance(uv, light_origin);
  bool dith = dither(uv, vUv.xy);
  float a = step(length(uv-vec2(0.5)), 0.49999);
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  float band = fbm(vec2(0.0, uv.y*size*bands));
  float turb = turbulence(uv);
  float fbm1 = fbm(uv*size);
  float fbm2 = fbm(uv*vec2(1.0, 2.0)*size+fbm1+vec2(-time*time_speed,0.0)+turb);
  fbm2 *= pow(band,2.0)*7.0;
  float light = fbm2 + light_d*1.8;
  fbm2 += pow(light_d, 1.0)-0.3;
  fbm2 = smoothstep(-0.2, 4.0-fbm2, light);
  if (dith && should_dither) { fbm2 *= 1.1; }
  float posterized = floor(fbm2*4.0)/2.0;
  vec4 col;
  if (fbm2 < 0.625) {
    col = texture2D(colorscheme, vec2(posterized, uv.y));
  } else {
    col = texture2D(dark_colorscheme, vec2(posterized-1.0, uv.y));
  }
  gl_FragColor = vec4(col.rgb, a * col.a);
}`;

const RING_FRAG = `
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform float ring_width;
uniform float ring_perspective;
uniform float scale_rel_to_planet;
uniform sampler2D colorscheme;
uniform sampler2D dark_colorscheme;
float size = 25.0;
int OCTAVES = 8;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(2.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float light_d = distance(uv, light_origin);
  uv = rotate(uv, rotation);
  vec2 uv_center = uv - vec2(0.0, 0.5);
  uv_center *= vec2(1.0, ring_perspective);
  float center_d = distance(uv_center, vec2(0.5, 0.0));
  float ring = smoothstep(0.5-ring_width*2.0, 0.5-ring_width, center_d);
  ring *= smoothstep(center_d-ring_width, center_d, 0.4);
  if (uv.y < 0.5) {
    ring *= step(1.0/scale_rel_to_planet, distance(uv, vec2(0.5)));
  }
  uv_center = rotate(uv_center+vec2(0, 0.5), time*time_speed);
  ring *= fbm(uv_center*size);
  float posterized = floor((ring+pow(light_d, 2.0)*2.0)*4.0)/4.0;
  vec4 col;
  if (posterized <= 1.0) {
    col = texture2D(colorscheme, vec2(posterized, uv.y));
  } else {
    col = texture2D(dark_colorscheme, vec2(posterized-1.0, uv.y));
  }
  float ring_a = step(0.28, ring);
  gl_FragColor = vec4(col.rgb, ring_a * col.a);
}`;

const STAR_FRAG = `
varying vec3 vUv;
uniform float pixels;
uniform float time_speed;
uniform float time;
uniform float rotation;
uniform sampler2D colorramp;
bool should_dither = true;
uniform float seed;
float size = 15.0;
int OCTAVES = 5;
float TILES = 2.0;

float rand(vec2 co) {
  co = mod(co, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
vec2 rotate(vec2 vec, float angle) {
  vec -= vec2(0.5);
  vec *= mat2(vec2(cos(angle),-sin(angle)), vec2(sin(angle),cos(angle)));
  vec += vec2(0.5);
  return vec;
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
vec2 Hash2(vec2 p) {
  float r = 523.0*sin(dot(p, vec2(53.3158, 43.6143)));
  return vec2(fract(15.32354 * r), fract(17.25865 * r));
}
float cells(in vec2 p, in float numCells) {
  p *= numCells;
  float d = 1.0e10;
  for (int xo = -1; xo <= 1; xo++) {
    for (int yo = -1; yo <= 1; yo++) {
      vec2 tp = floor(p) + vec2(float(xo), float(yo));
      tp = p - tp - Hash2(mod(tp, numCells / TILES));
      d = min(d, dot(tp, tp));
    }
  }
  return sqrt(d);
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 pixelized = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float a = step(distance(pixelized, vec2(0.5)), .49999);
  bool dith = dither(vUv.xy, pixelized);
  pixelized = rotate(pixelized, rotation);
  pixelized = spherify(pixelized);
  float n = cells(pixelized - vec2(time * time_speed * 2.0, 0), 10.0);
  n *= cells(pixelized - vec2(time * time_speed * 1.0, 0), 20.0);
  n *= 2.;
  n = clamp(n, 0.0, 1.0);
  if (dith || !should_dither) { n *= 1.3; }
  float interpolate = floor(n * 3.0) / 3.0;
  vec4 col = texture2D(colorramp, vec2(interpolate, 0.0));
  gl_FragColor = vec4(col.rgb, a * col.a);
}`;

const STAR_BLOB_FRAG = `
varying vec3 vUv;
uniform float pixels;
uniform float time_speed;
uniform float time;
uniform float rotation;
uniform vec4 color;
bool should_dither = true;
uniform float circle_amount;
uniform float circle_size;
uniform float scale;
uniform float seed;
float size = 4.0;
int OCTAVES = 4;
float TILES = 1.0;

float rand(vec2 co){
  co = mod(co, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
vec2 rotate(vec2 vec, float angle) {
  vec -= vec2(0.5);
  vec *= mat2(vec2(cos(angle),-sin(angle)), vec2(sin(angle),cos(angle)));
  vec += vec2(0.5);
  return vec;
}
float circle(vec2 uv) {
  float invert = 1.0 / circle_amount;
  if (mod(uv.y, invert*2.0) < invert) { uv.x += invert*0.5; }
  vec2 rand_co = floor(uv*circle_amount)/circle_amount;
  uv = mod(uv, invert)*circle_amount;
  float r = rand(rand_co);
  r = clamp(r, invert, 1.0 - invert);
  float c = distance(uv, vec2(r));
  return smoothstep(c, c+0.5, invert * circle_size * rand(rand_co*1.5));
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scl = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scl;
    coord *= 2.0;
    scl *= 0.5;
  }
  return value;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 pixelized = (floor(vUv.xy*pixels)/pixels) + 0.5;
  vec2 uv = rotate(pixelized, rotation);
  float angle = atan(uv.x - 0.5, uv.y - 0.5);
  float d = distance(pixelized, vec2(0.5));
  float c = 0.0;
  for(int i = 0; i < 15; i++) {
    float r = rand(vec2(float(i)));
    vec2 circleUV = vec2(d, angle);
    c += circle(circleUV*size - time * time_speed - (1.0/max(d, 0.001)) * 0.1 + r);
  }
  c *= 0.37 - d;
  c = step(0.07, c - d);
  gl_FragColor = vec4(color.rgb, c * color.a);
}`;

const STAR_FLARE_FRAG = `
varying vec3 vUv;
uniform float pixels;
uniform float time_speed;
uniform float time;
uniform float rotation;
uniform sampler2D colorramp;
bool should_dither = true;
uniform float storm_width;
uniform float storm_dither_width;
uniform float circle_amount;
uniform float circle_scale;
uniform float scale;
uniform float seed;
float size = 2.0;
int OCTAVES = 4;
float TILES = 1.0;

float rand(vec2 co){
  co = mod(co, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
vec2 rotate(vec2 vec, float angle) {
  vec -= vec2(0.5);
  vec *= mat2(vec2(cos(angle),-sin(angle)), vec2(sin(angle),cos(angle)));
  vec += vec2(0.5);
  return vec;
}
float circle(vec2 uv) {
  float invert = 1.0 / circle_amount;
  if (mod(uv.y, invert*2.0) < invert) { uv.x += invert*0.5; }
  vec2 rand_co = floor(uv*circle_amount)/circle_amount;
  uv = mod(uv, invert)*circle_amount;
  float r = rand(rand_co);
  r = clamp(r, invert, 1.0 - invert);
  float c = distance(uv, vec2(r));
  return smoothstep(c, c+0.5, invert * circle_scale * rand(rand_co*1.5));
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scl = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scl;
    coord *= 2.0;
    scl *= 0.5;
  }
  return value;
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 pixelized = (floor(vUv.xy*pixels)/pixels) + 0.5;
  bool dith = dither(vUv.xy, pixelized);
  pixelized = rotate(pixelized, rotation);
  vec2 uv = pixelized;
  float angle = atan(uv.x - 0.5, uv.y - 0.5) * 0.4;
  float d = distance(pixelized, vec2(0.5));
  vec2 circleUV = vec2(d, angle);
  float n = fbm(circleUV*size - time * time_speed);
  float nc = circle(circleUV*scale - time * time_speed + n);
  nc *= 1.5;
  float n2 = fbm(circleUV*size - time + vec2(100, 100));
  nc -= n2 * 0.1;
  float a = 0.0;
  if (1.0 - d > nc) {
    if (nc > storm_width - storm_dither_width + d && (dith || !should_dither)) { a = 1.0; }
    else if (nc > storm_width + d) { a = 1.0; }
  }
  float interpolate = floor(n2 + nc);
  vec4 col = texture2D(colorramp, vec2(interpolate, 0.0));
  a *= step(n2 * 0.25, d);
  gl_FragColor = vec4(col.rgb, a * col.a);
}`;

const ASTEROID_FRAG = `
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform vec4 color1;
uniform vec4 color2;
uniform vec4 color3;
uniform float size;
int OCTAVES = 4;
uniform float seed;
uniform float time;
bool should_dither = true;

float rand(vec2 coord) {
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return m = smoothstep(r-.10*r,r,m);
}
float crater(vec2 uv) {
  float c = 1.0;
  for (int i = 0; i < 2; i++) {
    c *= circleNoise((uv * size) + (float(i+1)+10.));
  }
  return 1.0 - c;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  bool dith = dither(uv, vUv.xy);
  float d = distance(uv, vec2(0.5));
  uv = rotate(uv, time*0.1);
  float n = fbm(uv * size);
  float n2 = fbm(uv * size + (rotate(light_origin, rotation)-0.5) * 0.5);
  float n_step = step(0.2, n - d);
  float n2_step = step(0.2, n2 - d);
  float noise_rel = (n2_step + n2) - (n_step + n);
  float c1 = crater(uv);
  float c2 = crater(uv + (light_origin-0.5)*0.03);
  vec4 col = color2;
  if (noise_rel < -0.06 || (noise_rel < -0.04 && (dith || !should_dither))) { col = color1; }
  if (noise_rel > 0.05 || (noise_rel > 0.03 && (dith || !should_dither))) { col = color3; }
  if (c1 > 0.4) { col = color2; }
  if (c2 < c1) { col = color3; }
  gl_FragColor = vec4(col.rgb, n_step * col.a);
}`;

const DRY_PLANET_FRAG = `
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
float light_distance1 = 0.362;
float light_distance2 = 0.525;
uniform float time_speed;
float dither_size = 2.0;
uniform sampler2D colors;
float size = 10.0;
int OCTAVES = 4;
uniform float seed;
uniform float time;
bool should_dither = true;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  bool dith = dither(uv, vUv.xy);
  float d_circle = distance(uv, vec2(0.5));
  float a = step(d_circle, 0.49999);
  uv = spherify(uv);
  float d_light = distance(uv, vec2(light_origin));
  uv = rotate(uv, rotation);
  float f = fbm(uv*size+vec2(time*time_speed, 0.0));
  d_light = smoothstep(-0.3, 1.2, d_light);
  if (d_light < light_distance1) { d_light *= 0.9; }
  if (d_light < light_distance2) { d_light *= 0.9; }
  float c = d_light*pow(f,0.8)*3.5;
  if (dith || !should_dither) { c += 0.02; c *= 1.05; }
  float posterize = floor(c*4.0)/4.0;
  vec4 col = texture2D(colors, vec2(posterize, 0.0));
  gl_FragColor = vec4(col.rgb, a * col.a);
}`;

// ─── Default color palettes (from PixelPlanets reference) ───────────

const DEFAULT_PALETTES = {
  noatmosphere: {
    base: [v4(155/255,158/255,184/255), v4(71/255,97/255,124/255), v4(53/255,57/255,85/255)],
    crater: [v4(71/255,97/255,124/255), v4(53/255,57/255,85/255)],
  },
  earth: {
    base: [v4(102/255,176/255,199/255), v4(102/255,176/255,199/255), v4(52/255,65/255,157/255)],
    land: [v4(0.784314,0.831373,0.364706), v4(0.388235,0.670588,0.247059), v4(0.184314,0.341176,0.32549), v4(0.156863,0.207843,0.25098)],
    cloud: [v4(0.882353,0.94902,1), v4(0.752941,0.890196,1), v4(0.368627,0.439216,0.647059), v4(0.25098,0.286275,0.45098)],
    atmosphere: [v4(173/255,216/255,230/255,0.25), v4(0,127/255,1,0.35), v4(0,0,128/255,0.45)],
  },
  ice: {
    base: [v4(250/255,1,1), v4(199/255,212/255,1), v4(146/255,143/255,184/255)],
    lake: [v4(79/255,164/255,184/255), v4(76/255,104/255,133/255), v4(58/255,63/255,94/255)],
    cloud: [v4(0.882353,0.94902,1), v4(0.752941,0.890196,1), v4(0.368627,0.439216,0.647059), v4(0.25098,0.286275,0.45098)],
  },
  lava: {
    base: [v4(0.560784,0.301961,0.341176), v4(0.321569,0.2,0.247059), v4(0.239216,0.160784,0.211765)],
    crater: [v4(0.321569,0.2,0.247059), v4(0.239216,0.160784,0.211765)],
    river: [v4(1,0.537255,0.2), v4(0.901961,0.270588,0.223529), v4(0.678431,0.184314,0.270588)],
  },
  gasgiant: {
    base: [v4(0.941176,0.709804,0.254902), v4(0.811765,0.458824,0.168627), v4(0.670588,0.317647,0.188235), v4(0.490196,0.219608,0.2)],
    gas: [v4(0.231373,0.12549,0.152941), v4(0.231373,0.12549,0.152941), v4(0.129412,0.0941176,0.105882), v4(0.129412,0.0941176,0.105882)],
  },
  gasgiantring: {
    colorScheme1: [0.94,0.71,0.25,1] as [number,number,number,number],
    colorScheme1_2: [0.81,0.46,0.17,1] as [number,number,number,number],
    colorScheme1_3: [0.67,0.32,0.19,1] as [number,number,number,number],
    colorScheme1_4: [0.49,0.22,0.20,1] as [number,number,number,number],
    colorScheme2: [0.49,0.22,0.20,1] as [number,number,number,number],
    colorScheme2_2: [0.35,0.15,0.12,1] as [number,number,number,number],
    colorScheme2_3: [0.23,0.10,0.08,1] as [number,number,number,number],
    colorScheme2_4: [0.15,0.06,0.05,1] as [number,number,number,number],
  },
  star: {
    ramp: [[0.95,0.65,0.2,1],[0.9,0.4,0.1,1],[0.7,0.25,0.08,1],[0.5,0.15,0.08,1]] as [number,number,number,number][],
    blobColor: v4(1,165/255,0),
  },
  asteroid: {
    colors: [v4(155/255,158/255,184/255), v4(71/255,97/255,124/255), v4(53/255,57/255,85/255)],
  },
  dry: {
    ramp: [[0.79,0.65,0.36,1],[0.66,0.46,0.24,1],[0.56,0.34,0.18,1],[0.38,0.22,0.12,1]] as [number,number,number,number][],
  },
};

// ─── Planet composition builders ────────────────────────────────────

interface CompositionResult {
  group: Group;
  materials: ShaderMaterial[];
  textures: DataTexture[];
  dominantColor: [number, number, number, number];
}

function applyVariation(colors: Vector4[], shift: number): Vector4[] {
  return colors.map((c) => varyV4(c, shift));
}

function composeNoAtmosphere(shift: number, pixels: number, rotation: number): CompositionResult {
  const lp = new Vector2(0.39, 0.7);
  const p = DEFAULT_PALETTES.noatmosphere;
  const bc = applyVariation(p.base, shift);
  const cc = applyVariation(p.crater, shift);
  const mats: ShaderMaterial[] = [];
  const group = new Group();

  const base = ml(BASE_PLANET_FRAG, {
    pixels: { value: pixels }, color1: { value: bc[0] }, color2: { value: bc[1] }, color3: { value: bc[2] },
    lightIntensity: { value: 0.1 }, light_origin: { value: lp },
    time_speed: { value: 0.1 }, rotation: { value: rotation }, seed: { value: randSeed() }, time: { value: 0 },
  });
  mats.push(base.mat); group.add(base.mesh);

  const crater = ml(CRATER_FRAG, {
    pixels: { value: pixels }, color1: { value: cc[0] }, color2: { value: cc[1] },
    light_origin: { value: lp }, time_speed: { value: 0.1 }, rotation: { value: rotation },
    seed: { value: randSeed() }, time: { value: 0 },
  });
  crater.mesh.position.z = 0.01;
  mats.push(crater.mat); group.add(crater.mesh);

  const dc = bc[2]!;
  return { group, materials: mats, textures: [], dominantColor: [dc.x, dc.y, dc.z, dc.w] };
}

function composeEarth(shift: number, pixels: number, rotation: number): CompositionResult {
  const lp = new Vector2(0.39, 0.7);
  const p = DEFAULT_PALETTES.earth;
  const bc = applyVariation(p.base, shift);
  const lc = applyVariation(p.land, shift);
  const clc = applyVariation(p.cloud, shift);
  const mats: ShaderMaterial[] = [];
  const group = new Group();

  const base = ml(BASE_PLANET_FRAG, {
    pixels: { value: pixels }, color1: { value: bc[0] }, color2: { value: bc[1] }, color3: { value: bc[2] },
    lightIntensity: { value: 0.1 }, light_origin: { value: lp },
    time_speed: { value: 0.1 }, rotation: { value: rotation }, seed: { value: randSeed() }, time: { value: 0 },
  });
  mats.push(base.mat); group.add(base.mesh);

  const land = ml(LAND_MASS_FRAG, {
    pixels: { value: pixels }, land_cutoff: { value: 0.5 },
    col1: { value: lc[0] }, col2: { value: lc[1] }, col3: { value: lc[2] }, col4: { value: lc[3] },
    lightIntensity: { value: 0.1 }, light_origin: { value: lp },
    time_speed: { value: 0.1 }, rotation: { value: rotation }, seed: { value: randSeed() }, time: { value: 0 },
  });
  land.mesh.position.z = 0.01;
  mats.push(land.mat); group.add(land.mesh);

  const cloud = ml(CLOUD_FRAG, {
    pixels: { value: pixels }, light_origin: { value: lp },
    seed: { value: randSeed() }, time_speed: { value: 0.1 },
    base_color: { value: clc[0] }, outline_color: { value: clc[1] },
    shadow_base_color: { value: clc[2] }, shadow_outline_color: { value: clc[3] },
    cloud_cover: { value: 0.546 }, rotation: { value: rotation }, stretch: { value: 2.5 }, time: { value: 0 },
  });
  cloud.mesh.position.z = 0.02;
  mats.push(cloud.mat); group.add(cloud.mesh);

  const atmo = ml(ATMOSPHERE_FRAG, {
    color: { value: p.atmosphere[0] }, color2: { value: p.atmosphere[1] }, color3: { value: p.atmosphere[2] },
  }, 1.02, 1.02);
  atmo.mesh.position.z = 0.03;
  mats.push(atmo.mat); group.add(atmo.mesh);

  const dc = lc[1]!;
  return { group, materials: mats, textures: [], dominantColor: [dc.x, dc.y, dc.z, dc.w] };
}

function composeIce(shift: number, pixels: number, rotation: number): CompositionResult {
  const lp = new Vector2(0.39, 0.7);
  const p = DEFAULT_PALETTES.ice;
  const bc = applyVariation(p.base, shift);
  const lkc = applyVariation(p.lake, shift);
  const clc = applyVariation(p.cloud, shift);
  const mats: ShaderMaterial[] = [];
  const group = new Group();

  const base = ml(BASE_PLANET_FRAG, {
    pixels: { value: pixels }, color1: { value: bc[0] }, color2: { value: bc[1] }, color3: { value: bc[2] },
    lightIntensity: { value: 0.1 }, light_origin: { value: lp },
    time_speed: { value: 0.1 }, rotation: { value: rotation }, seed: { value: randSeed() }, time: { value: 0 },
  });
  mats.push(base.mat); group.add(base.mesh);

  const lake = ml(LAKE_FRAG, {
    pixels: { value: pixels }, light_origin: { value: lp },
    seed: { value: randSeed() }, time_speed: { value: 0.1 }, lake_cutoff: { value: 0.6 },
    rotation: { value: rotation },
    color1: { value: lkc[0] }, color2: { value: lkc[1] }, color3: { value: lkc[2] }, time: { value: 0 },
  });
  lake.mesh.position.z = 0.01;
  mats.push(lake.mat); group.add(lake.mesh);

  const cloud = ml(CLOUD_FRAG, {
    pixels: { value: pixels }, light_origin: { value: lp },
    seed: { value: randSeed() }, time_speed: { value: 0.1 },
    base_color: { value: clc[0] }, outline_color: { value: clc[1] },
    shadow_base_color: { value: clc[2] }, shadow_outline_color: { value: clc[3] },
    cloud_cover: { value: 0.546 }, rotation: { value: rotation }, stretch: { value: 2.5 }, time: { value: 0 },
  });
  cloud.mesh.position.z = 0.02;
  mats.push(cloud.mat); group.add(cloud.mesh);

  const dc = bc[0]!;
  return { group, materials: mats, textures: [], dominantColor: [dc.x, dc.y, dc.z, dc.w] };
}

function composeLava(shift: number, pixels: number, rotation: number): CompositionResult {
  const lp = new Vector2(0.39, 0.7);
  const p = DEFAULT_PALETTES.lava;
  const bc = applyVariation(p.base, shift);
  const cc = applyVariation(p.crater, shift);
  const rc = applyVariation(p.river, shift);
  const mats: ShaderMaterial[] = [];
  const group = new Group();

  const base = ml(BASE_PLANET_FRAG, {
    pixels: { value: pixels }, color1: { value: bc[0] }, color2: { value: bc[1] }, color3: { value: bc[2] },
    lightIntensity: { value: 0.1 }, light_origin: { value: lp },
    time_speed: { value: 0.1 }, rotation: { value: rotation }, seed: { value: randSeed() }, time: { value: 0 },
  });
  mats.push(base.mat); group.add(base.mesh);

  const crater = ml(CRATER_FRAG, {
    pixels: { value: pixels }, color1: { value: cc[0] }, color2: { value: cc[1] },
    light_origin: { value: lp }, time_speed: { value: 0.1 }, rotation: { value: rotation },
    seed: { value: randSeed() }, time: { value: 0 },
  });
  crater.mesh.position.z = 0.01;
  mats.push(crater.mat); group.add(crater.mesh);

  const river = ml(RIVERS_FRAG, {
    pixels: { value: pixels }, light_origin: { value: lp },
    seed: { value: randSeed() }, time_speed: { value: 0.1 }, river_cutoff: { value: 0.6 },
    rotation: { value: rotation },
    color1: { value: rc[0] }, color2: { value: rc[1] }, color3: { value: rc[2] }, time: { value: 0 },
  });
  river.mesh.position.z = 0.02;
  mats.push(river.mat); group.add(river.mesh);

  const dc = rc[0]!;
  return { group, materials: mats, textures: [], dominantColor: [dc.x, dc.y, dc.z, dc.w] };
}

function composeGasGiant(shift: number, pixels: number, rotation: number): CompositionResult {
  const lp = new Vector2(0.39, 0.7);
  const p = DEFAULT_PALETTES.gasgiant;
  const bc = applyVariation(p.base, shift);
  const gc = applyVariation(p.gas, shift);
  const mats: ShaderMaterial[] = [];
  const group = new Group();

  const base = ml(GAS_CLOUD_FRAG, {
    pixels: { value: pixels },
    base_color: { value: bc[0] }, outline_color: { value: bc[1] },
    shadow_base_color: { value: bc[2] }, shadow_outline_color: { value: bc[3] },
    cloud_cover: { value: 0.0 }, stretch: { value: 1.0 }, cloud_curve: { value: 0.0 },
    time_speed: { value: 0.1 }, rotation: { value: rotation }, light_origin: { value: lp },
    seed: { value: randSeed() }, time: { value: 0 },
  });
  mats.push(base.mat); group.add(base.mesh);

  const gas = ml(GAS_CLOUD_FRAG, {
    pixels: { value: pixels },
    base_color: { value: gc[0] }, outline_color: { value: gc[1] },
    shadow_base_color: { value: gc[2] }, shadow_outline_color: { value: gc[3] },
    cloud_cover: { value: 0.538 }, stretch: { value: 1.0 }, cloud_curve: { value: 1.3 },
    time_speed: { value: 0.1 }, rotation: { value: rotation }, light_origin: { value: lp },
    seed: { value: randSeed() }, time: { value: 0 },
  });
  gas.mesh.position.z = 0.01;
  mats.push(gas.mat); group.add(gas.mesh);

  const dc = bc[0]!;
  return { group, materials: mats, textures: [], dominantColor: [dc.x, dc.y, dc.z, dc.w] };
}

function composeGasGiantRing(shift: number, pixels: number, rotation: number): CompositionResult {
  const lp = new Vector2(0.39, 0.7);
  const pr = DEFAULT_PALETTES.gasgiantring;
  const mats: ShaderMaterial[] = [];
  const textures: DataTexture[] = [];
  const group = new Group();

  const cs1 = createColorRamp([
    [pr.colorScheme1[0]+shift, pr.colorScheme1[1]+shift*0.8, pr.colorScheme1[2]+shift*0.6, 1],
    [pr.colorScheme1_2[0]+shift, pr.colorScheme1_2[1]+shift*0.8, pr.colorScheme1_2[2]+shift*0.6, 1],
    [pr.colorScheme1_3[0]+shift, pr.colorScheme1_3[1]+shift*0.8, pr.colorScheme1_3[2]+shift*0.6, 1],
    [pr.colorScheme1_4[0]+shift, pr.colorScheme1_4[1]+shift*0.8, pr.colorScheme1_4[2]+shift*0.6, 1],
  ]);
  const cs2 = createColorRamp([
    [pr.colorScheme2[0]+shift, pr.colorScheme2[1]+shift*0.8, pr.colorScheme2[2]+shift*0.6, 1],
    [pr.colorScheme2_2[0]+shift, pr.colorScheme2_2[1]+shift*0.8, pr.colorScheme2_2[2]+shift*0.6, 1],
    [pr.colorScheme2_3[0]+shift, pr.colorScheme2_3[1]+shift*0.8, pr.colorScheme2_3[2]+shift*0.6, 1],
    [pr.colorScheme2_4[0]+shift, pr.colorScheme2_4[1]+shift*0.8, pr.colorScheme2_4[2]+shift*0.6, 1],
  ]);
  textures.push(cs1, cs2);

  const denseGas = ml(DENSE_GAS_FRAG, {
    colorscheme: { value: cs1 }, dark_colorscheme: { value: cs2 },
    pixels: { value: 150 }, light_origin: { value: lp }, time_speed: { value: 0.1 },
    rotation: { value: rotation }, seed: { value: randSeed() }, time: { value: 0 },
    cloud_cover: { value: 0.0 },
  });
  mats.push(denseGas.mat); group.add(denseGas.mesh);

  const rcs1 = createColorRamp([
    [pr.colorScheme1[0]+shift, pr.colorScheme1[1]+shift*0.8, pr.colorScheme1[2]+shift*0.6, 1],
    [pr.colorScheme1_2[0]+shift, pr.colorScheme1_2[1]+shift*0.8, pr.colorScheme1_2[2]+shift*0.6, 1],
    [pr.colorScheme1_3[0]+shift, pr.colorScheme1_3[1]+shift*0.8, pr.colorScheme1_3[2]+shift*0.6, 1],
    [pr.colorScheme1_4[0]+shift, pr.colorScheme1_4[1]+shift*0.8, pr.colorScheme1_4[2]+shift*0.6, 1],
  ]);
  const rcs2 = createColorRamp([
    [pr.colorScheme2[0]+shift, pr.colorScheme2[1]+shift*0.8, pr.colorScheme2[2]+shift*0.6, 1],
    [pr.colorScheme2_2[0]+shift, pr.colorScheme2_2[1]+shift*0.8, pr.colorScheme2_2[2]+shift*0.6, 1],
    [pr.colorScheme2_3[0]+shift, pr.colorScheme2_3[1]+shift*0.8, pr.colorScheme2_3[2]+shift*0.6, 1],
    [pr.colorScheme2_4[0]+shift, pr.colorScheme2_4[1]+shift*0.8, pr.colorScheme2_4[2]+shift*0.6, 1],
  ]);
  textures.push(rcs1, rcs2);

  const ring = ml(RING_FRAG, {
    colorscheme: { value: rcs1 }, dark_colorscheme: { value: rcs2 },
    ring_width: { value: 0.143 }, ring_perspective: { value: 6.0 }, scale_rel_to_planet: { value: 4.0 },
    pixels: { value: 250 }, light_origin: { value: lp }, time_speed: { value: 0.1 },
    rotation: { value: rotation }, seed: { value: randSeed() }, time: { value: 0 },
  });
  ring.mesh.position.z = 0.01;
  ring.mesh.scale.set(2.0, 2.0, 1);
  mats.push(ring.mat); group.add(ring.mesh);

  return { group, materials: mats, textures, dominantColor: [pr.colorScheme1[0], pr.colorScheme1[1], pr.colorScheme1[2], 1] };
}

function composeStar(shift: number, pixels: number, rotation: number): CompositionResult {
  const lp = new Vector2(0.39, 0.7);
  const p = DEFAULT_PALETTES.star;
  const mats: ShaderMaterial[] = [];
  const textures: DataTexture[] = [];
  const group = new Group();

  const ramp1 = createColorRamp(p.ramp.map(c => [
    Math.min(1, Math.max(0, c[0]+shift)),
    Math.min(1, Math.max(0, c[1]+shift*0.8)),
    Math.min(1, Math.max(0, c[2]+shift*0.6)),
    c[3],
  ] as [number,number,number,number]));
  textures.push(ramp1);

  const blob = ml(STAR_BLOB_FRAG, {
    pixels: { value: 200 }, color: { value: varyV4(p.blobColor, shift) },
    time_speed: { value: 0.1 }, rotation: { value: rotation }, seed: { value: randSeed() }, time: { value: 0 },
    circle_amount: { value: 3.0 }, circle_size: { value: 1.5 }, scale: { value: 1.0 },
  }, 1.3, 1.3);
  blob.mesh.position.z = -0.01;
  blob.mesh.scale.set(1.9, 1.9, 1);
  mats.push(blob.mat); group.add(blob.mesh);

  const star = ml(STAR_FRAG, {
    pixels: { value: pixels }, colorramp: { value: ramp1 },
    lightIntensity: { value: 0.1 }, light_origin: { value: lp },
    time_speed: { value: 0.01 }, rotation: { value: rotation }, seed: { value: randSeed() }, time: { value: 0 },
  });
  mats.push(star.mat); group.add(star.mesh);

  const ramp2 = createColorRamp(p.ramp.map(c => [
    Math.min(1, Math.max(0, c[0]+shift)),
    Math.min(1, Math.max(0, c[1]+shift*0.8)),
    Math.min(1, Math.max(0, c[2]+shift*0.6)),
    c[3],
  ] as [number,number,number,number]));
  textures.push(ramp2);

  const flare = ml(STAR_FLARE_FRAG, {
    pixels: { value: 200 }, colorramp: { value: ramp2 },
    time_speed: { value: 0.05 }, rotation: { value: rotation }, seed: { value: randSeed() }, time: { value: 0 },
    storm_width: { value: 0.2 }, storm_dither_width: { value: 0.07 },
    circle_amount: { value: 2.0 }, circle_scale: { value: 1.0 }, scale: { value: 1.0 },
  }, 1.5, 1.5);
  flare.mesh.position.z = 0.01;
  flare.mesh.scale.set(1.2, 1.2, 1);
  mats.push(flare.mat); group.add(flare.mesh);

  const dc = p.ramp[0]!;
  return { group, materials: mats, textures, dominantColor: [dc[0], dc[1], dc[2], dc[3]] };
}

function composeAsteroid(shift: number, pixels: number, rotation: number): CompositionResult {
  const lp = new Vector2(0.39, 0.7);
  const p = DEFAULT_PALETTES.asteroid;
  const ac = applyVariation(p.colors, shift);
  const mats: ShaderMaterial[] = [];
  const group = new Group();

  const asteroid = ml(ASTEROID_FRAG, {
    pixels: { value: pixels }, color1: { value: ac[0] }, color2: { value: ac[1] }, color3: { value: ac[2] },
    size: { value: Math.random() * 10 },
    light_origin: { value: lp }, rotation: { value: rotation },
    seed: { value: randSeed() }, time: { value: 0 },
  }, 1.5, 1.5);
  mats.push(asteroid.mat); group.add(asteroid.mesh);

  const dc = ac[1]!;
  return { group, materials: mats, textures: [], dominantColor: [dc.x, dc.y, dc.z, dc.w] };
}

function composeDry(shift: number, pixels: number, rotation: number): CompositionResult {
  const lp = new Vector2(0.39, 0.7);
  const p = DEFAULT_PALETTES.dry;
  const mats: ShaderMaterial[] = [];
  const textures: DataTexture[] = [];
  const group = new Group();

  const ramp = createColorRamp(p.ramp.map(c => [
    Math.min(1, Math.max(0, c[0]+shift)),
    Math.min(1, Math.max(0, c[1]+shift*0.8)),
    Math.min(1, Math.max(0, c[2]+shift*0.6)),
    c[3],
  ] as [number,number,number,number]));
  textures.push(ramp);

  const dry = ml(DRY_PLANET_FRAG, {
    pixels: { value: pixels }, colors: { value: ramp },
    light_origin: { value: lp }, time_speed: { value: 0.1 }, rotation: { value: rotation },
    seed: { value: randSeed() }, time: { value: 0 },
  });
  mats.push(dry.mat); group.add(dry.mesh);

  const dc = p.ramp[1]!;
  return { group, materials: mats, textures, dominantColor: [dc[0], dc[1], dc[2], dc[3]] };
}

// ─── Main factory ───────────────────────────────────────────────────

function buildComposition(
  typeId: string,
  shift: number,
  pixels: number,
  rotation: number,
): CompositionResult {
  switch (typeId) {
    case "noatmosphere": return composeNoAtmosphere(shift, pixels, rotation);
    case "earth": return composeEarth(shift, pixels, rotation);
    case "ice": return composeIce(shift, pixels, rotation);
    case "lava": return composeLava(shift, pixels, rotation);
    case "gasgiant": return composeGasGiant(shift, pixels, rotation);
    case "gasgiantring": return composeGasGiantRing(shift, pixels, rotation);
    case "star": return composeStar(shift, pixels, rotation);
    case "asteroid": return composeAsteroid(shift, pixels, rotation);
    case "dry": return composeDry(shift, pixels, rotation);
    default: return composeNoAtmosphere(shift, pixels, rotation);
  }
}

function frustumForType(typeId: string): number {
  switch (typeId) {
    case "gasgiantring": return 1.1;
    case "star": return 1.3;
    case "asteroid": return 0.8;
    default: return 0.55;
  }
}

export function createThreePlanetRuntime(
  typeId: string,
  resolution: number,
  opts?: PlanetCreateOptions,
): ThreePlanetRuntime | null {
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: false });
  } catch {
    return null;
  }
  renderer.setSize(resolution, resolution, false);
  renderer.setPixelRatio(1);

  const fs = opts?.frustumScale ?? frustumForType(typeId);
  const scene = new Scene();
  const camera = new OrthographicCamera(-fs, fs, fs, -fs, 0.1, 100);
  camera.position.z = 1;

  const variSeed = opts?.variationSeed ?? 0;
  const shift = (Math.sin(variSeed * 12.9898) * 43758.5453 % 1) * 0.14 - 0.07;
  const pixels = opts?.pixels ?? 50;
  const rotation = opts?.rotation ?? (Math.random() - 0.5) * 0.6;

  const composition = buildComposition(typeId, shift, pixels, rotation);
  scene.add(composition.group);

  const update = (timeSec: number): void => {
    for (const mat of composition.materials) {
      if (mat.uniforms.time) {
        mat.uniforms.time.value = timeSec;
      }
    }
    renderer.render(scene, camera);
  };

  const destroy = (): void => {
    for (const mat of composition.materials) mat.dispose();
    for (const tex of composition.textures) tex.dispose();
    renderer.dispose();
  };

  update(0);

  return {
    renderer,
    scene,
    camera,
    image: renderer.domElement,
    dominantColor: composition.dominantColor,
    materials: composition.materials,
    update,
    destroy,
  };
}
