import { Bullet } from '@entities/Bullet';
import { Vector2 } from '@utils/Vector2';
import { TriangleShot } from './BombProjectiles';
import {
  BOMB_DROP_FLIGHT_TIME,
  TIMED_BOMB_WIDTH,
  TIMED_BOMB_HEIGHT,
  TIMED_BOMB_NOTCH,
  TIMED_BOMB_COLOR,
  TIMED_BOMB_BLINK_COLOR,
  TIMED_BOMB_FUSE_MIN,
  TIMED_BOMB_FUSE_MAX,
  TIMED_BOMB_BLINK_START_HZ,
  TIMED_BOMB_BLINK_END_HZ,
  TIMED_BOMB_SHARD_SPEED,
} from '@utils/Constants';

/**
 * 시한폭탄: 보스가 떨어뜨림 → 착지 후 5~8초 동안 점점 빠르게 깜빡임 → 삼각형 2발 발사
 * 삼각형은 45° 대각선 위에서 서로 반대 방향으로 날아감
 * 모양: 테두리가 같은 크기의 사각형 돌기/홈이 번갈아 있는 사각형. 본체 자체는 피해 없음
 */
export class TimedBomb {
  public active: boolean = true;
  private readonly start: Vector2;
  private readonly target: Vector2;
  private position: Vector2;
  private time: number = 0;
  private readonly fuseTime: number;
  private blinkPhase: number = 0;

  constructor(startX: number, startY: number, targetX: number, targetY: number) {
    this.start = new Vector2(startX, startY);
    this.target = new Vector2(targetX, targetY);
    this.position = this.start.clone();
    this.fuseTime = TIMED_BOMB_FUSE_MIN + Math.random() * (TIMED_BOMB_FUSE_MAX - TIMED_BOMB_FUSE_MIN);
  }

  private isLanded(): boolean {
    return this.time >= BOMB_DROP_FLIGHT_TIME;
  }

  // 폭발하면 생성된 탄을 반환
  update(deltaTime: number): Bullet[] {
    this.time += deltaTime;

    if (!this.isLanded()) {
      const t = this.time / BOMB_DROP_FLIGHT_TIME;
      const eased = 1 - (1 - t) * (1 - t);
      this.position = this.start.add(this.target.subtract(this.start).multiply(eased));
      return [];
    }

    this.position = this.target.clone();

    // 폭발에 가까울수록 깜빡임이 빨라짐
    const progress = Math.min(1, (this.time - BOMB_DROP_FLIGHT_TIME) / this.fuseTime);
    const hz = TIMED_BOMB_BLINK_START_HZ + (TIMED_BOMB_BLINK_END_HZ - TIMED_BOMB_BLINK_START_HZ) * progress * progress;
    this.blinkPhase += hz * deltaTime;

    if (this.time >= BOMB_DROP_FLIGHT_TIME + this.fuseTime) {
      this.active = false;
      // 45° 대각선 2개 중 하나를 고르고, 그 선 위에서 서로 반대 방향으로 발사
      const base = Math.random() < 0.5 ? Math.PI / 4 : (Math.PI * 3) / 4;
      return [base, base + Math.PI].map(
        (angle) =>
          new TriangleShot(
            this.position.x,
            this.position.y,
            Math.cos(angle) * TIMED_BOMB_SHARD_SPEED,
            Math.sin(angle) * TIMED_BOMB_SHARD_SPEED
          )
      );
    }
    return [];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const isBlinkOn = this.isLanded() && this.blinkPhase % 1 < 0.5;
    ctx.fillStyle = isBlinkOn ? TIMED_BOMB_BLINK_COLOR : TIMED_BOMB_COLOR;

    const w = TIMED_BOMB_WIDTH;
    const h = TIMED_BOMB_HEIGHT;
    const n = TIMED_BOMB_NOTCH;
    const left = Math.round(this.position.x - w / 2);
    const top = Math.round(this.position.y - h / 2);

    // 본체
    ctx.fillRect(left, top, w, h);

    // 테두리 요철: 돌기-홈-돌기-홈... (같은 크기의 사각형)
    for (let i = 0; i < w / n; i += 2) {
      ctx.fillRect(left + i * n, top - n, n, n); // 위
      ctx.fillRect(left + w - (i + 1) * n, top + h, n, n); // 아래
    }
    for (let i = 0; i < h / n; i += 2) {
      ctx.fillRect(left + w, top + i * n, n, n); // 오른쪽
      ctx.fillRect(left - n, top + h - (i + 1) * n, n, n); // 왼쪽
    }
  }
}
