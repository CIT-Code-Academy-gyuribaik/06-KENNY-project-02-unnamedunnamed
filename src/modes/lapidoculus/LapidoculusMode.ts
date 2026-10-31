import { Mode } from '../Mode';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Collider } from '@entities/Collider';
import { SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_MAX_HEALTH, STIFFEN_DURATION_MIN, STIFFEN_DURATION_MAX } from '@utils/Constants';
import { SaveManager } from '@core/SaveManager';

export class LapidoculusMode extends Mode {
  private player: Player;
  private enemy: Enemy;
  private lastStiffenCollision: number = 0; // 경직 충돌 쿨다운
  private clearMessageTime: number = 0;
  private gameOverMessageTime: number = 0;

  constructor() {
    super();
    this.player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 100);
    this.enemy = new Enemy(SCREEN_WIDTH / 2, 100);
  }

  update(deltaTime: number, isGamePaused: boolean): void {
    if (isGamePaused || this.isCleared || this.isGameOver) {
      return;
    }

    // 플레이어 업데이트
    this.player.update(deltaTime);

    // 경직 충돌 쿨다운
    if (this.lastStiffenCollision > 0) {
      this.lastStiffenCollision -= deltaTime;
    }

    this.enemy.update(deltaTime);

    // 탄막 충돌 체크 (경직 중에는 무적)
    if (!this.player.getIsStiffening()) {
      const bullets = this.enemy.getBullets();
      for (const bullet of bullets) {
        if (Collider.checkAABB(this.player, bullet)) {
          this.player.takeDamage();
          bullet.active = false;

          if (this.player.isDead()) {
            this.isGameOver = true;
            this.gameOverMessageTime = 0;
            return;
          }
        }
      }
    }

    // 경직 해제 후 보스와 충돌하면 데미지
    if (this.player.isStiffenReleasingNow() && Collider.checkAABB(this.player, this.enemy)) {
      if (this.lastStiffenCollision <= 0) {
        this.enemy.takeDamage();
        this.lastStiffenCollision = 0.2; // 0.2초 쿨다운 (중복 충돌 방지)
      }
    }

    // 게임 클리어 체크
    if (this.enemy.isDead()) {
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

    // 그리드 배경
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for (let i = 0; i < SCREEN_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, SCREEN_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < SCREEN_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(SCREEN_WIDTH, i);
      ctx.stroke();
    }

    // 게임 오브젝트
    this.player.draw(ctx);
    this.enemy.draw(ctx);

    // UI
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`HP: ${this.player.getHealth()} / ${PLAYER_MAX_HEALTH}`, 20, 30);
    ctx.fillText(`Boss HP: ${this.enemy.getHealth()}`, 20, 50);
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
    this.lastStiffenCollision = 0;
  }
}
