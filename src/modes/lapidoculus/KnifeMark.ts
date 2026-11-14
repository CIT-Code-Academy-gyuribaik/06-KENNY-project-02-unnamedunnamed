import { Vector2 } from '@utils/Vector2';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  KNIFE_MARK_COLOR,
  KNIFE_MARK_LENGTH_MIN,
  KNIFE_MARK_LENGTH_MAX,
  KNIFE_MARK_THICKNESS_MIN,
  KNIFE_MARK_THICKNESS_MAX,
  KNIFE_MARK_WARNING_TIME,
  KNIFE_MARK_FADE_TIME,
  KNIFE_MARK_AIMED_RATIO,
  KNIFE_MARK_AIM_SPREAD,
  KNIFE_MARK_FOCUS_RATIO,
  KNIFE_MARK_FOCUS_SPREAD,
} from '@utils/Constants';

export type KnifeMarkShape = 'parallelogram' | 'diamond';

/**
 * 칼자국: 무작위 위치/각도에 생기는 매우 얇은 사각형(평행사변형 또는 마름모)
 * 1) 예고(희미하게 표시, 피해 없음) → 2) 영구히 남음(선명, 피해 있음)
 * → 3) remove() 호출 시 사라짐(피해 없음)
 */
export class KnifeMark {
  public active: boolean = true;
  private time: number = 0;
  private isRemoving: boolean = false;
  private fadeTime: number = 0;
  private readonly points: Vector2[];

  constructor(centerX: number, centerY: number, angle: number, length: number, thickness: number, shape: KnifeMarkShape) {
    // 길이 방향(u)과 두께 방향(v) 단위 벡터
    const u = new Vector2(Math.cos(angle), Math.sin(angle));
    const v = new Vector2(-Math.sin(angle), Math.cos(angle));
    const center = new Vector2(centerX, centerY);
    const halfL = length / 2;
    const halfT = thickness / 2;

    // 로컬 좌표 (길이축, 두께축) 기준 꼭짓점
    let local: [number, number][];
    if (shape === 'diamond') {
      // 양 끝이 뾰족한 마름모
      local = [
        [halfL, 0],
        [0, halfT],
        [-halfL, 0],
        [0, -halfT],
      ];
    } else {
      // 양 끝이 비스듬히 잘린 평행사변형
      const shear = thickness * 1.5;
      local = [
        [-halfL + shear, -halfT],
        [halfL + shear, -halfT],
        [halfL - shear, halfT],
        [-halfL - shear, halfT],
      ];
    }

    this.points = local.map(([a, b]) => center.add(u.multiply(a)).add(v.multiply(b)));
  }

  /**
   * 칼자국 생성 위치 분포
   * - 2/3: 플레이어 조준 (플레이어 근처에 생성)
   * - 1/3: 무작위 (주로 화면 중앙과 네 모서리 부근)
   */
  static createRandom(playerX: number, playerY: number): KnifeMark {
    let x: number;
    let y: number;

    if (Math.random() < KNIFE_MARK_AIMED_RATIO) {
      // 조준: 플레이어 위치 주변
      x = playerX + KnifeMark.gaussian() * KNIFE_MARK_AIM_SPREAD;
      y = playerY + KnifeMark.gaussian() * KNIFE_MARK_AIM_SPREAD;
    } else if (Math.random() < KNIFE_MARK_FOCUS_RATIO) {
      // 무작위: 중앙 또는 모서리 중 하나를 골라 그 주변
      const inset = 60;
      const focusPoints: [number, number][] = [
        [SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2],
        [inset, inset],
        [SCREEN_WIDTH - inset, inset],
        [inset, SCREEN_HEIGHT - inset],
        [SCREEN_WIDTH - inset, SCREEN_HEIGHT - inset],
      ];
      const [fx, fy] = focusPoints[Math.floor(Math.random() * focusPoints.length)];
      x = fx + KnifeMark.gaussian() * KNIFE_MARK_FOCUS_SPREAD;
      y = fy + KnifeMark.gaussian() * KNIFE_MARK_FOCUS_SPREAD;
    } else {
      // 가끔은 화면 아무 곳에나
      x = Math.random() * SCREEN_WIDTH;
      y = Math.random() * SCREEN_HEIGHT;
    }

    // 화면 밖으로 너무 벗어나지 않도록 보정
    const margin = 20;
    x = Math.max(margin, Math.min(SCREEN_WIDTH - margin, x));
    y = Math.max(margin, Math.min(SCREEN_HEIGHT - margin, y));

    const angle = Math.random() * Math.PI;
    const length = KNIFE_MARK_LENGTH_MIN + Math.random() * (KNIFE_MARK_LENGTH_MAX - KNIFE_MARK_LENGTH_MIN);
    const thickness = KNIFE_MARK_THICKNESS_MIN + Math.random() * (KNIFE_MARK_THICKNESS_MAX - KNIFE_MARK_THICKNESS_MIN);
    const shape: KnifeMarkShape = Math.random() < 0.5 ? 'parallelogram' : 'diamond';
    return new KnifeMark(x, y, angle, length, thickness, shape);
  }

  // 표준 정규분포 난수 (Box-Muller): 중심 근처에 몰리고 멀어질수록 드묾
  private static gaussian(): number {
    const u = 1 - Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    if (this.isRemoving) {
      this.fadeTime += deltaTime;
      if (this.fadeTime >= KNIFE_MARK_FADE_TIME) {
        this.active = false;
      }
    }
  }

  // 사라지기 시작 (이후 피해 없음)
  remove(): void {
    this.isRemoving = true;
  }

  getIsRemoving(): boolean {
    return this.isRemoving;
  }

  // 예고가 끝난 뒤부터 제거되기 전까지 계속 피해를 줌
  isDangerous(): boolean {
    return !this.isRemoving && this.time >= KNIFE_MARK_WARNING_TIME;
  }

  getPoints(): Vector2[] {
    return this.points;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    let alpha: number;
    if (this.isRemoving) {
      // 사라짐
      alpha = Math.max(0, 1 - this.fadeTime / KNIFE_MARK_FADE_TIME) * 0.6;
    } else if (this.time < KNIFE_MARK_WARNING_TIME) {
      // 예고: 희미하게 깜빡임
      alpha = 0.15 + 0.1 * Math.sin(this.time * 30);
    } else {
      alpha = 1;
    }

    ctx.globalAlpha = alpha;
    ctx.fillStyle = KNIFE_MARK_COLOR;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
