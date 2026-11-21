import { Bullet, BulletEffect } from '@entities/Bullet';
import { Vector2 } from '@utils/Vector2';
import {
  LANDMINE_EXPLOSION_RADIUS,
  LANDMINE_EXPLOSION_TIME,
  LANDMINE_ARMED_COLOR,
  TORPEDO_LENGTH,
  TORPEDO_THICKNESS,
  TORPEDO_HITBOX,
  TORPEDO_COLOR,
  TORPEDO_SPEED,
  TORPEDO_TURN_SPEED,
  TORPEDO_LIFETIME,
  GAS_BOMB_RADIUS,
  GAS_BOMB_COLOR,
  GAS_BOMB_SPEED,
  BIG_BOMB_SHOT_SIZE,
  BIG_BOMB_CHARGE_COLOR,
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

// 폭발 범위 (지뢰, 로켓): 움직이지 않고 잠깐 남아 있으며, 그동안 닿으면 피해
export class Explosion extends Bullet {
  private time: number = 0;
  private readonly radius: number;

  constructor(x: number, y: number, radius: number = LANDMINE_EXPLOSION_RADIUS) {
    super(x, y, 0, 0);
    this.radius = radius;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.consumeOnHit = false;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    if (this.time >= LANDMINE_EXPLOSION_TIME) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const t = this.time / LANDMINE_EXPLOSION_TIME;
    ctx.globalAlpha = 0.6 * (1 - t);
    ctx.fillStyle = LANDMINE_ARMED_COLOR;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius * (0.6 + 0.4 * t), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// 어뢰: 아주 작고, 플레이어 쪽으로 아주 살짝 휘어짐. 피해 없이 이동 속도 감소만
export class Torpedo extends Bullet {
  private time: number = 0;
  private readonly getTarget: () => Vector2;

  constructor(x: number, y: number, angle: number, getTarget: () => Vector2) {
    super(x, y, Math.cos(angle) * TORPEDO_SPEED, Math.sin(angle) * TORPEDO_SPEED);
    this.getTarget = getTarget;
    this.width = TORPEDO_HITBOX;
    this.height = TORPEDO_HITBOX;
    this.dealsDamage = false;
    this.effect = BulletEffect.Slow;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    if (this.time >= TORPEDO_LIFETIME) {
      this.active = false;
      return;
    }

    // 현재 진행 각도를 목표 방향으로 최대 TORPEDO_TURN_SPEED 만큼만 회전
    const target = this.getTarget();
    const current = Math.atan2(this.velocity.y, this.velocity.x);
    const desired = Math.atan2(target.y - this.position.y, target.x - this.position.x);
    const diff = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
    const maxStep = TORPEDO_TURN_SPEED * deltaTime;
    const angle = current + Math.max(-maxStep, Math.min(maxStep, diff));
    this.velocity = new Vector2(Math.cos(angle) * TORPEDO_SPEED, Math.sin(angle) * TORPEDO_SPEED);

    super.update(deltaTime);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const l = TORPEDO_LENGTH;
    const r = TORPEDO_THICKNESS / 2;
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(Math.atan2(this.velocity.y, this.velocity.x));
    ctx.fillStyle = TORPEDO_COLOR;
    ctx.beginPath();
    ctx.moveTo(-l / 2, -r);
    ctx.lineTo(l / 2 - r, -r);
    ctx.arc(l / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2); // 둥근 앞부분
    ctx.lineTo(-l / 2, r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// 가스탄: 원형. 보스에서 아래로 빠르게 떨어져 화면 밖으로 나감. 맞으면 1 피해 + 화면 흐려짐
export class GasBomb extends Bullet {
  constructor(x: number, y: number, angle: number) {
    super(x, y, Math.cos(angle) * GAS_BOMB_SPEED, Math.sin(angle) * GAS_BOMB_SPEED);
    this.width = GAS_BOMB_RADIUS * 2;
    this.height = GAS_BOMB_RADIUS * 2;
    this.effect = BulletEffect.Blur;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = GAS_BOMB_COLOR;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, GAS_BOMB_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 대형 폭탄 꼭짓점에서 나오는 탄
export class BigBombShot extends Bullet {
  constructor(x: number, y: number, velocityX: number, velocityY: number) {
    super(x, y, velocityX, velocityY);
    this.width = BIG_BOMB_SHOT_SIZE;
    this.height = BIG_BOMB_SHOT_SIZE;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = BIG_BOMB_CHARGE_COLOR;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
