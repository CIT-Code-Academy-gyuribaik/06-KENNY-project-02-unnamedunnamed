import { SCREEN_WIDTH, SCREEN_HEIGHT, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, HEALTH_BAR_X, HEALTH_BAR_Y } from '@utils/Constants';

export class UIManager {
  private isPaused: boolean = false;
  private menuOptions: string[] = ['재개', '저장', '설정', '나가기'];
  private selectedMenuIndex: number = 0;

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  resetPause(): void {
    this.isPaused = false;
  }

  moveMenuUp(): void {
    this.selectedMenuIndex = (this.selectedMenuIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
  }

  moveMenuDown(): void {
    this.selectedMenuIndex = (this.selectedMenuIndex + 1) % this.menuOptions.length;
  }

  getSelectedMenuOption(): string {
    return this.menuOptions[this.selectedMenuIndex];
  }

  drawHealthBar(ctx: CanvasRenderingContext2D, currentHealth: number, maxHealth: number): void {
    const barWidth = HEALTH_BAR_WIDTH;
    const barHeight = HEALTH_BAR_HEIGHT;
    const x = HEALTH_BAR_X;
    const y = HEALTH_BAR_Y;

    // 배경
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // 체력 바
    const healthPercent = Math.max(0, Math.min(1, currentHealth / maxHealth));
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`HP: ${currentHealth} / ${maxHealth}`, x + 10, y + 16);
  }

  drawPauseMenu(ctx: CanvasRenderingContext2D): void {
    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 메뉴 제목
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('일시정지', SCREEN_WIDTH / 2, 100);

    // 메뉴 항목
    ctx.font = 'bold 20px Arial';
    this.menuOptions.forEach((option, index) => {
      const y = 200 + index * 60;
      if (index === this.selectedMenuIndex) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(SCREEN_WIDTH / 2 - 100, y - 25, 200, 40);
      }
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(option, SCREEN_WIDTH / 2, y);
    });
  }

  drawClearScreen(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE CLEAR!', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText('아무 키나 눌러서 계속...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 100);
  }

  drawGameOver(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText('아무 키나 눌러서 다시 시작...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 100);
  }
}
