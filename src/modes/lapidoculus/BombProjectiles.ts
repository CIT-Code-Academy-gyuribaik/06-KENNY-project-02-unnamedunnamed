import { Bullet } from '@entities/Bullet';
import {
  GRENADE_BALL_SIZE,
  GRENADE_BALL_COLOR,
  TIMED_BOMB_SHARD_SIZE,
  TIMED_BOMB_SHARD_HITBOX,
  TIMED_BOMB_BLINK_COLOR,
} from '@utils/Constants';

// 수류탄 폭발 시 나오는 고속 구슬
export class BallShot extends Bullet {
  constructor(x: number, y: number, velocityX: number, velocityY: number) {
    super(x, y, velocityX, velocityY);
    this.width = GRENADE_BALL_SIZE;
    this.height = GRENADE_BALL_SIZE;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = GRENADE_BALL_COLOR;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 시한폭탄 폭발 시 나오는 삼각형 (진행 방향을 가리킴)
export class TriangleShot extends Bullet {
  constructor(x: number, y: number, velocityX: number, velocityY: number) {
    super(x, y, velocityX, velocityY);
    this.width = TIMED_BOMB_SHARD_HITBOX;
    this.height = TIMED_BOMB_SHARD_HITBOX;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const s = TIMED_BOMB_SHARD_SIZE;
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(Math.atan2(this.velocity.y, this.velocity.x));
    ctx.fillStyle = TIMED_BOMB_BLINK_COLOR;
    ctx.beginPath();
    ctx.moveTo(s * 0.6, 0); // 앞쪽 꼭짓점
    ctx.lineTo(-s * 0.4, -s * 0.45);
    ctx.lineTo(-s * 0.4, s * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
