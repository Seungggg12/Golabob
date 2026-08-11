# Golabob

Golabob은 앱 서비스를 목표로 하는 모노레포입니다.

## 기술 스택

- API: NestJS, TypeScript, PostgreSQL
- Web: React, TypeScript, Vite
- Mobile: React Native, TypeScript, Expo
- Local DB: Docker Compose, PostgreSQL 16

## 구조

```text
apps/
  api/      NestJS API
  web/      React web app
  mobile/   React Native app
```

새 개발은 `apps/*` 기준으로 진행합니다.

## 서비스 설계 문서

- [MVP 제품 범위](docs/product-scope.md)
- [도메인 설계](docs/domain-design.md)
- [PostgreSQL ERD](docs/erd.md)
- [상태 전이](docs/state-transitions.md)
- [API 설계](docs/api-design.md)
- [DB 마이그레이션 계획](docs/migration-plan.md)

## 처음 설정

```bash
npm install
cp apps/api/.env.example apps/api/.env
```

## PostgreSQL 실행

```bash
docker compose up -d postgres
```

상태 확인:

```bash
docker compose ps
docker compose exec postgres pg_isready -U postgres -d golabob
```

## API 실행

최초 실행 또는 새 마이그레이션을 받은 뒤 DB를 먼저 갱신합니다.

```bash
npm run migrate:api
```

그다음 API를 실행합니다.

```bash
npm run dev:api
```

기본 주소:

```text
http://localhost:3000
```

## Web 실행

```bash
npm run dev:web
```

기본 주소:

```text
http://localhost:5173
```

## Mobile 실행

```bash
npm run dev:mobile
```

Expo가 출력하는 QR 또는 에뮬레이터 옵션으로 실행합니다.

## 검증

```bash
npm run build:api
npm run build:web
npm test
```

## 주요 API

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/dining-requests`
- `GET /api/dining-requests/me`
- `GET /api/owner/dining-requests`
- `POST /api/dining-requests/:requestId/offers`
- `GET /api/dining-requests/:requestId/offers`
- `POST /api/dining-requests/:requestId/offers/:offerId/select`

## Swagger 문서

API 서버 실행 후 아래 주소에서 Swagger UI를 확인합니다.

```text
http://localhost:3000/api/docs
```

보호 API는 우측 상단 `Authorize` 버튼에 로그인 응답의 `accessToken`을 Bearer 토큰으로 넣고 테스트합니다. 사용자와 역할은 토큰에서 확인하므로 `x-user-id`, `x-user-role` 같은 임시 헤더는 사용하지 않습니다.

## DB 스키마 관리

관리형 SQL은 `apps/api/migrations/managed`에 파일명 순서대로 추가합니다. 적용 전 상태 확인과 적용 명령은 다음과 같습니다.

```bash
npm run migrate:status:api
npm run migrate:api
```

적용 이력과 SQL 체크섬은 `schema_migrations`에 저장됩니다. 이미 적용한 SQL 파일을 수정하거나 DB에만 존재하는 버전이 있으면 실행이 중단됩니다. API도 필수 마이그레이션이 없으면 시작되지 않습니다.

운영체제별 줄바꿈 차이로 잘못된 drift가 발생하지 않도록 체크섬 계산 전에 `CRLF`와 `CR`을 `LF`로 정규화합니다. 줄바꿈 외의 SQL 내용 변경은 기존과 동일하게 drift로 감지됩니다.

`apps/api/migrations` 바로 아래의 기존 SQL은 관리형 러너 도입 전 수동 보정 이력이며 자동 실행 대상이 아닙니다.

### 로컬 DB 전체 초기화

MVP 스키마 확정 전에는 개발 데이터를 보존하지 않고 아래 명령으로 전체 초기화할 수 있습니다. `golabob` DB의 모든 테이블과 데이터가 삭제됩니다.

```bash
docker compose exec -T postgres psql -U postgres -d golabob -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE" -c "CREATE SCHEMA public AUTHORIZATION postgres"
npm run migrate:api
```

팀 공유·스테이징·운영 데이터가 생긴 뒤에는 이 초기화 명령을 사용하지 않고 신규 버전 SQL을 추가합니다.
