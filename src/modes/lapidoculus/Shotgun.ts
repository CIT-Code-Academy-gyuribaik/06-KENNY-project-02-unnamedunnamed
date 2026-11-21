import { Bullet } from '@entities/Bullet';
import { GameObject } from '@entities/GameObject';
import { Collider } from '@entities/Collider';
import { Vector2 } from '@utils/Vector2';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  GUN_AIM_LINE_COLOR,
  GUN_AIM_LINE_WIDTH,
  SHOTGUN_LENGTH,
  SHOTGUN_THICKNESS,
  SHOTGUN_COLOR,
  SHOTGUN_EXTEND_TIME,
  SHOTGUN_TRACK_TIME,
  SHOTGUN_LOCK_TIME,
  SHOTGUN_RETRACT_TIME,
  SLUG_SPEED,
  SLUG_RADIUS,
  SLUG_COLOR,
  SLUG_GAP,
  SLUG_TRAIL_LENGTH,
  SLUG_TRAIL_WIDEN_RATE,
  SLUG_LINE_THICKNESS,
  PELLET_COUNT,
  PELLET_SPREAD,
  PELLET_SPEED_MIN,
  PELLET_SPEED_MAX,
  PELLET_SIZE,
  PELLET_COLOR,
} from '@utils/Constants';

type Segment = [Vector2, Vector2];

// 두께가 있는 선분을 꼭짓점 4개짜리 사각형으로 (충돌 판정용)
const segmentToQuad = ([a, b]: Segment, thickness: number): Vector2[] => Collider.segmentToQuad(a, b, thickness);

// 점들을 감싸는 볼록 다각형 (Andrew's monotone chain)
function convexHull(points: Vector2[]): Vector2[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length < 3) return pts;
  const cross = (o: Vector2, a: Vector2, b: Vector2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Vector2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Vector2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/**
 * 슬러그: =====(탄)> 모양
 * 꼬리선 2개의 앞끝이 > 와 이어져 탄을 감싸는 선이 됨 (탄과는 살짝 떨어져 있음)
 * 꼬리선 2개는 멀리 갈수록 서로 벌어짐. 탄 / 꼬리선 / > 모두 닿으면 피해
 * 칼자국에 닿으면 > / 꼬리선이 닿은 부분만 지움 → 대부분의 칼자국이 둘로 갈라짐
 */
export class Slug extends Bullet {
  private traveled: number = 0;
  // 지난 프레임의 > 위치 (이번 프레임까지 > 가 쓸고 지나간 영역 계산용. 빠르므로 프레임 사이를 메워야 함)
  private prevPolylines: Vector2[][];

  constructor(x: number, y: number, angle: number) {
    super(x, y, Math.cos(angle) * SLUG_SPEED, Math.sin(angle) * SLUG_SPEED);
    this.width = SLUG_RADIUS * 2;
    this.height = SLUG_RADIUS * 2;
    this.prevPolylines = this.getPolylines();
  }

  update(deltaTime: number): void {
    this.prevPolylines = this.getPolylines();
    this.position = this.position.add(this.velocity.multiply(deltaTime));
    this.traveled += SLUG_SPEED * deltaTime;

    // 꼬리선까지 화면 밖으로 다 나가면 제거
    const margin = SLUG_TRAIL_LENGTH + 120; // 꼬리선이 벌어져도 다 나갈 만큼
    if (
      this.position.x < -margin ||
      this.position.x > SCREEN_WIDTH + margin ||
      this.position.y < -margin ||
      this.position.y > SCREEN_HEIGHT + margin
    ) {
      this.active = false;
    }
  }

  // 양쪽 꺾인 선 2개: 뒤쪽 끝 → (꼬리선) → 탄 옆 → (> 의 팔) → 앞쪽 꼭짓점
  // 반환: [위쪽 선의 점 3개, 아래쪽 선의 점 3개] (두 선은 앞쪽 꼭짓점에서 만남)
  private getPolylines(): Vector2[][] {
    const forward = this.velocity.normalize();
    const side = new Vector2(-forward.y, forward.x);
    const p = this.position;

    // > 의 팔은 45° 이므로 탄 중심에서 팔까지 거리 = 반간격 / √2. 이 거리가 (탄 반지름 + 간격) 이상이 되도록 시작 반간격을 정함
    const startHalfGap = (SLUG_RADIUS + SLUG_GAP) * Math.SQRT2;
    const halfGap = startHalfGap + this.traveled * SLUG_TRAIL_WIDEN_RATE;

    const tip = p.add(forward.multiply(halfGap)); // 앞쪽 꼭짓점 (45° 팔이 탄 옆의 꼬리선 앞끝과 만나도록)
    return [1, -1].map((s) => {
      const front = p.add(side.multiply(halfGap * s)); // 꼬리선 앞끝 = 탄 바로 옆
      const back = front.subtract(forward.multiply(SLUG_TRAIL_LENGTH)); // 꼬리선 뒤끝
      return [back, front, tip];
    });
  }

  // 충돌 판정용 선분 4개 (꼬리선 2개 + > 의 팔 2개)
  private getSegments(): Segment[] {
    return this.getPolylines().flatMap(([back, front, tip]) => [[back, front] as Segment, [front, tip] as Segment]);
  }

  /**
   * 칼자국을 지우는 영역 (볼록 다각형 목록)
   * - 지난 프레임 ~ 이번 프레임 사이에 > 가 쓸고 지나간 영역 (> 가 꼬리선 끝에서 끝까지 이어져 있으므로, 결국 두 꼬리선 사이 전체)
   * - 지금 꼬리선 2개
   * 선 두께만큼의 여유는 판정하는 쪽에서 더함
   */
  getEraseShapes(): Vector2[][] {
    const current = this.getPolylines();
    // [뒤끝, 앞끝(탄 옆), 꼭짓점] × 위/아래 → > 부분(앞끝 2개 + 꼭짓점)의 이전/현재 위치를 모두 감싸는 볼록 껍질
    const chevronPoints = [...this.prevPolylines, ...current].flatMap(([, front, tip]) => [front, tip]);
    const sweptChevron = convexHull(chevronPoints);
    const trails = current.map(([back, front]) => segmentToQuad([back, front], SLUG_LINE_THICKNESS));
    return [sweptChevron, ...trails];
  }

  hitTest(target: GameObject): boolean {
    if (Collider.checkCircle(this.position.x, this.position.y, SLUG_RADIUS, target)) {
      return true;
    }
    return this.getSegments().some((segment) => Collider.checkPolygonAABB(segmentToQuad(segment, SLUG_LINE_THICKNESS), target));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = SLUG_COLOR;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, SLUG_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = SLUG_COLOR;
    ctx.lineWidth = SLUG_LINE_THICKNESS;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (const [back, front, tip] of this.getPolylines()) {
      ctx.moveTo(back.x, back.y);
      ctx.lineTo(front.x, front.y);
      ctx.lineTo(tip.x, tip.y);
    }
    ctx.stroke();
  }
}

// 산탄 한 알
export class Pellet extends Bullet {
  constructor(x: number, y: number, velocityX: number, velocityY: number) {
    super(x, y, velocityX, velocityY);
    this.width = PELLET_SIZE;
    this.height = PELLET_SIZE;
    this.reflectsOffKnifeMarks = true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PELLET_COLOR;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, PELLET_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export enum ShotgunAmmo {
  Slug,
  Spread,
}

/**
 * 산탄총: 끝이 둥근 사각형. 보스 왼쪽 옆면 가운데에서 튀어나옴 (손 없이)
 * 튀어나옴 → 플레이어를 따라 조준 (예고선) → 조준 고정 → 슬러그 또는 산탄 9발 발사 → 들어감
 * 각도 제한 없이 플레이어를 직접 조준. 산탄이면 예고선 양옆에 퍼지는 범위도 희미하게 표시. 본체는 피해 없음
 */
export class Shotgun {
  public active: boolean = true;
  private time: number = 0;
  private hasFired: boolean = false;
  private aimAngle: number = Math.PI; // 처음엔 왼쪽
  private readonly ammo: ShotgunAmmo = Math.random() < 0.5 ? ShotgunAmmo.Slug : ShotgunAmmo.Spread;
  private readonly getMount: () => Vector2; // 보스 왼쪽 옆면 가운데
  private readonly getTarget: () => Vector2;

  constructor(getMount: () => Vector2, getTarget: () => Vector2) {
    this.getMount = getMount;
    this.getTarget = getTarget;
  }

  private get lockStart(): number {
    return SHOTGUN_EXTEND_TIME + SHOTGUN_TRACK_TIME;
  }

  private get fireTime(): number {
    return this.lockStart + SHOTGUN_LOCK_TIME;
  }

  // 0 = 들어가 있음, 1 = 다 튀어나옴
  private getExtension(): number {
    if (this.time < SHOTGUN_EXTEND_TIME) {
      return this.time / SHOTGUN_EXTEND_TIME;
    }
    if (this.time > this.fireTime) {
      return Math.max(0, 1 - (this.time - this.fireTime) / SHOTGUN_RETRACT_TIME);
    }
    return 1;
  }

  private getForward(): Vector2 {
    return new Vector2(Math.cos(this.aimAngle), Math.sin(this.aimAngle));
  }

  private getMuzzle(): Vector2 {
    return this.getMount().add(this.getForward().multiply(SHOTGUN_LENGTH * this.getExtension()));
  }

  // 발사한 탄을 반환
  update(deltaTime: number): Bullet[] {
    this.time += deltaTime;

    // 고정 전까지는 플레이어를 바로 조준
    if (this.time < this.lockStart) {
      const mount = this.getMount();
      const target = this.getTarget();
      this.aimAngle = Math.atan2(target.y - mount.y, target.x - mount.x);
    }

    const shots: Bullet[] = [];
    if (!this.hasFired && this.time >= this.fireTime) {
      this.hasFired = true;
      const muzzle = this.getMuzzle();
      if (this.ammo === ShotgunAmmo.Slug) {
        shots.push(new Slug(muzzle.x, muzzle.y, this.aimAngle));
      } else {
        for (let i = 0; i < PELLET_COUNT; i++) {
          // 부채꼴 안에 고르게 + 약간의 흔들림, 속도도 조금씩 달라 퍼져 보이게
          const t = i / Math.max(1, PELLET_COUNT - 1);
          const jitter = (Math.random() - 0.5) * (PELLET_SPREAD / PELLET_COUNT) * 0.6;
          const angle = this.aimAngle - PELLET_SPREAD / 2 + PELLET_SPREAD * t + jitter;
          const speed = PELLET_SPEED_MIN + Math.random() * (PELLET_SPEED_MAX - PELLET_SPEED_MIN);
          shots.push(new Pellet(muzzle.x, muzzle.y, Math.cos(angle) * speed, Math.sin(angle) * speed));
        }
      }
    }

    if (this.time >= this.fireTime + SHOTGUN_RETRACT_TIME) {
      this.active = false;
    }
    return shots;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const extension = this.getExtension();
    if (extension <= 0) {
      return;
    }

    // 조준 예고선 (튀어나온 뒤 ~ 발사 전). 고정되면 진해짐
    if (this.time >= SHOTGUN_EXTEND_TIME && this.time < this.fireTime) {
      const muzzle = this.getMuzzle();
      const isLocked = this.time >= this.lockStart;
      const length = Math.hypot(SCREEN_WIDTH, SCREEN_HEIGHT);
      const angles = this.ammo === ShotgunAmmo.Spread ? [0, -PELLET_SPREAD / 2, PELLET_SPREAD / 2] : [0];
      ctx.strokeStyle = GUN_AIM_LINE_COLOR;
      ctx.lineWidth = GUN_AIM_LINE_WIDTH;
      angles.forEach((offset, i) => {
        ctx.globalAlpha = (isLocked ? 0.6 : 0.25) * (i === 0 ? 1 : 0.4);
        ctx.beginPath();
        ctx.moveTo(muzzle.x, muzzle.y);
        ctx.lineTo(muzzle.x + Math.cos(this.aimAngle + offset) * length, muzzle.y + Math.sin(this.aimAngle + offset) * length);
        ctx.stroke();
      });
    }

    // 본체: 끝이 둥근 사각형. 보스 옆면에서 조준 방향으로 뻗음
    const mount = this.getMount();
    const length = SHOTGUN_LENGTH * extension;
    const r = SHOTGUN_THICKNESS / 2;
    ctx.save();
    ctx.globalAlpha = extension;
    ctx.translate(mount.x, mount.y);
    ctx.rotate(this.aimAngle);
    ctx.fillStyle = SHOTGUN_COLOR;
    ctx.beginPath();
    ctx.moveTo(r, -r);
    ctx.lineTo(Math.max(r, length - r), -r);
    ctx.arc(Math.max(r, length - r), 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(r, r);
    ctx.arc(r, 0, r, Math.PI / 2, (Math.PI * 3) / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
