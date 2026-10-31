import { GameObject } from '@entities/GameObject';
import { Bullet } from '@entities/Bullet';
import { BulletPattern } from './BulletPattern';
import { Vector2 } from '@utils/Vector2';
import { SCREEN_WIDTH, SCREEN_HEIGHT, BOSS_SIZE, BOSS_MAX_HEALTH, BOSS_SPEED } from '@utils/Constants';

export class Enemy extends GameObject {
  private health: number = BOSS_MAX_HEALTH;
  private bullets: Bullet[] = [];
  private patternTimer: number = 0;
  private patternIndex: number = 0;
  private patternInterval: number = 2; // 2초마다 패턴 발동
  private moveDirection: Vector2 = new Vector2(1, 0);

  constructor(x: number, y: number) {
    super(x, y, BOSS_SIZE, BOSS_SIZE);
  }

  update(deltaTime: number): void {
    // 패턴 실행
    this.patternTimer += deltaTime;
    if (this.patternTimer >= this.patternInterval) {
      this.firePattern();
      this.patternTimer = 0;
      this.patternIndex = (this.patternIndex + 1) % 2;
    }

    // 간단한 AI: 좌우 이동
    this.position.x += this.moveDirection.x * BOSS_SPEED * deltaTime;

    if (this.position.x < BOSS_SIZE / 2 + 50) {
      this.moveDirection.x = 1;
    } else if (this.position.x > SCREEN_WIDTH - BOSS_SIZE / 2 - 50) {
      this.moveDirection.x = -1;
    }

    // 탄막 업데이트
    this.bullets.forEach((bullet) => {
      bullet.update(deltaTime);
    });

    // 비활성 탄막 제거
    this.bullets = this.bullets.filter((b) => b.active);
  }

  firePattern(): void {
    if (this.patternIndex === 0) {
      // 원형 패턴
      const newBullets = BulletPattern.createCirclePattern(this.position.x, this.position.y, 8);
      this.bullets.push(...newBullets);
    } else {
      // 직선 패턴 (아래 방향)
      const newBullets = BulletPattern.createLinePattern(this.position.x, this.position.y, 0, 1, 5);
      this.bullets.push(...newBullets);
    }
  }

  takeDamage(): void {
    this.health -= 1;
  }

  getHealth(): number {
    return this.health;
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  getBullets(): Bullet[] {
    return this.bullets;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 보스 본체
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(this.getLeft(), this.getTop(), this.width, this.height);

    // 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.getLeft(), this.getTop(), this.width, this.height);

    // 체력 표시
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${this.health}`, this.position.x, this.position.y);

    // 탄막 렌더링
    this.bullets.forEach((bullet) => {
      bullet.draw(ctx);
    });
  }
}
