export type AnnotationAction =
  | {
      type: "create";
      annotationId: string;
      undo: () => Promise<void>;
    }
  | {
      type: "update";
      undo: () => Promise<void>;
    }
  | {
      type: "delete";
      undo: () => Promise<void>;
    };

export class AnnotationHistory {
  private readonly stack: AnnotationAction[] = [];

  push(action: AnnotationAction): void {
    this.stack.push(action);
  }

  async undo(): Promise<boolean> {
    const action = this.stack.pop();

    if (!action) {
      return false;
    }

    await action.undo();

    return true;
  }

  get size(): number {
    return this.stack.length;
  }
}
