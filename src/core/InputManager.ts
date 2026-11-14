export class InputManager {
  private keysPressed: Set<string> = new Set();
  // 물리 키 코드 (예: 'Space', 'ShiftLeft') — 좌/우 Shift 구분용
  private codesPressed: Set<string> = new Set();

  // 브라우저 기본 동작(스크롤 등)을 막을 키
  private static readonly BLOCKED_CODES = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    // 창 포커스를 잃으면 눌린 키 초기화 (키가 눌린 채로 남는 것 방지)
    window.addEventListener('blur', () => this.reset());
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (InputManager.BLOCKED_CODES.has(event.code)) {
      event.preventDefault();
    }
    this.keysPressed.add(event.key.toLowerCase());
    this.codesPressed.add(event.code);
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.key.toLowerCase());
    this.codesPressed.delete(event.code);
  }

  isKeyDown(key: string): boolean {
    return this.keysPressed.has(key.toLowerCase());
  }

  isCodeDown(code: string): boolean {
    return this.codesPressed.has(code);
  }

  isAnyKeyDown(): boolean {
    return this.keysPressed.size > 0;
  }

  reset(): void {
    this.keysPressed.clear();
    this.codesPressed.clear();
  }
}
