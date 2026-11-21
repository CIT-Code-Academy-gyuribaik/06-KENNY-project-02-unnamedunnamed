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
  HIT_INVULNERABILITY,
  PLAYER_MAX_HEALTH,
  PLAYER_TURN_SPEED,
  KNOCKBACK_SPEED,
  KNOCKBACK_DURATION,
} from '@utils/Constants';

export class Player extends GameObject {
  private health: number = PLAYER_MAX_HEALTH;
  private displayHealth: number = PLAYER_MAX_HEALTH; // 색/모양 표시용 (실제 체력을 부드럽게 따라감)

  private static readonly COLOR_FULL_HEALTH = '#C6FF82';
  private static readonly COLOR_LOW_HEALTH = '#8C0E06';
  private static readonly HEALTH_DISPLAY_SPEED = 4; // 초당 체력 칸 수 (1칸 변화에 0.25초)
  private isDashing: boolean = false;
  private dashTime: number = 0;
  private dashCooldownTime: number = 0;
  private isInvulnerable: boolean = false;
  private invulnerabilityTime: number = 0;
  private invulnerabilityDuration: number = DASH_INVULNERABILITY; // 대시/피격에 따라 다름

  // 경직 상태: X를 누르고 있는 동안 충전, 떼면 방출
  private isStiffening: boolean = false; // X 누르는 중
  private stiffenChargeTime: number = 0; // 누적된 홀드 시간
  private speedBoostTime: number = 0; // 속도 부스트 지속 시간
  private stiffenMaxCharge: number = 2; // 최대 충전 시간 (초)
  private speedBoostMultiplier: number = 1; // 속도 배수 (충전 시간에 비례)

  // 현재 이동 각도 (라디안). 입력 방향으로 서서히 회전하며, 대시는 이 각도로 발동
  private moveAngle: number = -Math.PI / 2;
  private wasMoving: boolean = false;
  private dashDirection: Vector2 = new Vector2(0, -1);
  private inputX: number = 0;
  private inputY: number = 0;
  private wasStiffenPressed: boolean = false;

  // 넉백: 피격 시 공격 반대 방향으로 밀려남
  private knockbackDirection: Vector2 = new Vector2(0, 0);
  private knockbackTime: number = 0;

  // 감속 디버프 (어뢰): 남은 시간 동안 일반 이동 속도에 배수 적용
  private slowTime: number = 0;
  private slowMultiplier: number = 1;

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

    // 표시용 체력: 실제 체력 쪽으로 서서히 변화 (색/모양이 부드럽게 바뀌도록)
    const healthDiff = this.health - this.displayHealth;
    const healthStep = Player.HEALTH_DISPLAY_SPEED * deltaTime;
    this.displayHealth = Math.abs(healthDiff) <= healthStep ? this.health : this.displayHealth + Math.sign(healthDiff) * healthStep;

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

    // 감속 디버프
    if (this.slowTime > 0) {
      this.slowTime -= deltaTime;
    }

    // 무적 상태 업데이트
    if (this.isInvulnerable) {
      this.invulnerabilityTime += deltaTime;
      if (this.invulnerabilityTime >= this.invulnerabilityDuration) {
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
    } else if (this.knockbackTime > 0) {
      // 넉백 중: 이동 입력 무시, 속도는 선형으로 감소
      const strength = this.knockbackTime / KNOCKBACK_DURATION;
      this.velocity = this.knockbackDirection.multiply(KNOCKBACK_SPEED * strength);
      this.knockbackTime -= deltaTime;
      this.wasMoving = false;
    } else {
      // 일반 이동: 이동 각도가 입력 방향으로 서서히 회전 (정지 상태에서 출발하면 즉시 해당 방향)
      const isMoving = inputX !== 0 || inputY !== 0;
      let moveDir = new Vector2(0, 0);
      if (isMoving) {
        const targetAngle = Math.atan2(inputY, inputX);
        if (!this.wasMoving) {
          this.moveAngle = targetAngle;
        } else {
          this.moveAngle = this.rotateTowards(this.moveAngle, targetAngle, PLAYER_TURN_SPEED * deltaTime);
        }
        moveDir = new Vector2(Math.cos(this.moveAngle), Math.sin(this.moveAngle));
        this.dashDirection = moveDir.clone();
      }
      this.wasMoving = isMoving;

      // 속도 부스트 적용
      let currentSpeed = this.speedBoostTime > 0 ? PLAYER_SPEED * this.speedBoostMultiplier : PLAYER_SPEED;
      if (this.slowTime > 0) {
        currentSpeed *= this.slowMultiplier;
      }
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
      this.invulnerabilityDuration = DASH_INVULNERABILITY;
    }
  }

  // current 각도를 target 각도 쪽으로 최대 maxStep 라디안만큼 회전 (짧은 방향으로)
  private rotateTowards(current: number, target: number, maxStep: number): number {
    let diff = target - current;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // -π ~ π 로 정규화
    if (Math.abs(diff) <= maxStep) {
      return target;
    }
    return current + Math.sign(diff) * maxStep;
  }

  // 대시 중, 피격 직후 무적 시간, 경직 중에는 피해를 받지 않음
  isInvincible(): boolean {
    return this.isDashing || this.isInvulnerable || this.isStiffening;
  }

  // 실제로 피해를 받았으면 true 반환. knockbackDirection 이 주어지면 그 방향으로 밀려남
  takeDamage(knockbackDirection?: Vector2): boolean {
    if (this.isInvincible()) {
      return false;
    }
    this.health -= 1;
    if (knockbackDirection) {
      const dir = knockbackDirection.normalize();
      if (dir.x !== 0 || dir.y !== 0) {
        this.knockbackDirection = dir;
        this.knockbackTime = KNOCKBACK_DURATION;
      }
    }
    this.isInvulnerable = true;
    this.invulnerabilityTime = 0;
    this.invulnerabilityDuration = HIT_INVULNERABILITY;
    return true;
  }

  // 일정 시간 이동 속도 감소 (피해 없음). 다시 맞으면 시간이 처음부터 다시 시작
  applySlow(multiplier: number, duration: number): void {
    this.slowMultiplier = multiplier;
    this.slowTime = duration;
  }

  isSlowed(): boolean {
    return this.slowTime > 0;
  }

  // 즉사 (저격). 무적 중이면 무시하고 false 반환
  kill(): boolean {
    if (this.isInvincible()) {
      return false;
    }
    this.health = 0;
    return true;
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

  // 두 hex 색상(#RRGGBB)을 t(0~1) 비율로 보간
  private static lerpColor(from: string, to: string, t: number): string {
    const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const a = parse(from);
    const b = parse(to);
    const mixed = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
  }

  // 모서리가 둥근 사각형 채우기 (radius = 0 이면 일반 사각형)
  private fillRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number): void {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 무적/대시 중 깜빡임
    if (this.isInvulnerable && Math.floor(this.invulnerabilityTime * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // 체력 손실 비율: 0 = 최대 체력, 1 = 마지막 1칸
    const damageRatio = Math.min(1, Math.max(0, (PLAYER_MAX_HEALTH - this.displayHealth) / (PLAYER_MAX_HEALTH - 1)));

    // 색상: 체력이 줄수록 #C6FF82 → #8C0E06 (경직 중에는 노란색)
    if (this.isStiffening) {
      ctx.fillStyle = '#ffff00';
    } else {
      ctx.fillStyle = Player.lerpColor(Player.COLOR_FULL_HEALTH, Player.COLOR_LOW_HEALTH, damageRatio);
    }

    // 모양: 체력이 줄수록 모서리가 둥글어짐 (마지막 1칸에서는 원)
    const cornerRadius = (Math.min(this.width, this.height) / 2) * damageRatio;
    this.fillRoundedRect(ctx, this.getLeft(), this.getTop(), this.width, this.height, cornerRadius);

    ctx.globalAlpha = 1;

    // 대시 방향 표시 (중심에서 현재 각도로 뻗는 선)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(
      this.position.x + this.dashDirection.x * (this.width * 0.75),
      this.position.y + this.dashDirection.y * (this.width * 0.75)
    );
    ctx.stroke();

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
