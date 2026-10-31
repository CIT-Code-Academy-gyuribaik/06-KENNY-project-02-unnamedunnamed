import { InputManager } from './InputManager';
import { UIManager } from './UIManager';
import { LapidoculusMode } from '@modes/lapidoculus/LapidoculusMode';
import { SaveManager } from './SaveManager';
import { SCREEN_WIDTH, SCREEN_HEIGHT, FPS } from '@utils/Constants';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private inputManager: InputManager;
  private uiManager: UIManager;
  private mode: LapidoculusMode;
  private lastFrameTime: number = 0;
  private isRunning: boolean = true;
  private clearWaitTime: number = 0;
  private gameOverWaitTime: number = 0;
  private lastPauseKeyDown: boolean = false;
  private lastUpKeyDown: boolean = false;
  private lastDownKeyDown: boolean = false;
  private lastEnterKeyDown: boolean = false;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = SCREEN_WIDTH;
    this.canvas.height = SCREEN_HEIGHT;

    this.inputManager = new InputManager();
    this.uiManager = new UIManager();
    this.mode = new LapidoculusMode();
  }

  private handleInput(deltaTime: number): void {
    // 입력 수집
    const inputX =
      (this.inputManager.isKeyDown('arrowright') || this.inputManager.isKeyDown('d') ? 1 : 0) -
      (this.inputManager.isKeyDown('arrowleft') || this.inputManager.isKeyDown('a') ? 1 : 0);
    const inputY =
      (this.inputManager.isKeyDown('arrowdown') || this.inputManager.isKeyDown('s') ? 1 : 0) -
      (this.inputManager.isKeyDown('arrowup') || this.inputManager.isKeyDown('w') ? 1 : 0);

    const dashPressed = this.inputManager.isKeyDown('z');
    const stiffenPressed = this.inputManager.isKeyDown('x');
    const pausePressed = this.inputManager.isKeyDown('escape');

    // ESC: 일시정지 토글 (한 번만)
    if (pausePressed && !this.lastPauseKeyDown) {
      this.uiManager.togglePause();
    }
    this.lastPauseKeyDown = pausePressed;

    // 일시정지 메뉴 조작
    if (this.uiManager.isPausedState()) {
      const upPressed = this.inputManager.isKeyDown('arrowup') || this.inputManager.isKeyDown('w');
      const downPressed = this.inputManager.isKeyDown('arrowdown') || this.inputManager.isKeyDown('s');
      const enterPressed = this.inputManager.isKeyDown('enter');

      if (upPressed && !this.lastUpKeyDown) {
        this.uiManager.moveMenuUp();
      }
      if (downPressed && !this.lastDownKeyDown) {
        this.uiManager.moveMenuDown();
      }
      if (enterPressed && !this.lastEnterKeyDown) {
        this.handlePauseMenuAction();
      }

      this.lastUpKeyDown = upPressed;
      this.lastDownKeyDown = downPressed;
      this.lastEnterKeyDown = enterPressed;
      return;
    }

    this.lastUpKeyDown = false;
    this.lastDownKeyDown = false;
    this.lastEnterKeyDown = false;

    // 모드에 입력 전달
    this.mode.handleInput(inputX, inputY, dashPressed, stiffenPressed);
  }

  private handlePauseMenuAction(): void {
    const option = this.uiManager.getSelectedMenuOption();
    switch (option) {
      case '재개':
        this.uiManager.togglePause();
        break;
      case '저장':
        SaveManager.save({
          gameMode: 'lapidoculus',
          stage: 1,
          player: {
            x: 0,
            y: 0,
            health: 4,
          },
        });
        break;
      case '설정':
        console.log('설정 메뉴');
        break;
      case '나가기':
        this.mode.reset();
        break;
    }
  }

  private handleEndState(): void {
    // 클리어/게임오버 상태 처리
    if (this.mode.getIsCleared()) {
      this.clearWaitTime += 1 / FPS;
      if (this.clearWaitTime > 2 || this.inputManager.isAnyKeyDown()) {
        this.mode.reset();
        this.clearWaitTime = 0;
      }
    }

    if (this.mode.getIsGameOver()) {
      this.gameOverWaitTime += 1 / FPS;
      if (this.gameOverWaitTime > 2 || this.inputManager.isAnyKeyDown()) {
        this.mode.reset();
        this.gameOverWaitTime = 0;
      }
    }
  }

  private update(deltaTime: number): void {
    this.handleInput(deltaTime);
    this.mode.update(deltaTime, this.uiManager.isPausedState());
    this.handleEndState();
  }

  private draw(): void {
    // 캔버스 지우기
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 모드 렌더링
    this.mode.draw(this.ctx);

    // UI 렌더링
    if (this.uiManager.isPausedState()) {
      this.uiManager.drawPauseMenu(this.ctx);
    }

    if (this.mode.getIsCleared()) {
      this.uiManager.drawClearScreen(this.ctx);
    }

    if (this.mode.getIsGameOver()) {
      this.uiManager.drawGameOver(this.ctx);
    }
  }

  private gameLoop = (currentTime: number): void => {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
    }

    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.016); // 최대 16ms
    this.lastFrameTime = currentTime;

    this.update(deltaTime);
    this.draw();

    if (this.isRunning) {
      requestAnimationFrame(this.gameLoop);
    }
  };

  start(): void {
    this.isRunning = true;
    requestAnimationFrame(this.gameLoop);
  }

  stop(): void {
    this.isRunning = false;
  }
}
