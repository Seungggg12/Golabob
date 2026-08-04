# 골라밥 PostgreSQL ERD

## 1. 목표 데이터 모델

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    USERS ||--o{ USER_TERM_AGREEMENTS : accepts
    TERMS ||--o{ USER_TERM_AGREEMENTS : records
    USERS ||--o{ OWNER_APPLICATIONS : submits
    USERS ||--o{ RESTAURANTS : owns
    USERS ||--o{ DINING_REQUESTS : creates
    USERS ||--o{ RESERVATIONS : books
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ WAITLIST_ENTRIES : joins

    RESTAURANTS ||--o{ RESTAURANT_BUSINESS_HOURS : has
    RESTAURANTS ||--o{ RESTAURANT_FACILITIES : has
    RESTAURANTS ||--o{ RESTAURANT_PHOTOS : has
    RESTAURANTS ||--o{ OFFERS : sends
    RESTAURANTS ||--o{ RESERVATIONS : receives
    RESTAURANTS ||--o{ REVIEWS : receives
    RESTAURANTS ||--o| WAITING_SETTINGS : configures
    RESTAURANTS ||--o{ WAITLIST_DAILY_COUNTERS : numbers
    RESTAURANTS ||--o{ WAITLIST_ENTRIES : queues

    DINING_REQUESTS ||--o{ OFFERS : receives
    DINING_REQUESTS ||--o| RESERVATIONS : becomes
    DINING_REQUESTS ||--o{ DINING_REQUEST_STATUS_HISTORY : records

    OFFERS ||--o| RESERVATIONS : accepted_as
    OFFERS ||--o{ OFFER_STATUS_HISTORY : records

    RESERVATIONS ||--o| REVIEWS : reviewed_by
    RESERVATIONS ||--o{ RESERVATION_STATUS_HISTORY : records
    WAITLIST_ENTRIES ||--o{ WAITLIST_STATUS_HISTORY : records

    USERS {
        uuid id PK
        text name
        text email UK
        text phone UK
        text password_hash
        text role
        text status
        timestamptz email_verified_at
        timestamptz phone_verified_at
        timestamptz created_at
        timestamptz updated_at
    }

    USER_ROLES {
        uuid user_id PK,FK
        text role PK
        timestamptz created_at
    }

    TERMS {
        bigint id PK
        text code UK
        int version UK
        text title
        boolean is_required
        boolean is_active
        timestamptz effective_at
        timestamptz created_at
    }

    USER_TERM_AGREEMENTS {
        uuid user_id PK,FK
        bigint term_id PK,FK
        boolean agreed
        timestamptz agreed_at
        timestamptz created_at
    }

    OWNER_APPLICATIONS {
        uuid id PK
        uuid user_id FK
        text business_number UK
        text business_name
        text representative_name
        text document_url
        text status
        uuid reviewed_by FK
        text rejection_reason
        timestamptz reviewed_at
        timestamptz created_at
        timestamptz updated_at
    }

    RESTAURANTS {
        uuid id PK
        uuid owner_id FK
        text name
        text address
        decimal latitude
        decimal longitude
        text category
        text description
        int max_capacity
        text status
        timestamptz approved_at
        uuid approved_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    RESTAURANT_BUSINESS_HOURS {
        bigint id PK
        uuid restaurant_id FK
        smallint day_of_week
        time open_time
        time close_time
        boolean is_closed
    }

    RESTAURANT_FACILITIES {
        uuid restaurant_id PK,FK
        text facility_code PK
    }

    RESTAURANT_PHOTOS {
        uuid id PK
        uuid restaurant_id FK
        text image_url
        int sort_order
        boolean is_primary
        timestamptz created_at
    }

    DINING_REQUESTS {
        bigint id PK
        uuid user_id FK
        text title
        date dining_date
        time dining_time
        int head_count
        text region
        int budget_per_person
        text preferred_menu
        text required_options
        text memo
        timestamptz offer_deadline_at
        text status
        int version
        timestamptz created_at
        timestamptz updated_at
    }

    OFFERS {
        bigint id PK
        bigint dining_request_id FK
        uuid restaurant_id FK
        int price_per_person
        text menu_description
        text service_description
        text seat_description
        time available_time
        text owner_comment
        text status
        timestamptz expires_at
        int version
        timestamptz created_at
        timestamptz updated_at
    }

    RESERVATIONS {
        uuid id PK
        text reservation_type
        bigint dining_request_id UK,FK
        bigint accepted_offer_id UK,FK
        uuid user_id FK
        uuid restaurant_id FK
        date reservation_date
        time reservation_time
        int head_count
        int price_per_person
        text menu_summary
        text request_memo
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    REVIEWS {
        uuid id PK
        uuid reservation_id UK,FK
        uuid restaurant_id FK
        uuid user_id FK
        int rating
        text content
        timestamptz created_at
        timestamptz updated_at
    }

    WAITING_SETTINGS {
        uuid restaurant_id PK,FK
        boolean is_open
        int max_party_size
        int call_grace_minutes
        timestamptz updated_at
    }

    WAITLIST_DAILY_COUNTERS {
        uuid restaurant_id PK,FK
        date business_date PK
        int last_queue_number
        timestamptz updated_at
    }

    WAITLIST_ENTRIES {
        uuid id PK
        uuid restaurant_id FK
        uuid user_id FK
        date business_date
        int queue_number
        int party_size
        text contact_name
        text contact_phone
        text status
        timestamptz called_at
        timestamptz expires_at
        timestamptz created_at
        timestamptz updated_at
    }

    WAITLIST_STATUS_HISTORY {
        bigint id PK
        uuid waitlist_entry_id FK
        text from_status
        text to_status
        uuid changed_by FK
        text actor_role
        text reason
        timestamptz created_at
    }

    DINING_REQUEST_STATUS_HISTORY {
        bigint id PK
        bigint dining_request_id FK
        text from_status
        text to_status
        uuid changed_by FK
        text reason
        timestamptz created_at
    }

    OFFER_STATUS_HISTORY {
        bigint id PK
        bigint offer_id FK
        text from_status
        text to_status
        uuid changed_by FK
        text reason
        timestamptz created_at
    }

    RESERVATION_STATUS_HISTORY {
        bigint id PK
        uuid reservation_id FK
        text from_status
        text to_status
        uuid changed_by FK
        text actor_role
        text reason
        timestamptz created_at
    }
```

## 2. 주요 키 전략

- 계정, 식당, 예약처럼 외부 시스템과 연결될 가능성이 큰 식별자는 UUID를 유지한다.
- 현재 API와 데이터 호환을 위해 회식 요청과 오퍼의 기본 키는 BIGINT를 유지한다.
- 모든 사용자 참조 컬럼은 `users.id`를 가리키는 UUID 외래 키로 통일한다.
- 시간은 업무상 날짜·시각이면 `DATE`와 `TIME`, 사건 발생 시각과 마감이면 `TIMESTAMPTZ`를 사용한다.

## 3. 필수 제약조건

| 테이블 | 제약조건 |
| --- | --- |
| users | 대소문자 무관 `email` 유일, E.164 `phone` 유일, `status IN ('active', 'suspended', 'withdrawn')` |
| user_roles | `(user_id, role)` 복합 PK, 역할 CHECK |
| terms | `(code, version)` 유일, 코드별 활성 버전 하나 |
| user_term_agreements | `(user_id, term_id)` 복합 PK, 동의 여부와 동의 시각 일치 |
| owner_applications | 활성 신청 중복 방지 부분 유일 인덱스 |
| restaurants | owner UUID FK, 상태 CHECK, 수용 인원 양수 |
| restaurant_business_hours | `(restaurant_id, day_of_week)` 유일, 요일 0~6 |
| dining_requests | 인원 2명 이상, 예산 양수, 상태 CHECK, 마감이 회식 시작보다 빠름 |
| offers | `(dining_request_id, restaurant_id)` 유일, 가격 양수, 상태 CHECK |
| reservations | 예약 유형 CHECK, nullable 요청·오퍼 참조의 부분 유일 인덱스, 상태 CHECK |
| reviews | `reservation_id` 유일, 평점 1~5 |
| waiting_settings | 최대 인원·호출 제한 시간 양수, 식당별 한 행 |
| waitlist_daily_counters | `(restaurant_id, business_date)` 복합 PK, 마지막 번호 0 이상 |
| waitlist_entries | `(restaurant_id, business_date, queue_number)` 유일, 상태 CHECK, 사용자별 활성 웨이팅 부분 유일 인덱스 |

## 4. 필수 인덱스

- `dining_requests(status, offer_deadline_at, dining_date, dining_time)`
- `dining_requests(user_id, created_at DESC)`
- `offers(dining_request_id, status, price_per_person)`
- `offers(restaurant_id, created_at DESC)`
- `restaurants(owner_id, status)`
- `restaurants(status, category)`
- `reservations(user_id, created_at DESC)`
- `reservations(restaurant_id, reservation_date, reservation_time)`
- `waitlist_entries(restaurant_id, business_date, status, queue_number)`
- `waitlist_entries(user_id, status, created_at DESC)`
- 각 상태 이력 테이블의 대상 FK와 `created_at DESC`

## 5. 현재 구조와의 차이

| 현재 구조 | 목표 구조 |
| --- | --- |
| 사용자 참조가 `TEXT`이고 FK가 없음 | UUID 타입과 `users(id)` FK 사용 |
| 식당 생성 기본 상태가 `approved` | 기본 상태 `pending`, 관리자 승인 후 `approved` |
| 영업시간·시설이 식당 단일 행에 포함 | 영업시간·시설·사진을 별도 검색 가능 테이블로 분리 |
| 예약 유형 구분이 없고 요청·선택 오퍼와 무관 | `offer` 예약은 요청·선택 오퍼를 연결하고 `direct` 예약은 직접 식당 예약으로 구분 |
| 상태 변경 이력이 없음 | 요청·오퍼·예약별 상태 이력 테이블 추가 |
| 웨이팅 데이터 구조가 없음 | 식당 설정, 대기 항목, 상태 이력 테이블 추가 |
| 계정 상태와 사업자 신청이 없음 | 계정 상태와 owner 신청·심사 구조 추가 |

## 6. 삭제 정책

- 운영 데이터는 기본적으로 물리 삭제하지 않고 상태 변경으로 보존한다.
- 사용자 탈퇴는 `withdrawn` 처리하고 법적 보존 기간 후 개인정보를 익명화한다.
- 식당·요청·오퍼·예약은 참조 이력 때문에 물리 삭제 API를 제공하지 않는다.
- 개발·테스트 데이터 정리는 명시적인 관리 스크립트에서 FK 역순으로 수행한다.
