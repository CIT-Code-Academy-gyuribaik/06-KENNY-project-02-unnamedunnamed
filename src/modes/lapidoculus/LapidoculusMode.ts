import { Mode } from '../Mode';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { KnifeMark } from './KnifeMark';
import { Flame } from './Flamethrower';
import { Slug } from './Shotgun';
import {
  KNIFE_MARK_SPAWN_MIN,
  KNIFE_MARK_SPAWN_MAX,
  KNIFE_MARK_MAX_COUNT,
  STAGE_1_DURATION,
  TORPEDO_SLOW_MULTIPLIER,
  TORPEDO_SLOW_DURATION,
  GAS_BLUR_DURATION,
  GAS_BLUR_AMOUNT,
  SNIPER_HIT_RADIUS,
  SLUG_LINE_THICKNESS,
} from '@utils/Constants';
import { Collider } from '@entities/Collider';
import { Bullet, BulletEffect } from '@entities/Bullet';
import { SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_MAX_HEALTH, STIFFEN_DURATION_MIN, STIFFEN_DURATION_MAX } from '@utils/Constants';
import { SaveManager } from '@core/SaveManager';
import { Vector2 } from '@utils/Vector2';

export class LapidoculusMode extends Mode {
  private player: Player;
  private enemy: Enemy;
  private stageTimer: number = 0;
  private stageDuration: number = STAGE_1_DURATION; // 3분 생존하면 클리어
  private clearMessageTime: number = 0;
  private gameOverMessageTime: number = 0;

  // 1스테이지 기본 패턴: 칼자국
  private knifeMarks: KnifeMark[] = [];
  private knifeMarkSpawnTimer: number = KNIFE_MARK_SPAWN_MAX;

  // 가스탄에 맞으면 화면이 잠시 흐려짐 (남은 시간)
  private blurTime: number = 0;

  constructor() {
    super();
    this.player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 100);
    this.enemy = new Enemy(SCREEN_WIDTH / 2, 100);
  }

  update(deltaTime: number, isGamePaused: boolean): void {
    if (isGamePaused || this.isCleared || this.isGameOver) {
      return;
    }

    // 스테이지 타이머
    this.stageTimer += deltaTime;

    // 플레이어 업데이트
    this.player.update(deltaTime);

    this.enemy.setTargetPosition(this.player.position, this.player.velocity);
    this.enemy.update(deltaTime);

    if (this.blurTime > 0) {
      this.blurTime = Math.max(0, this.blurTime - deltaTime);
    }

    // 저격: 빨간 점이 멈춘 자리를 쏨. 맞으면 즉사 (대시/경직 무적 중에는 통과)
    const sniperShot = this.enemy.takeSniperShot();
    if (sniperShot && Collider.checkCircle(sniperShot.x, sniperShot.y, SNIPER_HIT_RADIUS, this.player) && this.player.kill()) {
      this.isGameOver = true;
      this.gameOverMessageTime = 0;
      return;
    }

    // 지뢰: 밟으면 작동 (폭발은 1초 뒤, 무적 중에도 밟으면 작동)
    for (const mine of this.enemy.getLandmines()) {
      if (mine.canTrigger() && Collider.checkAABB(this.player, mine)) {
        mine.trigger();
      }
    }

    // 칼자국 생성/업데이트
    this.knifeMarkSpawnTimer -= deltaTime;
    if (this.knifeMarkSpawnTimer <= 0) {
      // 칼자국은 영구히 남음. 최대 개수에 도달하면 무작위로 1개를 지우고 새로 생성
      const remaining = this.knifeMarks.filter((mark) => !mark.getIsRemoving());
      if (remaining.length >= KNIFE_MARK_MAX_COUNT) {
        remaining[Math.floor(Math.random() * remaining.length)].remove();
      }
      this.knifeMarks.push(KnifeMark.createRandom(this.player.position.x, this.player.position.y));
      this.knifeMarkSpawnTimer = KNIFE_MARK_SPAWN_MIN + Math.random() * (KNIFE_MARK_SPAWN_MAX - KNIFE_MARK_SPAWN_MIN);
    }
    this.knifeMarks.forEach((mark) => mark.update(deltaTime));
    this.knifeMarks = this.knifeMarks.filter((mark) => mark.active);

    // 슬러그: > / 꼬리선이 닿은 부분만 칼자국을 지움 → 대부분 둘로 갈라짐
    this.eraseKnifeMarksBySlugs();

    // 막 그어진 칼자국에 권총/소총/개틀링/산탄 총알이 닿으면 튕겨 나감
    this.reflectBulletsOffKnifeMarks(deltaTime);

    // 화염방사기 불꽃에 닿은 칼자국은 지워짐 (서서히 사라짐, 피해 없음)
    for (const bullet of this.enemy.getBullets()) {
      if (!(bullet instanceof Flame)) {
        continue;
      }
      for (const mark of this.knifeMarks) {
        if (!mark.getIsRemoving() && Collider.checkPolygonAABB(mark.getPoints(), bullet)) {
          mark.remove();
        }
      }
    }

    // 칼자국 충돌 체크 (베기 구간에만 피해, 무적 중에는 통과)
    for (const mark of this.knifeMarks) {
      if (mark.isDangerous() && Collider.checkPolygonAABB(mark.getPoints(), this.player) && this.player.takeDamage()) {
        if (this.player.isDead()) {
          this.isGameOver = true;
          this.gameOverMessageTime = 0;
          return;
        }
      }
    }

    // 보스 본체 충돌 체크: 보스와 겹쳐 있으면 피해 (무적 중에는 통과)
    if (Collider.checkAABB(this.player, this.enemy) && this.player.takeDamage(this.player.position.subtract(this.enemy.position))) {
      if (this.player.isDead()) {
        this.isGameOver = true;
        this.gameOverMessageTime = 0;
        return;
      }
    }

    // 탄막 충돌 체크 (대시/경직/피격 직후 무적 중에는 탄막이 통과)
    for (const bullet of this.enemy.getBullets()) {
      if (!bullet.touchesPlayer || this.player.isInvincible() || !bullet.hitTest(this.player)) {
        continue;
      }
      if (bullet.dealsDamage && !this.player.takeDamage(this.getBulletKnockback(bullet))) {
        continue;
      }
      this.applyBulletEffect(bullet);
      if (bullet.consumeOnHit) {
        bullet.active = false;
      }

      if (this.player.isDead()) {
        this.isGameOver = true;
        this.gameOverMessageTime = 0;
        return;
      }
    }

    // 게임 클리어 체크: 일정 시간 생존
    if (this.stageTimer >= this.stageDuration) {
      this.isCleared = true;
      this.clearMessageTime = 0;
      SaveManager.save({
        gameMode: 'lapidoculus',
        stage: 1,
        player: {
          x: this.player.position.x,
          y: this.player.position.y,
          health: this.player.getHealth(),
        },
      });
    }
  }

  handleInput(inputX: number, inputY: number, dashPressed: boolean, stiffenPressed: boolean): void {
    if (this.isCleared || this.isGameOver) {
      return;
    }

    this.player.setInput(inputX, inputY);
    this.player.setStiffenInput(stiffenPressed);

    if (dashPressed) {
      this.player.dash();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 배경
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 가스탄 효과: 게임 화면만 살짝 흐리게 (남은 시간/UI 글자는 그대로). 끝날 때 서서히 풀림
    if (this.blurTime > 0) {
      const strength = Math.min(1, this.blurTime / 0.5);
      ctx.filter = `blur(${(GAS_BLUR_AMOUNT * strength).toFixed(2)}px)`;
    }

    // 칼자국 (플레이어/보스보다 아래에 그림)
    this.knifeMarks.forEach((mark) => mark.draw(ctx));

    // 게임 오브젝트
    this.player.draw(ctx);
    this.enemy.draw(ctx);

    ctx.filter = 'none';

    // 남은 시간
    const remainingTime = Math.max(0, this.stageDuration - this.stageTimer);
    ctx.fillStyle = remainingTime < 10 ? '#ff0000' : '#00ff00';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`남은 시간: ${remainingTime.toFixed(1)}초`, SCREEN_WIDTH / 2, 30);

    // 경직 상태
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    const stiffenStatus = this.player.getIsStiffening() ? `충전중: ${(this.player.getStiffenChargePercent() * 100).toFixed(0)}%` : '준비완료';
    ctx.fillText(`경직: ${stiffenStatus}`, 20, 70);

    // 클리어 메시지
    if (this.isCleared) {
      this.clearMessageTime += 1 / 60;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('STAGE CLEAR!', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    }

    // 게임오버 메시지
    if (this.isGameOver) {
      this.gameOverMessageTime += 1 / 60;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    }
  }

  reset(): void {
    super.reset();
    this.player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 100);
    this.enemy = new Enemy(SCREEN_WIDTH / 2, 100);
    this.stageTimer = 0;
    this.knifeMarks = [];
    this.knifeMarkSpawnTimer = KNIFE_MARK_SPAWN_MAX;
    this.blurTime = 0;
  }

  // 슬러그의 > 가 쓸고 지나간 영역과 꼬리선에 걸친 칼자국 부분을 지움 (지워진 부분은 서서히 사라지는 조각이 됨)
  private eraseKnifeMarksBySlugs(): void {
    const eraseShapes = this.enemy
      .getBullets()
      .filter((bullet): bullet is Slug => bullet instanceof Slug)
      .flatMap((slug) => slug.getEraseShapes());
    if (eraseShapes.length === 0) {
      return;
    }

    const next: KnifeMark[] = [];
    for (const mark of this.knifeMarks) {
      if (mark.getIsRemoving()) {
        next.push(mark);
        continue;
      }
      const margin = mark.getHalfThickness() + SLUG_LINE_THICKNESS / 2;
      const intervals = eraseShapes
        .map((shape) => mark.getCoveredInterval(shape, margin))
        .filter((interval): interval is [number, number] => interval !== null);
      next.push(...(intervals.length > 0 ? mark.splitByErasing(intervals) : [mark]));
    }
    this.knifeMarks = next;
  }

  // 거울 반사: 칼자국의 선을 기준으로 진행 방향을 뒤집음
  // 빠른 총알은 한 프레임에 칼자국 두께보다 많이 움직이므로, 이번 프레임에 지나온 경로 전체로 판정
  private reflectBulletsOffKnifeMarks(deltaTime: number): void {
    const freshMarks = this.knifeMarks.filter((mark) => mark.isFresh());
    if (freshMarks.length === 0) {
      return;
    }
    for (const bullet of this.enemy.getBullets()) {
      if (!bullet.reflectsOffKnifeMarks) {
        continue;
      }
      const previous = bullet.position.subtract(bullet.velocity.multiply(deltaTime));
      const path = Collider.segmentToQuad(previous, bullet.position, bullet.width);

      for (const mark of freshMarks) {
        const axis = mark.getAxis();
        const normal = new Vector2(-axis.y, axis.x);
        const toPrevious = previous.subtract(mark.getCenter());
        const previousSide = toPrevious.x * normal.x + toPrevious.y * normal.y;
        const velocityDot = bullet.velocity.x * normal.x + bullet.velocity.y * normal.y;
        // 칼자국 쪽으로 다가오는 중일 때만 (이미 튕겨 나가는 중이면 무시 — 같은 칼자국에 여러 번 튕기지 않도록)
        if (velocityDot === 0 || previousSide * velocityDot > 0) {
          continue;
        }
        // 지나온 경로가 칼자국(잘린 조각이면 남은 부분만)에 닿았는지
        if (!mark.getCoveredInterval(path, mark.getHalfThickness())) {
          continue;
        }

        bullet.velocity = bullet.velocity.subtract(normal.multiply(2 * velocityDot));
        // 이미 선을 넘어갔으면 원래 쪽으로 되돌림 (거울에 비친 위치)
        const toCurrent = bullet.position.subtract(mark.getCenter());
        const currentSide = toCurrent.x * normal.x + toCurrent.y * normal.y;
        if (currentSide * previousSide < 0) {
          bullet.position = bullet.position.subtract(normal.multiply(2 * currentSide));
        }
        break;
      }
    }
  }

  // 넉백 방향: 움직이는 탄은 진행 방향, 멈춰 있는 것(지뢰 폭발)은 중심에서 바깥쪽
  private getBulletKnockback(bullet: Bullet): Vector2 {
    if (bullet.velocity.magnitude() > 0) {
      return bullet.velocity;
    }
    return this.player.position.subtract(bullet.position);
  }

  private applyBulletEffect(bullet: Bullet): void {
    switch (bullet.effect) {
      case BulletEffect.Slow:
        this.player.applySlow(TORPEDO_SLOW_MULTIPLIER, TORPEDO_SLOW_DURATION);
        break;
      case BulletEffect.Blur:
        this.blurTime = GAS_BLUR_DURATION;
        break;
    }
  }
}
