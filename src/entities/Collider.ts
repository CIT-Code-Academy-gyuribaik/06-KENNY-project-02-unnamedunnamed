import { GameObject } from './GameObject';
import { Vector2 } from '@utils/Vector2';

export class Collider {
  static checkAABB(a: GameObject, b: GameObject): boolean {
    return (
      a.getLeft() < b.getRight() &&
      a.getRight() > b.getLeft() &&
      a.getTop() < b.getBottom() &&
      a.getBottom() > b.getTop()
    );
  }

  // 볼록 다각형(꼭짓점 배열)과 오브젝트의 AABB 충돌 (분리축 정리, SAT)
  static checkPolygonAABB(points: Vector2[], obj: GameObject): boolean {
    const box = [
      new Vector2(obj.getLeft(), obj.getTop()),
      new Vector2(obj.getRight(), obj.getTop()),
      new Vector2(obj.getRight(), obj.getBottom()),
      new Vector2(obj.getLeft(), obj.getBottom()),
    ];

    const axes: Vector2[] = [new Vector2(1, 0), new Vector2(0, 1)];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      axes.push(new Vector2(-(p2.y - p1.y), p2.x - p1.x)); // 변의 법선
    }

    const project = (pts: Vector2[], axis: Vector2): [number, number] => {
      let min = Infinity;
      let max = -Infinity;
      for (const p of pts) {
        const d = p.x * axis.x + p.y * axis.y;
        if (d < min) min = d;
        if (d > max) max = d;
      }
      return [min, max];
    };

    for (const axis of axes) {
      const [minA, maxA] = project(points, axis);
      const [minB, maxB] = project(box, axis);
      if (maxA <= minB || maxB <= minA) {
        return false; // 분리축 발견 → 충돌 없음
      }
    }
    return true;
  }

  // 두께가 있는 선분(a→b)을 꼭짓점 4개짜리 볼록 다각형으로
  static segmentToQuad(a: Vector2, b: Vector2, thickness: number): Vector2[] {
    let dir = b.subtract(a).normalize();
    if (dir.x === 0 && dir.y === 0) {
      dir = new Vector2(1, 0); // 길이 0이면 아무 방향
    }
    const n = new Vector2(-dir.y, dir.x).multiply(thickness / 2);
    return [a.add(n), b.add(n), b.subtract(n), a.subtract(n)];
  }

  static checkCircle(
    posX: number,
    posY: number,
    radius: number,
    obj: GameObject
  ): boolean {
    const dx = obj.position.x - posX;
    const dy = obj.position.y - posY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radius + Math.max(obj.width, obj.height) / 2;
  }
}
