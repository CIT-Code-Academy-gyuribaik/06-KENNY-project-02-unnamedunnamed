import { Bullet } from '@entities/Bullet';
import { Gun } from './Gun';
import {
  RIFLE_GUN_FRONT_LENGTH,
  RIFLE_GUN_REAR_LENGTH,
  RIFLE_GUN_FRONT_HALF_WIDTH,
  RIFLE_GUN_REAR_HALF_WIDTH,
  RIFLE_GUN_LINE_WIDTH,
  RIFLE_GUN_COLOR,
  RIFLE_GUN_AIM_TIME,
  RIFLE_GUN_SHOT_COUNT_MIN,
  RIFLE_GUN_SHOT_COUNT_MAX,
  RIFLE_GUN_SHOT_INTERVAL,
  RIFLE_GUN_SHOT_SPEED,
  RIFLE_GUN_SHOT_LENGTH,
  RIFLE_GUN_SHOT_HALF_WIDTH,
  RIFLE_GUN_SHOT_HITBOX,
  RIFLE_GUN_SHOT_COLOR,
} from '@utils/Constants';

// 소총 탄: 뾰족한 예각 삼각형 (진행 방향을 가리킴). 매우 빠름. 1 피해
export class RifleShot extends Bullet {
  constructor(x: number, y: number, velocityX: number, velocityY: number) {
    super(x, y, velocityX, velocityY);
    this.width = RIFLE_GUN_SHOT_HITBOX;
    this.height = RIFLE_GUN_SHOT_HITBOX;
    this.reflectsOffKnifeMarks = true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const l = RIFLE_GUN_SHOT_LENGTH;
    const w = RIFLE_GUN_SHOT_HALF_WIDTH;
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(Math.atan2(this.velocity.y, this.velocity.x));
    ctx.fillStyle = RIFLE_GUN_SHOT_COLOR;
    ctx.beginPath();
    ctx.moveTo(l / 2, 0); // 뾰족한 앞 꼭짓점
    ctx.lineTo(-l / 2, -w);
    ctx.lineTo(-l / 2, w);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/**
 * 소총: 선 4개로 된 긴 모양. 뾰족한 삼각형 탄 4~6발을 한 줄로 매우 빠르게 발사
 * - 양옆의 긴 선 2개: 가운데(교차점)에서 꺾이며 서로 교차. 교차점 앞쪽(총구 쪽)이 뒤쪽보다 김
 * - 나머지 선 2개: 뒤쪽(개머리 쪽)에 가로로 걸침
 */
export class RifleGun extends Gun {
  private readonly count: number =
    RIFLE_GUN_SHOT_COUNT_MIN + Math.floor(Math.random() * (RIFLE_GUN_SHOT_COUNT_MAX - RIFLE_GUN_SHOT_COUNT_MIN + 1));

  // 교차점이 총 중심이 되도록 하지 않고, 전체 길이의 가운데를 중심으로 둠
  private static readonly CENTER_SHIFT = (RIFLE_GUN_FRONT_LENGTH - RIFLE_GUN_REAR_LENGTH) / 2;

  protected get muzzleOffset(): number {
    return (RIFLE_GUN_FRONT_LENGTH + RIFLE_GUN_REAR_LENGTH) / 2;
  }
  protected get aimTime(): number {
    return RIFLE_GUN_AIM_TIME;
  }
  protected get shotCount(): number {
    return this.count;
  }
  protected get shotInterval(): number {
    return RIFLE_GUN_SHOT_INTERVAL;
  }
  protected get shotSpeed(): number {
    return RIFLE_GUN_SHOT_SPEED;
  }

  protected createShot(x: number, y: number, velocityX: number, velocityY: number): Bullet {
    return new RifleShot(x, y, velocityX, velocityY);
  }

  protected drawBody(ctx: CanvasRenderingContext2D): void {
    const cx = -RifleGun.CENTER_SHIFT; // 교차점 x (총 중심 기준)
    const front = cx + RIFLE_GUN_FRONT_LENGTH; // 총구 끝 x
    const rear = cx - RIFLE_GUN_REAR_LENGTH; // 개머리 끝 x
    const fw = RIFLE_GUN_FRONT_HALF_WIDTH;
    const rw = RIFLE_GUN_REAR_HALF_WIDTH;

    ctx.strokeStyle = RIFLE_GUN_COLOR;
    ctx.lineWidth = RIFLE_GUN_LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.beginPath();

    // 양옆의 긴 선 2개: 한쪽 끝에서 교차점을 지나 반대쪽으로 넘어감 (교차점에서 기울기가 바뀌며 꺾임)
    ctx.moveTo(rear, -rw);
    ctx.lineTo(cx, 0);
    ctx.lineTo(front, fw);
    ctx.moveTo(rear, rw);
    ctx.lineTo(cx, 0);
    ctx.lineTo(front, -fw);

    // 뒤쪽(개머리 쪽)에 가로로 걸친 선 2개 — 그 위치에서의 두 긴 선 사이 폭에 맞춤
    for (const t of [0.4, 0.8]) {
      const x = cx - RIFLE_GUN_REAR_LENGTH * t;
      const halfWidth = rw * t;
      ctx.moveTo(x, -halfWidth);
      ctx.lineTo(x, halfWidth);
    }

    ctx.stroke();
  }
}
