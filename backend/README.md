# Golabob Backend

Node.js와 Express로 만든 Golabob 백엔드 프로젝트입니다.

## 실행 방법

```bash
npm install
cp .env.example .env
npm run dev
```

서버 실행 후 아래 주소에서 상태를 확인할 수 있습니다.

```text
GET http://localhost:3000/api/health
```

## 명령어

- `npm run dev`: 개발 서버 실행
- `npm start`: 일반 서버 실행
- `npm test`: API 테스트 실행
