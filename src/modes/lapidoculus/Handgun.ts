import { Bullet } from '@entities/Bullet';
import { Gun } from './Gun';
import {
  TORPEDO_LENGTH,
  TORPEDO_THICKNESS,
  TORPEDO_HITBOX,
  HANDGUN_BARREL_LENGTH,
  HANDGUN_BARREL_THICKNESS,
  HANDGUN_GRIP_LENGTH,
  HANDGUN_GRIP_THICKNESS,
  HANDGUN_COLOR,
  HANDGUN_AIM_TIME,
  HANDGUN_SHOT_COUNT,
  HANDGUN_SHOT_INTERVAL,
  HANDGUN_SHOT_SPEED,
  HANDGUN_SHOT_COLOR,
} from '@utils/Constants';

// 권총 탄: 어뢰 크기, 수류탄 구슬 속도. 1 피해
export class HandgunShot extends Bullet {
  constructor(x: number, y: number, velocityX: number, velocityY: number) {
    super(x, y, velocityX, velocityY);
    this.width = TORPEDO_HITBOX;
    this.height = TORPEDO_HITBOX;
    this.reflectsOffKnifeMarks = true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(Math.atan2(this.velocity.y, this.velocity.x));
    ctx.fillStyle = HANDGUN_SHOT_COLOR;
    ctx.fillRect(-TORPEDO_LENGTH / 2, -TORPEDO_THICKNESS / 2, TORPEDO_LENGTH, TORPEDO_THICKNESS);
    ctx.restore();
  }
}

/**
 * 권총: 두 사각형(총신 + 손잡이)이 직각으로 붙은 ㄱ자 모양. 2발을 짧은 간격으로 발사
 */
export class Handgun extends Gun {
  protected get muzzleOffset(): number {
    return HANDGUN_BARREL_LENGTH / 2;
  }
  protected get aimTime(): number {
    return HANDGUN_AIM_TIME;
  }
  protected get shotCount(): number {
    return HANDGUN_SHOT_COUNT;
  }
  protected get shotInterval(): number {
    return HANDGUN_SHOT_INTERVAL;
  }
  protected get shotSpeed(): number {
    return HANDGUN_SHOT_SPEED;
  }

  protected createShot(x: number, y: number, velocityX: number, velocityY: number): Bullet {
    return new HandgunShot(x, y, velocityX, velocityY);
  }

  protected drawBody(ctx: CanvasRenderingContext2D): void {
    const bl = HANDGUN_BARREL_LENGTH;
    const bt = HANDGUN_BARREL_THICKNESS;
    ctx.fillStyle = HANDGUN_COLOR;
    ctx.fillRect(-bl / 2, -bt / 2, bl, bt); // 총신
    ctx.fillRect(-bl / 2, bt / 2, HANDGUN_GRIP_THICKNESS, HANDGUN_GRIP_LENGTH); // 손잡이 (총신 뒤쪽 끝 아래)
  }
}
