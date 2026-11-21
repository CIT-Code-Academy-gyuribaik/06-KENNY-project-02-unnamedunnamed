import { GameObject } from './GameObject';
import { Collider } from './Collider';
import { Vector2 } from '@utils/Vector2';
import { SCREEN_WIDTH, SCREEN_HEIGHT, BULLET_SIZE } from '@utils/Constants';

// 탄에 맞았을 때 피해 외에 추가로 걸리는 효과
export enum BulletEffect {
  None = 'none',
  Slow = 'slow', // 어뢰: 이동 속도 감소
  Blur = 'blur', // 가스탄: 화면 흐려짐
}

export class Bullet extends GameObject {
  public dealsDamage: boolean = true; // false 면 피해 없이 효과만
  public effect: BulletEffect = BulletEffect.None;
  public consumeOnHit: boolean = true; // 맞으면 사라짐 (폭발 범위처럼 남아야 하는 건 false)
  public touchesPlayer: boolean = true; // false 면 플레이어와 부딪혀도 아무 일 없음 (로켓 본체 등)
  public reflectsOffKnifeMarks: boolean = false; // true 면 막 그어진 칼자국에 닿을 때 튕겨 나감 (권총/소총/개틀링/산탄)
  protected spawned: Bullet[] = []; // 이 탄이 새로 만들어 낸 탄 (예: 로켓 폭발). 소유자가 takeSpawned() 로 가져감

  // 대상과 닿았는지. 기본은 사각형(AABB) 판정. 모양이 특이한 탄(예: 슬러그의 꼬리선)은 재정의
  hitTest(target: GameObject): boolean {
    return Collider.checkAABB(target, this);
  }

  // 이번 프레임에 새로 만들어진 탄을 꺼내 감
  takeSpawned(): Bullet[] {
    const spawned = this.spawned;
    this.spawned = [];
    return spawned;
  }

  constructor(x: number, y: number, velocityX: number, velocityY: number) {
    super(x, y, BULLET_SIZE, BULLET_SIZE);
    this.velocity = new Vector2(velocityX, velocityY);
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    // 화면 범위 밖 체크
    if (
      this.position.x < -BULLET_SIZE ||
      this.position.x > SCREEN_WIDTH + BULLET_SIZE ||
      this.position.y < -BULLET_SIZE ||
      this.position.y > SCREEN_HEIGHT + BULLET_SIZE
    ) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(this.getLeft(), this.getTop(), this.width, this.height);
  }
}
