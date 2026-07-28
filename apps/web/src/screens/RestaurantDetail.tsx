import { useState } from "react";
import { AppScreen } from "../types";
import { Restaurant } from "./RestaurantList";

interface ReservationResponse {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string | null;
  reservationDate: string;
  reservationTime: string;
  headCount: number;
  requestMemo: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onNavigate: (screen: AppScreen) => void;

  restaurant: Restaurant | null;

  requestJson: <T>(
    path: string,
    options?: RequestInit,
  ) => Promise<T>;
}

export default function RestaurantDetail({
  onNavigate,
  restaurant,
  requestJson,
}: Props) {
  const [reservationDate, setReservationDate] =
    useState("");

  const [reservationTime, setReservationTime] =
    useState("");

  const [headCount, setHeadCount] =
    useState(2);

  const [requestMemo, setRequestMemo] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  if (!restaurant) {
    return (
      <main className="restaurant-detail-page">
        <section className="restaurant-detail-empty">
          <span className="material-symbols-outlined">
            restaurant
          </span>

          <h2>식당 정보가 없습니다.</h2>

          <button
            type="button"
            onClick={() =>
              onNavigate("restaurantList")
            }
          >
            식당 목록으로 돌아가기
          </button>
        </section>
      </main>
    );
  }

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const handleReservation = async () => {
    if (
      !reservationDate ||
      !reservationTime
    ) {
      setMessage(
        "예약 날짜와 시간을 선택해주세요.",
      );
      return;
    }

    if (
      !Number.isInteger(headCount) ||
      headCount < 1
    ) {
      setMessage(
        "예약 인원은 1명 이상이어야 합니다.",
      );
      return;
    }

    if (
      headCount >
      restaurant.maxCapacity
    ) {
      setMessage(
        `최대 ${restaurant.maxCapacity}명까지 예약할 수 있습니다.`,
      );
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await requestJson<ReservationResponse>(
        "/api/reservations",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            "x-user-id": "1",
            "x-user-role": "USER",
          },

          body: JSON.stringify({
            restaurantId:
              restaurant.id,

            reservationDate,

            reservationTime,

            headCount,

            requestMemo:
              requestMemo.trim() ||
              undefined,
          }),
        },
      );

      window.alert(
        "예약이 완료되었습니다.",
      );

      onNavigate("myReservation");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "예약에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="restaurant-detail-page">
      <section className="restaurant-detail-container">
        <button
          type="button"
          className="restaurant-detail-back"
          onClick={() =>
            onNavigate("restaurantList")
          }
        >
          <span className="material-symbols-outlined">
            arrow_back
          </span>

          <span>식당 목록</span>
        </button>

        <article className="restaurant-detail-card">
          <div className="restaurant-detail-image-area">
            {restaurant.imageUrl ? (
              <img
                src={restaurant.imageUrl}
                alt={`${restaurant.name} 대표 사진`}
                className="restaurant-detail-image"
              />
            ) : (
              <div className="restaurant-detail-image-placeholder">
                <span className="material-symbols-outlined">
                  restaurant
                </span>

                <p>
                  등록된 대표 사진이
                  없습니다.
                </p>
              </div>
            )}

            <span className="restaurant-detail-category">
              {restaurant.category}
            </span>
          </div>

          <div className="restaurant-detail-content">
            <section className="restaurant-detail-information">
              <div className="restaurant-detail-title">
                <div>
                  <p className="restaurant-detail-eyebrow">
                    골라밥 일반 예약
                  </p>

                  <h1>
                    {restaurant.name}
                  </h1>
                </div>

                <span className="restaurant-detail-capacity">
                  최대{" "}
                  {restaurant.maxCapacity}
                  명
                </span>
              </div>

              <div className="restaurant-detail-info-list">
                <div className="restaurant-detail-info-row">
                  <span className="material-symbols-outlined">
                    location_on
                  </span>

                  <div>
                    <strong>주소</strong>

                    <p>
                      {restaurant.address}
                    </p>
                  </div>
                </div>

                <div className="restaurant-detail-info-row">
                  <span className="material-symbols-outlined">
                    call
                  </span>

                  <div>
                    <strong>
                      전화번호
                    </strong>

                    <p>
                      {restaurant.phone ||
                        "전화번호 정보 없음"}
                    </p>
                  </div>
                </div>

                <div className="restaurant-detail-info-row">
                  <span className="material-symbols-outlined">
                    schedule
                  </span>

                  <div>
                    <strong>
                      영업시간
                    </strong>

                    <p>
                      {restaurant.openTime}
                      {" ~ "}
                      {restaurant.closeTime}
                    </p>
                  </div>
                </div>

                <div className="restaurant-detail-info-row">
                  <span className="material-symbols-outlined">
                    groups
                  </span>

                  <div>
                    <strong>
                      수용 인원
                    </strong>

                    <p>
                      최대{" "}
                      {
                        restaurant.maxCapacity
                      }
                      명
                    </p>
                  </div>
                </div>
              </div>

              <div className="restaurant-detail-options">
                {restaurant.hasRoom ? (
                  <span>
                    <span className="material-symbols-outlined">
                      meeting_room
                    </span>

                    룸 있음
                  </span>
                ) : null}

                {restaurant.hasParking ? (
                  <span>
                    <span className="material-symbols-outlined">
                      local_parking
                    </span>

                    주차 가능
                  </span>
                ) : null}

                {!restaurant.hasRoom &&
                !restaurant.hasParking ? (
                  <span>
                    등록된 편의시설이
                    없습니다.
                  </span>
                ) : null}
              </div>

              <div className="restaurant-detail-description">
                <h2>식당 소개</h2>

                <p>
                  {restaurant.description ||
                    "등록된 식당 소개가 없습니다."}
                </p>
              </div>
            </section>

            <aside className="restaurant-detail-reservation">
              <div className="restaurant-detail-reservation-header">
                <h2>예약 정보</h2>

                <p>
                  방문 날짜와 인원을
                  선택해주세요.
                </p>
              </div>

              <div className="restaurant-detail-form">
                <div className="restaurant-detail-field">
                  <label htmlFor="reservation-date">
                    예약 날짜
                  </label>

                  <input
                    id="reservation-date"
                    type="date"
                    min={today}
                    value={reservationDate}
                    onChange={(event) =>
                      setReservationDate(
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="restaurant-detail-field">
                  <label htmlFor="reservation-time">
                    예약 시간
                  </label>

                  <input
                    id="reservation-time"
                    type="time"
                    value={reservationTime}
                    onChange={(event) =>
                      setReservationTime(
                        event.target.value,
                      )
                    }
                  />

                  <p className="restaurant-detail-guide">
                    영업시간:{" "}
                    {restaurant.openTime}
                    {" ~ "}
                    {restaurant.closeTime}
                  </p>
                </div>

                <div className="restaurant-detail-field">
                  <label htmlFor="reservation-head-count">
                    예약 인원
                  </label>

                  <div className="restaurant-detail-counter">
                    <button
                      type="button"
                      onClick={() =>
                        setHeadCount(
                          Math.max(
                            1,
                            headCount - 1,
                          ),
                        )
                      }
                      disabled={
                        headCount <= 1
                      }
                      aria-label="예약 인원 줄이기"
                    >
                      <span className="material-symbols-outlined">
                        remove
                      </span>
                    </button>

                    <input
                      id="reservation-head-count"
                      type="number"
                      min={1}
                      max={
                        restaurant.maxCapacity
                      }
                      value={headCount}
                      onChange={(event) =>
                        setHeadCount(
                          Number(
                            event.target
                              .value,
                          ),
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setHeadCount(
                          Math.min(
                            restaurant.maxCapacity,
                            headCount + 1,
                          ),
                        )
                      }
                      disabled={
                        headCount >=
                        restaurant.maxCapacity
                      }
                      aria-label="예약 인원 늘리기"
                    >
                      <span className="material-symbols-outlined">
                        add
                      </span>
                    </button>
                  </div>
                </div>

                <div className="restaurant-detail-field">
                  <label htmlFor="reservation-memo">
                    요청사항
                  </label>

                  <textarea
                    id="reservation-memo"
                    rows={4}
                    value={requestMemo}
                    onChange={(event) =>
                      setRequestMemo(
                        event.target.value,
                      )
                    }
                    placeholder="알레르기, 좌석 등 요청사항을 입력해주세요."
                  />
                </div>

                {message ? (
                  <p className="restaurant-detail-message">
                    {message}
                  </p>
                ) : null}

                <button
                  type="button"
                  className="restaurant-detail-submit"
                  onClick={() =>
                    void handleReservation()
                  }
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "예약 중..."
                    : "예약하기"}
                </button>
              </div>
            </aside>
          </div>
        </article>
      </section>
    </main>
  );
}