import { Bullet } from '@entities/Bullet';
import { Vector2 } from '@utils/Vector2';
import { BULLET_SPEED } from '@utils/Constants';

export class BulletPattern {
  static createCirclePattern(centerX: number, centerY: number, bulletCount: number = 8): Bullet[] {
    const bullets: Bullet[] = [];
    const angleStep = (Math.PI * 2) / bulletCount;

    for (let i = 0; i < bulletCount; i++) {
      const angle = angleStep * i;
      const vx = Math.cos(angle) * BULLET_SPEED;
      const vy = Math.sin(angle) * BULLET_SPEED;
      bullets.push(new Bullet(centerX, centerY, vx, vy));
    }

    return bullets;
  }

  static createLinePattern(
    startX: number,
    startY: number,
    directionX: number,
    directionY: number,
    bulletCount: number = 5,
    spacing: number = 20
  ): Bullet[] {
    const bullets: Bullet[] = [];
    const dir = new Vector2(directionX, directionY).normalize();
    const perpX = -dir.y;
    const perpY = dir.x;

    for (let i = 0; i < bulletCount; i++) {
      const offset = (i - (bulletCount - 1) / 2) * spacing;
      const x = startX + perpX * offset;
      const y = startY + perpY * offset;
      const vx = dir.x * BULLET_SPEED;
      const vy = dir.y * BULLET_SPEED;
      bullets.push(new Bullet(x, y, vx, vy));
    }

    return bullets;
  }

  static createSpiralPattern(
    centerX: number,
    centerY: number,
    bulletCount: number = 12,
    rotation: number = 0
  ): Bullet[] {
    const bullets: Bullet[] = [];
    const angleStep = (Math.PI * 2) / bulletCount;

    for (let i = 0; i < bulletCount; i++) {
      const angle = angleStep * i + rotation;
      const vx = Math.cos(angle) * BULLET_SPEED;
      const vy = Math.sin(angle) * BULLET_SPEED;
      bullets.push(new Bullet(centerX, centerY, vx, vy));
    }

    return bullets;
  }
}
