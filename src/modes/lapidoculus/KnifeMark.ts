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
  KNIFE_MARK_REFLECT_WINDOW,
} from '@utils/Constants';

export type KnifeMarkShape = 'parallelogram' | 'diamond';

type LocalPoint = [number, number]; // (길이축 좌표, 두께축 좌표)

// 잘린 조각이 이보다 짧으면 버림 (px)
const MIN_PIECE_LENGTH = 3;

/**
 * 칼자국: 무작위 위치/각도에 생기는 매우 얇은 사각형(평행사변형 또는 마름모)
 * 1) 예고(희미하게 표시, 피해 없음) → 2) 영구히 남음(선명, 피해 있음)
 * → 3) remove() 호출 시 사라짐(피해 없음)
 * 슬러그에 닿은 부분만 잘려 나갈 수 있음: 원래 모양을 길이축 [clipMin, clipMax] 범위로 잘라 둔 조각으로 표현
 */
export class KnifeMark {
  public active: boolean = true;
  private time: number = 0;
  private isRemoving: boolean = false;
  private fadeTime: number = 0;
  private readonly center: Vector2;
  private readonly u: Vector2; // 길이 방향 단위 벡터
  private readonly v: Vector2; // 두께 방향 단위 벡터
  private readonly halfThickness: number;
  private readonly fullLocal: LocalPoint[]; // 잘리기 전 원래 모양 (로컬 좌표)
  private readonly clipMin: number;
  private readonly clipMax: number;
  private readonly points: Vector2[];
  // 조각을 만들 때 원래 모양 정보를 그대로 넘기기 위해 보관
  private readonly shapeArgs: { centerX: number; centerY: number; angle: number; length: number; thickness: number; shape: KnifeMarkShape };

  constructor(
    centerX: number,
    centerY: number,
    angle: number,
    length: number,
    thickness: number,
    shape: KnifeMarkShape,
    clipMin: number = -Infinity,
    clipMax: number = Infinity
  ) {
    this.u = new Vector2(Math.cos(angle), Math.sin(angle));
    this.v = new Vector2(-Math.sin(angle), Math.cos(angle));
    this.center = new Vector2(centerX, centerY);
    this.halfThickness = thickness / 2;
    const halfL = length / 2;
    const halfT = thickness / 2;

    // 로컬 좌표 (길이축, 두께축) 기준 꼭짓점
    if (shape === 'diamond') {
      // 양 끝이 뾰족한 마름모
      this.fullLocal = [
        [halfL, 0],
        [0, halfT],
        [-halfL, 0],
        [0, -halfT],
      ];
    } else {
      // 양 끝이 비스듬히 잘린 평행사변형
      const shear = thickness * 1.5;
      this.fullLocal = [
        [-halfL + shear, -halfT],
        [halfL + shear, -halfT],
        [halfL - shear, halfT],
        [-halfL - shear, halfT],
      ];
    }

    const localExtent = this.getLocalExtent();
    this.clipMin = Math.max(clipMin, localExtent[0]);
    this.clipMax = Math.min(clipMax, localExtent[1]);
    this.points = KnifeMark.clipLocal(this.fullLocal, this.clipMin, this.clipMax).map(([a, b]) =>
      this.center.add(this.u.multiply(a)).add(this.v.multiply(b))
    );

    this.shapeArgs = { centerX, centerY, angle, length, thickness, shape };
  }

  // 원래 모양의 길이축 범위
  private getLocalExtent(): [number, number] {
    const as = this.fullLocal.map(([a]) => a);
    return [Math.min(...as), Math.max(...as)];
  }

  // 볼록 다각형(로컬 좌표)을 길이축 min ≤ a ≤ max 범위로 자름 (Sutherland–Hodgman)
  private static clipLocal(polygon: LocalPoint[], min: number, max: number): LocalPoint[] {
    const clip = (pts: LocalPoint[], inside: (p: LocalPoint) => boolean, bound: number): LocalPoint[] => {
      const out: LocalPoint[] = [];
      for (let i = 0; i < pts.length; i++) {
        const cur = pts[i];
        const prev = pts[(i + pts.length - 1) % pts.length];
        const curIn = inside(cur);
        const prevIn = inside(prev);
        if (curIn !== prevIn) {
          const t = (bound - prev[0]) / (cur[0] - prev[0]);
          out.push([bound, prev[1] + (cur[1] - prev[1]) * t]);
        }
        if (curIn) {
          out.push(cur);
        }
      }
      return out;
    };
    let result = polygon;
    if (isFinite(min)) result = clip(result, (p) => p[0] >= min, min);
    if (isFinite(max)) result = clip(result, (p) => p[0] <= max, max);
    return result;
  }

  /**
   * 볼록 다각형(월드 좌표)이 이 칼자국의 중심선을 덮는 길이축 구간 [시작, 끝] (없으면 null)
   * margin: 다각형을 이만큼 넓혀서 판정 (칼자국 두께 등)
   */
  getCoveredInterval(polygon: Vector2[], margin: number): [number, number] | null {
    // 다각형 중심 (변의 바깥쪽 법선 방향을 정하는 데 사용)
    const centroid = polygon.reduce((s, p) => s.add(p), new Vector2(0, 0)).multiply(1 / polygon.length);
    let lo = this.clipMin;
    let hi = this.clipMax;
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      let n = new Vector2(-(p2.y - p1.y), p2.x - p1.x).normalize();
      if (n.x === 0 && n.y === 0) continue;
      if ((centroid.x - p1.x) * n.x + (centroid.y - p1.y) * n.y > 0) {
        n = n.multiply(-1); // 바깥쪽을 향하도록
      }
      // 중심선 위의 점 C + u·s 가 n·(점 - p1) ≤ margin 을 만족하는 s 범위
      const base = (this.center.x - p1.x) * n.x + (this.center.y - p1.y) * n.y - margin;
      const slope = this.u.x * n.x + this.u.y * n.y;
      if (Math.abs(slope) < 1e-9) {
        if (base > 0) return null; // 평행하고 바깥쪽
        continue;
      }
      const s = -base / slope;
      if (slope > 0) hi = Math.min(hi, s);
      else lo = Math.max(lo, s);
      if (lo >= hi) return null;
    }
    return [lo, hi];
  }

  /**
   * 주어진 구간들(길이축)을 지운 조각들을 반환. 지워진 부분은 사라지는(fade) 조각으로 함께 반환
   * 이 칼자국 자체는 반환 목록으로 대체되어야 함
   */
  splitByErasing(intervals: [number, number][]): KnifeMark[] {
    // 겹치는 구간 합치기
    const sorted = intervals
      .map(([a, b]): [number, number] => [Math.max(a, this.clipMin), Math.min(b, this.clipMax)])
      .filter(([a, b]) => b > a)
      .sort((x, y) => x[0] - y[0]);
    const merged: [number, number][] = [];
    for (const iv of sorted) {
      const last = merged[merged.length - 1];
      if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]);
      else merged.push([iv[0], iv[1]]);
    }
    if (merged.length === 0) {
      return [this];
    }

    const pieces: KnifeMark[] = [];
    let cursor = this.clipMin;
    for (const [a, b] of merged) {
      if (a - cursor >= MIN_PIECE_LENGTH) pieces.push(this.makePiece(cursor, a, false)); // 남는 부분
      pieces.push(this.makePiece(a, b, true)); // 지워지는 부분 (서서히 사라짐)
      cursor = b;
    }
    if (this.clipMax - cursor >= MIN_PIECE_LENGTH) pieces.push(this.makePiece(cursor, this.clipMax, false));
    return pieces;
  }

  private makePiece(min: number, max: number, erased: boolean): KnifeMark {
    const { centerX, centerY, angle, length, thickness, shape } = this.shapeArgs;
    const piece = new KnifeMark(centerX, centerY, angle, length, thickness, shape, min, max);
    piece.time = this.time; // 예고/생성 시점 유지
    if (erased) piece.remove();
    return piece;
  }

  getHalfThickness(): number {
    return this.halfThickness;
  }

  getCenter(): Vector2 {
    return this.center;
  }

  getAxis(): Vector2 {
    return this.u;
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

  // 막 그어진 칼자국 (예고가 끝나 선명해진 뒤 KNIFE_MARK_REFLECT_WINDOW 이내): 일부 총알을 튕겨냄
  isFresh(): boolean {
    return this.isDangerous() && this.time < KNIFE_MARK_WARNING_TIME + KNIFE_MARK_REFLECT_WINDOW;
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
