export class InputManager {
  private keysPressed: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keysPressed.add(event.key.toLowerCase());
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.key.toLowerCase());
  }

  isKeyDown(key: string): boolean {
    return this.keysPressed.has(key.toLowerCase());
  }

  isAnyKeyDown(): boolean {
    return this.keysPressed.size > 0;
  }

  reset(): void {
    this.keysPressed.clear();
  }
}
