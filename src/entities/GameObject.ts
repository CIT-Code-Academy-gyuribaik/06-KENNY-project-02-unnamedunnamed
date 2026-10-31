import { Vector2 } from '@utils/Vector2';

export abstract class GameObject {
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  active: boolean = true;

  constructor(x: number, y: number, width: number, height: number) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.width = width;
    this.height = height;
  }

  update(deltaTime: number): void {
    this.position = this.position.add(this.velocity.multiply(deltaTime));
  }

  abstract draw(ctx: CanvasRenderingContext2D): void;

  getLeft(): number {
    return this.position.x - this.width / 2;
  }

  getRight(): number {
    return this.position.x + this.width / 2;
  }

  getTop(): number {
    return this.position.y - this.height / 2;
  }

  getBottom(): number {
    return this.position.y + this.height / 2;
  }
}
