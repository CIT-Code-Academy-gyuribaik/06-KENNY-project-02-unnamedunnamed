import { Vector2 } from '@utils/Vector2';
import {
  SNIPER_DOT_RADIUS,
  SNIPER_DOT_COLOR,
  SNIPER_LOCK_COLOR,
  SNIPER_FADE_IN_TIME,
  SNIPER_FOLLOW_RATE,
  SNIPER_FIRE_TIME_MIN,
  SNIPER_FIRE_TIME_MAX,
  SNIPER_LOCK_TIME,
  SNIPER_HIT_RADIUS,
  SNIPER_FLASH_TIME,
} from '@utils/Constants';

/**
 * 저격 (Rifle 모드 특수 패턴)
 * Rifle 모드 동안 작은 흰 점이 플레이어를 조금 뒤처져 따라다님
 * 모드마다 한 번, 무작위 시점에 점이 빨갛게 변하며 멈춤 → SNIPER_LOCK_TIME 뒤 화면 밖의 총이 그 지점을 쏨
 * 맞으면 즉사 (판정은 LapidoculusMode 에서 takeShot() 으로 처리)
 * 쏜 뒤에는 그 모드가 끝날 때까지 점이 사라짐. 다음 Rifle 모드에서 새 Sniper 가 만들어져 다시 나타남
 */
export class Sniper {
  private time: number = 0;
  private dot: Vector2;
  private readonly fireTime: number; // 빨갛게 멈추는 시점 (모드 시작 기준)
  private isLocked: boolean = false;
  private hasFired: boolean = false;
  private pendingShot: Vector2 | null = null;
  private flashTime: number = 0;
  private flashPosition: Vector2 = new Vector2(0, 0);

  constructor(start: Vector2) {
    this.dot = start.clone();
    this.fireTime = SNIPER_FIRE_TIME_MIN + Math.random() * (SNIPER_FIRE_TIME_MAX - SNIPER_FIRE_TIME_MIN);
  }

  update(deltaTime: number, target: Vector2): void {
    this.time += deltaTime;
    if (this.flashTime > 0) {
      this.flashTime -= deltaTime;
    }

    if (!this.hasFired && this.time >= this.fireTime) {
      this.isLocked = true;
    }

    if (this.isLocked) {
      // 멈춘 채로 대기 → 발사
      if (this.time >= this.fireTime + SNIPER_LOCK_TIME) {
        this.isLocked = false;
        this.hasFired = true;
        this.pendingShot = this.dot.clone();
        this.flashPosition = this.dot.clone();
        this.flashTime = SNIPER_FLASH_TIME;
      }
      return;
    }

    // 쏜 뒤에는 이번 모드 동안 점이 사라짐 (다음 Rifle 모드에서 새로 나타남)
    if (this.hasFired) {
      return;
    }

    // 플레이어를 부드럽게 따라감 (프레임 속도와 무관하게 같은 비율로 다가감)
    const t = 1 - Math.exp(-SNIPER_FOLLOW_RATE * deltaTime);
    this.dot = this.dot.add(target.subtract(this.dot).multiply(t));
  }

  // 이번 프레임에 발사했으면 저격 지점을 반환 (한 번만)
  takeShot(): Vector2 | null {
    const shot = this.pendingShot;
    this.pendingShot = null;
    return shot;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 발사 섬광: 빨간 원이 퍼지며 사라짐
    if (this.flashTime > 0) {
      const p = 1 - this.flashTime / SNIPER_FLASH_TIME;
      ctx.globalAlpha = 0.8 * (1 - p);
      ctx.strokeStyle = SNIPER_LOCK_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.flashPosition.x, this.flashPosition.y, SNIPER_HIT_RADIUS * (1 + p * 1.5), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (this.hasFired) {
      return; // 쏜 뒤에는 점이 사라짐 (섬광만 남음)
    }

    ctx.globalAlpha = Math.min(1, this.time / SNIPER_FADE_IN_TIME);
    ctx.fillStyle = this.isLocked ? SNIPER_LOCK_COLOR : SNIPER_DOT_COLOR;
    ctx.beginPath();
    ctx.arc(this.dot.x, this.dot.y, SNIPER_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
