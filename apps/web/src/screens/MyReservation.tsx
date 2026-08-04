import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { AppScreen } from "../types";
import { Restaurant } from "./RestaurantList";

interface Reservation {
  id: string;
  userId: string;
  restaurantId: string;
  reservationDate: string;
  reservationTime: string;
  headCount: number;
  requestMemo: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ReservationWithRestaurant
  extends Reservation {
  restaurantName: string;
  restaurantAddress: string;
  restaurantImageUrl: string;
}

interface Props {
  onNavigate: (
    screen: AppScreen,
  ) => void;

  onWriteReview: (
    reservationId: string,
    restaurantId: string,
    restaurantName: string,
  ) => void;

  requestJson: <T>(
    path: string,
    options?: RequestInit,
  ) => Promise<T>;
}

export default function MyReservation({
  onNavigate,
  onWriteReview,
  requestJson,
}: Props) {
  const [
    reservations,
    setReservations,
  ] = useState<
    ReservationWithRestaurant[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [cancelingId, setCancelingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const loadReservations =
    useCallback(async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const reservationData =
          await requestJson<
            Reservation[]
          >("/api/reservations/me");

        const reservationsWithRestaurant =
          await Promise.all(
            reservationData.map(
              async (reservation) => {
                try {
                  const restaurant =
                    await requestJson<Restaurant>(
                      `/api/restaurants/${reservation.restaurantId}`,
                    );

                  return {
                    ...reservation,
                    restaurantName:
                      restaurant.name,
                    restaurantAddress:
                      restaurant.address,
                    restaurantImageUrl:
                      restaurant.imageUrl ||
                      "",
                  };
                } catch {
                  return {
                    ...reservation,
                    restaurantName:
                      "식당 정보 없음",
                    restaurantAddress:
                      "",
                    restaurantImageUrl:
                      "",
                  };
                }
              },
            ),
          );

        setReservations(
          reservationsWithRestaurant,
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "예약 내역을 불러오지 못했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }, [requestJson]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const cancelReservation = async (
    reservation: ReservationWithRestaurant,
  ) => {
    const isConfirmed =
      window.confirm(
        `${reservation.restaurantName} 예약을 취소하시겠습니까?`,
      );

    if (!isConfirmed) {
      return;
    }

    setCancelingId(reservation.id);
    setMessage("");

    try {
      const canceledReservation =
        await requestJson<Reservation>(
          `/api/reservations/${reservation.id}/cancel`,
          {
            method: "PATCH",

          },
        );

      setReservations((current) =>
        current.map((item) =>
          item.id ===
          canceledReservation.id
            ? {
                ...item,
                status:
                  canceledReservation.status,
                updatedAt:
                  canceledReservation.updatedAt,
              }
            : item,
        ),
      );

      window.alert(
        "예약이 취소되었습니다.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "예약 취소에 실패했습니다.",
      );
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusText = (
    status: string,
  ) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "예약 확정";

      case "pending":
        return "예약 대기";

      case "canceled":
      case "cancelled":
        return "예약 취소";

      case "completed":
        return "이용 완료";

      default:
        return status;
    }
  };

  const getStatusClassName = (
    status: string,
  ) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "confirmed";

      case "pending":
        return "pending";

      case "canceled":
      case "cancelled":
        return "canceled";

      case "completed":
        return "completed";

      default:
        return "";
    }
  };

  const formatDate = (
    date: string,
  ) => {
    if (!date) {
      return "";
    }

    const normalizedDate =
      date.includes("T")
        ? date.split("T")[0]
        : date;

    const [year, month, day] =
      normalizedDate.split("-");

    if (!year || !month || !day) {
      return date;
    }

    return `${year}년 ${Number(
      month,
    )}월 ${Number(day)}일`;
  };

  const isCanceled = (
    status: string,
  ) => {
    const normalized =
      status.toLowerCase();

    return (
      normalized === "canceled" ||
      normalized === "cancelled"
    );
  };

  return (
    <main className="my-reservation-page">
      <section className="my-reservation-container">
        <div className="page-title-row">
          <button
            type="button"
            className="back-button"
            onClick={() =>
              onNavigate(
                "restaurantList",
              )
            }
          >
            <span className="material-symbols-outlined">
              arrow_back
            </span>
          </button>

          <div>
            <h2>내 예약</h2>

            <p>
              예약한 식당과 일정을
              확인할 수 있습니다.
            </p>
          </div>
        </div>

        {message ? (
          <div className="reservation-error-message">
            <span className="material-symbols-outlined">
              error
            </span>

            <p>{message}</p>

            <button
              type="button"
              onClick={() =>
                void loadReservations()
              }
            >
              다시 시도
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="empty-state">
            <span className="material-symbols-outlined reservation-loading-icon">
              progress_activity
            </span>

            <h3>
              예약 내역을 불러오는 중
            </h3>

            <p>
              잠시만 기다려주세요.
            </p>
          </div>
        ) : null}

        {!isLoading &&
        reservations.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">
              event_busy
            </span>

            <h3>
              예약 내역이 없습니다
            </h3>

            <p>
              식당을 둘러보고 원하는
              날짜에 예약해보세요.
            </p>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  "restaurantList",
                )
              }
            >
              식당 둘러보기
            </button>
          </div>
        ) : null}

        {!isLoading &&
        reservations.length > 0 ? (
          <div className="reservation-list">
            {reservations.map(
              (reservation) => (
                <article
                  className="reservation-card"
                  key={reservation.id}
                >
                  <div className="reservation-card-image-area">
                    {reservation.restaurantImageUrl ? (
                      <img
                        src={
                          reservation.restaurantImageUrl
                        }
                        alt={`${reservation.restaurantName} 대표 이미지`}
                        className="reservation-card-image"
                      />
                    ) : (
                      <div className="reservation-card-image-placeholder">
                        <span className="material-symbols-outlined">
                          restaurant
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="reservation-card-content">
                    <div className="reservation-card-header">
                      <div>
                        <h3>
                          {
                            reservation.restaurantName
                          }
                        </h3>

                        {reservation.restaurantAddress ? (
                          <p className="reservation-restaurant-address">
                            <span className="material-symbols-outlined">
                              location_on
                            </span>

                            {
                              reservation.restaurantAddress
                            }
                          </p>
                        ) : null}
                      </div>

                      <span
                        className={`reservation-status ${getStatusClassName(
                          reservation.status,
                        )}`}
                      >
                        {getStatusText(
                          reservation.status,
                        )}
                      </span>
                    </div>

                    <div className="reservation-information">
                      <p>
                        <span className="material-symbols-outlined">
                          calendar_month
                        </span>

                        {formatDate(
                          reservation.reservationDate,
                        )}
                      </p>

                      <p>
                        <span className="material-symbols-outlined">
                          schedule
                        </span>

                        {
                          reservation.reservationTime
                        }
                      </p>

                      <p>
                        <span className="material-symbols-outlined">
                          group
                        </span>

                        {
                          reservation.headCount
                        }
                        명
                      </p>
                    </div>

                    {reservation.requestMemo ? (
                      <div className="reservation-request-memo">
                        <strong>
                          요청사항
                        </strong>

                        <p>
                          {
                            reservation.requestMemo
                          }
                        </p>
                      </div>
                    ) : null}

                    <div className="reservation-button-group">
                      {!isCanceled(
                        reservation.status,
                      ) ? (
                        <button
                          type="button"
                          className="reservation-review-button"
                          onClick={() =>
                            onWriteReview(
                              reservation.id,
                              reservation.restaurantId,
                              reservation.restaurantName,
                            )
                          }
                        >
                          리뷰 작성
                        </button>
                      ) : null}

                      {reservation.status.toLowerCase() ===
                      "confirmed" ? (
                        <button
                          type="button"
                          className="reservation-cancel-button"
                          disabled={
                            cancelingId ===
                            reservation.id
                          }
                          onClick={() =>
                            void cancelReservation(
                              reservation,
                            )
                          }
                        >
                          {cancelingId ===
                          reservation.id
                            ? "취소 중..."
                            : "예약 취소"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
