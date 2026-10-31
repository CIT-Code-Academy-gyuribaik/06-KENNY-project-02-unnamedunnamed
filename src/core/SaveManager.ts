interface SaveData {
  version: string;
  gameMode: string;
  stage: number;
  player: {
    x: number;
    y: number;
    health: number;
  };
  timestamp: number;
}

export class SaveManager {
  private static readonly SAVE_KEY = 'gajae_save';
  private static readonly VERSION = '1.0';

  static save(data: Partial<SaveData>): void {
    const saveData: SaveData = {
      version: this.VERSION,
      gameMode: data.gameMode || 'lapidoculus',
      stage: data.stage || 1,
      player: {
        x: data.player?.x || 0,
        y: data.player?.y || 0,
        health: data.player?.health || 4,
      },
      timestamp: Date.now(),
    };

    localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
  }

  static load(): SaveData | null {
    const saved = localStorage.getItem(this.SAVE_KEY);
    if (!saved) return null;

    try {
      return JSON.parse(saved) as SaveData;
    } catch {
      console.error('Failed to load save data');
      return null;
    }
  }

  static clear(): void {
    localStorage.removeItem(this.SAVE_KEY);
  }

  static hasSave(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }
}
