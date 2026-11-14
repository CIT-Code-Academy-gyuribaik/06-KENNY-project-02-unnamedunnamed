import { Bullet } from '@entities/Bullet';
import { Vector2 } from '@utils/Vector2';
import { BallShot } from './BombProjectiles';
import {
  BOMB_DROP_FLIGHT_TIME,
  GRENADE_RADIUS_X,
  GRENADE_RADIUS_Y,
  GRENADE_FLAT_X,
  GRENADE_COLOR,
  GRENADE_FUSE_TIME,
  GRENADE_BALL_COUNT,
  GRENADE_BALL_SPEED,
  GRENADE_BALL_COLOR,
  GRENADE_AIM_LINE_LENGTH,
} from '@utils/Constants';

/**
 * 수류탄: 보스가 떨어뜨림 → 착지 → 신관 시간 동안 구슬이 날아갈 방향을 선으로 예고 → 고속 구슬 5발 발사
 * 모양: 얇은 쪽 양 끝이 평평하게 잘린 타원. 본체 자체는 피해 없음
 */
export class Grenade {
  public active: boolean = true;
  private readonly start: Vector2;
  private readonly target: Vector2;
  private position: Vector2;
  private time: number = 0;
  private rotation: number = 0;
  private readonly spin: number;
  private readonly ballAngles: number[];

  constructor(startX: number, startY: number, targetX: number, targetY: number) {
    this.start = new Vector2(startX, startY);
    this.target = new Vector2(targetX, targetY);
    this.position = this.start.clone();
    this.spin = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 6);
    // 구슬 방향은 미리 무작위로 정해 둠 (예고선과 실제 발사 방향이 같도록)
    this.ballAngles = Array.from({ length: GRENADE_BALL_COUNT }, () => Math.random() * Math.PI * 2);
  }

  private isLanded(): boolean {
    return this.time >= BOMB_DROP_FLIGHT_TIME;
  }

  // 폭발하면 생성된 탄을 반환
  update(deltaTime: number): Bullet[] {
    this.time += deltaTime;

    if (!this.isLanded()) {
      // 투하 중: 감속하며 착지 지점으로 이동, 회전
      const t = this.time / BOMB_DROP_FLIGHT_TIME;
      const eased = 1 - (1 - t) * (1 - t);
      this.position = this.start.add(this.target.subtract(this.start).multiply(eased));
      this.rotation += this.spin * deltaTime;
      return [];
    }

    this.position = this.target.clone();

    if (this.time >= BOMB_DROP_FLIGHT_TIME + GRENADE_FUSE_TIME) {
      this.active = false;
      return this.ballAngles.map(
        (angle) =>
          new BallShot(
            this.position.x,
            this.position.y,
            Math.cos(angle) * GRENADE_BALL_SPEED,
            Math.sin(angle) * GRENADE_BALL_SPEED
          )
      );
    }
    return [];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 착지 후: 구슬이 날아갈 방향 예고선 (폭발에 가까울수록 진해짐)
    if (this.isLanded()) {
      const fuseProgress = (this.time - BOMB_DROP_FLIGHT_TIME) / GRENADE_FUSE_TIME;
      ctx.strokeStyle = GRENADE_BALL_COLOR;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25 + 0.55 * fuseProgress;
      for (const angle of this.ballAngles) {
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(
          this.position.x + Math.cos(angle) * GRENADE_AIM_LINE_LENGTH,
          this.position.y + Math.sin(angle) * GRENADE_AIM_LINE_LENGTH
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // 본체: 양 끝이 잘린 타원
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.beginPath();
    ctx.rect(-GRENADE_FLAT_X, -GRENADE_RADIUS_Y, GRENADE_FLAT_X * 2, GRENADE_RADIUS_Y * 2);
    ctx.clip();
    ctx.fillStyle = GRENADE_COLOR;
    ctx.beginPath();
    ctx.ellipse(0, 0, GRENADE_RADIUS_X, GRENADE_RADIUS_Y, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
