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

  // 경직 상태: X를 누르고 있는 동안 충전, 떼면 방출
  private isStiffening: boolean = false; // X 누르는 중
  private stiffenChargeTime: number = 0; // 누적된 홀드 시간
  private speedBoostTime: number = 0; // 속도 부스트 지속 시간
  private stiffenMaxCharge: number = 2; // 최대 충전 시간 (초)
  private speedBoostMultiplier: number = 1; // 속도 배수 (충전 시간에 비례)

  private dashDirection: Vector2 = new Vector2(1, 0);
  private inputX: number = 0;
  private inputY: number = 0;
  private wasStiffenPressed: boolean = false;

  constructor(x: number, y: number) {
    super(x, y, PLAYER_SIZE, PLAYER_SIZE);
  }

  setInput(inputX: number, inputY: number): void {
    this.inputX = inputX;
    this.inputY = inputY;
  }

  setStiffenInput(pressed: boolean): void {
    if (pressed && !this.wasStiffenPressed) {
      // X 키 눌렀을 때
      this.isStiffening = true;
      this.stiffenChargeTime = 0;
    } else if (!pressed && this.wasStiffenPressed) {
      // X 키 뗐을 때
      if (this.stiffenChargeTime > 0) {
        this.isStiffening = false;
        // 충전 시간에 비례해서 속도 부스트 설정 (충전시간 = 부스트 지속시간)
        this.speedBoostTime = this.stiffenChargeTime;
        // 속도 배수: 충전시간에 비례 (최대 충전시 3배)
        this.speedBoostMultiplier = 1 + (this.stiffenChargeTime / this.stiffenMaxCharge) * 2;
      }
    }
    this.wasStiffenPressed = pressed;
  }

  update(deltaTime: number): void {
    const inputX = this.inputX;
    const inputY = this.inputY;

    // 경직 충전 상태
    if (this.isStiffening) {
      this.stiffenChargeTime += deltaTime;
      if (this.stiffenChargeTime > this.stiffenMaxCharge) {
        this.stiffenChargeTime = this.stiffenMaxCharge;
      }
    }

    // 속도 부스트 상태
    if (this.speedBoostTime > 0) {
      this.speedBoostTime -= deltaTime;
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
    }

    // 경직 중에는 움직이지 않음
    if (this.isStiffening) {
      this.velocity = new Vector2(0, 0);
    } else if (this.isDashing) {
      // 대시 중
      this.velocity = this.dashDirection.multiply(DASH_SPEED);
    } else {
      // 일반 이동
      const moveDir = new Vector2(inputX, inputY).normalize();
      if (moveDir.magnitude() > 0) {
        this.dashDirection = moveDir.clone();
      }

      // 속도 부스트 적용
      const currentSpeed = this.speedBoostTime > 0 ? PLAYER_SPEED * this.speedBoostMultiplier : PLAYER_SPEED;
      this.velocity = moveDir.multiply(currentSpeed);
    }

    // 위치 업데이트
    super.update(deltaTime);

    // 화면 경계
    this.position.x = Math.max(PLAYER_SIZE / 2, Math.min(SCREEN_WIDTH - PLAYER_SIZE / 2, this.position.x));
    this.position.y = Math.max(PLAYER_SIZE / 2, Math.min(SCREEN_HEIGHT - PLAYER_SIZE / 2, this.position.y));
  }

  dash(): void {
    if (!this.isDashing && this.dashCooldownTime <= 0 && !this.isStiffening) {
      this.isDashing = true;
      this.dashTime = 0;
      this.dashCooldownTime = DASH_COOLDOWN;
      this.isInvulnerable = true;
      this.invulnerabilityTime = 0;
    }
  }

  takeDamage(): void {
    if (!this.isInvulnerable && !this.isStiffening) {
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

  getIsStiffening(): boolean {
    return this.isStiffening;
  }

  getStiffenChargePercent(): number {
    return this.stiffenChargeTime / this.stiffenMaxCharge;
  }

  isSpeedBoosted(): boolean {
    return this.speedBoostTime > 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 무적/대시 중 깜빡임
    if (this.isInvulnerable && Math.floor(this.invulnerabilityTime * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // 경직 상태 색상 변경
    if (this.isStiffening) {
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

    // 경직 충전 표시 (위에 게이지 바)
    if (this.isStiffening && this.stiffenChargeTime > 0) {
      const barWidth = this.width * this.getStiffenChargePercent();
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(this.getLeft(), this.getTop() - 8, barWidth, 4);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.getLeft(), this.getTop() - 8, this.width, 4);
    }

    // 속도 부스트 표시 (아래에 게이지 바)
    if (this.speedBoostTime > 0) {
      const boostPercent = this.speedBoostTime / this.stiffenMaxCharge;
      const barWidth = this.width * boostPercent;
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(this.getLeft(), this.getBottom() + 4, barWidth, 4);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.getLeft(), this.getBottom() + 4, this.width, 4);
    }
  }
}
