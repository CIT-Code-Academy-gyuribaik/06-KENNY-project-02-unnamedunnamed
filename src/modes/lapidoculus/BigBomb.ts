import { Bullet } from '@entities/Bullet';
import { Vector2 } from '@utils/Vector2';
import { BigBombShot } from './BombProjectiles';
import {
  BIG_BOMB_RADIUS,
  BIG_BOMB_COLOR,
  BIG_BOMB_CHARGE_COLOR,
  BIG_BOMB_FADE_IN_TIME,
  BIG_BOMB_CHARGE_TIME,
  BIG_BOMB_SHOTS_PER_POINT,
  BIG_BOMB_SHOT_INTERVAL,
  BIG_BOMB_SHOT_SPEED,
  BIG_BOMB_FADE_OUT_TIME,
  BIG_BOMB_SPIN,
} from '@utils/Constants';

const POINT_COUNT = 5;

/**
 * 대형 폭탄: Bombs 모드가 끝날 때만 화면 중앙에 오각형으로 나타남
 * 나타남 → 예고(점점 주황색으로 채워짐) → 각 꼭짓점에서 바깥 방향으로 5발씩 연속 발사 → 사라짐
 * 천천히 회전하므로 발사 방향이 매번 다름. 본체 자체는 피해 없음
 */
export class BigBomb {
  public active: boolean = true;
  private readonly position: Vector2;
  private time: number = 0;
  private rotation: number = Math.random() * Math.PI * 2;
  private shotsFired: number = 0;

  constructor(x: number, y: number) {
    this.position = new Vector2(x, y);
  }

  // 발사한 탄을 반환
  update(deltaTime: number): Bullet[] {
    this.time += deltaTime;
    const fireStart = BIG_BOMB_FADE_IN_TIME + BIG_BOMB_CHARGE_TIME;
    const fireEnd = fireStart + BIG_BOMB_SHOTS_PER_POINT * BIG_BOMB_SHOT_INTERVAL;

    // 발사 중에는 회전을 멈춰서 5발이 한 줄로 나가도록 함
    if (this.time < fireStart || this.time >= fireEnd) {
      this.rotation += BIG_BOMB_SPIN * deltaTime;
    }

    const shots: Bullet[] = [];
    while (this.shotsFired < BIG_BOMB_SHOTS_PER_POINT && this.time >= fireStart + this.shotsFired * BIG_BOMB_SHOT_INTERVAL) {
      for (const angle of this.pointAngles()) {
        const x = this.position.x + Math.cos(angle) * BIG_BOMB_RADIUS;
        const y = this.position.y + Math.sin(angle) * BIG_BOMB_RADIUS;
        shots.push(new BigBombShot(x, y, Math.cos(angle) * BIG_BOMB_SHOT_SPEED, Math.sin(angle) * BIG_BOMB_SHOT_SPEED));
      }
      this.shotsFired++;
    }

    if (this.time >= fireEnd + BIG_BOMB_FADE_OUT_TIME) {
      this.active = false;
    }
    return shots;
  }

  private pointAngles(): number[] {
    return Array.from({ length: POINT_COUNT }, (_, i) => this.rotation + (i * Math.PI * 2) / POINT_COUNT);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const fireStart = BIG_BOMB_FADE_IN_TIME + BIG_BOMB_CHARGE_TIME;
    const fireEnd = fireStart + BIG_BOMB_SHOTS_PER_POINT * BIG_BOMB_SHOT_INTERVAL;

    let alpha = 1;
    if (this.time < BIG_BOMB_FADE_IN_TIME) {
      alpha = this.time / BIG_BOMB_FADE_IN_TIME;
    } else if (this.time > fireEnd) {
      alpha = Math.max(0, 1 - (this.time - fireEnd) / BIG_BOMB_FADE_OUT_TIME);
    }

    // 예고 중에는 점점 주황색으로 채워짐
    const charge = Math.min(1, Math.max(0, (this.time - BIG_BOMB_FADE_IN_TIME) / BIG_BOMB_CHARGE_TIME));

    ctx.beginPath();
    this.pointAngles().forEach((angle, i) => {
      const x = this.position.x + Math.cos(angle) * BIG_BOMB_RADIUS;
      const y = this.position.y + Math.sin(angle) * BIG_BOMB_RADIUS;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = BIG_BOMB_COLOR;
    ctx.fill();
    if (charge > 0) {
      ctx.globalAlpha = alpha * charge;
      ctx.fillStyle = BIG_BOMB_CHARGE_COLOR;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
