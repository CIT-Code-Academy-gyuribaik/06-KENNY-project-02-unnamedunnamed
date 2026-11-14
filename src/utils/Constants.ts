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

// Bombs 모드 공통
export const BOMB_DROP_FLIGHT_TIME = 0.7; // 보스에서 떨어져 착지까지 걸리는 시간 (초)
export const BOMB_DROP_MIN_Y = 180; // 착지 지점 y 최소값 (보스 아래쪽)

// Grenade (수류탄): 착지 후 신관 시간 동안 탄 방향 예고 → 고속 구슬 5발
export const GRENADE_SPAWN_MIN = 2.0; // 투하 간격 최소 (초)
export const GRENADE_SPAWN_MAX = 3.0; // 투하 간격 최대 (초)
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
export const TIMED_BOMB_SPAWN_MIN = 3.0; // 투하 간격 최소 (초)
export const TIMED_BOMB_SPAWN_MAX = 4.5; // 투하 간격 최대 (초)
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

// UI
export const HEALTH_BAR_WIDTH = 200;
export const HEALTH_BAR_HEIGHT = 20;
export const HEALTH_BAR_X = 20;
export const HEALTH_BAR_Y = 20;
