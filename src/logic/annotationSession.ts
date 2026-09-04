export class AnnotationSession {
  private readonly imageIds: string[];
  private currentIndex = 0;
  private zoomLevel = 1;

  constructor(imageIds: string[]) {
    if (imageIds.length === 0) {
      throw new Error(
        "NO_IMAGES_AVAILABLE",
      );
    }

    this.imageIds = [...imageIds];
  }

  get currentImageId(): string {
    return this.imageIds[
      this.currentIndex
    ];
  }

  get zoom(): number {
    return this.zoomLevel;
  }

  zoomIn(): number {
    this.zoomLevel *= 1.25;
    return this.zoomLevel;
  }

  zoomOut(): number {
    this.zoomLevel = Math.max(
      1,
      this.zoomLevel / 1.25,
    );

    return this.zoomLevel;
  }

  next(): {
    imageId: string;
    atEnd: boolean;
  } {
    if (
      this.currentIndex >=
      this.imageIds.length - 1
    ) {
      return {
        imageId: this.currentImageId,
        atEnd: true,
      };
    }

    this.currentIndex++;

    return {
      imageId: this.currentImageId,
      atEnd: false,
    };
  }

  previous(): string {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }

    return this.currentImageId;
  }
}
