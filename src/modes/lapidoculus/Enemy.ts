import { GameObject } from '@entities/GameObject';
import { Bullet } from '@entities/Bullet';
import { Collider } from '@entities/Collider';
import { BulletPattern } from './BulletPattern';
import { Vector2 } from '@utils/Vector2';
import { Grenade } from './Grenade';
import { TimedBomb } from './TimedBomb';
import { Landmine } from './Landmine';
import { BigBomb } from './BigBomb';
import { Torpedo, GasBomb } from './BombProjectiles';
import { Gun } from './Gun';
import { Handgun } from './Handgun';
import { RifleGun } from './RifleGun';
import { Flamethrower } from './Flamethrower';
import { RocketLauncher } from './RocketLauncher';
import { Shotgun } from './Shotgun';
import { Sniper } from './Sniper';
import { Gatling } from './Gatling';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  BOSS_SIZE,
  BOSS_MAX_HEALTH,
  BOSS_SPEED,
  BOSS_MODE_DURATION,
  BOMB_DROP_MIN_Y,
  BOMB_SPAWN_MIN,
  BOMB_SPAWN_MAX,
  BOMB_FIRST_SPAWN_DELAY,
  LANDMINE_MIN_PLAYER_DISTANCE,
  LANDMINE_EXPLOSION_RADIUS,
  GAS_BOMB_MAX_ANGLE,
  BIG_BOMB_APPEAR_BEFORE_END,
  RIFLE_SPAWN_MIN,
  RIFLE_SPAWN_MAX,
  RIFLE_FIRST_SPAWN_DELAY,
  GUN_LEAD_TIME,
  GUN_AIM_DISTANCE_MIN,
  GUN_AIM_DISTANCE_MAX,
  GUN_MIN_PLAYER_DISTANCE,
  RIFLE_GUN_FRONT_LENGTH,
  RIFLE_GUN_REAR_LENGTH,
  RIFLE_GUN_EDGE_INSET,
  ROCKET_LAUNCHER_MIN_PLAYER_DISTANCE,
  GATLING_TEST_ON_FIRST_RIFLE,
  GATLING_START_BEFORE_END,
  GATLING_BOSS_MARGIN,
} from '@utils/Constants';

// Rifle 모드 기본 패턴 5개 (같은 확률로 무작위 선택). 특수 패턴 2개는 추가 예정
enum RiflePattern {
  Handgun,
  RifleGun,
  Flamethrower,
  RocketLauncher,
  Shotgun,
}
const RIFLE_PATTERNS: RiflePattern[] = [
  RiflePattern.Handgun,
  RiflePattern.RifleGun,
  RiflePattern.Flamethrower,
  RiflePattern.RocketLauncher,
  RiflePattern.Shotgun,
];
// 보스가 직접 드는 무기 (동시에 하나만)
const HELD_WEAPON_PATTERNS: RiflePattern[] = [RiflePattern.Flamethrower, RiflePattern.Shotgun];

// 일반 폭탄 종류 (같은 확률로 무작위 선택). 대형 폭탄은 모드 끝에만 따로 등장
enum BombType {
  Grenade,
  TimedBomb,
  Landmine,
  Torpedo,
  GasBomb,
}
const BOMB_TYPES: BombType[] = [BombType.Grenade, BombType.TimedBomb, BombType.Landmine, BombType.Torpedo, BombType.GasBomb];

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
  private landmines: Landmine[] = [];
  private bigBombs: BigBomb[] = [];
  private bombSpawnTimer: number = 0;
  private hasSpawnedBigBomb: boolean = false;

  // Rifle 모드
  private guns: Gun[] = [];
  private heldWeapon: Flamethrower | Shotgun | null = null; // 보스가 직접 드는 무기 (화염방사기/산탄총). 한 번에 하나만
  private rocketLaunchers: RocketLauncher[] = [];
  private rifleSpawnTimer: number = 0;
  private sniper: Sniper | null = null; // 특수 패턴: Rifle 모드 동안만 존재
  private rifleModeCount: number = 0; // 지금까지 Rifle 모드에 들어간 횟수 (개틀링은 2번째에만)
  private gatling: Gatling | null = null; // 특수 패턴: 2번째 Rifle 모드 끝에만
  private hasStartedGatling: boolean = false;
  private gatlingStartX: number = 0; // 개틀링 연사 중 보스가 가로질러 이동하는 시작/끝 x
  private gatlingEndX: number = 0;

  // 어뢰 조준/지뢰 위치 계산용 플레이어 위치 (매 프레임 모드에서 갱신)
  private targetPosition: Vector2 = new Vector2(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 100);
  private targetVelocity: Vector2 = new Vector2(0, 0); // 권총 조준(이동 방향 예측)용

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

    // 기존 임시 패턴 (Ambush 모드에서만, 패턴이 생기기 전까지 임시)
    if (this.getMode() === EnemyMode.Ambush) {
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
    for (const mine of this.landmines) {
      const explosions = mine.update(deltaTime);
      this.bullets.push(...explosions);
      // 연쇄 폭발: 폭발 범위 안의 다른 지뢰도 1초 카운트다운 시작
      for (const explosion of explosions) {
        for (const other of this.landmines) {
          if (other.active && Collider.checkCircle(explosion.position.x, explosion.position.y, LANDMINE_EXPLOSION_RADIUS, other)) {
            other.triggerByExplosion();
          }
        }
      }
    }
    for (const bigBomb of this.bigBombs) {
      this.bullets.push(...bigBomb.update(deltaTime));
    }
    for (const gun of this.guns) {
      this.bullets.push(...gun.update(deltaTime));
    }
    this.guns = this.guns.filter((g) => g.active);
    for (const launcher of this.rocketLaunchers) {
      this.bullets.push(...launcher.update(deltaTime));
    }
    this.rocketLaunchers = this.rocketLaunchers.filter((l) => l.active);
    if (this.heldWeapon) {
      this.bullets.push(...this.heldWeapon.update(deltaTime));
      if (!this.heldWeapon.active) {
        this.heldWeapon = null;
      }
    }
    this.grenades = this.grenades.filter((g) => g.active);
    this.timedBombs = this.timedBombs.filter((b) => b.active);
    this.landmines = this.landmines.filter((m) => m.active);
    this.bigBombs = this.bigBombs.filter((b) => b.active);

    // 개틀링: 연사하는 동안 보스가 화면을 가로질러 이동
    if (this.gatling) {
      this.bullets.push(...this.gatling.update(deltaTime));
      const progress = this.gatling.getSweepProgress();
      const eased = progress * progress * (3 - 2 * progress); // 처음/끝은 천천히
      this.position.x = this.gatlingStartX + (this.gatlingEndX - this.gatlingStartX) * eased;
      if (!this.gatling.active) {
        this.gatling = null;
        this.moveDirection.x = this.gatlingEndX > this.gatlingStartX ? -1 : 1; // 끝난 쪽에서 되돌아감
      }
    } else if (!this.heldWeapon) {
      // 간단한 AI: 좌우 이동 (무기를 든 동안에는 멈춤 — 불길/조준이 흔들리지 않도록)
      this.position.x += this.moveDirection.x * BOSS_SPEED * deltaTime;
    }

    if (this.position.x < BOSS_SIZE / 2 + 50) {
      this.moveDirection.x = 1;
    } else if (this.position.x > SCREEN_WIDTH - BOSS_SIZE / 2 - 50) {
      this.moveDirection.x = -1;
    }

    // 탄막 업데이트 (탄이 새로 만들어 낸 탄 — 예: 로켓 폭발 — 도 추가. 지뢰 연쇄 폭발은 일으키지 않음)
    this.bullets.forEach((bullet) => {
      bullet.update(deltaTime);
    });
    this.bullets.push(...this.bullets.flatMap((bullet) => bullet.takeSpawned()));

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
    // 저격 점은 Rifle 모드 동안만 있음
    this.sniper = mode === EnemyMode.Rifle ? new Sniper(this.targetPosition) : null;

    if (mode === EnemyMode.Bombs) {
      this.bombSpawnTimer = BOMB_FIRST_SPAWN_DELAY;
      this.hasSpawnedBigBomb = false;
    } else if (mode === EnemyMode.Rifle) {
      this.rifleSpawnTimer = RIFLE_FIRST_SPAWN_DELAY;
      this.rifleModeCount++;
      this.hasStartedGatling = false;
    }
  }

  // 이번 Rifle 모드 끝에 개틀링이 나오는지 (2번째 Rifle 모드. 테스트 중에는 1번째)
  private isGatlingRifleMode(): boolean {
    return this.rifleModeCount === (GATLING_TEST_ON_FIRST_RIFLE ? 1 : 2);
  }

  // 보스 오른쪽 옆면 가운데 (개틀링이 붙는 곳)
  private getRightMount(): Vector2 {
    return new Vector2(this.getRight(), this.position.y);
  }

  setTargetPosition(position: Vector2, velocity: Vector2 = new Vector2(0, 0)): void {
    this.targetPosition = position.clone();
    this.targetVelocity = velocity.clone();
  }

  // 소총 모드 패턴
  private updateRifle(deltaTime: number): void {
    // 특수 패턴 1: 저격 (모드당 한 번)
    this.sniper?.update(deltaTime, this.targetPosition);

    // 특수 패턴 2: 개틀링 (2번째 Rifle 모드 끝). 이때부터 다른 패턴은 더 생기지 않음
    if (this.isGatlingRifleMode() && this.modeTimer >= BOSS_MODE_DURATION - GATLING_START_BEFORE_END) {
      if (!this.hasStartedGatling) {
        this.hasStartedGatling = true;
        this.heldWeapon = null; // 들고 있던 무기는 버림
        // 화면 반대쪽 끝까지 가로질러 이동 (더 먼 쪽으로)
        this.gatlingStartX = this.position.x;
        this.gatlingEndX = this.position.x < SCREEN_WIDTH / 2 ? SCREEN_WIDTH - GATLING_BOSS_MARGIN : GATLING_BOSS_MARGIN;
        this.gatling = new Gatling(() => this.getRightMount(), this.gatlingEndX > this.gatlingStartX);
      }
      return;
    }

    // 기본 패턴: 하나의 타이머로 약 1초에 1개 이하, 종류는 같은 확률
    // 보스가 직접 드는 무기(화염방사기/산탄총)는 한 번에 하나만이므로, 들고 있으면 후보에서 뺌
    this.rifleSpawnTimer -= deltaTime;
    if (this.rifleSpawnTimer <= 0) {
      const candidates = this.heldWeapon ? RIFLE_PATTERNS.filter((p) => !HELD_WEAPON_PATTERNS.includes(p)) : RIFLE_PATTERNS;
      this.spawnRiflePattern(candidates[Math.floor(Math.random() * candidates.length)]);
      this.rifleSpawnTimer = randomRange(RIFLE_SPAWN_MIN, RIFLE_SPAWN_MAX);
    }
  }

  private spawnRiflePattern(pattern: RiflePattern): void {
    switch (pattern) {
      case RiflePattern.Handgun:
        this.spawnGun((x, y, angle) => new Handgun(x, y, angle));
        break;
      case RiflePattern.RifleGun:
        this.spawnGunFromSide(
          (x, y, angle) => new RifleGun(x, y, angle),
          (RIFLE_GUN_FRONT_LENGTH + RIFLE_GUN_REAR_LENGTH) / 2 + RIFLE_GUN_EDGE_INSET
        );
        break;
      case RiflePattern.Flamethrower:
        this.heldWeapon = new Flamethrower(() => this.getLeftMount());
        break;
      case RiflePattern.Shotgun:
        this.heldWeapon = new Shotgun(() => this.getLeftMount(), () => this.targetPosition);
        break;
      case RiflePattern.RocketLauncher:
        this.spawnRocketLauncher();
        break;
    }
  }

  // 보스 왼쪽 옆면 가운데 (화염방사기/산탄총이 붙는 곳)
  private getLeftMount(): Vector2 {
    return new Vector2(this.getLeft(), this.position.y);
  }

  // 로켓 발사기: 플레이어에게서 충분히 떨어진 무작위 위치에, 플레이어 쪽(0/90/180/270° 중 가장 가까운 방향)을 향해 나타남
  private spawnRocketLauncher(): void {
    const margin = 40;
    let x = 0;
    let y = 0;
    for (let i = 0; i < 20; i++) {
      x = randomRange(margin, SCREEN_WIDTH - margin);
      y = randomRange(margin, SCREEN_HEIGHT - margin);
      if (Math.hypot(x - this.targetPosition.x, y - this.targetPosition.y) >= ROCKET_LAUNCHER_MIN_PLAYER_DISTANCE) {
        break;
      }
    }
    const dx = this.targetPosition.x - x;
    const dy = this.targetPosition.y - y;
    const angle = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 0 : Math.PI) : dy >= 0 ? Math.PI / 2 : -Math.PI / 2;
    this.rocketLaunchers.push(new RocketLauncher(x, y, angle, () => this.targetPosition));
  }

  // 소총: 화면 왼쪽/오른쪽 끝에서만 나타나 반대쪽으로 발사. 노리는 지점(이동 방향 예측)과 같은 가로줄 위
  // halfLength: 총 중심에서 끝까지 거리 + 화면 끝 여백 (총 전체가 화면 안에 들어오도록)
  private spawnGunFromSide(create: (x: number, y: number, angle: number) => Gun, halfLength: number): void {
    const margin = 30;
    const aim = this.targetPosition.add(this.targetVelocity.multiply(GUN_LEAD_TIME));
    const y = Math.max(margin, Math.min(SCREEN_HEIGHT - margin, aim.y));

    // 왼쪽 끝(오른쪽으로 발사) / 오른쪽 끝(왼쪽으로 발사) 중 무작위. 플레이어 바로 옆이면 반대쪽 사용
    const sides = Math.random() < 0.5 ? [0, Math.PI] : [Math.PI, 0];
    for (const angle of sides) {
      const x = angle === 0 ? halfLength : SCREEN_WIDTH - halfLength;
      if (Math.hypot(x - this.targetPosition.x, y - this.targetPosition.y) >= GUN_MIN_PLAYER_DISTANCE || angle === sides[1]) {
        this.guns.push(create(x, y, angle));
        return;
      }
    }
  }

  // 총: 플레이어가 이동 중인 방향의 예상 위치를 노림 (멈춰 있으면 현재 위치)
  // 방향은 0/90/180/270° 중 무작위이고, 총은 노리는 지점과 같은 가로줄/세로줄 위, 발사 방향의 반대쪽에 나타남
  private spawnGun(create: (x: number, y: number, angle: number) => Gun): void {
    const margin = 30;
    const aim = this.targetPosition.add(this.targetVelocity.multiply(GUN_LEAD_TIME));
    aim.x = Math.max(margin, Math.min(SCREEN_WIDTH - margin, aim.x));
    aim.y = Math.max(margin, Math.min(SCREEN_HEIGHT - margin, aim.y));

    // 각 방향에 대해, 총을 놓을 수 있는 노리는 지점까지의 거리 범위 계산 (화면 안 + 최소 거리 확보)
    const options: { angle: number; direction: Vector2; maxDistance: number }[] = [];
    for (let k = 0; k < 4; k++) {
      const angle = (k * Math.PI) / 2;
      const direction = new Vector2(Math.round(Math.cos(angle)), Math.round(Math.sin(angle)));
      // 총은 노리는 지점에서 발사 방향의 반대쪽에 위치
      const roomBehind =
        direction.x > 0 ? aim.x - margin : direction.x < 0 ? SCREEN_WIDTH - margin - aim.x : direction.y > 0 ? aim.y - margin : SCREEN_HEIGHT - margin - aim.y;
      const maxDistance = Math.min(GUN_AIM_DISTANCE_MAX, roomBehind);
      if (maxDistance >= GUN_AIM_DISTANCE_MIN) {
        options.push({ angle, direction, maxDistance });
      }
    }

    let gunX = aim.x;
    let gunY = aim.y;
    let angle = 0;
    for (let i = 0; i < 10 && options.length > 0; i++) {
      const option = options[Math.floor(Math.random() * options.length)];
      const distance = randomRange(GUN_AIM_DISTANCE_MIN, option.maxDistance);
      gunX = aim.x - option.direction.x * distance;
      gunY = aim.y - option.direction.y * distance;
      angle = option.angle;
      // 플레이어가 총 쪽으로 다가오는 중이면 총이 플레이어 바로 옆에 생길 수 있으므로 다시 뽑음
      if (Math.hypot(gunX - this.targetPosition.x, gunY - this.targetPosition.y) >= GUN_MIN_PLAYER_DISTANCE) {
        break;
      }
    }
    this.guns.push(create(gunX, gunY, angle));
  }

  // 매복 모드 패턴
  private updateAmbush(deltaTime: number): void {
    // TODO: 매복 패턴
  }

  // 폭탄 모드 패턴
  private updateBombs(deltaTime: number): void {
    // 모드 마지막: 대형 폭탄 1개만 등장하고, 일반 폭탄은 더 생기지 않음
    if (this.modeTimer >= BOSS_MODE_DURATION - BIG_BOMB_APPEAR_BEFORE_END) {
      if (!this.hasSpawnedBigBomb) {
        this.bigBombs.push(new BigBomb(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2));
        this.hasSpawnedBigBomb = true;
      }
      return;
    }

    // 일반 폭탄: 하나의 타이머로 약 1초에 1개 이하, 종류는 같은 확률
    this.bombSpawnTimer -= deltaTime;
    if (this.bombSpawnTimer <= 0) {
      this.spawnBomb(BOMB_TYPES[Math.floor(Math.random() * BOMB_TYPES.length)]);
      this.bombSpawnTimer = randomRange(BOMB_SPAWN_MIN, BOMB_SPAWN_MAX);
    }

    // TODO: 로켓
  }

  private spawnBomb(type: BombType): void {
    switch (type) {
      case BombType.Grenade: {
        const [tx, ty] = this.randomDropTarget();
        this.grenades.push(new Grenade(this.position.x, this.position.y, tx, ty));
        break;
      }
      case BombType.TimedBomb: {
        const [tx, ty] = this.randomDropTarget();
        this.timedBombs.push(new TimedBomb(this.position.x, this.position.y, tx, ty));
        break;
      }
      case BombType.Landmine: {
        const [x, y] = this.randomLandminePosition();
        this.landmines.push(new Landmine(x, y));
        break;
      }
      case BombType.Torpedo: {
        // 보스 왼쪽 또는 오른쪽 옆에서, 바깥쪽으로 살짝 기울어진 아래 방향으로 발사 → 이후 아주 살짝 플레이어를 따라감
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = this.position.x + side * (BOSS_SIZE / 2 + 4);
        const angle = Math.PI / 2 - side * (Math.PI / 4);
        this.bullets.push(new Torpedo(x, this.position.y, angle, () => this.targetPosition));
        break;
      }
      case BombType.GasBomb: {
        // 보스에서 아래쪽으로 빠르게 발사 (수직에서 살짝 벗어난 무작위 각도)
        const angle = Math.PI / 2 + randomRange(-GAS_BOMB_MAX_ANGLE, GAS_BOMB_MAX_ANGLE);
        this.bullets.push(new GasBomb(this.position.x, this.getBottom(), angle));
        break;
      }
    }
  }

  // 지뢰 위치: 화면 안의 무작위 위치 (플레이어 바로 근처는 피함)
  private randomLandminePosition(): [number, number] {
    const margin = 40;
    let x = 0;
    let y = 0;
    for (let i = 0; i < 10; i++) {
      x = randomRange(margin, SCREEN_WIDTH - margin);
      y = randomRange(BOMB_DROP_MIN_Y, SCREEN_HEIGHT - margin);
      if (Math.hypot(x - this.targetPosition.x, y - this.targetPosition.y) >= LANDMINE_MIN_PLAYER_DISTANCE) {
        break;
      }
    }
    return [x, y];
  }

  // 이번 프레임에 저격이 발사됐으면 저격 지점 (없으면 null)
  takeSniperShot(): Vector2 | null {
    return this.sniper ? this.sniper.takeShot() : null;
  }

  getLandmines(): Landmine[] {
    return this.landmines;
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

    // 폭탄 (지뢰/대형 폭탄은 바닥에 깔리므로 먼저)
    this.landmines.forEach((mine) => mine.draw(ctx));
    this.bigBombs.forEach((bigBomb) => bigBomb.draw(ctx));
    this.timedBombs.forEach((bomb) => bomb.draw(ctx));
    this.guns.forEach((gun) => gun.draw(ctx));
    this.heldWeapon?.draw(ctx);
    this.rocketLaunchers.forEach((launcher) => launcher.draw(ctx));
    this.sniper?.draw(ctx);
    this.gatling?.draw(ctx);
    this.grenades.forEach((grenade) => grenade.draw(ctx));

    // 탄막 렌더링
    this.bullets.forEach((bullet) => {
      bullet.draw(ctx);
    });
  }
}
