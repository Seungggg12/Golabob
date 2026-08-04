# 골라밥 DB 마이그레이션 계획

## 1. 목적

MVP 스키마가 확정되기 전까지 로컬 개발 DB는 기존 테스트 데이터를 보존하지 않고 초기화하며, 목표 ERD를 빈 DB에 직접 구성한다. 팀 공유·스테이징·운영 데이터가 생긴 이후의 변경만 버전이 관리되는 후속 마이그레이션으로 적용한다.

마이그레이션 도구는 기존 쿼리와 PostgreSQL 기능을 그대로 활용할 수 있는 `pg` 기반 경량 러너로 확정했다. 아래 순서는 동일하게 적용한다.

## 2. 현재 상태

2026-07-28 로컬 PostgreSQL 기준:

| 테이블 | 행 수 | 주요 문제 |
| --- | ---: | --- |
| users | 0 | 계정 상태·updated_at 없음, 대표 role과 user_roles 병행 |
| user_roles | 0 | owner 승인 근거와 역할 변경 이력 없음 |
| restaurants | 0 | owner_id가 TEXT, 생성 기본값이 approved, 운영 정보가 단일 행에 집중 |
| dining_requests | 0 | user_id가 TEXT FK 없음, 마감 시각·version 없음 |
| offers | 0 | 상태 이력·version 없음 |
| reservations | 0 | 요청과 선택 오퍼 연결 없음, user_id가 TEXT |
| reviews | 0 | user_id가 TEXT |
| schema_migrations | 1 | `initial_schema` 적용 이력과 SQL 체크섬 저장 |

2026-07-28 기존 개발 데이터와 스키마를 모두 삭제하고 `202607280001_initial_schema.sql`로 재생성했다.

## 3. 전환 원칙

- MVP 스키마 확정 전 로컬 DB에는 보존 대상 데이터를 넣지 않는다.
- 목표 구조 변경은 `initial_schema`와 API 코드를 함께 수정한 뒤 DB를 다시 초기화한다.
- 빈 DB 신규 적용, 재실행, 실패 롤백 검증을 항상 수행한다.
- 팀 공유·스테이징·운영 데이터가 생긴 시점부터 `initial_schema`를 동결한다.
- 동결 이후 변경은 expand, backfill, validate, contract 순서의 신규 버전 SQL로 적용한다.
- 운영 데이터 마이그레이션 전에는 PostgreSQL custom-format 백업을 생성한다.

## 4. 초기화 조건

- 대상 DB가 로컬 개발용 `golabob`인지 확인한다.
- 삭제할 데이터가 테스트 데이터이며 팀 공유 데이터가 아닌지 확인한다.
- `public` 스키마를 삭제하고 다시 만든 뒤 `npm run migrate:api`를 실행한다.
- 모든 업무 테이블의 행 수가 0이고 `schema_migrations`에 `initial_schema` 한 건만 있는지 확인한다.
- 공유 환경에서는 전체 초기화를 금지하고 사전 점검·백업 후 후속 마이그레이션을 사용한다.

## 5. 초기 스키마 확장 순서

### 단계 1. 스키마 관리 기반 도입

- [완료] 적용 이력과 체크섬을 저장하는 `schema_migrations`와 실행 명령을 추가했다.
- [완료] 현재 `DbService.init()` DDL을 `202607280001_initial_schema.sql`로 옮겼다.
- [완료] 개발·테스트·운영에서 사용할 `npm run migrate:api` 명령을 추가했다.
- [완료] `DbService.init()`은 연결과 필수 초기 스키마 적용 여부만 확인한다.

### 단계 2. 계정 상태와 사업자 신청

- `users.status`, `users.updated_at`을 추가한다.
- `owner_applications`와 심사 이력을 추가한다.
- 빈 DB에 관리자 계정 seed를 별도 개발 명령으로 생성한다.

### 단계 3. 사용자 참조 UUID 전환

`restaurants.owner_id`, `dining_requests.user_id`, `reservations.user_id`, `reviews.user_id`를 초기 스키마에서 바로 UUID 외래 키로 정의한다. 기존 TEXT 컬럼이나 backfill 단계는 만들지 않는다.

### 단계 4. 식당 구조 확장

- 식당 기본 상태를 `pending`으로 변경하고 `rejected`, `suspended`를 허용한다.
- 승인 관리자와 승인 시각 컬럼을 추가한다.
- `restaurant_business_hours`, `restaurant_facilities`, `restaurant_photos`를 추가한다.
- API·Web·Mobile도 분리된 영업시간·시설·사진 구조를 바로 사용하도록 전환한다.

### 단계 5. 요청과 오퍼 규칙 확장

- `dining_requests.offer_deadline_at`, `version`을 추가한다.
- 요청 상태는 초기 스키마부터 목표 상태 `matched`를 사용한다.
- `offers.version`을 추가한다.
- 요청·오퍼 상태 이력 테이블을 추가한다.

### 단계 6. 예약 유형·연결과 상태 이력

- `reservations.reservation_type`, `dining_request_id`, `accepted_offer_id`, `price_per_person`, `menu_summary`를 추가한다.
- 일반 예약은 `direct`, 오퍼 선택 예약은 `offer`로 생성한다.
- `offer` 유형은 요청·오퍼 FK가 필수이고 `direct` 유형은 두 FK가 NULL이어야 하는 CHECK를 추가한다.
- 예약 유형 CHECK와 nullable FK의 부분 유일 인덱스를 초기 스키마에 바로 적용한다.
- 예약 상태 이력과 취소 수행 주체·사유를 추가한다.

### 단계 7. 원격 웨이팅 구조 추가

- `waiting_settings`, `waitlist_daily_counters`, `waitlist_entries`, `waitlist_status_history`를 추가한다.
- `(restaurant_id, business_date)` 카운터 행 잠금으로 대기 번호를 원자적으로 발급한다.
- 사용자별 식당 활성 웨이팅 부분 유일 인덱스와 상태 CHECK를 추가한다.
- 초기 스키마에 독립된 신규 테이블로 추가한다.

### 단계 8. 무결성 강화

- 모든 사용자 참조를 UUID FK로 정의한다.
- 상태 CHECK, 유일 제약, 마감 시각 CHECK와 필수 인덱스를 추가한다.
- 오퍼 선택 동시성과 일반 예약 중복 제출 통합 테스트를 모두 통과시킨다.
- 신규 코드가 목표 컬럼만 사용하는지 확인한다.

### 단계 9. 서버 시작 DDL 제거

- [완료] `DbService.init()`의 `CREATE TABLE`, 데이터 backfill SQL을 제거했다.
- [완료] 서버는 필수 초기 스키마 버전이 없으면 시작을 실패시킨다.

## 6. 공유 환경 전환 후 배포 순서

1. DB 백업과 사전 점검 쿼리를 실행한다.
2. 호환 가능한 expand 마이그레이션을 적용한다.
3. 구·신 스키마를 함께 지원하는 API를 배포한다.
4. 데이터를 backfill하고 제약을 validate한다.
5. Web·Mobile을 신규 API로 전환한다.
6. 최소 한 배포 주기 모니터링 후 contract 마이그레이션을 적용한다.

## 7. 검증 항목

- 빈 DB 신규 적용
- 로컬 개발 DB 전체 초기화 후 데이터 0건 확인
- 마이그레이션 재실행
- 중간 단계 실패 후 트랜잭션 롤백
- 공유 환경 전환 후 고아 사용자 참조 발견 시 안전 중단
- 공유 환경에서 기존 API와 신규 API의 전환 기간 호환
- 오퍼 동시 선택 시 예약 하나만 생성
- 동시 웨이팅 등록 시 대기 번호가 중복되지 않고 순서가 보존됨
- 호출 제한 시간 만료 시 노쇼 전이가 멱등하게 처리됨
- 롤백 후 API 이전 버전 기동

## 8. 롤백과 복구

- 로컬 초기 스키마 개발 중 실패하면 DB를 다시 초기화하고 마지막 정상 SQL과 API 코드로 되돌린다.
- 컬럼 제거 전 단계는 신규 컬럼과 테이블을 사용 중지하는 방식으로 롤백한다.
- 데이터 변환 후에는 down SQL보다 백업 복원과 이전 API 재배포를 기본 복구 전략으로 사용한다.
- contract 마이그레이션은 배포 안정화와 백업 보존을 확인한 뒤 별도 릴리스로 실행한다.
- 실패 로그에는 SQL 파라미터의 개인정보 원문을 남기지 않는다.

## 9. 도구 결정 기록

- 선택: 현재 사용 중인 `pg`와 SQL 파일 기반 경량 마이그레이션 러너를 유지한다.
- 이유: 서비스 코드가 이미 `pg` 직접 쿼리로 구성되어 있고, 부분 유일 인덱스·CHECK·행 잠금 같은 PostgreSQL 기능을 명시적으로 제어해야 한다.
- Prisma 미선택 이유: 현 단계에서 ORM 전환은 모든 서비스 쿼리를 함께 변경해야 해 마이그레이션 체계 도입 범위를 크게 만들고 팀 학습 비용을 증가시킨다.
- 파일 규칙: MVP 스키마 확정 전에는 `initial_schema`를 수정하고 DB를 초기화한다. 공유 환경 전환 후에는 파일을 동결하고 `YYYYMMDDNNNN_description.sql` 형식의 신규 파일만 추가한다.
- 실행 명령: `npm run migrate:status:api`, `npm run migrate:api`를 프로젝트 루트에서 실행한다.
- 운영 원칙: 배포 단계에서 마이그레이션을 먼저 적용하고, API는 필수 버전이 없으면 시작을 중단한다.
