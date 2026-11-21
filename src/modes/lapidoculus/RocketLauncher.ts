import { Bullet } from '@entities/Bullet';
import { Vector2 } from '@utils/Vector2';
import { Explosion } from './BombProjectiles';
import {
  GUN_FADE_IN_TIME,
  GUN_FADE_OUT_TIME,
  LANDMINE_ARMED_COLOR,
  ROCKET_LAUNCHER_BODY_LENGTH,
  ROCKET_LAUNCHER_TUBE_WIDTH,
  ROCKET_LAUNCHER_GAP,
  ROCKET_LAUNCHER_COLOR,
  ROCKET_LAUNCHER_LINE_WIDTH,
  ROCKET_LAUNCHER_AIM_TIME,
  ROCKET_TIP_LENGTH,
  ROCKET_COLOR,
  ROCKET_HITBOX,
  ROCKET_SPEED,
  ROCKET_TURN_SPEED,
  ROCKET_FUSE_TIME,
  ROCKET_WARN_TIME,
  ROCKET_EXPLOSION_RADIUS,
} from '@utils/Constants';

// 로켓 모양(뾰족한 삼각형)을 원점에 오른쪽을 향하게 그림 — 밑변 중앙이 원점
function drawRocketTip(ctx: CanvasRenderingContext2D): void {
  const w = ROCKET_LAUNCHER_TUBE_WIDTH / 2;
  ctx.beginPath();
  ctx.moveTo(0, -w);
  ctx.lineTo(ROCKET_TIP_LENGTH, 0);
  ctx.lineTo(0, w);
  ctx.closePath();
  ctx.fill();
}

/**
 * 로켓: 느리게 플레이어를 따라가다 ROCKET_FUSE_TIME 뒤 폭발 (지뢰의 2배 범위)
 * 로켓 본체는 플레이어에게 닿아도 아무 일 없음. 폭발만 피해. 지뢰 연쇄 폭발은 일으키지 않음
 * 화면 밖으로 나가도 사라지지 않음 (계속 따라옴)
 */
export class Rocket extends Bullet {
  private time: number = 0;
  private readonly getTarget: () => Vector2;

  constructor(x: number, y: number, angle: number, getTarget: () => Vector2) {
    super(x, y, Math.cos(angle) * ROCKET_SPEED, Math.sin(angle) * ROCKET_SPEED);
    this.getTarget = getTarget;
    this.width = ROCKET_HITBOX;
    this.height = ROCKET_HITBOX;
    this.touchesPlayer = false;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    if (this.time >= ROCKET_FUSE_TIME) {
      this.active = false;
      this.spawned.push(new Explosion(this.position.x, this.position.y, ROCKET_EXPLOSION_RADIUS));
      return;
    }

    // 플레이어 쪽으로 최대 ROCKET_TURN_SPEED 만큼 회전
    const target = this.getTarget();
    const current = Math.atan2(this.velocity.y, this.velocity.x);
    const desired = Math.atan2(target.y - this.position.y, target.x - this.position.x);
    const diff = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
    const maxStep = ROCKET_TURN_SPEED * deltaTime;
    const angle = current + Math.max(-maxStep, Math.min(maxStep, diff));
    this.velocity = new Vector2(Math.cos(angle) * ROCKET_SPEED, Math.sin(angle) * ROCKET_SPEED);
    this.position = this.position.add(this.velocity.multiply(deltaTime));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const remaining = ROCKET_FUSE_TIME - this.time;

    // 폭발 직전: 폭발 범위를 희미하게 표시하고 점점 빠르게 깜빡임
    let isBlinkOn = false;
    if (remaining < ROCKET_WARN_TIME) {
      const progress = 1 - remaining / ROCKET_WARN_TIME;
      ctx.globalAlpha = 0.08 + 0.12 * progress;
      ctx.strokeStyle = LANDMINE_ARMED_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, ROCKET_EXPLOSION_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      const hz = 3 + 12 * progress;
      isBlinkOn = Math.floor(this.time * hz * 2) % 2 === 0;
    }

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(Math.atan2(this.velocity.y, this.velocity.x));
    ctx.fillStyle = isBlinkOn ? LANDMINE_ARMED_COLOR : ROCKET_COLOR;
    ctx.translate(-ROCKET_TIP_LENGTH / 2, 0);
    drawRocketTip(ctx);
    ctx.restore();
  }
}

/**
 * 로켓 발사기: 얇은 집 모양 오각형 2개가 나란히 있고, 그 사이에 얇은 선 1개
 * 오각형의 뾰족한 끝(지붕)이 로켓이며, 발사하면 떨어져 나감
 * 나타남 → 잠시 뒤 로켓 2발 동시 발사 → (지붕 없이) 사라짐. 본체는 피해 없음
 */
export class RocketLauncher {
  public active: boolean = true;
  private readonly position: Vector2;
  private readonly angle: number;
  private readonly getTarget: () => Vector2;
  private time: number = 0;
  private hasFired: boolean = false;

  constructor(x: number, y: number, angle: number, getTarget: () => Vector2) {
    this.position = new Vector2(x, y);
    this.angle = angle;
    this.getTarget = getTarget;
  }

  private get fireTime(): number {
    return GUN_FADE_IN_TIME + ROCKET_LAUNCHER_AIM_TIME;
  }

  // 각 오각형의 중심선 위치 (발사기 진행 방향에 수직으로 ±)
  private static readonly TUBE_OFFSETS = [-1, 1].map((s) => s * (ROCKET_LAUNCHER_GAP / 2 + ROCKET_LAUNCHER_TUBE_WIDTH / 2));
  // 사각형 부분 앞쪽 끝(지붕이 시작되는 곳)의 x (발사기 중심 기준, 오른쪽을 향할 때)
  private static readonly BODY_FRONT = (ROCKET_LAUNCHER_BODY_LENGTH - ROCKET_TIP_LENGTH) / 2;

  // 발사한 로켓을 반환
  update(deltaTime: number): Bullet[] {
    this.time += deltaTime;
    const rockets: Bullet[] = [];

    if (!this.hasFired && this.time >= this.fireTime) {
      this.hasFired = true;
      const forward = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
      const side = new Vector2(-forward.y, forward.x);
      for (const offset of RocketLauncher.TUBE_OFFSETS) {
        // 지붕(로켓) 중심 위치에서 발사
        const start = this.position.add(forward.multiply(RocketLauncher.BODY_FRONT + ROCKET_TIP_LENGTH / 2)).add(side.multiply(offset));
        rockets.push(new Rocket(start.x, start.y, this.angle, this.getTarget));
      }
    }

    if (this.time >= this.fireTime + GUN_FADE_OUT_TIME) {
      this.active = false;
    }
    return rockets;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    let alpha = 1;
    if (this.time < GUN_FADE_IN_TIME) {
      alpha = this.time / GUN_FADE_IN_TIME;
    } else if (this.time > this.fireTime) {
      alpha = Math.max(0, 1 - (this.time - this.fireTime) / GUN_FADE_OUT_TIME);
    }

    const back = RocketLauncher.BODY_FRONT - ROCKET_LAUNCHER_BODY_LENGTH;
    const front = RocketLauncher.BODY_FRONT;
    const w = ROCKET_LAUNCHER_TUBE_WIDTH;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);

    for (const offset of RocketLauncher.TUBE_OFFSETS) {
      // 오각형의 사각형 부분 (평행한 두 변 쪽)
      ctx.fillStyle = ROCKET_LAUNCHER_COLOR;
      ctx.fillRect(back, offset - w / 2, ROCKET_LAUNCHER_BODY_LENGTH, w);
      // 지붕 부분 = 로켓 (발사 전까지만)
      if (!this.hasFired) {
        ctx.save();
        ctx.translate(front, offset);
        ctx.fillStyle = ROCKET_COLOR;
        drawRocketTip(ctx);
        ctx.restore();
      }
    }

    // 두 오각형 사이의 얇은 선
    ctx.strokeStyle = ROCKET_LAUNCHER_COLOR;
    ctx.lineWidth = ROCKET_LAUNCHER_LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(back, 0);
    ctx.lineTo(front, 0);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
