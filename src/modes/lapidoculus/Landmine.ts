import { GameObject } from '@entities/GameObject';
import { Bullet } from '@entities/Bullet';
import { Explosion } from './BombProjectiles';
import {
  LANDMINE_WIDTH,
  LANDMINE_HEIGHT,
  LANDMINE_GRID,
  LANDMINE_COLOR,
  LANDMINE_ARMED_COLOR,
  LANDMINE_FADE_IN_TIME,
  LANDMINE_FUSE_TIME,
  LANDMINE_LIFETIME,
  LANDMINE_FADE_OUT_TIME,
} from '@utils/Constants';

/**
 * 지뢰: 무작위 위치에 서서히 나타남 → 플레이어가 밟으면 1초 후 폭발 (폭발 범위만 피해)
 * 모양: 그물 모양 사각형. 본체 자체는 피해 없음
 * 아무도 밟지 않으면 LANDMINE_LIFETIME 후 서서히 사라짐
 */
export class Landmine extends GameObject {
  private time: number = 0;
  private isTriggered: boolean = false;
  private fuseTime: number = 0;

  constructor(x: number, y: number) {
    super(x, y, LANDMINE_WIDTH, LANDMINE_HEIGHT);
  }

  // 다 나타난 뒤에만 밟을 수 있음
  canTrigger(): boolean {
    return !this.isTriggered && this.time >= LANDMINE_FADE_IN_TIME && this.time < LANDMINE_LIFETIME;
  }

  trigger(): void {
    if (this.canTrigger()) {
      this.isTriggered = true;
      this.fuseTime = 0;
    }
  }

  // 연쇄 폭발: 다른 지뢰의 폭발 범위 안에 있으면 작동 (아직 나타나는 중이어도 작동, 사라지는 중이면 무시)
  triggerByExplosion(): void {
    if (!this.isTriggered && this.time < LANDMINE_LIFETIME) {
      this.isTriggered = true;
      this.fuseTime = 0;
    }
  }

  // 폭발하면 폭발 범위를 반환
  update(deltaTime: number): Bullet[] {
    this.time += deltaTime;

    if (this.isTriggered) {
      this.fuseTime += deltaTime;
      if (this.fuseTime >= LANDMINE_FUSE_TIME) {
        this.active = false;
        return [new Explosion(this.position.x, this.position.y)];
      }
    } else if (this.time >= LANDMINE_LIFETIME + LANDMINE_FADE_OUT_TIME) {
      this.active = false;
    }
    return [];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    let alpha = 1;
    if (this.time < LANDMINE_FADE_IN_TIME) {
      alpha = this.time / LANDMINE_FADE_IN_TIME;
    } else if (!this.isTriggered && this.time > LANDMINE_LIFETIME) {
      alpha = Math.max(0, 1 - (this.time - LANDMINE_LIFETIME) / LANDMINE_FADE_OUT_TIME);
    }

    // 밟힌 뒤에는 빠르게 깜빡임
    const isBlinkOn = this.isTriggered && Math.floor(this.fuseTime * 12) % 2 === 0;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = isBlinkOn ? LANDMINE_ARMED_COLOR : LANDMINE_COLOR;
    ctx.lineWidth = 1.5;

    const left = this.getLeft();
    const top = this.getTop();
    const cell = this.width / LANDMINE_GRID;

    // 테두리 + 그물
    ctx.strokeRect(left, top, this.width, this.height);
    ctx.beginPath();
    for (let x = cell; x < this.width - 0.5; x += cell) {
      ctx.moveTo(left + x, top);
      ctx.lineTo(left + x, top + this.height);
    }
    for (let y = cell; y < this.height - 0.5; y += cell) {
      ctx.moveTo(left, top + y);
      ctx.lineTo(left + this.width, top + y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
