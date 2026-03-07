import {
  createThreePlanetRuntime,
  type ThreePlanetRuntime,
  type PlanetCreateOptions,
} from "@/planets/ThreePlanetRuntime";
import { ALL_PLANET_TYPE_IDS, PLANET_TYPES } from "@/planets/PlanetTypes";

const PREVIEW_SIZE = 300;

export class DemoPlanetPage {
  private container: HTMLElement;
  private previewCanvas: HTMLCanvasElement;
  private previewCtx: CanvasRenderingContext2D;
  private runtime: ThreePlanetRuntime | null = null;
  private animFrameId = 0;
  private startTime = 0;

  private currentType = "earth";
  private currentSeed = Math.floor(Math.random() * 999999999);
  private currentPixels = 100;
  private currentRotation = 0;

  constructor(
    parent: HTMLElement,
    private readonly onBack: () => void,
  ) {
    this.container = document.createElement("div");
    this.container.className = "demoPlanetPage";

    const layout = document.createElement("div");
    layout.className = "demoLayout";

    const previewSection = document.createElement("div");
    previewSection.className = "demoPreview";
    this.previewCanvas = document.createElement("canvas");
    this.previewCanvas.width = PREVIEW_SIZE;
    this.previewCanvas.height = PREVIEW_SIZE;
    this.previewCanvas.className = "demoCanvas";
    this.previewCtx = this.previewCanvas.getContext("2d")!;
    previewSection.append(this.previewCanvas);

    const controls = this.createControls();

    layout.append(previewSection, controls);
    this.container.append(layout);
    parent.replaceChildren(this.container);

    this.rebuildPlanet();
    this.startTime = performance.now();
    this.animate();
  }

  private createControls(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "demoControls";

    panel.append(this.createLabel("PLANET TYPE:"));
    const typeSelect = document.createElement("select");
    typeSelect.className = "demoSelect";
    for (const t of ALL_PLANET_TYPE_IDS) {
      const name = PLANET_TYPES.find((p) => p.id === t)?.name ?? t;
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = name.toUpperCase();
      opt.selected = t === this.currentType;
      typeSelect.append(opt);
    }
    typeSelect.onchange = () => {
      this.currentType = typeSelect.value;
      this.rebuildPlanet();
    };
    panel.append(typeSelect);

    panel.append(this.createLabel("SEED:"));
    const seedRow = document.createElement("div");
    seedRow.className = "demoRow";
    const seedInput = document.createElement("input");
    seedInput.className = "demoInput";
    seedInput.type = "number";
    seedInput.value = String(this.currentSeed);
    seedInput.onchange = () => {
      this.currentSeed = Number(seedInput.value);
      this.rebuildPlanet();
    };
    const randBtn = document.createElement("button");
    randBtn.className = "demoBtn";
    randBtn.textContent = "RAND";
    randBtn.onclick = () => {
      this.currentSeed = Math.floor(Math.random() * 999999999);
      seedInput.value = String(this.currentSeed);
      this.rebuildPlanet();
    };
    seedRow.append(seedInput, randBtn);
    panel.append(seedRow);

    panel.append(this.createLabel("PIXELS:"));
    const pixelRow = document.createElement("div");
    pixelRow.className = "demoRow";
    const pixelValue = document.createElement("span");
    pixelValue.className = "demoValue";
    pixelValue.textContent = String(this.currentPixels);
    const pixelSlider = document.createElement("input");
    pixelSlider.type = "range";
    pixelSlider.className = "demoSlider";
    pixelSlider.min = "20";
    pixelSlider.max = "300";
    pixelSlider.value = String(this.currentPixels);
    pixelSlider.oninput = () => {
      this.currentPixels = Number(pixelSlider.value);
      pixelValue.textContent = String(this.currentPixels);
      this.updatePixels();
    };
    pixelRow.append(pixelSlider, pixelValue);
    panel.append(pixelRow);

    panel.append(this.createLabel("ROTATION:"));
    const rotRow = document.createElement("div");
    rotRow.className = "demoRow";
    const rotSlider = document.createElement("input");
    rotSlider.type = "range";
    rotSlider.className = "demoSlider";
    rotSlider.min = "-314";
    rotSlider.max = "314";
    rotSlider.value = String(Math.round(this.currentRotation * 100));
    rotSlider.oninput = () => {
      this.currentRotation = Number(rotSlider.value) / 100;
      this.updateRotation();
    };
    rotRow.append(rotSlider);
    panel.append(rotRow);

    panel.append(document.createElement("hr"));

    const exportRow = document.createElement("div");
    exportRow.className = "demoRow";
    const pngBtn = document.createElement("button");
    pngBtn.className = "demoBtn";
    pngBtn.textContent = "EXPORT PNG";
    pngBtn.onclick = () => this.exportPng();
    exportRow.append(pngBtn);
    panel.append(exportRow);

    panel.append(document.createElement("hr"));

    const backBtn = document.createElement("button");
    backBtn.className = "demoBtn demoBackBtn";
    backBtn.textContent = "← BACK TO MENU";
    backBtn.onclick = () => this.onBack();
    panel.append(backBtn);

    return panel;
  }

  private createLabel(text: string): HTMLElement {
    const el = document.createElement("div");
    el.className = "demoLabel";
    el.textContent = text;
    return el;
  }

  private rebuildPlanet(): void {
    this.runtime?.destroy();
    this.runtime = null;

    const frustum = this.frustumForType(this.currentType);
    const opts: PlanetCreateOptions = {
      variationSeed: this.currentSeed,
      frustumScale: frustum,
      pixels: this.currentPixels,
      rotation: this.currentRotation,
    };

    this.runtime = createThreePlanetRuntime(this.currentType, PREVIEW_SIZE, opts);
    this.startTime = performance.now();
  }

  private updatePixels(): void {
    if (!this.runtime) return;
    for (const mat of this.runtime.materials) {
      if (mat.uniforms.pixels) {
        mat.uniforms.pixels.value = this.currentPixels;
      }
    }
  }

  private updateRotation(): void {
    if (!this.runtime) return;
    for (const mat of this.runtime.materials) {
      if (mat.uniforms.rotation) {
        mat.uniforms.rotation.value = this.currentRotation;
      }
    }
  }

  private frustumForType(typeId: string): number {
    switch (typeId) {
      case "gasgiantring": return 1.1;
      case "star": return 1.3;
      case "asteroid": return 0.8;
      default: return 0.55;
    }
  }

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);
    if (!this.runtime) return;

    const elapsed = (performance.now() - this.startTime) * 0.001;
    this.runtime.update(elapsed);

    this.previewCtx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    this.previewCtx.drawImage(this.runtime.image, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
  };

  private exportPng(): void {
    if (!this.runtime) return;
    const link = document.createElement("a");
    link.download = `planet_${this.currentType}_${this.currentSeed}.png`;
    link.href = this.previewCanvas.toDataURL("image/png");
    link.click();
  }

  public destroy(): void {
    cancelAnimationFrame(this.animFrameId);
    this.runtime?.destroy();
    this.runtime = null;
  }
}
