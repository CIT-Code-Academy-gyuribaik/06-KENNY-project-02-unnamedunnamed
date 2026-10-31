import { GameObject } from './GameObject';

export class Collider {
  static checkAABB(a: GameObject, b: GameObject): boolean {
    return (
      a.getLeft() < b.getRight() &&
      a.getRight() > b.getLeft() &&
      a.getTop() < b.getBottom() &&
      a.getBottom() > b.getTop()
    );
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
