import type { Camera } from "@/camera/Camera";

export class RotationControls {
  private readonly container: HTMLDivElement;
  private readonly rotateLeftButton: HTMLButtonElement;
  private readonly rotateRightButton: HTMLButtonElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly slider: HTMLInputElement;
  private lastKnownRotation = 0;

  public constructor(
    private readonly camera: Camera,
    private readonly parentElement: HTMLElement,
    private readonly onResetView: () => void,
  ) {
    this.container = document.createElement("div");
    this.container.className = "rotationControls";

    this.rotateLeftButton = document.createElement("button");
    this.rotateLeftButton.className = "zoomButton";
    this.rotateLeftButton.textContent = "↶";
    this.rotateLeftButton.title = "Rotate Left (Q)";
    this.rotateLeftButton.onclick = () => this.camera.rotateBy(-15);

    this.slider = document.createElement("input");
    this.slider.type = "range";
    this.slider.className = "rotationSlider";
    this.slider.min = "-180";
    this.slider.max = "180";
    this.slider.step = "1";
    this.slider.title = "Camera Rotation";
    this.slider.addEventListener("input", () => {
      this.camera.setRotation(Number(this.slider.value));
    });

    this.rotateRightButton = document.createElement("button");
    this.rotateRightButton.className = "zoomButton";
    this.rotateRightButton.textContent = "↷";
    this.rotateRightButton.title = "Rotate Right (E)";
    this.rotateRightButton.onclick = () => this.camera.rotateBy(15);

    this.resetButton = document.createElement("button");
    this.resetButton.className = "zoomButton fitButton";
    this.resetButton.textContent = "↺";
    this.resetButton.title = "Reset View (Home/F)";
    this.resetButton.onclick = () => this.onResetView();

    this.container.append(
      this.rotateLeftButton,
      this.slider,
      this.rotateRightButton,
      this.resetButton,
    );
    this.parentElement.appendChild(this.container);
    this.sync();
  }

  public sync(): void {
    const currentRotation = this.camera.getState().rotation;
    if (currentRotation !== this.lastKnownRotation) {
      this.lastKnownRotation = currentRotation;
      this.slider.value = String(Math.round(currentRotation));
    }
  }

  public destroy(): void {
    this.container.remove();
  }
}
