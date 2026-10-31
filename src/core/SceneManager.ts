export type SceneName = 'menu' | 'game' | 'gameover' | 'clear';
export type ModeName = 'lapidoculus' | 'messor' | 'mol';

interface Scene {
  name: SceneName;
  update(deltaTime: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export class SceneManager {
  private scenes: Map<SceneName, Scene> = new Map();
  private currentScene: Scene | null = null;
  private currentSceneName: SceneName | null = null;
  private currentMode: ModeName = 'lapidoculus';

  registerScene(name: SceneName, scene: Scene): void {
    this.scenes.set(name, scene);
  }

  switchScene(name: SceneName): void {
    const scene = this.scenes.get(name);
    if (!scene) {
      console.warn(`Scene ${name} not registered`);
      return;
    }
    this.currentScene = scene;
    this.currentSceneName = name;
  }

  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  getCurrentSceneName(): SceneName | null {
    return this.currentSceneName;
  }

  getCurrentMode(): ModeName {
    return this.currentMode;
  }

  setCurrentMode(mode: ModeName): void {
    this.currentMode = mode;
  }

  update(deltaTime: number): void {
    this.currentScene?.update(deltaTime);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.currentScene?.draw(ctx);
  }
}
