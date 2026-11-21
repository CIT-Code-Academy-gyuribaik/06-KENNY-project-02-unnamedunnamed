export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 600;
export const FPS = 60;
export const DELTA_TIME = 1 / FPS;

// Player
export const PLAYER_SIZE = 32;
export const PLAYER_SPEED = 200; // px/s
export const DASH_DURATION = 0.3; // seconds
export const DASH_COOLDOWN = 0.5; // seconds
export const DASH_SPEED = 400; // px/s
export const DASH_INVULNERABILITY = 0.3; // seconds
export const HIT_INVULNERABILITY = 0.8; // seconds, 피격 직후 무적 시간
export const KNOCKBACK_SPEED = 450; // px/s, 피격 시 넉백 초기 속도
export const KNOCKBACK_DURATION = 0.2; // seconds, 넉백 지속 시간 (이동 입력 무시, 속도는 선형 감소)
export const PLAYER_TURN_SPEED = 8; // rad/s, 이동 방향이 입력 방향으로 회전하는 속도

// Stiffen (경직)
export const STIFFEN_DURATION_MIN = 5; // seconds
export const STIFFEN_DURATION_MAX = 10; // seconds
export const STIFFEN_STAT_MULTIPLIER = 1.5; // 공격/방어 상승도

// Player Health
export const PLAYER_MAX_HEALTH = 4;

// Boss
export const BOSS_SIZE = 64;
export const BOSS_MAX_HEALTH = 100;
export const BOSS_SPEED = 100; // px/s
export const BOSS_MODE_DURATION = 30; // 보스 모드 전환 간격 (초)

// Stage
export const STAGE_1_DURATION = 180; // 1스테이지 생존 시간 (초) = 3분

// Bullets
export const BULLET_SIZE = 8;
export const BULLET_SPEED = 150; // px/s

// Knife marks (칼자국) — 1스테이지 기본 패턴
export const KNIFE_MARK_COLOR = '#E6E6E6';
export const KNIFE_MARK_LENGTH_MIN = 100; // px
export const KNIFE_MARK_LENGTH_MAX = 260; // px
export const KNIFE_MARK_THICKNESS_MIN = 3; // px (매우 얇게)
export const KNIFE_MARK_THICKNESS_MAX = 6; // px
export const KNIFE_MARK_WARNING_TIME = 0.6; // 예고 시간 (피해 없음)
export const KNIFE_MARK_FADE_TIME = 0.25; // 교체되어 사라지는 시간 (피해 없음)
export const KNIFE_MARK_AIMED_RATIO = 2 / 3; // 플레이어 조준 비율 (나머지는 무작위)
export const KNIFE_MARK_AIM_SPREAD = 50; // 조준 시 플레이어 주변 퍼짐 정도 (px, 표준편차)
export const KNIFE_MARK_FOCUS_RATIO = 0.8; // 무작위 중 중앙/모서리에 몰리는 비율 (나머지는 완전 무작위)
export const KNIFE_MARK_FOCUS_SPREAD = 80; // 중앙/모서리 주변 퍼짐 정도 (px, 표준편차)
export const KNIFE_MARK_MAX_COUNT = 25; // 최대 개수. 넘으면 무작위 1개 삭제 후 새로 생성
export const KNIFE_MARK_SPAWN_MIN = 0.35; // 생성 간격 최소 (초)
export const KNIFE_MARK_SPAWN_MAX = 0.8; // 생성 간격 최대 (초)
// 막 그어진 칼자국(선명해진 뒤 이 시간 이내)에 권총/소총/개틀링/산탄 총알이 닿으면 튕겨 나감 (거울 반사)
export const KNIFE_MARK_REFLECT_WINDOW = 0.2; // 초

// Bombs 모드 공통
export const BOMB_DROP_FLIGHT_TIME = 0.7; // 보스에서 떨어져 착지까지 걸리는 시간 (초)
export const BOMB_DROP_MIN_Y = 180; // 착지 지점 y 최소값 (보스 아래쪽)
// 일반 폭탄(수류탄/시한폭탄/지뢰/어뢰/가스탄)은 하나의 타이머로 같은 확률로 무작위 선택
export const BOMB_SPAWN_MIN = 1.0; // 폭탄 생성 간격 최소 (초) — 초당 1개 이하
export const BOMB_SPAWN_MAX = 1.4; // 폭탄 생성 간격 최대 (초)
export const BOMB_FIRST_SPAWN_DELAY = 1.0; // Bombs 모드 시작 후 첫 폭탄까지 (초)

// Grenade (수류탄): 착지 후 신관 시간 동안 탄 방향 예고 → 고속 구슬 5발
export const GRENADE_RADIUS_X = 9; // 타원 가로 반지름 (px)
export const GRENADE_RADIUS_Y = 5; // 타원 세로 반지름 (px)
export const GRENADE_FLAT_X = 7; // 얇은 쪽 양 끝을 평평하게 자르는 위치 (중심에서 px)
export const GRENADE_COLOR = '#6E7F3A';
export const GRENADE_FUSE_TIME = 1.0; // 착지 후 폭발까지 (초) = 방향 예고 시간
export const GRENADE_BALL_COUNT = 5;
export const GRENADE_BALL_SPEED = 420; // px/s (고속)
export const GRENADE_BALL_SIZE = 6; // px
export const GRENADE_BALL_COLOR = '#E8D44D';
export const GRENADE_AIM_LINE_LENGTH = 70; // 방향 예고선 길이 (px)

// Timed bomb (시한폭탄): 착지 후 5~8초 동안 점점 빠르게 깜빡임 → 삼각형 2발 (45° 대각선, 서로 반대 방향)
export const TIMED_BOMB_WIDTH = 12; // 본체 (px), 요철 크기의 배수
export const TIMED_BOMB_HEIGHT = 8; // 본체 (px), 요철 크기의 배수
export const TIMED_BOMB_NOTCH = 2; // 요철(돌기/홈) 크기 (px)
export const TIMED_BOMB_COLOR = '#A8A8A8';
export const TIMED_BOMB_BLINK_COLOR = '#FF3B30';
export const TIMED_BOMB_FUSE_MIN = 5; // 폭발까지 최소 (초)
export const TIMED_BOMB_FUSE_MAX = 8; // 폭발까지 최대 (초)
export const TIMED_BOMB_BLINK_START_HZ = 1.5; // 처음 깜빡임 속도
export const TIMED_BOMB_BLINK_END_HZ = 12; // 폭발 직전 깜빡임 속도
export const TIMED_BOMB_SHARD_SPEED = 230; // px/s
export const TIMED_BOMB_SHARD_SIZE = 12; // 삼각형 그림 크기 (px)
export const TIMED_BOMB_SHARD_HITBOX = 8; // 삼각형 충돌 크기 (px)

// Landmine (지뢰): 무작위 위치에 서서히 나타남 → 플레이어가 밟으면 1초 후 폭발 (본체는 피해 없음, 폭발 범위만 피해)
export const LANDMINE_WIDTH = 28; // px
export const LANDMINE_HEIGHT = 20; // px
export const LANDMINE_GRID = 4; // 그물 칸 수 (가로 기준)
export const LANDMINE_COLOR = '#8FA3B0';
export const LANDMINE_ARMED_COLOR = '#FF3B30';
export const LANDMINE_FADE_IN_TIME = 1.0; // 나타나는 시간 (초). 다 나타나기 전에는 밟아도 작동 안 함
export const LANDMINE_FUSE_TIME = 1.0; // 밟은 뒤 폭발까지 (초)
export const LANDMINE_LIFETIME = 12; // 아무도 안 밟으면 이 시간 후 사라짐 (초)
export const LANDMINE_FADE_OUT_TIME = 0.5; // 사라지는 시간 (초)
export const LANDMINE_MIN_PLAYER_DISTANCE = 100; // 플레이어 바로 위에는 생기지 않음 (px)
export const LANDMINE_EXPLOSION_RADIUS = 48; // 폭발 범위 반지름 (px)
export const LANDMINE_EXPLOSION_TIME = 0.25; // 폭발 표시/판정 시간 (초)

// Torpedo (어뢰): 보스 옆에서 발사되는 아주 작은 폭탄. 플레이어를 살짝 따라감. 피해 없이 1초간 이동 속도 감소만
export const TORPEDO_LENGTH = 9; // 그림 길이 (px)
export const TORPEDO_THICKNESS = 4; // 그림 두께 (px)
export const TORPEDO_HITBOX = 6; // 충돌 크기 (px)
export const TORPEDO_COLOR = '#5AC8FA';
export const TORPEDO_SPEED = 230; // px/s
export const TORPEDO_TURN_SPEED = 0.9; // rad/s — 아주 살짝만 플레이어 쪽으로 휨
export const TORPEDO_LIFETIME = 4; // 초 (플레이어 주위를 계속 맴돌지 않도록)
export const TORPEDO_SLOW_MULTIPLIER = 0.7; // 맞으면 이동 속도 배수
export const TORPEDO_SLOW_DURATION = 1.0; // 초

// Gas bomb (가스탄): 보스가 위에서 아래로 빠르게 쏨 → 화면 아래로 빠져나감. 맞으면 1 피해 + 3초간 화면 살짝 흐려짐
export const GAS_BOMB_RADIUS = 9; // px
export const GAS_BOMB_COLOR = '#9BC53D';
export const GAS_BOMB_SPEED = 420; // px/s
export const GAS_BOMB_MAX_ANGLE = 0.25; // 수직에서 벗어나는 최대 각도 (rad, 약 14°)
export const GAS_BLUR_DURATION = 3.0; // 초
export const GAS_BLUR_AMOUNT = 2.0; // px (살짝만 흐리게)

// Big bomb (대형 폭탄): Bombs 모드 끝에만 화면 중앙에 오각형으로 등장 → 각 꼭짓점에서 5발씩 연속 발사
export const BIG_BOMB_APPEAR_BEFORE_END = 6; // 모드 종료 몇 초 전에 등장 (이때부터 일반 폭탄은 더 안 생김)
export const BIG_BOMB_RADIUS = 30; // 중심~꼭짓점 (px)
export const BIG_BOMB_COLOR = '#C7C7CC';
export const BIG_BOMB_CHARGE_COLOR = '#FF9500';
export const BIG_BOMB_FADE_IN_TIME = 1.0; // 초
export const BIG_BOMB_CHARGE_TIME = 1.5; // 발사 전 예고 (초)
export const BIG_BOMB_SHOTS_PER_POINT = 5;
export const BIG_BOMB_SHOT_INTERVAL = 0.12; // 연속 발사 간격 (초)
export const BIG_BOMB_SHOT_SPEED = 260; // px/s
export const BIG_BOMB_SHOT_SIZE = 7; // px
export const BIG_BOMB_FADE_OUT_TIME = 0.5; // 초
export const BIG_BOMB_SPIN = 0.4; // 회전 속도 (rad/s)

// Rifle 모드 공통: 기본 패턴 하나의 타이머로 같은 확률로 무작위 선택
export const RIFLE_SPAWN_MIN = 1.0; // 패턴 생성 간격 최소 (초)
export const RIFLE_SPAWN_MAX = 1.4; // 패턴 생성 간격 최대 (초)
export const RIFLE_FIRST_SPAWN_DELAY = 1.0; // Rifle 모드 시작 후 첫 패턴까지 (초)

// 총 공통: 무작위 위치에 나타나 0/90/180/270° 중 한 방향으로 발사. 탄 경로를 얇은 선으로 예고. 총 본체는 피해 없음
export const GUN_FADE_IN_TIME = 0.4; // 나타나는 시간 (초)
export const GUN_FADE_OUT_TIME = 0.4; // 사라지는 시간 (초)
export const GUN_AIM_LINE_COLOR = '#F2F2F7';
export const GUN_AIM_LINE_WIDTH = 1; // px (얇은 선)
// 조준: 플레이어가 이동 중인 방향의 앞쪽(예상 위치)을 지나가도록 같은 가로줄/세로줄 위에 나타남
export const GUN_LEAD_TIME = 0.9; // 몇 초 뒤의 플레이어 위치를 노릴지 (초). 0 이면 현재 위치
export const GUN_AIM_DISTANCE_MIN = 120; // 노리는 지점에서 총 중심까지 최소 거리 (px)
export const GUN_AIM_DISTANCE_MAX = 360; // 노리는 지점에서 총 중심까지 최대 거리 (px)
export const GUN_MIN_PLAYER_DISTANCE = 80; // 플레이어 바로 옆에는 나타나지 않음 (px)

// Handgun (권총): ㄱ자 모양. 어뢰 크기 탄 2발을 짧은 간격으로
export const HANDGUN_BARREL_LENGTH = 22; // 총신 길이 (px)
export const HANDGUN_BARREL_THICKNESS = 6; // 총신 두께 (px)
export const HANDGUN_GRIP_LENGTH = 12; // 손잡이 길이 (총신 아래로, px)
export const HANDGUN_GRIP_THICKNESS = 7; // 손잡이 두께 (px)
export const HANDGUN_COLOR = '#8E8E93';
export const HANDGUN_AIM_TIME = 0.8; // 경로 예고선 표시 후 발사까지 (초)
export const HANDGUN_SHOT_COUNT = 2; // 한 번에 2발
export const HANDGUN_SHOT_INTERVAL = 0.06; // 2발 사이 간격 (초) — 짧게 붙어서 나감
export const HANDGUN_SHOT_SPEED = GRENADE_BALL_SPEED; // 수류탄 구슬과 같은 속도
export const HANDGUN_SHOT_COLOR = '#F2F2F7';

// Rifle gun (소총): 선 4개로 된 긴 모양. 아주 빠른 뾰족한 삼각형 탄 4~6발을 한 줄로
// 모양(총구가 위쪽일 때): 양옆의 긴 선 2개가 가운데에서 꺾이며 서로 교차 (교차점 위쪽이 아래쪽보다 김)
//                       나머지 선 2개는 아래쪽(개머리 쪽)에 가로로 걸침
export const RIFLE_GUN_FRONT_LENGTH = 38; // 교차점 ~ 총구 (위쪽, 긴 쪽, px)
export const RIFLE_GUN_REAR_LENGTH = 24; // 교차점 ~ 개머리 끝 (아래쪽, 짧은 쪽, px)
export const RIFLE_GUN_FRONT_HALF_WIDTH = 3; // 총구 쪽 끝의 반폭 (px)
export const RIFLE_GUN_REAR_HALF_WIDTH = 7; // 개머리 쪽 끝의 반폭 (px)
export const RIFLE_GUN_LINE_WIDTH = 2; // px
export const RIFLE_GUN_COLOR = '#AEAEB2';
export const RIFLE_GUN_AIM_TIME = 1.0; // 탄이 매우 빠르므로 권총보다 예고를 조금 길게 (초)
export const RIFLE_GUN_SHOT_COUNT_MIN = 4;
export const RIFLE_GUN_SHOT_COUNT_MAX = 6;
export const RIFLE_GUN_SHOT_INTERVAL = 0.05; // 연속 발사 간격 (초)
export const RIFLE_GUN_SHOT_SPEED = 900; // px/s (매우 빠름)
export const RIFLE_GUN_SHOT_LENGTH = 14; // 삼각형 길이 (px)
export const RIFLE_GUN_SHOT_HALF_WIDTH = 2.5; // 삼각형 밑변 반폭 (px) — 뾰족한 예각
export const RIFLE_GUN_SHOT_HITBOX = 5; // px
export const RIFLE_GUN_SHOT_COLOR = '#F2F2F7';
export const RIFLE_GUN_EDGE_INSET = 6; // 화면 왼쪽/오른쪽 끝에서 총 끝까지 띄우는 거리 (px). 소총은 양옆 끝에서만 나타남

// Flamethrower (화염방사기): 보스 왼쪽 옆면 가운데에 붙어 있음 (손 없이 튀어나옴)
// 모양: 색을 채우지 않은 사각형 + 안쪽에 긴 변과 평행한 선들, 위쪽 가운데 작은 타원,
//       오른쪽 아래 모서리 ~ 오른쪽 변 가운데를 잇는 C자 (보스 쪽으로 볼록)
// 불꽃: 아래쪽을 향해 오른쪽 → 왼쪽으로 쓸며 발사. 내려갈수록 퍼짐(커짐). 이동으로는 피하기 어려워 대시로 통과해야 함
export const FLAMETHROWER_WIDTH = 34; // 사각형 가로 (긴 변, px)
export const FLAMETHROWER_HEIGHT = 12; // 사각형 세로 (px)
export const FLAMETHROWER_STRIPES = 2; // 안쪽 평행선 개수
export const FLAMETHROWER_OVAL_RADIUS_X = 4; // 위쪽 타원 (px)
export const FLAMETHROWER_OVAL_RADIUS_Y = 2.5; // px
export const FLAMETHROWER_C_BULGE = 6; // C자가 오른쪽(보스 쪽)으로 튀어나온 정도 (px)
export const FLAMETHROWER_LINE_WIDTH = 1.5; // px
export const FLAMETHROWER_COLOR = '#D1D1D6';
export const FLAMETHROWER_EXTEND_TIME = 0.5; // 튀어나오는 시간 (초)
export const FLAMETHROWER_WARN_TIME = 0.7; // 발사 전 총구에서 불씨가 튀는 예고 (초)
export const FLAMETHROWER_FIRE_TIME = 2.2; // 오른쪽 → 왼쪽으로 쓰는 시간 (초)
export const FLAMETHROWER_RETRACT_TIME = 0.4; // 들어가는 시간 (초)
export const FLAMETHROWER_SWEEP_START = (25 * Math.PI) / 180; // 시작 방향: 오른쪽 아래 (0 = 오른쪽, 90° = 아래)
export const FLAMETHROWER_SWEEP_END = (155 * Math.PI) / 180; // 끝 방향: 왼쪽 아래
export const FLAMETHROWER_EMIT_RATE = 55; // 초당 불꽃 수
export const FLAMETHROWER_SPREAD = (4 * Math.PI) / 180; // 불꽃 방향 무작위 흔들림 (±rad)
export const FLAME_SPEED = 380; // px/s
export const FLAME_LIFETIME = 1.5; // 초 (사거리 ≈ 570px, 화면 아래까지 닿음)
export const FLAME_SIZE_START = 8; // 처음 크기 (px)
export const FLAME_SIZE_END = 34; // 마지막 크기 (px) — 내려갈수록 퍼짐

// Rocket launcher (로켓 발사기): 얇은 집 모양 오각형 2개가 나란히 + 그 사이에 얇은 선 1개
// 오각형의 뾰족한 끝(지붕)이 로켓. 로켓 2발을 동시에 발사 → 느리게 플레이어를 따라감 → 5초 뒤 폭발 (지뢰의 2배 범위, 연쇄 폭발 없음)
// 발사기는 무작위 위치에 나타나 플레이어 쪽(0/90/180/270° 중 가장 가까운 방향)을 향함. 발사기/로켓 본체는 피해 없음
export const ROCKET_LAUNCHER_BODY_LENGTH = 20; // 오각형의 사각형 부분 길이 (px)
export const ROCKET_LAUNCHER_TUBE_WIDTH = 6; // 오각형 하나의 폭 (px, 얇게)
export const ROCKET_LAUNCHER_GAP = 6; // 두 오각형 사이 간격 (가운데 얇은 선이 지나감, px)
export const ROCKET_LAUNCHER_COLOR = '#8E8E93';
export const ROCKET_LAUNCHER_LINE_WIDTH = 1; // 가운데 선 두께 (px)
export const ROCKET_LAUNCHER_AIM_TIME = 0.8; // 나타난 뒤 발사까지 (초)
export const ROCKET_LAUNCHER_MIN_PLAYER_DISTANCE = 200; // 플레이어에게서 이 거리 이상 떨어진 곳에 나타남 (px)
export const ROCKET_TIP_LENGTH = 8; // 로켓(뾰족한 지붕 부분) 길이 (px)
export const ROCKET_COLOR = '#FF6B3D';
export const ROCKET_HITBOX = 6; // px (본체는 피해 없음, 위치 판정용)
export const ROCKET_SPEED = 110; // px/s (꽤 느림 — 플레이어 이동 속도 200보다 느림)
export const ROCKET_TURN_SPEED = 2.2; // rad/s (플레이어를 잘 따라감)
export const ROCKET_FUSE_TIME = 5.0; // 발사 후 폭발까지 (초)
export const ROCKET_WARN_TIME = 1.5; // 폭발 전 이 시간 동안 깜빡이며 폭발 범위를 희미하게 표시 (초)
export const ROCKET_EXPLOSION_RADIUS = LANDMINE_EXPLOSION_RADIUS * 2; // 지뢰의 2배

// Shotgun (산탄총): 끝이 둥근 사각형. 보스 왼쪽 옆면에서 튀어나와 플레이어를 직접 조준 (각도 제한 없음)
// 슬러그(굵은 탄 1발 + 뒤쪽 평행한 꼬리선 2개 + 앞쪽 > 모양) 또는 산탄(9발이 퍼짐) 중 무작위로 발사
// 보스가 직접 드는 무기라 화염방사기와 동시에 들지 않음. 본체는 피해 없음
export const SHOTGUN_LENGTH = 30; // px
export const SHOTGUN_THICKNESS = 7; // px (끝은 반원으로 둥글게)
export const SHOTGUN_COLOR = '#8E8E93';
export const SHOTGUN_EXTEND_TIME = 0.3; // 튀어나오는 시간 (초)
export const SHOTGUN_TRACK_TIME = 0.7; // 플레이어를 따라 조준하는 시간 (초)
export const SHOTGUN_LOCK_TIME = 0.25; // 조준 고정 후 발사까지 (초) — 이 동안 예고선이 진해짐
export const SHOTGUN_RETRACT_TIME = 0.4; // 발사 후 들어가는 시간 (초)
// 슬러그: =====(탄)> 모양. 꼬리선 2개의 앞쪽 끝이 > 와 이어져 탄을 감싸는 하나의 선이 됨 (탄과는 살짝 떨어져 있음)
// 꼬리선 2개는 멀리 갈수록 서로 벌어지고, > 도 함께 커짐. 탄 / 꼬리선 / > 모두 피해 판정
export const SLUG_SPEED = 700; // px/s (매우 빠름)
export const SLUG_RADIUS = 6; // 굵은 탄 반지름 (px)
export const SLUG_COLOR = '#FFFFFF'; // 흰색
export const SLUG_GAP = 5; // 탄과 > 사이 최소 간격 (px). 처음 꼬리선 간격은 이 값으로 자동 계산
export const SLUG_TRAIL_LENGTH = 40; // 꼬리선 길이 (탄 옆 ~ 뒤쪽 끝, px)
export const SLUG_TRAIL_WIDEN_RATE = 0.05; // 이동한 거리 1px 당 반간격이 늘어나는 양 (500px 이동 시 +25px)
export const SLUG_LINE_THICKNESS = 2; // 꼬리선 / > 두께 (px, 피해 판정도 이 두께)
// 산탄: 9발이 부채꼴로 퍼짐
export const PELLET_COUNT = 9;
export const PELLET_SPREAD = (40 * Math.PI) / 180; // 퍼지는 전체 각도 (rad)
export const PELLET_SPEED_MIN = 300; // px/s
export const PELLET_SPEED_MAX = 360; // px/s
export const PELLET_SIZE = 5; // px
export const PELLET_COLOR = '#FFFFFF'; // 흰색

// Sniper (저격, Rifle 모드 특수 패턴): Rifle 모드 동안 작은 흰 점이 항상 플레이어를 따라다님
// 모드마다 한 번(스테이지 전체 2번), 무작위 시점에 점이 빨갛게 변하며 멈춤 → 잠시 뒤 화면 밖의 총이 그 지점을 쏨
// 맞으면 즉사. 대시/경직 무적 중에는 피할 수 있음. 쏜 뒤에는 그 모드 동안 점이 사라짐 (다음 Rifle 모드에서 다시 나타남)
export const SNIPER_DOT_RADIUS = 2.5; // px
export const SNIPER_DOT_COLOR = '#FFFFFF';
export const SNIPER_LOCK_COLOR = '#FF3B30';
export const SNIPER_FADE_IN_TIME = 0.5; // 모드 시작 시 점이 나타나는 시간 (초)
export const SNIPER_FOLLOW_RATE = 7; // 따라가는 빠르기 (1/s). 클수록 플레이어에 바짝 붙음 (이동 중 약 200/7 ≈ 29px 뒤처짐)
export const SNIPER_FIRE_TIME_MIN = 6; // 모드 시작 후 이 시간 ~ 최대 시간 사이 무작위로 한 번 저격 (초)
export const SNIPER_FIRE_TIME_MAX = 24; // 초 (모드 끝나기 전에 끝나도록)
export const SNIPER_LOCK_TIME = 0.6; // 빨갛게 멈춘 뒤 발사까지 (초)
export const SNIPER_HIT_RADIUS = 8; // 저격 판정 반지름 (px)
export const SNIPER_FLASH_TIME = 0.35; // 발사 후 섬광 표시 시간 (초)

// Gatling (개틀링, Rifle 모드 특수 패턴): 2번째 Rifle 모드가 끝날 때만 등장
// 보스가 들고 있던 무기를 버리고, 오른쪽 옆면에 개틀링을 들고 연사
// 보스 몸이 화면을 가로질러 이동 + 총구가 아래쪽 부채꼴을 왔다 갔다 하며 화면 전체를 쓸어냄 (약 3.5초, 30발 이상)
// 모양: 사각형 + 한쪽 면에 붙은 선(총열) 6개. 본체는 피해 없음
// 테스트용: true 면 1번째 Rifle 모드 끝에 등장 (기본 false = 2번째 Rifle 모드 끝)
export const GATLING_TEST_ON_FIRST_RIFLE = false;
export const GATLING_START_BEFORE_END = 5.5; // 모드 종료 몇 초 전에 시작 (이때부터 다른 Rifle 패턴은 더 안 생김)
export const GATLING_BODY_LENGTH = 16; // 사각형 길이 (총구 방향, px)
export const GATLING_BODY_WIDTH = 14; // 사각형 폭 (px)
export const GATLING_BARREL_COUNT = 6; // 총열 선 개수
export const GATLING_BARREL_LENGTH = 16; // 총열 선 길이 (px)
export const GATLING_COLOR = '#AEAEB2';
export const GATLING_LINE_WIDTH = 1.5; // px
export const GATLING_EXTEND_TIME = 0.5; // 꺼내는 시간 (초)
export const GATLING_FIRE_TIME = 3.5; // 연사 시간 (초) — 3~4초
export const GATLING_RETRACT_TIME = 0.4; // 집어넣는 시간 (초)
export const GATLING_FIRE_RATE = 16; // 초당 발사 수 (3.5초 동안 약 56발)
export const GATLING_SWEEP_CENTER = Math.PI / 2; // 총구가 흔들리는 중심 방향 (아래)
export const GATLING_SWEEP_AMPLITUDE = (60 * Math.PI) / 180; // 중심에서 좌우로 흔들리는 각도 (30° ~ 150°)
export const GATLING_SWEEP_PERIOD = 1.4; // 총구가 한 번 왕복하는 시간 (초)
export const GATLING_BOSS_MARGIN = 82; // 보스가 이동하는 화면 양 끝 한계 (보스 중심 x, px)
export const GATLING_SHOT_SPEED = 400; // px/s
export const GATLING_SHOT_SIZE = 5; // px
export const GATLING_SHOT_COLOR = '#F2F2F7';

// UI
export const HEALTH_BAR_WIDTH = 200;
export const HEALTH_BAR_HEIGHT = 20;
export const HEALTH_BAR_X = 20;
export const HEALTH_BAR_Y = 20;
