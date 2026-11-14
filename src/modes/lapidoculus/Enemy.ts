import { GameObject } from '@entities/GameObject';
import { Bullet } from '@entities/Bullet';
import { BulletPattern } from './BulletPattern';
import { Vector2 } from '@utils/Vector2';
import { Grenade } from './Grenade';
import { TimedBomb } from './TimedBomb';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  BOSS_SIZE,
  BOSS_MAX_HEALTH,
  BOSS_SPEED,
  BOSS_MODE_DURATION,
  BOMB_DROP_MIN_Y,
  GRENADE_SPAWN_MIN,
  GRENADE_SPAWN_MAX,
  TIMED_BOMB_SPAWN_MIN,
  TIMED_BOMB_SPAWN_MAX,
} from '@utils/Constants';

const randomRange = (min: number, max: number): number => min + Math.random() * (max - min);

/**
 * 보스 모드: BOSS_MODE_DURATION(30초)마다 순서대로 전환되며 순환함
 * 화면에는 모드를 표시하지 않음 (패턴으로만 드러남)
 */
export enum EnemyMode {
  Rifle = 'rifle',
  Ambush = 'ambush',
  Bombs = 'bombs',
}

const ENEMY_MODE_ORDER: EnemyMode[] = [EnemyMode.Bombs, EnemyMode.Rifle, EnemyMode.Ambush];

export class Enemy extends GameObject {
  private health: number = BOSS_MAX_HEALTH;
  private modeIndex: number = 0;
  private modeTimer: number = 0;
  private bullets: Bullet[] = [];
  private patternTimer: number = 0;
  private patternIndex: number = 0;
  private patternInterval: number = 2; // 2초마다 패턴 발동
  private moveDirection: Vector2 = new Vector2(1, 0);

  // Bombs 모드
  private grenades: Grenade[] = [];
  private timedBombs: TimedBomb[] = [];
  private grenadeTimer: number = 0;
  private timedBombTimer: number = 0;

  constructor(x: number, y: number) {
    super(x, y, BOSS_SIZE, BOSS_SIZE);
    this.onModeEnter(this.getMode());
  }

  update(deltaTime: number): void {
    // 모드 전환 (30초마다)
    this.modeTimer += deltaTime;
    if (this.modeTimer >= BOSS_MODE_DURATION) {
      this.modeTimer -= BOSS_MODE_DURATION;
      this.modeIndex = (this.modeIndex + 1) % ENEMY_MODE_ORDER.length;
      this.onModeEnter(this.getMode());
    }

    // 현재 모드별 패턴
    switch (this.getMode()) {
      case EnemyMode.Rifle:
        this.updateRifle(deltaTime);
        break;
      case EnemyMode.Ambush:
        this.updateAmbush(deltaTime);
        break;
      case EnemyMode.Bombs:
        this.updateBombs(deltaTime);
        break;
    }

    // 기존 임시 패턴 (Bombs 외 모드에서만, 패턴이 생기기 전까지 임시)
    if (this.getMode() !== EnemyMode.Bombs) {
      this.patternTimer += deltaTime;
      if (this.patternTimer >= this.patternInterval) {
        this.firePattern();
        this.patternTimer = 0;
        this.patternIndex = (this.patternIndex + 1) % 2;
      }
    }

    // 떨어뜨린 폭탄은 모드가 바뀌어도 끝까지 동작 (폭발 시 생긴 탄은 탄막 목록에 추가)
    for (const grenade of this.grenades) {
      this.bullets.push(...grenade.update(deltaTime));
    }
    for (const bomb of this.timedBombs) {
      this.bullets.push(...bomb.update(deltaTime));
    }
    this.grenades = this.grenades.filter((g) => g.active);
    this.timedBombs = this.timedBombs.filter((b) => b.active);

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

  getMode(): EnemyMode {
    return ENEMY_MODE_ORDER[this.modeIndex];
  }

  // 모드에 진입할 때 한 번 호출 (모드별 초기화용)
  private onModeEnter(mode: EnemyMode): void {
    if (mode === EnemyMode.Bombs) {
      this.grenadeTimer = 1.0; // 모드 시작 후 첫 투하까지
      this.timedBombTimer = 2.0;
    }
  }

  // 소총 모드 패턴
  private updateRifle(deltaTime: number): void {
    // TODO: 소총 패턴
  }

  // 매복 모드 패턴
  private updateAmbush(deltaTime: number): void {
    // TODO: 매복 패턴
  }

  // 폭탄 모드 패턴
  private updateBombs(deltaTime: number): void {
    // 수류탄 투하
    this.grenadeTimer -= deltaTime;
    if (this.grenadeTimer <= 0) {
      const [tx, ty] = this.randomDropTarget();
      this.grenades.push(new Grenade(this.position.x, this.position.y, tx, ty));
      this.grenadeTimer = randomRange(GRENADE_SPAWN_MIN, GRENADE_SPAWN_MAX);
    }

    // 시한폭탄 투하
    this.timedBombTimer -= deltaTime;
    if (this.timedBombTimer <= 0) {
      const [tx, ty] = this.randomDropTarget();
      this.timedBombs.push(new TimedBomb(this.position.x, this.position.y, tx, ty));
      this.timedBombTimer = randomRange(TIMED_BOMB_SPAWN_MIN, TIMED_BOMB_SPAWN_MAX);
    }

    // TODO: 로켓
  }

  // 폭탄 착지 지점: 보스 아래쪽 화면 안의 무작위 위치
  private randomDropTarget(): [number, number] {
    const margin = 40;
    return [randomRange(margin, SCREEN_WIDTH - margin), randomRange(BOMB_DROP_MIN_Y, SCREEN_HEIGHT - margin)];
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

    // 폭탄
    this.timedBombs.forEach((bomb) => bomb.draw(ctx));
    this.grenades.forEach((grenade) => grenade.draw(ctx));

    // 탄막 렌더링
    this.bullets.forEach((bullet) => {
      bullet.draw(ctx);
    });
  }
}
