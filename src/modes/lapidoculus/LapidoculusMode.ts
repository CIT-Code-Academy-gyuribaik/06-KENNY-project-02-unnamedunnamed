import { Mode } from '../Mode';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { KnifeMark } from './KnifeMark';
import { KNIFE_MARK_SPAWN_MIN, KNIFE_MARK_SPAWN_MAX, KNIFE_MARK_MAX_COUNT, STAGE_1_DURATION } from '@utils/Constants';
import { Collider } from '@entities/Collider';
import { SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_MAX_HEALTH, STIFFEN_DURATION_MIN, STIFFEN_DURATION_MAX } from '@utils/Constants';
import { SaveManager } from '@core/SaveManager';

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

    this.enemy.update(deltaTime);

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
    if (Collider.checkAABB(this.player, this.enemy) && this.player.takeDamage()) {
      if (this.player.isDead()) {
        this.isGameOver = true;
        this.gameOverMessageTime = 0;
        return;
      }
    }

    // 탄막 충돌 체크 (대시/경직/피격 직후 무적 중에는 탄막이 통과)
    if (!this.player.isInvincible()) {
      const bullets = this.enemy.getBullets();
      for (const bullet of bullets) {
        if (Collider.checkAABB(this.player, bullet) && this.player.takeDamage()) {
          bullet.active = false;

          if (this.player.isDead()) {
            this.isGameOver = true;
            this.gameOverMessageTime = 0;
            return;
          }
        }
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

    // 칼자국 (플레이어/보스보다 아래에 그림)
    this.knifeMarks.forEach((mark) => mark.draw(ctx));

    // 게임 오브젝트
    this.player.draw(ctx);
    this.enemy.draw(ctx);

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
  }
}
