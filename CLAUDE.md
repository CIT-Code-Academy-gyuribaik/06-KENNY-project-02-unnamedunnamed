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
   - 피격 시: 1칸 감소, 0.8초 무적(깜빡임), 피격 원인 반대 방향으로 넉백(0.2초, 이동 입력 무시, 대시로 취소 가능). 칼자국은 넉백 없음
   - 공격 오브젝트 콘셉트: 무기(칼, 총 등). 디테일 최소화, 한두 가지 색으로 표현
   - **공통 규칙:** 폭탄/총 등 무기 본체에는 피해 없음 (발사된 탄/폭발만 피해). 대시·경직 무적 중에는 모든 공격 통과. 모드는 화면에 표시하지 않음. 수치는 모두 `Constants.ts`
   - 1스테이지 기본 패턴 (항상 존재): 칼자국 — 무작위로 생기는 매우 얇은 평행사변형/마름모 (`KnifeMark.ts`). 생기면 영구히 남으며, 25개를 넘으면 무작위로 1개를 지우고 새 위치에 1개 생성. 2/3는 플레이어 근처에 조준 생성, 1/3은 무작위(주로 화면 중앙과 모서리)
     - 화염방사기 불꽃에 닿으면 지워짐
     - 막 그어진 칼자국(선명해진 뒤 0.2초 이내)에 권총/소총/개틀링/산탄 총알이 닿으면 거울 반사
     - 슬러그는 > / 꼬리선이 닿은 부분만 지움 → 대부분 둘로 갈라짐 (조각은 원래 칼자국의 나이/피해를 유지)
   - 1스테이지: 3분 생존. 보스 모드가 30초마다 전환 (폭탄 Bombs → 소총 Rifle → 매복 Ambush → 반복, 각 모드 2번씩). 모드별 패턴은 `Enemy.ts`
   - **Bombs 모드** — 일반 폭탄 5종이 하나의 타이머(1.0~1.4초 간격)로 같은 확률로 등장
     - 수류탄(`Grenade.ts`): 양 끝이 잘린 타원. 착지 후 방향 예고선 → 고속 구슬 5발 무작위 방향
     - 시한폭탄(`TimedBomb.ts`): 요철 테두리 사각형. 5~8초 동안 점점 빠르게 깜빡임 → 삼각형 2발 45° 대각선 반대 방향
     - 지뢰(`Landmine.ts`): 그물 모양 사각형. 무작위 위치에 서서히 나타남 → 밟으면 1초 뒤 폭발(반지름 48). 폭발 범위 안의 다른 지뢰도 1초 카운트다운 시작(연쇄). 12초간 안 밟히면 사라짐
     - 어뢰(`BombProjectiles.ts`): 아주 작은 폭탄. 보스 옆에서 발사, 플레이어를 살짝 따라감. 피해 없이 1초간 이동 속도 70%
     - 가스탄(`BombProjectiles.ts`): 원형. 보스에서 아래로 빠르게 발사 → 화면 아래로 빠져나감. 1 피해 + 3초간 화면 살짝 흐려짐
     - 대형 폭탄(`BigBomb.ts`): 모드 종료 6초 전에만 화면 중앙에 오각형으로 등장 (이때부터 일반 폭탄 중단) → 각 꼭짓점에서 5발씩 연속 발사
   - **Rifle 모드** — 기본 패턴 5종이 하나의 타이머(1.0~1.4초 간격)로 같은 확률로 등장 + 특수 패턴 2종
     - 총 공통(`Gun.ts`): 나타남 → 탄 경로 예고선 → 발사 → 사라짐. 0/90/180/270° 방향만. 플레이어의 이동 방향 예측 위치(0.9초 뒤)를 노림
     - 권총(`Handgun.ts`): ㄱ자 모양. 어뢰 크기 탄 2발을 짧은 간격으로 (수류탄 구슬 속도)
     - 소총(`RifleGun.ts`): 선 4개(가운데에서 꺾여 교차하는 긴 선 2개 + 아래쪽 가로선 2개). 화면 왼쪽/오른쪽 끝에서만 등장. 뾰족한 삼각형 4~6발을 한 줄로 매우 빠르게(900px/s)
     - 화염방사기(`Flamethrower.ts`): 선만 있는 사각형 + 안쪽 평행선 + 위쪽 작은 타원 + 오른쪽 C자. 보스 왼쪽 옆면에 붙음. 아래쪽을 오른쪽 → 왼쪽으로 쓸며 불꽃 발사, 내려갈수록 퍼짐. 걸어서는 못 피하고 대시로 통과해야 함
     - 로켓 발사기(`RocketLauncher.ts`): 집 모양 오각형 2개 + 사이의 얇은 선. 뾰족한 끝이 로켓. 로켓 2발이 느리게 플레이어를 따라가다 5초 뒤 폭발(지뢰의 2배 범위, 연쇄 폭발 없음). 폭발 1.5초 전부터 범위 표시
     - 산탄총(`Shotgun.ts`): 끝이 둥근 사각형. 보스 왼쪽 옆면에서 플레이어를 직접 조준(각도 제한 없음). 흰색 슬러그(=====(탄)> 모양, 700px/s, 꼬리선이 멀리 갈수록 벌어짐, 탄/꼬리선/> 모두 피해) 또는 산탄 9발 부채꼴
     - 보스가 직접 드는 무기(화염방사기/산탄총)는 한 번에 하나만, 드는 동안 보스는 멈춤
     - 특수 — 저격(`Sniper.ts`): Rifle 모드 동안 흰 점이 플레이어를 따라다님. 모드당 한 번 무작위 시점에 빨갛게 멈춤 → 0.6초 뒤 그 지점 저격, 맞으면 즉사. 쏜 뒤 그 모드 동안 점 사라짐
     - 특수 — 개틀링(`Gatling.ts`): 사각형 + 한쪽 면의 선 6개. 2번째 Rifle 모드 종료 5.5초 전에만 등장(테스트: `GATLING_TEST_ON_FIRST_RIFLE`). 보스가 들던 무기를 버리고 오른쪽 옆면에 들고, 화면을 가로질러 이동하며 총구를 흔들어 약 3.5초간 연사(약 56발)
   - **Ambush 모드** — 아직 미구현 (임시 원형/직선 패턴)

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
│   │   ├── LapidoculusMode.ts # 스테이지 진행, 충돌/피해, 칼자국 반사·절단, 가스 흐림
│   │   ├── Player.ts       # 플레이어: 이동, 대시, 경직, 넉백, 감속, 즉사
│   │   ├── Enemy.ts        # 보스 AI: 모드 전환, 폭탄/총 생성, 보스가 드는 무기
│   │   ├── KnifeMark.ts    # 칼자국 (항상 존재하는 기본 패턴)
│   │   ├── Grenade.ts / TimedBomb.ts / Landmine.ts / BigBomb.ts # Bombs 모드 폭탄
│   │   ├── BombProjectiles.ts # 폭탄 탄: 구슬, 삼각형, 폭발 범위, 어뢰, 가스탄, 대형 폭탄 탄
│   │   ├── Gun.ts          # 총 공통 (권총/소총)
│   │   ├── Handgun.ts / RifleGun.ts / Flamethrower.ts / RocketLauncher.ts / Shotgun.ts # Rifle 기본 패턴
│   │   ├── Sniper.ts / Gatling.ts # Rifle 특수 패턴
│   │   ├── BulletPattern.ts # 임시 탄막 패턴 (Ambush 모드 구현 전까지)
│   │   └── Scene.ts        # (예정) 배경, 스테이지 레이아웃
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
| Space | 대시 (대시 중 무적, 쿨다운) |
| 왼쪽 Shift | 경직 (능력치 상승) |
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
