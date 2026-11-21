import { Bullet } from '@entities/Bullet';
import { Vector2 } from '@utils/Vector2';
import {
  GATLING_BODY_LENGTH,
  GATLING_BODY_WIDTH,
  GATLING_BARREL_COUNT,
  GATLING_BARREL_LENGTH,
  GATLING_COLOR,
  GATLING_LINE_WIDTH,
  GATLING_EXTEND_TIME,
  GATLING_FIRE_TIME,
  GATLING_RETRACT_TIME,
  GATLING_FIRE_RATE,
  GATLING_SWEEP_CENTER,
  GATLING_SWEEP_AMPLITUDE,
  GATLING_SWEEP_PERIOD,
  GATLING_SHOT_SPEED,
  GATLING_SHOT_SIZE,
  GATLING_SHOT_COLOR,
} from '@utils/Constants';

// 개틀링 탄: 작은 사각형. 1 피해
export class GatlingShot extends Bullet {
  constructor(x: number, y: number, velocityX: number, velocityY: number) {
    super(x, y, velocityX, velocityY);
    this.width = GATLING_SHOT_SIZE;
    this.height = GATLING_SHOT_SIZE;
    this.reflectsOffKnifeMarks = true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = GATLING_SHOT_COLOR;
    ctx.fillRect(this.getLeft(), this.getTop(), this.width, this.height);
  }
}

/**
 * 개틀링 (Rifle 모드 특수 패턴): 보스 오른쪽 옆면 가운데에 들고 연사
 * 꺼냄 → GATLING_FIRE_TIME 동안 총구가 아래쪽 부채꼴을 왔다 갔다 하며 연사 → 집어넣음
 * 보스 몸의 가로 이동은 Enemy 가 getSweepProgress() 를 보고 처리. 본체는 피해 없음
 * 모양: 사각형 + 총구 쪽 면에 붙은 총열 선 6개
 */
export class Gatling {
  public active: boolean = true;
  private time: number = 0;
  private fireAccumulator: number = 0;
  private barrelIndex: number = 0; // 총열을 돌아가며 발사
  private aimAngle: number = GATLING_SWEEP_CENTER;
  private readonly getMount: () => Vector2; // 보스 오른쪽 옆면 가운데
  private readonly sweepPhase: number; // 처음 흔들리는 방향 (보스 이동 방향과 맞춤)

  constructor(getMount: () => Vector2, startSweepingRight: boolean) {
    this.getMount = getMount;
    this.sweepPhase = startSweepingRight ? Math.PI : 0;
  }

  private get fireStart(): number {
    return GATLING_EXTEND_TIME;
  }

  private get fireEnd(): number {
    return GATLING_EXTEND_TIME + GATLING_FIRE_TIME;
  }

  // 연사 진행도 0~1 (연사 전 0, 연사 후 1). 보스 이동에 사용
  getSweepProgress(): number {
    return Math.min(1, Math.max(0, (this.time - this.fireStart) / GATLING_FIRE_TIME));
  }

  // 0 = 넣은 상태, 1 = 다 꺼낸 상태
  private getExtension(): number {
    if (this.time < GATLING_EXTEND_TIME) {
      return this.time / GATLING_EXTEND_TIME;
    }
    if (this.time > this.fireEnd) {
      return Math.max(0, 1 - (this.time - this.fireEnd) / GATLING_RETRACT_TIME);
    }
    return 1;
  }

  // 총열 선의 옆 방향 위치 (px, 사각형 폭 안에 고르게)
  private barrelOffset(index: number): number {
    const t = index / Math.max(1, GATLING_BARREL_COUNT - 1);
    return (t - 0.5) * (GATLING_BODY_WIDTH - 2);
  }

  // 발사한 탄을 반환
  update(deltaTime: number): Bullet[] {
    this.time += deltaTime;
    const shots: Bullet[] = [];

    if (this.time >= this.fireStart && this.time < this.fireEnd) {
      // 총구가 아래쪽 부채꼴을 왔다 갔다 함
      const t = this.time - this.fireStart;
      this.aimAngle = GATLING_SWEEP_CENTER + GATLING_SWEEP_AMPLITUDE * Math.sin((2 * Math.PI * t) / GATLING_SWEEP_PERIOD + this.sweepPhase);

      this.fireAccumulator += GATLING_FIRE_RATE * deltaTime;
      const forward = new Vector2(Math.cos(this.aimAngle), Math.sin(this.aimAngle));
      const side = new Vector2(-forward.y, forward.x);
      const mount = this.getMount();
      while (this.fireAccumulator >= 1) {
        this.fireAccumulator -= 1;
        const muzzle = mount
          .add(forward.multiply(GATLING_BODY_LENGTH + GATLING_BARREL_LENGTH))
          .add(side.multiply(this.barrelOffset(this.barrelIndex)));
        this.barrelIndex = (this.barrelIndex + 1) % GATLING_BARREL_COUNT;
        shots.push(new GatlingShot(muzzle.x, muzzle.y, forward.x * GATLING_SHOT_SPEED, forward.y * GATLING_SHOT_SPEED));
      }
    }

    if (this.time >= this.fireEnd + GATLING_RETRACT_TIME) {
      this.active = false;
    }
    return shots;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const extension = this.getExtension();
    if (extension <= 0) {
      return;
    }
    const mount = this.getMount();
    const bodyEnd = GATLING_BODY_LENGTH;
    const w = GATLING_BODY_WIDTH;

    ctx.save();
    ctx.globalAlpha = extension;
    ctx.translate(mount.x, mount.y);
    ctx.rotate(this.aimAngle);
    ctx.strokeStyle = GATLING_COLOR;
    ctx.lineWidth = GATLING_LINE_WIDTH;

    // 사각형 본체 (보스 옆면에 붙음)
    ctx.strokeRect(0, -w / 2, bodyEnd, w);

    // 총구 쪽 면에 붙은 총열 선 6개 (꺼내는 동안 길어짐)
    ctx.beginPath();
    for (let i = 0; i < GATLING_BARREL_COUNT; i++) {
      const y = this.barrelOffset(i);
      ctx.moveTo(bodyEnd, y);
      ctx.lineTo(bodyEnd + GATLING_BARREL_LENGTH * extension, y);
    }
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
