import { Bullet } from '@entities/Bullet';
import { Vector2 } from '@utils/Vector2';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  GUN_FADE_IN_TIME,
  GUN_FADE_OUT_TIME,
  GUN_AIM_LINE_COLOR,
  GUN_AIM_LINE_WIDTH,
} from '@utils/Constants';

/**
 * 총 공통 (Rifle 모드): 나타남 → 탄 경로를 얇은 선으로 예고 → 같은 방향으로 연속 발사 → 사라짐
 * 방향은 0/90/180/270° 중 하나. 본체 자체는 피해 없음
 * 하위 클래스는 모양(drawBody), 탄(createShot), 발사 수/간격/속도, 예고 시간만 정함
 */
export abstract class Gun {
  public active: boolean = true;
  protected readonly position: Vector2; // 총 중심
  protected readonly angle: number;
  protected readonly direction: Vector2;
  private time: number = 0;
  private shotsFired: number = 0;

  constructor(x: number, y: number, angle: number) {
    this.position = new Vector2(x, y);
    this.angle = angle;
    // 0/90/180/270° 이므로 cos/sin 을 정수로 반올림해 오차 제거
    this.direction = new Vector2(Math.round(Math.cos(angle)), Math.round(Math.sin(angle)));
  }

  // 총 중심에서 총구까지 거리
  protected abstract get muzzleOffset(): number;
  protected abstract get aimTime(): number;
  protected abstract get shotCount(): number;
  protected abstract get shotInterval(): number;
  protected abstract get shotSpeed(): number;
  protected abstract createShot(x: number, y: number, velocityX: number, velocityY: number): Bullet;
  // 오른쪽(0°)을 향한 모양을 원점 기준으로 그림 (회전/투명도는 Gun 이 처리)
  protected abstract drawBody(ctx: CanvasRenderingContext2D): void;

  private getMuzzle(): Vector2 {
    return this.position.add(this.direction.multiply(this.muzzleOffset));
  }

  private get fireStart(): number {
    return GUN_FADE_IN_TIME + this.aimTime;
  }

  private get fireEnd(): number {
    return this.fireStart + (this.shotCount - 1) * this.shotInterval;
  }

  // 총구에서 진행 방향으로 화면 끝까지의 거리
  private static lineLengthToEdge(muzzle: Vector2, direction: Vector2): number {
    if (direction.x > 0) return SCREEN_WIDTH - muzzle.x;
    if (direction.x < 0) return muzzle.x;
    if (direction.y > 0) return SCREEN_HEIGHT - muzzle.y;
    return muzzle.y;
  }

  // 발사한 탄을 반환
  update(deltaTime: number): Bullet[] {
    this.time += deltaTime;

    const shots: Bullet[] = [];
    while (this.shotsFired < this.shotCount && this.time >= this.fireStart + this.shotsFired * this.shotInterval) {
      const muzzle = this.getMuzzle();
      const v = this.direction.multiply(this.shotSpeed);
      shots.push(this.createShot(muzzle.x, muzzle.y, v.x, v.y));
      this.shotsFired++;
    }

    if (this.time >= this.fireEnd + GUN_FADE_OUT_TIME) {
      this.active = false;
    }
    return shots;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    let alpha = 1;
    if (this.time < GUN_FADE_IN_TIME) {
      alpha = this.time / GUN_FADE_IN_TIME;
    } else if (this.time > this.fireEnd) {
      alpha = Math.max(0, 1 - (this.time - this.fireEnd) / GUN_FADE_OUT_TIME);
    }

    // 탄 경로 예고선: 나타날 때부터 마지막 발사까지 표시 (발사가 가까울수록 진해짐)
    if (this.time <= this.fireEnd) {
      const muzzle = this.getMuzzle();
      const end = muzzle.add(this.direction.multiply(Gun.lineLengthToEdge(muzzle, this.direction)));
      ctx.globalAlpha = 0.15 + 0.45 * Math.min(1, this.time / this.fireStart);
      ctx.strokeStyle = GUN_AIM_LINE_COLOR;
      ctx.lineWidth = GUN_AIM_LINE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(muzzle.x, muzzle.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // 본체: 오른쪽을 향한 모양을 회전. 왼쪽을 향할 때는 위아래를 뒤집어 손잡이 등이 항상 아래쪽에 오도록 함
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);
    if (this.direction.x < 0) {
      ctx.scale(1, -1);
    }
    this.drawBody(ctx);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
