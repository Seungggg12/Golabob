# Golabob 백엔드 운영·성능 개선 로드맵

## 1. 문서 목적

현재 Golabob 백엔드는 NestJS, TypeScript, PostgreSQL, `pg` 직접 쿼리 방식으로 기본 CRUD를 구현한 단계다. 이 구조는 초기 기능 검증에는 충분하지만, 실제 사용자가 들어오는 서비스로 배포하려면 다음 네 가지를 먼저 갖춰야 한다.

1. 데이터와 권한이 잘못 처리되지 않는 정확성
2. 장애를 발견하고 복구할 수 있는 운영성
3. 트래픽이 증가해도 버틸 수 있는 확장성
4. 변경해도 기존 기능이 깨지지 않는 테스트 체계

성능 개선은 캐시부터 넣는 작업이 아니다. 현재 단계에서는 데이터베이스 쿼리와 API 구조를 먼저 정리하고, 실제 지표로 병목이 확인된 이후 캐시를 추가하는 것이 안전하다.

---

## 2. 현재 코드 상태 요약

### 잘 되어 있는 부분

- NestJS 모듈이 `auth`, `dining-requests`, `offers` 등의 도메인으로 구분되어 있다.
- SQL 파라미터 바인딩인 `$1`, `$2`를 사용해 기본적인 SQL Injection을 방지한다.
- 비밀번호를 `bcrypt`로 해싱한다.
- JWT에 사용자 ID와 역할을 포함하고 있다.
- DB 제약 조건과 일부 인덱스가 존재한다.
- Swagger 문서와 헬스 체크 엔드포인트가 존재한다.
- 오퍼 중복 등록을 DB의 UNIQUE 제약 조건으로 막고 있다.

### 실제 배포 전 반드시 개선할 부분

| 우선순위 | 문제 | 현재 위험 |
|---|---|---|
| P0 | 사장 오퍼 조회에 소유권 조건이 부족함 | 다른 사장의 오퍼가 조회될 수 있음 |
| P0 | 앱 실행 시 `CREATE TABLE`을 직접 수행함 | 배포 시 스키마 변경 이력과 롤백을 관리하기 어려움 |
| P0 | 요청 상태 변경을 여러 쿼리로 처리할 트랜잭션 구조가 없음 | 동시 요청 시 상태 불일치 가능 |
| P0 | DTO 검증이 서비스마다 수동 구현됨 | 누락된 필드·잘못된 타입이 API 내부까지 들어올 수 있음 |
| P1 | 목록 API에 페이지네이션이 없음 | 데이터 증가 시 응답과 DB 부하가 계속 증가함 |
| P1 | SQL, 비즈니스 규칙, 응답 변환이 서비스 하나에 섞여 있음 | 기능이 커질수록 수정과 테스트가 어려움 |
| P1 | JWT 파싱 코드가 여러 도메인에 복제됨 | 보안 정책 변경 시 코드 불일치 가능 |
| P1 | 구조화 로그, 메트릭, 에러 추적이 없음 | 운영 장애 원인을 찾기 어려움 |
| P1 | 실질적인 자동 테스트가 없음 | 변경 후 회귀 버그를 발견하기 어려움 |
| P2 | 캐시가 없음 | 현재 데이터 규모에서는 문제가 아닐 가능성이 큼 |

---

## 3. 권장 목표 구조

현재 모놀리식 NestJS 구조는 유지한다. 지금 마이크로서비스로 분리하면 네트워크 통신, 배포, 장애 처리 복잡도만 증가한다.

```text
apps/api/src/
  common/
    auth/
      jwt-auth.guard.ts
      roles.decorator.ts
      roles.guard.ts
    database/
      db.module.ts
      db.service.ts
      transaction.ts
    filters/
      http-exception.filter.ts
    interceptors/
      request-logging.interceptor.ts

  dining-requests/
    dto/
    dining-requests.controller.ts
    dining-requests.service.ts
    dining-requests.repository.ts
    dining-requests.mapper.ts
    dining-requests.module.ts

  offers/
    dto/
    offers.controller.ts
    offers.service.ts
    offers.repository.ts
    offers.mapper.ts
    offers.module.ts

  migrations/
    001-initial-schema.sql
    002-add-query-indexes.sql
```

역할은 다음과 같이 나눈다.

| 계층 | 역할 |
|---|---|
| Controller | HTTP 요청과 응답, DTO 수신 |
| Guard | 로그인 여부와 역할 검사 |
| Service | 비즈니스 규칙과 트랜잭션 흐름 |
| Repository | SQL 실행과 DB Row 반환 |
| Mapper | DB Row를 API 응답 객체로 변환 |

`pg` 직접 쿼리를 계속 사용해도 된다. Repository로 SQL을 옮기는 이유는 ORM처럼 보이게 만들기 위해서가 아니라, 비즈니스 로직과 DB 접근을 분리해 테스트하기 위해서다.

---

## 4. P0: 실제 배포 전에 반드시 할 작업

### 4.1 인증·권한 로직 공통화

현재 `dining-requests/request-user.ts`와 `offers/request-user.ts`에 비슷한 JWT 파싱 코드가 존재한다. 이를 NestJS Guard로 통합한다.

권장 방식:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("OWNER")
@Get("owner/offers")
findOwnerOffers(@CurrentUser() user: RequestUser) {
  return this.offersService.findOwnerOffers(user);
}
```

필수 보안 규칙:

- 클라이언트가 전달한 `userId`, `ownerId`를 신뢰하지 않는다.
- 사용자 ID와 역할은 검증된 JWT에서만 가져온다.
- 사장용 조회는 반드시 `restaurants.owner_id = 로그인 사용자 ID` 조건을 거친다.
- 특정 오퍼 조회도 `offers.id = ?`만 사용하지 말고 소유 식당과 JOIN하여 검사한다.
- 운영 환경에서는 개발용 JWT Secret fallback을 허용하지 않는다.
- JWT Secret은 소스나 이미지에 넣지 않고 배포 플랫폼의 Secret으로 관리한다.
- CORS는 `app.enableCors()` 전체 허용 대신 실제 프론트 도메인만 허용한다.

현재 특히 확인할 쿼리:

```sql
SELECT o.*
FROM offers o
JOIN restaurants r ON r.id = o.restaurant_id
WHERE r.owner_id = $1
ORDER BY o.created_at DESC;
```

### 4.2 테이블 자동 생성을 Migration으로 변경

현재 `DbService.init()`에서 서버가 시작될 때 테이블과 인덱스를 만든다. 로컬 개발에는 편하지만 운영에서는 다음 문제가 있다.

- 어떤 스키마 변경이 언제 적용됐는지 알 수 없다.
- 여러 서버가 동시에 시작하며 같은 DDL을 실행할 수 있다.
- 컬럼 변경과 데이터 변환을 안전하게 순서대로 처리하기 어렵다.
- 실패한 변경을 롤백하기 어렵다.

권장 변경:

1. 현재 `CREATE TABLE` 문을 최초 Migration 파일로 이동한다.
2. Migration 실행 이력을 저장하는 테이블을 사용한다.
3. 배포 시 애플리케이션 실행 전에 Migration을 한 번 실행한다.
4. 서버 시작 과정에서는 DB 연결 확인만 수행한다.

도구는 팀 선택에 따라 다음 중 하나를 사용한다.

- `node-pg-migrate`: 현재 `pg` 직접 쿼리 구조와 잘 맞음
- Prisma Migrate: 앞으로 Prisma를 도입할 계획이 확실할 때
- Flyway: 언어와 관계없이 SQL Migration을 운영하고 싶을 때

현재 구조에서는 `node-pg-migrate` 또는 순수 SQL Migration이 변경량이 가장 작다.

### 4.3 ID 타입과 외래 키 정리

현재 `users.id`는 UUID지만 일부 `user_id`, `owner_id`는 TEXT다. 운영 전에 다음처럼 통일하는 편이 좋다.

```sql
users.id                    UUID
restaurants.owner_id       UUID REFERENCES users(id)
dining_requests.user_id    UUID REFERENCES users(id)
reservations.user_id       UUID REFERENCES users(id)
reviews.user_id            UUID REFERENCES users(id)
```

장점:

- 존재하지 않는 사용자 ID 저장 방지
- 회원 삭제 정책을 DB 수준에서 명확하게 적용
- 타입 불일치로 인한 비교·인덱스 문제 방지

회원 삭제 시 데이터 정책은 반드시 먼저 결정한다.

- 기록까지 제거: `ON DELETE CASCADE`
- 서비스 기록 보존: soft delete 또는 익명화
- 삭제 차단: `ON DELETE RESTRICT`

### 4.4 DTO 자동 검증

`class-validator`와 NestJS `ValidationPipe`를 사용해 컨트롤러 진입 전에 입력값을 거절한다.

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

```ts
export class CreateDiningRequestDto {
  @IsString()
  @Length(1, 100)
  title!: string;

  @IsInt()
  @Min(2)
  headCount!: number;

  @IsInt()
  @Min(1)
  budgetPerPerson!: number;
}
```

서비스에는 DTO 형식 검사가 아니라 실제 비즈니스 규칙만 남긴다.

- 날짜가 과거인지
- 요청이 아직 OPEN인지
- 본인 요청 또는 본인 식당인지
- 동일 식당이 이미 오퍼를 보냈는지

### 4.5 트랜잭션과 동시성 제어

단순 목록 조회에는 트랜잭션이 필요하지 않다. 하지만 다음 흐름은 반드시 하나의 트랜잭션으로 묶어야 한다.

- 사용자가 오퍼를 선택함
- 선택된 오퍼 상태를 `selected`로 변경함
- 다른 오퍼를 `rejected`로 변경함
- 회식 요청을 `reserved`로 변경함
- 예약 레코드를 생성함

예시:

```text
BEGIN
  SELECT dining_request FOR UPDATE
  요청 상태가 open인지 검사
  선택 오퍼 상태 변경
  나머지 오퍼 상태 변경
  요청 상태 변경
  예약 생성
COMMIT
```

`SELECT ... FOR UPDATE` 또는 조건부 UPDATE를 사용해 두 요청이 동시에 같은 오퍼를 선택하지 못하게 한다.

```sql
UPDATE dining_requests
SET status = 'reserved', updated_at = NOW()
WHERE id = $1 AND user_id = $2 AND status = 'open'
RETURNING *;
```

반환된 Row가 없으면 이미 다른 요청에서 상태가 변경된 것으로 처리한다.

---

## 5. P1: 데이터가 늘기 전에 할 성능 개선

### 5.1 모든 목록 API에 페이지네이션 적용

현재 `findMine`, `findOpenForOwner`, `findOwnerOffers`는 조건에 맞는 전체 Row를 반환한다. 데이터가 쌓이면 응답 크기와 메모리 사용량이 계속 증가한다.

초기에는 `limit` 기반으로 시작하되, 실제 서비스에서는 cursor 방식이 안정적이다.

```http
GET /api/dining-requests/me?limit=20&cursor=2026-07-13T10:00:00Z
```

```sql
SELECT *
FROM dining_requests
WHERE user_id = $1
  AND created_at < $2
ORDER BY created_at DESC
LIMIT $3;
```

권장 제한:

- 기본 `limit`: 20
- 최대 `limit`: 100
- 응답에 `nextCursor` 포함

### 5.2 실제 쿼리에 맞는 복합 인덱스 추가

인덱스는 컬럼마다 무조건 만드는 것이 아니라 실제 `WHERE`와 `ORDER BY` 조합에 맞춰 만든다.

현재 쿼리 기준 권장 후보:

```sql
CREATE INDEX idx_dining_requests_user_created
ON dining_requests(user_id, created_at DESC);

CREATE INDEX idx_dining_requests_open_schedule
ON dining_requests(dining_date, dining_time, created_at DESC)
WHERE status = 'open';

CREATE INDEX idx_offers_request_price_created
ON offers(dining_request_id, price_per_person ASC, created_at DESC);

CREATE INDEX idx_restaurants_owner_status
ON restaurants(owner_id, status);
```

주의:

- 인덱스가 많으면 INSERT와 UPDATE 비용이 증가한다.
- 운영 데이터와 유사한 데이터로 `EXPLAIN (ANALYZE, BUFFERS)`를 확인한 뒤 확정한다.
- 사용하지 않는 인덱스는 제거한다.

### 5.3 필요한 컬럼만 조회

목록에서는 `SELECT *` 대신 카드에 필요한 컬럼만 조회한다.

```sql
SELECT id, title, dining_date, dining_time, head_count,
       region, budget_per_person, status, created_at
FROM dining_requests
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2;
```

상세 메모나 큰 TEXT 컬럼은 상세 조회에서만 가져온다.

### 5.4 JOIN으로 화면에 필요한 데이터를 한 번에 조회

오퍼 목록 화면에서 식당 이름을 보여주기 위해 오퍼별로 식당 API를 반복 호출하면 N+1 문제가 생긴다. 오퍼 목록 SQL에서 JOIN하여 한 번에 반환한다.

```sql
SELECT
  o.id,
  o.price_per_person,
  o.menu_description,
  o.available_time,
  o.status,
  r.id AS restaurant_id,
  r.name AS restaurant_name,
  r.address AS restaurant_address
FROM offers o
JOIN restaurants r ON r.id = o.restaurant_id
WHERE o.dining_request_id = $1
ORDER BY o.price_per_person ASC, o.created_at DESC;
```

### 5.5 DB Pool과 Timeout 설정

현재 Pool 기본값에만 의존한다. 운영에서는 환경 변수로 조절할 수 있게 한다.

```ts
new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 5_000,
});
```

주의할 점:

```text
전체 DB 연결 수 ≈ 애플리케이션 인스턴스 수 × 인스턴스별 Pool max
```

예를 들어 API 서버 5대에 Pool max 20이면 최대 100개 연결이 생긴다. Managed PostgreSQL의 연결 한도를 기준으로 계산해야 한다.

### 5.6 응답 압축과 정적 파일 분리

- API JSON 응답은 플랫폼 또는 reverse proxy에서 gzip/Brotli 압축한다.
- 이미지 파일은 API 서버 로컬 디스크에 저장하지 않는다.
- 이미지·업로드 파일은 S3 호환 Object Storage와 CDN을 사용한다.
- API 서버는 상태를 로컬 파일에 저장하지 않는 stateless 구조를 유지한다.

---

## 6. 캐싱 전략

### 결론

현재 단계에서는 Redis를 바로 추가하지 않는다.

먼저 다음을 수행한다.

1. 페이지네이션
2. 복합 인덱스
3. 필요한 컬럼만 조회
4. JOIN으로 N+1 제거
5. 느린 쿼리 측정

이후 DB 조회가 실제 병목일 때 Redis를 추가한다.

### 캐시해도 되는 후보

| 데이터 | 권장 TTL | 이유 |
|---|---:|---|
| 공개 식당 요약 정보 | 30초~5분 | 변경 빈도가 낮음 |
| 지역·카테고리 필터 결과 | 10초~60초 | 반복 조회 가능성이 높음 |
| OPEN 요청의 집계 개수 | 5초~30초 | 짧은 지연을 허용할 수 있음 |
| 자주 사용하는 설정·코드값 | 5분 이상 | 거의 변경되지 않음 |

### 초기에 캐시하지 않는 데이터

- 내 요청 목록
- 내 오퍼 목록
- 오퍼 선택 결과
- 예약 상태
- 인증·권한 판정 결과

이 데이터는 사용자별이고 상태 변경 직후 최신 값이 중요하다. 잘못 캐시하면 다른 사용자 데이터 노출이나 오래된 상태 표시로 이어질 수 있다.

### Redis를 도입할 때의 규칙

- Cache-aside 패턴을 사용한다.
- 키에 사용자 또는 요청 범위를 명확히 포함한다.
- 데이터 변경 후 관련 키를 삭제한다.
- TTL을 반드시 설정한다.
- Redis 장애 시 DB 조회로 fallback한다.
- 캐시 데이터는 원본이 아니며 언제든 삭제할 수 있어야 한다.

예시:

```text
restaurant:summary:{restaurantId}
region:restaurants:{region}:{category}:{page}
request:{requestId}:offer-count
```

애플리케이션 인스턴스가 여러 대라면 프로세스 메모리 캐시는 서로 공유되지 않으므로 일관성이 필요한 캐시는 Redis를 사용한다.

---

## 7. 안정성과 API 설계

### 7.1 멱등성

모바일 네트워크에서는 사용자가 버튼을 두 번 누르거나 클라이언트가 재시도할 수 있다.

- 오퍼 중복은 현재 UNIQUE 제약 조건을 유지한다.
- 예약 생성과 결제 같은 중요한 POST에는 `Idempotency-Key`를 고려한다.
- 서버는 동일 키로 들어온 요청에 같은 결과를 반환한다.

### 7.2 상태 전이 규칙 중앙화

허용되는 상태 전이를 명시한다.

```text
dining_request:
  open -> reserved
  open -> canceled
  open -> expired

offer:
  pending -> selected
  pending -> rejected
  pending -> canceled
  pending -> expired
```

어떤 상태에서든 임의의 상태로 UPDATE하지 않도록 서비스 계층에서 검사하고, 가능한 부분은 DB CHECK 또는 조건부 UPDATE로 보강한다.

### 7.3 API 버전과 에러 형식

실제 모바일 앱이 배포되면 모든 사용자가 동시에 업데이트하지 않는다. 호환성을 위해 `/api/v1` 버전을 고려한다.

에러 응답도 통일한다.

```json
{
  "code": "OFFER_ALREADY_EXISTS",
  "message": "이미 이 요청에 오퍼를 보냈습니다.",
  "requestId": "trace-id"
}
```

클라이언트는 한국어 메시지가 아니라 `code`를 기준으로 분기한다.

### 7.4 Rate Limit

다음 엔드포인트부터 제한한다.

- 로그인·회원가입
- 회식 요청 생성
- 오퍼 생성
- 검색 API

초기 예시:

- 로그인: IP당 분당 10회
- 생성 API: 사용자당 분당 20회
- 일반 조회: 사용자당 분당 100회

정확한 값은 실제 사용 패턴을 보고 조정한다.

---

## 8. 로그, 모니터링, 장애 대응

### 반드시 수집할 항목

- 요청 ID 또는 Trace ID
- HTTP method와 path
- 상태 코드
- 응답 시간
- 사용자 ID: 필요 시 내부 식별자만 기록
- DB 쿼리 실패 코드
- 애플리케이션 버전 또는 Git SHA

로그에 남기면 안 되는 정보:

- 비밀번호
- JWT 원문
- 개인정보가 포함된 메모 전문
- DATABASE_URL과 Secret

### 권장 지표

| 지표 | 설명 |
|---|---|
| 요청 수 | API별 초당 요청 수 |
| 오류율 | 5xx 비율과 주요 4xx 코드 |
| Latency | 평균보다 p50, p95, p99 중심 |
| DB Pool | 사용 중·대기 중 연결 수 |
| Slow Query | 기준 시간 이상 걸린 쿼리 |
| Event Count | 요청 생성, 오퍼 생성, 예약 성공 수 |

### 헬스 체크 분리

- Liveness: Node 프로세스가 살아 있는지
- Readiness: DB 연결과 필수 의존성이 준비됐는지

DB 장애 중에는 Readiness를 실패시켜 새 트래픽을 받지 않게 하고, Liveness는 무조건 재시작 루프를 만들지 않도록 구분한다.

### 도구 예시

- 에러 추적: Sentry
- 메트릭: Prometheus + Grafana 또는 배포 플랫폼 기본 메트릭
- 로그: Pino JSON 로그 + CloudWatch/Datadog/Loki
- 분산 추적: OpenTelemetry

처음부터 모든 도구를 도입할 필요는 없다. 구조화 로그, 에러 추적, 기본 메트릭 순서로 시작한다.

---

## 9. 테스트 전략

현재 테스트 명령은 존재하지만 실질적인 테스트가 부족하다. 다음 순서로 추가한다.

### Unit Test

DB를 Mock 처리하고 서비스 규칙을 검사한다.

- USER만 회식 요청을 생성할 수 있음
- OWNER만 오퍼를 생성할 수 있음
- 종료된 요청에는 오퍼를 보낼 수 없음
- 다른 사장 식당으로 오퍼를 보낼 수 없음
- 중복 오퍼는 Conflict로 처리됨

### Repository Integration Test

테스트 PostgreSQL을 사용해 실제 SQL과 제약 조건을 검사한다.

- 쿼리 결과 매핑
- UNIQUE·FK·CHECK 제약
- 페이지네이션 순서
- 트랜잭션 rollback

### API E2E Test

실제 사용자 흐름을 검사한다.

```text
사용자 가입
-> 요청 생성
-> 사장 공개 요청 조회
-> 사장 오퍼 생성
-> 사용자 오퍼 목록 조회
-> 오퍼 선택
-> 요청·오퍼·예약 상태 확인
```

### 성능 테스트

기능 테스트가 안정된 뒤 `k6` 또는 `autocannon`으로 측정한다.

초기 목표 예시:

- 일반 조회 API p95 < 300ms
- 생성 API p95 < 500ms
- 5xx 오류율 < 0.1%
- 목표 동시 사용자 수에서 DB Pool 대기 없음

목표 수치는 팀의 실제 요구사항과 배포 환경에 맞춰 조정한다.

---

## 10. 배포 구조 권장안

초기 서비스는 다음 정도면 충분하다.

```text
사용자
  -> CDN / HTTPS
  -> Web Frontend
  -> Load Balancer 또는 배포 플랫폼
  -> NestJS API 1~2개 인스턴스
  -> Managed PostgreSQL
  -> Object Storage
  -> Redis는 필요할 때 추가
```

### 배포 체크리스트

- API를 Docker 이미지로 빌드
- `NODE_ENV=production`
- 운영용 Secret 주입
- HTTPS 강제
- 운영 CORS origin 제한
- DB Migration을 애플리케이션보다 먼저 실행
- Managed PostgreSQL 자동 백업 활성화
- 실제 복구 훈련 수행
- 로그·에러 알림 연결
- CPU·메모리·DB 연결 수 알람 설정
- 배포 실패 시 이전 이미지로 rollback 가능
- 무중단 종료를 위한 graceful shutdown 적용

### Graceful Shutdown

배포 중 기존 서버가 바로 종료되면 처리 중인 요청이 실패할 수 있다.

```ts
app.enableShutdownHooks();
```

종료 신호를 받으면 새 요청 수신을 중단하고, 진행 중인 요청과 DB 연결이 정리된 뒤 종료한다.

---

## 11. 단계별 실행 순서

### Phase 0: 보안과 정확성

- [ ] 사장 오퍼 목록·상세 조회에 소유권 조건 추가
- [ ] JWT Guard와 Role Guard 공통화
- [ ] 다른 사용자·다른 사장 데이터 접근 테스트
- [ ] DTO ValidationPipe 적용
- [ ] 상태 전이 규칙 정리
- [ ] 중요한 상태 변경에 트랜잭션 적용

### Phase 1: DB 운영 기반

- [ ] `DbService.init()`의 DDL을 Migration으로 이동
- [ ] ID 타입을 UUID로 통일하고 FK 추가
- [ ] DB Pool과 Timeout 설정
- [ ] Managed PostgreSQL과 백업 정책 결정
- [ ] Migration rollback 절차 작성

### Phase 2: 조회 성능

- [ ] 목록 API cursor 페이지네이션
- [ ] 목록의 `SELECT *` 제거
- [ ] 화면 단위 JOIN 응답 설계
- [ ] 복합 인덱스 추가
- [ ] `EXPLAIN ANALYZE`로 검증

### Phase 3: 테스트와 운영

- [ ] 서비스 Unit Test
- [ ] PostgreSQL Integration Test
- [ ] 사용자-사장 전체 E2E Test
- [ ] 구조화 로그와 Request ID
- [ ] 에러 추적과 알람
- [ ] Liveness·Readiness 분리

### Phase 4: 부하 측정과 확장

- [ ] 예상 트래픽 시나리오 작성
- [ ] k6/autocannon 부하 테스트
- [ ] p95, 오류율, DB Pool, Slow Query 확인
- [ ] API 인스턴스 수평 확장
- [ ] 측정된 병목에만 Redis 캐시 적용

---

## 12. 지금 당장 추천하는 첫 작업 5개

1. **사장 오퍼 조회 권한 수정**
   - 현재 가장 먼저 처리할 보안 문제다.

2. **JWT Guard 및 Role Guard 공통화**
   - 도메인마다 인증 코드가 달라지는 문제를 막는다.

3. **DB Migration 도입**
   - 실제 배포와 팀 협업을 가능하게 하는 기반이다.

4. **목록 페이지네이션과 복합 인덱스 적용**
   - 데이터 증가에 대비한 가장 효과적인 성능 개선이다.

5. **핵심 E2E 테스트 1개 작성**
   - 요청 생성부터 오퍼 조회까지의 실제 흐름을 자동 검증한다.

이 다섯 가지가 끝나기 전에는 Redis, Kafka, 마이크로서비스 전환을 우선하지 않는다.

---

## 13. 하지 않아도 되는 것

### 지금 ORM으로 전면 교체

`pg` 직접 SQL 자체가 성능 문제는 아니다. 오히려 쿼리를 명확하게 최적화할 수 있다. 팀이 SQL 유지보수에 어려움을 겪거나 도메인 모델 관리가 복잡해졌을 때 Prisma 또는 TypeORM 도입을 검토한다.

### 지금 마이크로서비스 도입

현재 규모에서는 하나의 NestJS 애플리케이션을 도메인 모듈로 잘 나누는 모듈러 모놀리스가 적합하다.

### 모든 API에 Redis 적용

캐시 무효화와 사용자별 데이터 격리가 더 큰 버그를 만들 수 있다. 측정된 병목과 명확한 TTL 정책이 있는 데이터에만 적용한다.

### 처음부터 Kafka 도입

알림, 통계, 이벤트 처리량이 실제로 커지고 비동기 처리가 필요해질 때 Queue 또는 Event Broker를 검토한다. 초기에는 DB 트랜잭션과 단순 Background Job으로 충분하다.

---

## 14. 최종 판단

현재 Golabob 코드는 기능 검증용 MVP로는 적절하다. 실제 서비스로 발전시키기 위해 구조 전체를 다시 만들 필요는 없다.

다음 방향을 유지하면 된다.

- NestJS 모놀리스 유지
- `pg` 직접 SQL 유지 가능
- Controller, Service, Repository 책임 분리
- 권한과 트랜잭션을 우선
- Migration과 테스트로 배포 안정성 확보
- 페이지네이션과 인덱스로 기본 성능 확보
- 관측 후 필요한 곳에만 Redis 도입

가장 중요한 기준은 “기술을 얼마나 많이 넣었는가”가 아니라, 데이터가 정확하고 장애를 발견·복구할 수 있으며 실제 트래픽 지표를 기준으로 개선할 수 있는가이다.
