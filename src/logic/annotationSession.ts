import type { BoundingBox } from "./bboxService.js";

export class AnnotationSession {
  private history: BoundingBox[][] = [];
  private currentBoxes: BoundingBox[] = [];
  private zoomLevel = 1.0;
  private currentImageIndex = 0;

  constructor(
    private images: { id: string; filename: string }[],
    initialBoxes: BoundingBox[] = [],
  ) {
    this.currentBoxes = initialBoxes;
  }

  public getZoomLevel(): number {
    return this.zoomLevel;
  }

  public applyZoomIn(): void {
    if (this.zoomLevel < 3.0) {
      this.zoomLevel += 0.25;
    }
  }

  public applyZoomOut(): void {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel -= 0.25;
    }
  }

  public getCurrentImageView() {
    return this.images[this.currentImageIndex];
  }

  public nextImage(): void {
    if (this.currentImageIndex < this.images.length - 1) {
      this.currentImageIndex++;
    }
  }

  public prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }
}
