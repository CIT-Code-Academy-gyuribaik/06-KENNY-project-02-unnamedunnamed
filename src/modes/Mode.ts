export abstract class Mode {
  protected isCleared: boolean = false;
  protected isGameOver: boolean = false;

  abstract update(deltaTime: number, isGamePaused: boolean): void;
  abstract draw(ctx: CanvasRenderingContext2D): void;
  abstract handleInput(inputX: number, inputY: number, dashPressed: boolean, stiffenPressed: boolean): void;

  getIsCleared(): boolean {
    return this.isCleared;
  }

  getIsGameOver(): boolean {
    return this.isGameOver;
  }

  reset(): void {
    this.isCleared = false;
    this.isGameOver = false;
  }
}
