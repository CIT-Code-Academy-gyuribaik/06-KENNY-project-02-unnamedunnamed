import { GameObject } from '@entities/GameObject';
import { Vector2 } from '@utils/Vector2';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  PLAYER_SIZE,
  PLAYER_SPEED,
  DASH_DURATION,
  DASH_COOLDOWN,
  DASH_SPEED,
  DASH_INVULNERABILITY,
  PLAYER_MAX_HEALTH,
} from '@utils/Constants';

export class Player extends GameObject {
  private health: number = PLAYER_MAX_HEALTH;
  private isDashing: boolean = false;
  private dashTime: number = 0;
  private dashCooldownTime: number = 0;
  private isInvulnerable: boolean = false;
  private invulnerabilityTime: number = 0;
  private isStiffened: boolean = false;
  private stiffenTime: number = 0;
  private stiffenDuration: number = 0;
  private dashDirection: Vector2 = new Vector2(1, 0);
  private inputX: number = 0;
  private inputY: number = 0;

  constructor(x: number, y: number) {
    super(x, y, PLAYER_SIZE, PLAYER_SIZE);
  }

  setInput(inputX: number, inputY: number): void {
    this.inputX = inputX;
    this.inputY = inputY;
  }

  update(deltaTime: number): void {
    const inputX = this.inputX;
    const inputY = this.inputY;
    // 경직 상태 업데이트
    if (this.isStiffened) {
      this.stiffenTime += deltaTime;
      if (this.stiffenTime >= this.stiffenDuration) {
        this.isStiffened = false;
        this.stiffenTime = 0;
      }
    }

    // 무적 상태 업데이트
    if (this.isInvulnerable) {
      this.invulnerabilityTime += deltaTime;
      if (this.invulnerabilityTime >= DASH_INVULNERABILITY) {
        this.isInvulnerable = false;
        this.invulnerabilityTime = 0;
      }
    }

    // 대시 상태 업데이트
    if (this.isDashing) {
      this.dashTime += deltaTime;
      if (this.dashTime >= DASH_DURATION) {
        this.isDashing = false;
        this.dashTime = 0;
        this.isInvulnerable = false;
      }
    } else {
      // 대시 쿨다운
      if (this.dashCooldownTime > 0) {
        this.dashCooldownTime -= deltaTime;
      }

      // 일반 이동
      const moveDir = new Vector2(inputX, inputY).normalize();
      if (moveDir.magnitude() > 0) {
        this.dashDirection = moveDir.clone();
      }
      this.velocity = moveDir.multiply(PLAYER_SPEED);
    }

    // 대시 중
    if (this.isDashing) {
      this.velocity = this.dashDirection.multiply(DASH_SPEED);
    }

    // 위치 업데이트
    super.update(deltaTime);

    // 화면 경계
    this.position.x = Math.max(PLAYER_SIZE / 2, Math.min(SCREEN_WIDTH - PLAYER_SIZE / 2, this.position.x));
    this.position.y = Math.max(PLAYER_SIZE / 2, Math.min(SCREEN_HEIGHT - PLAYER_SIZE / 2, this.position.y));
  }

  dash(): void {
    if (!this.isDashing && this.dashCooldownTime <= 0) {
      this.isDashing = true;
      this.dashTime = 0;
      this.dashCooldownTime = DASH_COOLDOWN;
      this.isInvulnerable = true;
      this.invulnerabilityTime = 0;
    }
  }

  stiffen(duration: number): void {
    this.isStiffened = true;
    this.stiffenTime = 0;
    this.stiffenDuration = duration;
  }

  takeDamage(): void {
    if (!this.isInvulnerable) {
      this.health -= 1;
      this.isInvulnerable = true;
      this.invulnerabilityTime = 0;
    }
  }

  getHealth(): number {
    return this.health;
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  isInDashCooldown(): boolean {
    return this.dashCooldownTime > 0;
  }

  getIsStiffened(): boolean {
    return this.isStiffened;
  }

  getStiffenProgress(): number {
    if (!this.isStiffened) return 0;
    return this.stiffenTime / this.stiffenDuration;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 무적/대시 중 깜빡임
    if (this.isInvulnerable && Math.floor(this.invulnerabilityTime * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // 경직 상태 색상 변경
    if (this.isStiffened) {
      ctx.fillStyle = '#ffff00';
    } else {
      ctx.fillStyle = '#00ff00';
    }

    // 플레이어 그리기
    ctx.fillRect(
      this.getLeft(),
      this.getTop(),
      this.width,
      this.height
    );

    ctx.globalAlpha = 1;

    // 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.getLeft(), this.getTop(), this.width, this.height);
  }
}
