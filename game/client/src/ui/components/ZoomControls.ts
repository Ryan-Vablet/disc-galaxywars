import type { Camera } from "@/camera/Camera";

/**
 * ZoomControls provides UI controls for camera zoom.
 *
 * Features:
 * - Zoom in/out buttons (+/-)
 * - Zoom slider
 * - Fit-all button (⊞ icon)
 * - Syncs with camera state (mousewheel/pinch zoom)
 * - Positioned in bottom-right corner
 */
export class ZoomControls {
  private container: HTMLDivElement;
  private zoomInButton: HTMLButtonElement;
  private zoomOutButton: HTMLButtonElement;
  private fitButton: HTMLButtonElement;
  private slider: HTMLInputElement;
  private lastKnownZoom = 1;

  public constructor(
    private readonly camera: Camera,
    private readonly parentElement: HTMLElement,
    private readonly onFitAll: () => void,
  ) {
    // Create container
    this.container = document.createElement("div");
    this.container.className = "zoomControls";

    // Create zoom buttons
    this.zoomInButton = document.createElement("button");
    this.zoomInButton.className = "zoomButton";
    this.zoomInButton.textContent = "+";
    this.zoomInButton.title = "Zoom In";
    this.zoomInButton.onclick = () => this.zoomIn();

    this.zoomOutButton = document.createElement("button");
    this.zoomOutButton.className = "zoomButton";
    this.zoomOutButton.textContent = "−";
    this.zoomOutButton.title = "Zoom Out";
    this.zoomOutButton.onclick = () => this.zoomOut();

    // Create fit-all button
    this.fitButton = document.createElement("button");
    this.fitButton.className = "zoomButton fitButton";
    this.fitButton.textContent = "⊞";
    this.fitButton.title = "Fit All (Home/F)";
    this.fitButton.onclick = () => this.onFitAll();

    // Create slider
    this.slider = document.createElement("input");
    this.slider.type = "range";
    this.slider.className = "zoomSlider";
    this.slider.min = "0";
    this.slider.max = "100";
    this.slider.step = "1";
    this.slider.title = "Zoom Level";

    // Slider event: update camera zoom
    this.slider.addEventListener("input", () => {
      const zoomPercent = parseFloat(this.slider.value);
      const zoom = this.zoomFromPercent(zoomPercent);
      this.camera.setZoom(zoom);
    });

    // Assemble UI
    this.container.append(
      this.zoomInButton,
      this.slider,
      this.zoomOutButton,
      this.fitButton,
    );

    // Add to parent (typically the canvas container)
    this.parentElement.appendChild(this.container);
    this.sync();
  }

  /**
   * Zoom in by 20%.
   */
  private zoomIn(): void {
    this.camera.zoomAt(
      this.camera.getViewport().width / 2,
      this.camera.getViewport().height / 2,
      0.2,
    );
  }

  /**
   * Zoom out by 20%.
   */
  private zoomOut(): void {
    this.camera.zoomAt(
      this.camera.getViewport().width / 2,
      this.camera.getViewport().height / 2,
      -0.2,
    );
  }

  /**
   * Convert zoom level to slider percentage (0-100).
   */
  private percentFromZoom(zoom: number): number {
    const min = this.camera.getMinZoom();
    const max = this.camera.getMaxZoom();
    const percent = ((zoom - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, percent));
  }

  /**
   * Convert slider percentage to zoom level.
   */
  private zoomFromPercent(percent: number): number {
    const min = this.camera.getMinZoom();
    const max = this.camera.getMaxZoom();
    return min + (percent / 100) * (max - min);
  }

  /**
   * Sync slider with current camera zoom.
   * Called in update loop and when external zoom changes occur.
   */
  public sync(): void {
    const currentZoom = this.camera.getZoom();
    if (currentZoom !== this.lastKnownZoom) {
      this.lastKnownZoom = currentZoom;
      this.slider.value = String(this.percentFromZoom(currentZoom));
    }
  }

  /**
   * Clean up DOM and event listeners.
   */
  public destroy(): void {
    this.container.remove();
  }
}
