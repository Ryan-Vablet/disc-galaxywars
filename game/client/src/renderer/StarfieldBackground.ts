/**
 * Starfield background ported 1:1 from PixelPlanets (background.js).
 * Renders procedural dust and nebula layers via WebGL for a space starfield effect.
 */

import {
  DataTexture,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  WebGLRenderer,
} from "three";

const VERT = `
varying vec3 vUv;
void main() {
  vUv = position;
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
}
`;

// Fragment shader: dust layer (1:1 from PixelPlanets fragmentShaderDust)
const DUST_FRAG = `
varying vec3 vUv;
float size = 10.0;
int OCTAVES = 12;
uniform float seed;
float pixels = 100.0;
bool should_tile = false;
bool reduce_background = false;
uniform sampler2D colorscheme;
vec2 uv_correct = vec2(1.0);

float rand(vec2 coord, float tilesize) {
  if (should_tile) {
    coord = mod(coord / uv_correct, tilesize);
  }
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * (15.5453 + seed));
}

float noise(vec2 coord, float tilesize){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i, tilesize);
  float b = rand(i + vec2(1.0, 0.0), tilesize);
  float c = rand(i + vec2(0.0, 1.0), tilesize);
  float d = rand(i + vec2(1.0, 1.0), tilesize);
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}

float fbm(vec2 coord, float tilesize){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord, tilesize) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}

bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.y+uv2.x,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}

float circleNoise(vec2 uv, float tilesize) {
  if (should_tile) {
    uv = mod(uv, tilesize);
  }
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)), tilesize);
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}

float cloud_alpha(vec2 uv, float tilesize) {
  float c_noise = 0.0;
  int iters = 2;
  for (int i = 0; i < iters; i++) {
    c_noise += circleNoise(uv * 0.5 + (float(i+1)) + vec2(-0.3, 0.0), ceil(tilesize * 0.5));
  }
  float f = fbm(uv+c_noise, tilesize);
  return f;
}

void main() {
  vec2 uv = floor((vUv.xy) * pixels) / pixels * uv_correct;
  bool dith = dither(uv, vUv.xy);
  float n_alpha = fbm(uv * ceil(size * 0.5) +vec2(2,2), ceil(size * 0.5));
  float n_dust = cloud_alpha(uv * size, size);
  float n_dust2 = fbm(uv * ceil(size * 0.2) -vec2(2,2),ceil(size * 0.2));
  float n_dust_lerp = n_dust2 * n_dust;
  if (dith) {
    n_dust_lerp *= 0.95;
  }
  float a_dust = step(n_alpha , n_dust_lerp * 1.8);
  n_dust_lerp = pow(n_dust_lerp, 3.2) * 56.0;
  if (dith) {
    n_dust_lerp *= 1.1;
  }
  if (reduce_background) {
    n_dust_lerp = pow(n_dust_lerp, 0.8) * 0.7;
  }
  float col_value = floor(n_dust_lerp) / 7.0;
  vec3 col = texture2D(colorscheme, vec2(col_value, 0.0)).rgb;
  gl_FragColor = vec4(col, a_dust);
}
`;

// Fragment shader: nebula layer (1:1 from PixelPlanets fragmentShaderNebula)
const NEBULA_FRAG = `
varying vec3 vUv;
float size = 5.0;
int OCTAVES = 8;
uniform float seed;
float pixels = 100.0;
uniform sampler2D colorscheme;
vec4 background_color = vec4(0,0,0,0);
bool should_tile = false;
bool reduce_background = false;
vec2 uv_correct = vec2(1.0);

float rand(vec2 coord, float tilesize) {
  if (should_tile) {
    coord = mod(coord / uv_correct, tilesize);
  }
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * (15.5453 + seed));
}

float noise(vec2 coord, float tilesize){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i, tilesize);
  float b = rand(i + vec2(1.0, 0.0), tilesize);
  float c = rand(i + vec2(0.0, 1.0), tilesize);
  float d = rand(i + vec2(1.0, 1.0), tilesize);
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}

float fbm(vec2 coord, float tilesize){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord, tilesize) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}

bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.y+uv2.x,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}

float circleNoise(vec2 uv, float tilesize) {
  if (should_tile) {
    uv = mod(uv, tilesize / uv_correct);
  }
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)), tilesize);
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}

float cloud_alpha(vec2 uv, float tilesize) {
  float c_noise = 0.0;
  int iters = 4;
  for (int i = 0; i < iters; i++) {
    c_noise += circleNoise(uv * 0.5 + (float(i+1)) + vec2(-0.3, 0.0), ceil(tilesize * 0.5));
  }
  float f = fbm(uv+c_noise, tilesize);
  return f;
}

void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d = distance(uv, vec2(0.5)) * 0.4;
  uv *= uv_correct;
  bool dith = dither(uv, vUv.xy);
  float n = cloud_alpha(uv * size, size);
  float n2 = fbm(uv * size + vec2(1, 1), size);
  float n_lerp = n2 * n;
  float n_dust = cloud_alpha(uv * size, size);
  float n_dust_lerp = n_dust * n_lerp;
  if (dith) {
    n_dust_lerp *= 0.95;
    n_lerp *= 0.95;
    d*= 0.98;
  }
  float a = step(n2, 0.1 + d);
  float a2 = step(n2, 0.115 + d);
  if (should_tile) {
    a = step(n2, 0.3);
    a2 = step(n2, 0.315);
  }
  if (reduce_background) {
    n_dust_lerp = pow(n_dust_lerp, 1.2) * 0.7;
  }
  float col_value = 0.0;
  if (a2 > a) {
    col_value = floor(n_dust_lerp * 35.0) / 7.0;
  } else {
    col_value = floor(n_dust_lerp * 14.0) / 7.0;
  }
  vec3 col = texture2D(colorscheme, vec2(col_value, 0.0)).rgb;
  if (col_value < 0.1) {
    col = background_color.rgb;
  }
  gl_FragColor = vec4(col, a2);
}
`;

/** 8-step color ramp approximating PixelPlanets colorScheme1 (warm space dust/nebula). */
function createColorRamp(): DataTexture {
  const colors: [number, number, number, number][] = [
    [0.02, 0.02, 0.06, 1],
    [0.06, 0.04, 0.12, 1],
    [0.10, 0.06, 0.18, 1],
    [0.14, 0.08, 0.22, 1],
    [0.18, 0.10, 0.28, 1],
    [0.22, 0.12, 0.32, 1],
    [0.28, 0.16, 0.38, 1],
    [0.35, 0.20, 0.45, 1],
  ];
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

export interface StarfieldBackgroundAPI {
  getCanvas(): HTMLCanvasElement | null;
  update(timeMs: number): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

export function createStarfieldBackground(
  width: number,
  height: number,
  seed: number,
): StarfieldBackgroundAPI | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: true,
    });
  } catch {
    return null;
  }
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x05080f, 1);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const colorScheme = createColorRamp();

  const dustMat = new ShaderMaterial({
    uniforms: {
      colorscheme: { value: colorScheme },
      seed: { value: seed },
    },
    vertexShader: VERT,
    fragmentShader: DUST_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const dustMesh = new Mesh(new PlaneGeometry(3, 3), dustMat);
  dustMesh.position.z = -1;

  const nebulaMat = new ShaderMaterial({
    uniforms: {
      colorscheme: { value: colorScheme },
      seed: { value: seed * 1.37 },
    },
    vertexShader: VERT,
    fragmentShader: NEBULA_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const nebulaMesh = new Mesh(new PlaneGeometry(3, 3), nebulaMat);
  nebulaMesh.position.z = -0.9;

  scene.add(dustMesh);
  scene.add(nebulaMesh);

  const update = (timeMs: number): void => {
    renderer.clear();
    renderer.render(scene, camera);
  };

  const resize = (w: number, h: number): void => {
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    renderer.setSize(w, h, false);
  };

  const destroy = (): void => {
    dustMat.dispose();
    nebulaMat.dispose();
    colorScheme.dispose();
    renderer.dispose();
  };

  update(0);

  return {
    getCanvas: () => canvas,
    update,
    resize,
    destroy,
  };
}
