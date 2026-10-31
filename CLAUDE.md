# 가재(가제) 게임 개발 문서

## 프로젝트 개요

**2D 멀티 장르 게임: 3명의 주인공이 각자 다른 모드에서 탈출**

- **플랫폼:** PC, 키보드 조작
- **엔진:** Canvas (HTML5)
- **언어:** TypeScript
- **빌드:** Webpack (또는 직접 파일)

### 3개 모드

1. **Lapidoculus (탄막)**
   - 전투력 없음, 회피만 가능
   - 기능: 대시(무적 0.3초), 경직(능력치 상승), 장신구 장착
   - 체력: 4칸, 스테이지 클리어 시 저장

2. **Messor (크래프팅 액션)**
   - 적 본부 탈출, 전투 가능
   - 기능: 인벤토리, 제작, 스킬 트리, 베이스캠프
   - 체력: 최대 1000 (피격 원인별 대미지)
   - 저장: 거처에서 수동 저장

3. **MOL (메트로배니아)**
   - 참호 탈출, 탐험 중심
   - 기능: 근접/원거리 공격, 재화 상점, 수집
   - 체력: 3칸 (시간/처치 수에 따라 회복)
   - 저장: 수동 + 스토리 지점 자동 저장

### 공통 시스템

- **ESC 일시정지 메뉴:** 저장, 설정, 재개, 나가기
- **대화:** 말풍선 (모드별 스타일 다름)
- **모드 전환:** 보스 1~2체 처치 후 다음 모드로
- **1막 진행 순서:** 1→2→3→2→1→3→1→3→2→1→2→3

---

## 폴더 구조

```
src/
├── core/                    # 공유 시스템
│   ├── Game.ts             # 메인 게임 루프, 상태 관리, 모드 전환
│   ├── InputManager.ts      # 키 입력 수집 (↑↓←→, Z, X, ESC)
│   ├── SceneManager.ts      # 씬/모드 관리
│   ├── SaveManager.ts       # LocalStorage 저장/로드
│   ├── DialogueManager.ts   # 말풍선 UI (모드별 커스텀 가능)
│   └── UIManager.ts         # 체력바, ESC 메뉴, 클리어/게임오버 UI
├── modes/
│   ├── Mode.ts             # 모드 기본 클래스 (abstract)
│   ├── lapidoculus/
│   │   ├── LapidoculusMode.ts
│   │   ├── Player.ts       # 플레이어: 이동, 대시, 경직
│   │   ├── BulletPattern.ts # 탄막 패턴 정의 (2개)
│   │   ├── Enemy.ts        # 보스 AI
│   │   └── Scene.ts        # 배경, 스테이지 레이아웃
│   ├── messor/             # (MVP 이후)
│   └── mol/                # (MVP 이후)
├── entities/               # 공유 개체
│   ├── GameObject.ts       # 기본 게임 오브젝트
│   ├── Bullet.ts           # 탄막
│   └── Collider.ts         # 충돌 감지
├── utils/
│   ├── Vector2.ts          # 2D 벡터
│   └── Constants.ts        # 상수 (화면 크기, FPS 등)
└── index.ts                # 엔트리 포인트
```

---

## 코딩 규칙

### TypeScript & OOP

- **클래스명:** PascalCase (Player, BulletPattern, LapidoculusMode)
- **메서드명:** camelCase (update, draw, takeDamage)
- **상수:** UPPER_SNAKE_CASE (SCREEN_WIDTH, DASH_DURATION)
- **private/protected:** 명시적으로 표기 (_position, protected health)
- **인터페이스:** I-prefix 또는 설명적 이름 (IGameObject, Collidable)

### 파일 구조

```typescript
// 임포트
import { Vector2 } from '@utils/Vector2';

// 인터페이스/타입
interface IUpdateable {
  update(deltaTime: number): void;
}

// 메인 클래스
export class Player implements IUpdateable {
  // 프로퍼티
  private position: Vector2;
  private velocity: Vector2;
  
  // 생성자
  constructor(x: number, y: number) { }
  
  // 퍼블릭 메서드
  public update(deltaTime: number): void { }
  public draw(ctx: CanvasRenderingContext2D): void { }
  
  // 프라이빗 메서드
  private checkCollisions(): void { }
}
```

---

## MVP 구현 체크리스트

### 기본 구조 (1단계)
- [ ] Game.ts: 게임 루프 (requestAnimationFrame, 60fps)
- [ ] InputManager.ts: 키 수집 (isKeyDown)
- [ ] SceneManager.ts: 씬 전환
- [ ] Canvas 렌더링 파이프라인

### 플레이어 (2단계)
- [ ] Player.ts: 이동 (↑↓←→ 4방향)
- [ ] 대시 (Z): 0.3초 무적, 0.5초 쿨다운, 이동 방향 유지
- [ ] 경직 (X): 5~10초 유지 후 능력치 상승 (공격 1.5배, 방어 1.5배)
- [ ] Collider.ts: 충돌 감지 (AABB)

### 보스 & 탄막 (3단계)
- [ ] BulletPattern.ts: 2개 패턴 정의 (원형, 직선 등)
- [ ] Enemy.ts: 보스 AI (패턴 순환, 체력)
- [ ] Bullet.ts: 탄막 생성/이동/충돌

### UI & 게임 플로우 (4단계)
- [ ] 체력바 (4칸 표시)
- [ ] ESC 메뉴: 재개, 저장, 설정, 나가기
- [ ] 클리어 화면 (보스 처치 후)
- [ ] 게임오버 화면 (체력 0)

### 저장 & 테스트 (5단계)
- [ ] SaveManager.ts: LocalStorage 저장/로드 JSON
- [ ] 스테이지 클리어 시 자동 저장
- [ ] 플레이 테스트: 조작감, 밸런스 확인

---

## 저장 데이터 포맷 (JSON)

```json
{
  "version": "1.0",
  "gameMode": "lapidoculus",
  "stage": 1,
  "player": {
    "x": 100,
    "y": 200,
    "health": 3,
    "position": { "x": 100, "y": 200 }
  },
  "timestamp": 1635696000000
}
```

---

## 키 바인딩

| 키 | 기능 |
|----|------|
| ↑↓←→ | 이동 |
| Z | 대시 (무적, 쿨다운) |
| X | 경직 (능력치 상승) |
| ESC | 일시정지 메뉴 |

---

## 개발 참고사항

### 성능
- 60fps 유지 목표
- Canvas 렌더링 최소화 (필요한 개체만 매 프레임 그리기)
- 탄막 최대 개수: 200개 (성능 테스트 필요)

### 충돌 감지
- AABB (Axis-Aligned Bounding Box) 사용
- 플레이어 vs 탄막, 플레이어 vs 보스 히트박스

### 게임 밸런스 (초안)
- 플레이어 크기: 32x32px
- 탄막 크기: 8x8px
- 보스 체력: 50~100 (2단계 패턴)
- 피격 대미지: 1칸 = 1회 피격

---

## 다음 단계

### MVP 완료 후
1. 시각 개선 (스프라이트, 이펙트)
2. Messor 모드 구현 (크래프팅)
3. MOL 모드 구현 (메트로배니아)
4. 모드 전환 시스템
5. 음성/음악 추가
