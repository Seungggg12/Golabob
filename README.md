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

`GET /api/auth/me`는 우측 상단 `Authorize` 버튼에 로그인 응답의 `accessToken`을 Bearer 토큰으로 넣고 테스트합니다.
