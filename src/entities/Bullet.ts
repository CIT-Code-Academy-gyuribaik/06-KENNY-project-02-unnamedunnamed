import { GameObject } from './GameObject';
import { Vector2 } from '@utils/Vector2';
import { SCREEN_WIDTH, SCREEN_HEIGHT, BULLET_SIZE } from '@utils/Constants';

export class Bullet extends GameObject {
  constructor(x: number, y: number, velocityX: number, velocityY: number) {
    super(x, y, BULLET_SIZE, BULLET_SIZE);
    this.velocity = new Vector2(velocityX, velocityY);
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    // 화면 범위 밖 체크
    if (
      this.position.x < -BULLET_SIZE ||
      this.position.x > SCREEN_WIDTH + BULLET_SIZE ||
      this.position.y < -BULLET_SIZE ||
      this.position.y > SCREEN_HEIGHT + BULLET_SIZE
    ) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(this.getLeft(), this.getTop(), this.width, this.height);

    // 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.getLeft(), this.getTop(), this.width, this.height);
  }
}
