import { Bullet } from '@entities/Bullet';
import { Vector2 } from '@utils/Vector2';
import {
  FLAMETHROWER_WIDTH,
  FLAMETHROWER_HEIGHT,
  FLAMETHROWER_STRIPES,
  FLAMETHROWER_OVAL_RADIUS_X,
  FLAMETHROWER_OVAL_RADIUS_Y,
  FLAMETHROWER_C_BULGE,
  FLAMETHROWER_LINE_WIDTH,
  FLAMETHROWER_COLOR,
  FLAMETHROWER_EXTEND_TIME,
  FLAMETHROWER_WARN_TIME,
  FLAMETHROWER_FIRE_TIME,
  FLAMETHROWER_RETRACT_TIME,
  FLAMETHROWER_SWEEP_START,
  FLAMETHROWER_SWEEP_END,
  FLAMETHROWER_EMIT_RATE,
  FLAMETHROWER_SPREAD,
  FLAME_SPEED,
  FLAME_LIFETIME,
  FLAME_SIZE_START,
  FLAME_SIZE_END,
} from '@utils/Constants';

// 불꽃 한 덩이: 날아가면서 커지고(퍼지고) 색이 노랑 → 주황 → 빨강으로 바뀌며 흐려짐
// 닿으면 1 피해. 맞아도 사라지지 않음 (불길이 끊기지 않도록)
export class Flame extends Bullet {
  private time: number = 0;

  constructor(x: number, y: number, velocityX: number, velocityY: number) {
    super(x, y, velocityX, velocityY);
    this.width = FLAME_SIZE_START;
    this.height = FLAME_SIZE_START;
    this.consumeOnHit = false;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    if (this.time >= FLAME_LIFETIME) {
      this.active = false;
      return;
    }
    const size = FLAME_SIZE_START + (FLAME_SIZE_END - FLAME_SIZE_START) * (this.time / FLAME_LIFETIME);
    this.width = size;
    this.height = size;
    super.update(deltaTime);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const t = this.time / FLAME_LIFETIME;
    // 노랑(255,214,10) → 주황(255,149,0) → 빨강(255,59,48)
    const g = t < 0.5 ? 214 - (214 - 149) * (t / 0.5) : 149 - (149 - 59) * ((t - 0.5) / 0.5);
    const b = t < 0.5 ? 10 - 10 * (t / 0.5) : 48 * ((t - 0.5) / 0.5);
    ctx.globalAlpha = 0.75 * (1 - t * t);
    ctx.fillStyle = `rgb(255, ${Math.round(g)}, ${Math.round(b)})`;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/**
 * 화염방사기: 보스 왼쪽 옆면 가운데에 붙어서 튀어나옴 (손 없이)
 * 튀어나옴 → 총구에서 불씨가 튀며 예고 → 아래쪽을 오른쪽에서 왼쪽으로 쓸며 불꽃 발사 → 들어감
 * 불꽃은 내려갈수록 퍼지므로 걸어서는 피하기 어렵고, 대시(무적)로 통과해야 함. 본체는 피해 없음
 */
export class Flamethrower {
  public active: boolean = true;
  private time: number = 0;
  private emitAccumulator: number = 0;
  private readonly getMount: () => Vector2; // 보스 왼쪽 옆면 가운데

  constructor(getMount: () => Vector2) {
    this.getMount = getMount;
  }

  private get fireStart(): number {
    return FLAMETHROWER_EXTEND_TIME + FLAMETHROWER_WARN_TIME;
  }

  private get fireEnd(): number {
    return this.fireStart + FLAMETHROWER_FIRE_TIME;
  }

  // 0 = 들어가 있음, 1 = 다 튀어나옴
  private getExtension(): number {
    if (this.time < FLAMETHROWER_EXTEND_TIME) {
      return this.time / FLAMETHROWER_EXTEND_TIME;
    }
    if (this.time > this.fireEnd) {
      return Math.max(0, 1 - (this.time - this.fireEnd) / FLAMETHROWER_RETRACT_TIME);
    }
    return 1;
  }

  // 사각형 중심 (C자의 볼록한 끝이 보스 옆면에 닿도록 왼쪽으로 띄움)
  private getBodyCenter(): Vector2 {
    const mount = this.getMount();
    const offset = (FLAMETHROWER_C_BULGE + FLAMETHROWER_WIDTH / 2) * this.getExtension();
    return new Vector2(mount.x - offset, mount.y);
  }

  // 총구: 사각형 왼쪽 끝 가운데
  private getNozzle(): Vector2 {
    const center = this.getBodyCenter();
    return new Vector2(center.x - FLAMETHROWER_WIDTH / 2, center.y);
  }

  // 발사한 불꽃을 반환
  update(deltaTime: number): Bullet[] {
    this.time += deltaTime;
    const flames: Bullet[] = [];

    if (this.time >= this.fireStart && this.time < this.fireEnd) {
      this.emitAccumulator += FLAMETHROWER_EMIT_RATE * deltaTime;
      const nozzle = this.getNozzle();
      const progress = (this.time - this.fireStart) / FLAMETHROWER_FIRE_TIME;
      const baseAngle = FLAMETHROWER_SWEEP_START + (FLAMETHROWER_SWEEP_END - FLAMETHROWER_SWEEP_START) * progress;
      while (this.emitAccumulator >= 1) {
        this.emitAccumulator -= 1;
        const angle = baseAngle + (Math.random() * 2 - 1) * FLAMETHROWER_SPREAD;
        flames.push(new Flame(nozzle.x, nozzle.y, Math.cos(angle) * FLAME_SPEED, Math.sin(angle) * FLAME_SPEED));
      }
    }

    if (this.time >= this.fireEnd + FLAMETHROWER_RETRACT_TIME) {
      this.active = false;
    }
    return flames;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const extension = this.getExtension();
    if (extension <= 0) {
      return;
    }
    const center = this.getBodyCenter();
    const w = FLAMETHROWER_WIDTH;
    const h = FLAMETHROWER_HEIGHT;
    const left = center.x - w / 2;
    const top = center.y - h / 2;
    const right = left + w;
    const bottom = top + h;

    ctx.globalAlpha = extension;
    ctx.strokeStyle = FLAMETHROWER_COLOR;
    ctx.lineWidth = FLAMETHROWER_LINE_WIDTH;

    // 사각형 (색 없음, 선만)
    ctx.strokeRect(left, top, w, h);

    // 안쪽 평행선 (긴 변 = 가로와 평행)
    ctx.beginPath();
    for (let i = 1; i <= FLAMETHROWER_STRIPES; i++) {
      const y = top + (h * i) / (FLAMETHROWER_STRIPES + 1);
      ctx.moveTo(left + 3, y);
      ctx.lineTo(right - 3, y);
    }
    ctx.stroke();

    // 위쪽 가운데 작은 타원
    ctx.beginPath();
    ctx.ellipse(center.x, top - FLAMETHROWER_OVAL_RADIUS_Y, FLAMETHROWER_OVAL_RADIUS_X, FLAMETHROWER_OVAL_RADIUS_Y, 0, 0, Math.PI * 2);
    ctx.stroke();

    // C자: 오른쪽 아래 모서리 → 오른쪽 변 가운데, 오른쪽(보스 쪽)으로 볼록
    ctx.beginPath();
    ctx.moveTo(right, bottom);
    ctx.bezierCurveTo(right + FLAMETHROWER_C_BULGE * 1.3, bottom, right + FLAMETHROWER_C_BULGE * 1.3, center.y, right, center.y);
    ctx.stroke();

    // 예고: 총구에서 작은 불씨가 튐
    if (this.time >= FLAMETHROWER_EXTEND_TIME && this.time < this.fireStart) {
      const nozzle = this.getNozzle();
      ctx.fillStyle = '#FFD60A';
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 6;
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        ctx.fillRect(nozzle.x - 2 + Math.cos(a) * r, nozzle.y + Math.sin(a) * r, 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }
}
