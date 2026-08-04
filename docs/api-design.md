# 골라밥 API 설계

## 1. 공통 계약

- Base URL은 `/api`를 사용한다.
- 인증은 `Authorization: Bearer <access-token>` 헤더를 사용한다.
- 권한은 토큰의 사용자 ID를 기준으로 DB의 계정 상태·역할·소유권을 검증한다.
- 기존 성공 응답의 필드명은 API 버전을 올리기 전까지 유지한다.
- 검증 오류는 `400`, 인증 실패는 `401`, 권한·소유권 실패는 `403`, 리소스 없음은 `404`, 상태 충돌과 중복은 `409`를 반환한다.
- 목록 API에 페이지네이션을 도입할 때는 `{ items, nextCursor }` 형식을 사용하고 Web·Mobile을 동시에 전환한다.

## 2. 인증과 계정

| 역할 | Method | Path | 설명 |
| --- | --- | --- | --- |
| Public | POST | `/auth/signup` | `user` 계정 회원가입. 클라이언트 역할 입력은 받지 않는다 |
| Public | POST | `/auth/login` | 로그인과 토큰 발급 |
| 로그인 | GET | `/auth/me` | 최신 계정 상태와 역할 조회 |
| 로그인 | PATCH | `/auth/me` | 이름·이메일·휴대전화 수정. 연락처 변경 시 해당 인증 상태 초기화 |
| user | POST | `/auth/owner-role` | `owner` 역할을 멱등하게 즉시 추가하고 갱신된 액세스 토큰 발급 |
| 로그인 | POST | `/auth/logout` | 현재 세션 종료. Refresh Token 도입 시 구현 |
| 로그인 | GET | `/owner-applications/me` | 후속: 내 사업자 신청 조회 |
| user | POST | `/owner-applications` | 후속: 사업자 신청 제출 |
| user | PATCH | `/owner-applications/:id/withdraw` | 후속: pending 신청 철회 |
| admin | GET | `/admin/owner-applications` | 후속: 상태별 신청 목록 조회 |
| admin | PATCH | `/admin/owner-applications/:id/approve` | 후속: 신청 승인과 owner 역할 부여 |
| admin | PATCH | `/admin/owner-applications/:id/reject` | 후속: 사유를 포함한 신청 반려 |

`POST /auth/signup` 요청 예시:

```json
{
  "name": "홍길동",
  "email": "user@example.com",
  "phone": "010-1234-5678",
  "password": "password1234",
  "agreements": {
    "serviceTerms": true,
    "privacyPolicy": true,
    "marketingConsent": false
  }
}
```

서버는 휴대전화 번호를 `+82` E.164 형식으로 정규화한다. 서비스 이용약관과 개인정보 수집 및 이용 동의가 모두 `true`가 아니면 회원가입을 거부하며, 계정과 기본 `user` 역할 및 활성 약관 버전별 동의를 하나의 트랜잭션으로 저장한다.

현재 MVP의 사장님 전환 API는 활성 계정 행을 잠근 뒤 `user_roles.owner`를 중복 없이 추가하고, 새 역할이 포함된 액세스 토큰을 반환한다. 사업자 승인 API를 도입할 때는 신청 행 잠금, 상태 변경, 역할 추가와 이력 생성을 한 트랜잭션으로 처리한다.

## 3. 식당

| 역할 | Method | Path | 설명 |
| --- | --- | --- | --- |
| Public | GET | `/restaurants` | 승인된 식당 목록 조회 |
| Public | GET | `/restaurants/:id` | 승인된 식당 상세 조회 |
| owner | POST | `/owner/restaurants` | 식당 등록. `pending` 상태로 생성 |
| owner | GET | `/owner/restaurants` | 본인 식당 목록 조회 |
| owner | GET | `/owner/restaurants/:id` | 본인 식당 상세와 승인 상태 조회 |
| owner | PATCH | `/owner/restaurants/:id` | 본인 식당 수정 |
| owner | POST | `/owner/restaurants/:id/resubmit` | 반려 식당 재심사 요청 |
| admin | GET | `/admin/restaurants` | 상태별 식당 목록 조회 |
| admin | PATCH | `/admin/restaurants/:id/approve` | 식당 승인 |
| admin | PATCH | `/admin/restaurants/:id/reject` | 식당 반려 |
| admin | PATCH | `/admin/restaurants/:id/suspend` | 운영 식당 정지 |

사장님 API는 URL의 식당 ID뿐 아니라 `restaurants.owner_id = currentUser.id` 조건을 항상 SQL에 포함한다.

## 4. 회식 요청

| 역할 | Method | Path | 설명 |
| --- | --- | --- | --- |
| user | POST | `/dining-requests` | 회식 조건과 오퍼 마감 시각 등록 |
| user | GET | `/dining-requests/me` | 내 요청 목록 조회 |
| user | GET | `/dining-requests/:id` | 내 요청 상세 조회 |
| user | PATCH | `/dining-requests/:id` | open이고 유효 오퍼가 없을 때 수정 |
| user | PATCH | `/dining-requests/:id/cancel` | open 요청 취소 |
| owner | GET | `/owner/dining-requests` | 마감되지 않은 open 요청 조회 |
| owner | GET | `/owner/dining-requests/:id` | 오퍼 작성용 요청 상세 조회 |

생성 요청에는 기존 필드와 함께 `offerDeadlineAt`을 추가한다. 서버는 마감 시각이 현재보다 이후이고 회식 시작보다 이전인지 검증한다.

## 5. 오퍼

| 역할 | Method | Path | 설명 |
| --- | --- | --- | --- |
| owner | POST | `/dining-requests/:requestId/offers` | 승인된 본인 식당으로 오퍼 작성 |
| owner | GET | `/owner/offers` | 본인 식당이 보낸 오퍼 목록 조회 |
| owner | GET | `/owner/offers/restaurants` | 오퍼 작성 가능한 승인 식당 조회 |
| owner | GET | `/owner/offers/:id` | 본인 식당 오퍼 상세 조회 |
| owner | PATCH | `/owner/offers/:id` | pending 오퍼 수정 |
| owner | PATCH | `/owner/offers/:id/cancel` | pending 오퍼 취소 |
| user | GET | `/dining-requests/:requestId/offers` | 본인 요청에 도착한 오퍼 조회 |
| user | POST | `/dining-requests/:requestId/offers/:offerId/select` | 오퍼 선택과 예약 확정 |

오퍼 선택 API는 `Idempotency-Key` 헤더를 받고 다음 작업을 한 트랜잭션으로 처리한다.

1. 요청과 선택 오퍼를 잠그고 소유권·상태·만료를 검증한다.
2. 선택 오퍼를 `selected`, 나머지를 `rejected`로 변경한다.
3. 요청을 `matched`로 변경한다.
4. 확정 시점 조건을 복사한 예약을 생성한다.
5. 상태 이력과 멱등성 응답을 저장한다.

성공 응답은 생성된 예약 리소스를 반환한다.

## 6. 예약

| 역할 | Method | Path | 설명 |
| --- | --- | --- | --- |
| user | POST | `/reservations` | 승인된 식당 일반 예약 생성 |
| user | GET | `/reservations/me` | 내 예약 목록 조회 |
| user | GET | `/reservations/:id` | 내 예약 상세 조회 |
| user | PATCH | `/reservations/:id/cancel` | 사유를 포함한 예약 취소 |
| owner | GET | `/owner/reservations` | 본인 식당 예약 목록 조회 |
| owner | GET | `/owner/reservations/:id` | 본인 식당 예약 상세 조회 |
| owner | PATCH | `/owner/reservations/:id/cancel` | 사유를 포함한 예약 취소 |

`POST /reservations`는 `direct` 유형 일반 예약을 생성한다. 오퍼 선택 API는 `offer` 유형 예약을 생성하며 클라이언트가 예약 유형을 임의로 지정하지 못하게 한다. 예약 날짜·인원 변경은 MVP에서 취소 후 새 예약 또는 새 요청으로 처리한다.

예약 취소 요청 예시:

```json
{
  "reason": "회사 일정이 변경되었습니다."
}
```

## 7. 원격 웨이팅

| 역할 | Method | Path | 설명 |
| --- | --- | --- | --- |
| user | POST | `/restaurants/:restaurantId/waitlist` | 원격 웨이팅 등록 |
| user | GET | `/waitlist/me/active` | 내 활성 웨이팅·순번 조회 |
| user | PATCH | `/waitlist/:id/cancel` | 내 웨이팅 취소 |
| owner | GET | `/owner/restaurants/:restaurantId/waitlist` | 본인 식당 대기열 조회 |
| owner | PATCH | `/owner/restaurants/:restaurantId/waitlist/settings` | 접수 여부·최대 인원·호출 제한 시간 변경 |
| owner | PATCH | `/owner/waitlist/:id/call` | 고객 호출 |
| owner | PATCH | `/owner/waitlist/:id/seat` | 착석 처리 |
| owner | PATCH | `/owner/waitlist/:id/no-show` | 노쇼 처리 |
| owner | PATCH | `/owner/waitlist/:id/cancel` | 사유를 포함한 웨이팅 취소 |

웨이팅 등록은 식당 설정 행과 일자별 번호 카운터를 잠그고 다음 번호를 발급한다. 상태 변경 API는 본인 식당 소유권과 현재 상태를 SQL 조건에 포함한다.

## 8. 리뷰

| 역할 | Method | Path | 설명 |
| --- | --- | --- | --- |
| user | POST | `/reviews` | 본인의 completed 예약에 리뷰 작성 |
| user | GET | `/reviews/me` | 내 리뷰 조회 |
| Public | GET | `/restaurants/:restaurantId/reviews` | 식당 리뷰 조회 |
| user | PATCH | `/reviews/:id` | 본인 리뷰 수정 |
| user | DELETE | `/reviews/:id` | 본인 리뷰 삭제 |

## 9. 관리자 운영 API 원칙

- 모든 관리자 변경에는 관리자 ID, 이전 상태, 변경 상태, 사유와 시각을 남긴다.
- 사업자번호와 증빙 URL은 관리자 권한이 있는 응답에만 포함한다.
- 승인·반려·정지 API는 동일 요청 재실행 시 현재 상태에 따라 멱등 응답 또는 `409`를 반환한다.

## 10. 동시성과 일관성

- 오퍼 선택은 `SELECT ... FOR UPDATE`와 예약 유일 제약을 함께 사용한다.
- 수정 API는 `version`을 전달받아 낙관적 잠금을 적용한다.
- 상태 조건을 SQL `WHERE` 절에 포함하고 변경 행이 0개면 `409`를 반환한다.
- 네트워크 재시도가 예상되는 선택·승인 API는 멱등성 키를 지원한다.
- 웨이팅 번호는 `(restaurant_id, business_date)` 단위 카운터 행을 잠가 중복 발급을 방지한다.

## 11. 현재 API에서 변경되는 부분

| 현재 | 목표 |
| --- | --- |
| 회원가입 요청이 owner 역할을 직접 받을 수 있음 | 회원가입은 user 고정, 현재 MVP에서는 로그인 후 `/auth/owner-role` 요청으로 owner를 즉시 추가 |
| 식당이 기본 approved로 생성됨 | pending 생성 후 관리자 승인 |
| 요청 수정 API 없음 | 오퍼 도착 전 조건부 수정 API 추가 |
| 오퍼 수정·취소·선택 API 없음 | 상태 규칙을 적용한 API 추가 |
| 예약 유형 구분 없이 직접 생성 | 일반 예약은 direct, 오퍼 선택 예약은 offer 유형으로 구분하고 일반 수정은 제한 |
| 원격 웨이팅 API 없음 | 사용자 줄서기와 사장님 호출·착석·노쇼 API 추가 |
| 취소 사유와 상태 이력 없음 | 취소 DTO와 상태 이력 저장 |
