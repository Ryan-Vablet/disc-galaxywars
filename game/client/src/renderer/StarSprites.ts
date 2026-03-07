/**
 * PixelPlanets-style star sprites via PNG atlases.
 * Loads stars.png (9 frames) and stars-special.png (6 frames), mirrors PixelPlanets
 * logic: 50% special, random frame, color #ffef9e | #ffffff, opacity 0.1–1.
 * Caches pre-tinted sprites once to avoid per-frame allocations; draws at visible sizes.
 */

const STAR_ATLAS_NORMAL_URL = "assets/stars/stars.png";
const STAR_ATLAS_SPECIAL_URL = "assets/stars/stars-special.png";

const NORMAL_FRAME_COUNT = 9;
const SPECIAL_FRAME_COUNT = 6;
const DISPLAY_SIZE_NORMAL = 11;
const DISPLAY_SIZE_SPECIAL = 16;
const STAR_COUNT = 420;

function flip(): boolean {
  return Math.random() > 0.5;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

interface StarSprite {
  x: number;
  y: number;
  isSpecial: boolean;
  frameIndex: number;
  color: string;
  opacity: number;
}

interface AtlasInfo {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  /** Cached tinted (yellow) sprites per frame: [frameIndex] = canvas at display size */
  yellowCache: HTMLCanvasElement[];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function buildYellowCache(
  image: HTMLImageElement,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
  displaySize: number,
): HTMLCanvasElement[] {
  const out: HTMLCanvasElement[] = [];
  for (let f = 0; f < frameCount; f++) {
    const canvas = document.createElement("canvas");
    canvas.width = displaySize;
    canvas.height = displaySize;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      image,
      f * frameWidth, 0, frameWidth, frameHeight,
      0, 0, displaySize, displaySize,
    );
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#ffef9e";
    ctx.fillRect(0, 0, displaySize, displaySize);
    out.push(canvas);
  }
  return out;
}

export class StarSprites {
  private stars: StarSprite[] = [];
  private normalAtlas: AtlasInfo | null = null;
  private specialAtlas: AtlasInfo | null = null;

  constructor(width: number, height: number, count: number = STAR_COUNT) {
    this.loadAtlases();
    this.createStars(width, height, count);
  }

  private async loadAtlases(): Promise<void> {
    try {
      const [normalImg, specialImg] = await Promise.all([
        loadImage(STAR_ATLAS_NORMAL_URL),
        loadImage(STAR_ATLAS_SPECIAL_URL),
      ]);
      const nFrameW = normalImg.naturalWidth / NORMAL_FRAME_COUNT;
      const nFrameH = normalImg.naturalHeight;
      const sFrameW = specialImg.naturalWidth / SPECIAL_FRAME_COUNT;
      const sFrameH = specialImg.naturalHeight;
      this.normalAtlas = {
        image: normalImg,
        frameWidth: nFrameW,
        frameHeight: nFrameH,
        frameCount: NORMAL_FRAME_COUNT,
        yellowCache: buildYellowCache(
          normalImg, nFrameW, nFrameH, NORMAL_FRAME_COUNT, DISPLAY_SIZE_NORMAL,
        ),
      };
      this.specialAtlas = {
        image: specialImg,
        frameWidth: sFrameW,
        frameHeight: sFrameH,
        frameCount: SPECIAL_FRAME_COUNT,
        yellowCache: buildYellowCache(
          specialImg, sFrameW, sFrameH, SPECIAL_FRAME_COUNT, DISPLAY_SIZE_SPECIAL,
        ),
      };
    } catch {
      this.normalAtlas = null;
      this.specialAtlas = null;
    }
  }

  private createStars(width: number, height: number, count: number): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const isSpecial = flip();
      this.stars.push({
        x: rand(0, width),
        y: rand(0, height),
        isSpecial,
        frameIndex: isSpecial
          ? randInt(0, SPECIAL_FRAME_COUNT - 1)
          : randInt(0, NORMAL_FRAME_COUNT - 1),
        color: flip() ? "#ffef9e" : "#ffffff",
        opacity: rand(0.1, 1),
      });
    }
  }

  /** Update (no-op; stars are static for performance) */
  update(_deltaTime: number): void {}

  /** Render stars to the given canvas context. No-op until atlases are loaded. */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.normalAtlas || !this.specialAtlas) return;

    const alpha = ctx.globalAlpha;
    for (const star of this.stars) {
      const atlas = star.isSpecial ? this.specialAtlas : this.normalAtlas;
      if (!atlas) continue;

      const displaySize = star.isSpecial ? DISPLAY_SIZE_SPECIAL : DISPLAY_SIZE_NORMAL;
      const dx = star.x - displaySize / 2;
      const dy = star.y - displaySize / 2;

      ctx.globalAlpha = star.opacity;

      if (star.color === "#ffef9e") {
        const cached = atlas.yellowCache[star.frameIndex];
        if (cached) ctx.drawImage(cached, dx, dy, displaySize, displaySize);
      } else {
        const sx = star.frameIndex * atlas.frameWidth;
        ctx.drawImage(
          atlas.image,
          sx, 0, atlas.frameWidth, atlas.frameHeight,
          dx, dy, displaySize, displaySize,
        );
      }
    }
    ctx.globalAlpha = alpha;
  }

  /** Resize and regenerate star positions */
  resize(width: number, height: number, count?: number): void {
    this.createStars(width, height, count ?? this.stars.length);
  }

  /** Clean up */
  dispose(): void {
    this.stars = [];
    this.normalAtlas = null;
    this.specialAtlas = null;
  }
}
