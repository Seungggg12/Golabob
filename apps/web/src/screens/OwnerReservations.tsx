import {
    useCallback,
    useEffect,
    useState,
  } from "react";
  import { Navigate } from "../types";
  
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
  
  interface Restaurant {
    id: string;
    name: string;
    address: string;
  }
  
  interface OwnerReservation
    extends Reservation {
    restaurantName: string;
    restaurantAddress: string;
  }
  
  interface Props {
    onNavigate: Navigate;
  
    requestJson: <T>(
      path: string,
      options?: RequestInit,
    ) => Promise<T>;
  }
  
  type ActionType =
    | "confirm"
    | "reject";
  
  export default function OwnerReservations({
    onNavigate,
    requestJson,
  }: Props) {
    const [
      reservations,
      setReservations,
    ] = useState<OwnerReservation[]>([]);
  
    const [isLoading, setIsLoading] =
      useState(true);
  
    const [message, setMessage] =
      useState("");
  
    const [processing, setProcessing] =
      useState<{
        id: string;
        action: ActionType;
      } | null>(null);
  
    const loadReservations =
      useCallback(async () => {
        setIsLoading(true);
        setMessage("");
  
        try {
          const reservationData =
            await requestJson<
              Reservation[]
            >("/api/owner/reservations", {
              headers: {
                "x-user-id": "1",
                "x-user-role": "OWNER",
              },
            });
  
          const result =
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
                    };
                  } catch {
                    return {
                      ...reservation,
                      restaurantName:
                        "식당 정보 없음",
                      restaurantAddress: "",
                    };
                  }
                },
              ),
            );
  
          setReservations(result);
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "예약 요청을 불러오지 못했습니다.",
          );
        } finally {
          setIsLoading(false);
        }
      }, [requestJson]);
  
    useEffect(() => {
      void loadReservations();
    }, [loadReservations]);
  
    const updateReservationStatus = (
      updatedReservation: Reservation,
    ) => {
      setReservations((current) =>
        current.map((reservation) =>
          reservation.id ===
          updatedReservation.id
            ? {
                ...reservation,
                status:
                  updatedReservation.status,
                updatedAt:
                  updatedReservation.updatedAt,
              }
            : reservation,
        ),
      );
    };
  
    const confirmReservation = async (
      reservation: OwnerReservation,
    ) => {
      const confirmed =
        window.confirm(
          `${reservation.restaurantName} 예약을 확정하시겠습니까?`,
        );
  
      if (!confirmed) {
        return;
      }
  
      setProcessing({
        id: reservation.id,
        action: "confirm",
      });
  
      setMessage("");
  
      try {
        const updatedReservation =
          await requestJson<Reservation>(
            `/api/owner/reservations/${reservation.id}/confirm`,
            {
              method: "PATCH",
  
              headers: {
                "x-user-id": "1",
                "x-user-role": "OWNER",
              },
            },
          );
  
        updateReservationStatus(
          updatedReservation,
        );
  
        window.alert(
          "예약이 확정되었습니다.",
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "예약 확정에 실패했습니다.",
        );
      } finally {
        setProcessing(null);
      }
    };
  
    const rejectReservation = async (
      reservation: OwnerReservation,
    ) => {
      const confirmed =
        window.confirm(
          `${reservation.restaurantName} 예약을 거절하시겠습니까?`,
        );
  
      if (!confirmed) {
        return;
      }
  
      setProcessing({
        id: reservation.id,
        action: "reject",
      });
  
      setMessage("");
  
      try {
        const updatedReservation =
          await requestJson<Reservation>(
            `/api/owner/reservations/${reservation.id}/reject`,
            {
              method: "PATCH",
  
              headers: {
                "x-user-id": "1",
                "x-user-role": "OWNER",
              },
            },
          );
  
        updateReservationStatus(
          updatedReservation,
        );
  
        window.alert(
          "예약이 거절되었습니다.",
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "예약 거절에 실패했습니다.",
        );
      } finally {
        setProcessing(null);
      }
    };
  
    const getStatusText = (
      status: string,
    ) => {
      switch (status.toLowerCase()) {
        case "pending":
          return "확인 대기";
  
        case "confirmed":
          return "예약 확정";
  
        case "rejected":
          return "예약 거절";
  
        case "canceled":
        case "cancelled":
          return "예약 취소";
  
        case "completed":
          return "방문 완료";
  
        default:
          return status;
      }
    };
  
    const getStatusClassName = (
      status: string,
    ) => {
      switch (status.toLowerCase()) {
        case "pending":
          return "pending";
  
        case "confirmed":
          return "confirmed";
  
        case "rejected":
          return "rejected";
  
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
  
      const normalized =
        date.includes("T")
          ? date.split("T")[0]
          : date;
  
      const [year, month, day] =
        normalized.split("-");
  
      if (!year || !month || !day) {
        return date;
      }
  
      return `${year}년 ${Number(
        month,
      )}월 ${Number(day)}일`;
    };
  
    const isProcessing = (
      reservationId: string,
    ) => {
      return (
        processing?.id === reservationId
      );
    };
  
    return (
      <main className="owner-reservations-page">
        <section className="owner-reservations-container">
          <div className="page-title-row">
            <button
              type="button"
              className="back-button"
              onClick={() =>
                onNavigate("ownerHome")
              }
            >
              <span className="material-symbols-outlined">
                arrow_back
              </span>
            </button>
  
            <div>
              <h2>새 예약 요청</h2>
  
              <p>
                내 식당에 들어온 예약 요청을
                확인하고 처리할 수 있습니다.
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
                예약 요청을 불러오는 중
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
                예약 요청이 없습니다
              </h3>
  
              <p>
                새로운 예약이 들어오면
                이곳에 표시됩니다.
              </p>
            </div>
          ) : null}
  
          {!isLoading &&
          reservations.length > 0 ? (
            <div className="owner-reservation-list">
              {reservations.map(
                (reservation) => (
                  <article
                    key={reservation.id}
                    className="owner-reservation-card"
                  >
                    <div className="owner-reservation-card-header">
                      <div>
                        <h3>
                          {
                            reservation.restaurantName
                          }
                        </h3>
  
                        {reservation.restaurantAddress ? (
                          <p>
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
  
                    <div className="owner-reservation-information">
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
  
                    {reservation.status.toLowerCase() ===
                    "pending" ? (
                      <div className="owner-reservation-actions">
                        <button
                          type="button"
                          className="owner-reservation-confirm-button"
                          disabled={isProcessing(
                            reservation.id,
                          )}
                          onClick={() =>
                            void confirmReservation(
                              reservation,
                            )
                          }
                        >
                          {processing?.id ===
                            reservation.id &&
                          processing.action ===
                            "confirm"
                            ? "확정 중..."
                            : "예약 확정"}
                        </button>
  
                        <button
                          type="button"
                          className="owner-reservation-reject-button"
                          disabled={isProcessing(
                            reservation.id,
                          )}
                          onClick={() =>
                            void rejectReservation(
                              reservation,
                            )
                          }
                        >
                          {processing?.id ===
                            reservation.id &&
                          processing.action ===
                            "reject"
                            ? "거절 중..."
                            : "예약 거절"}
                        </button>
                      </div>
                    ) : null}
                  </article>
                ),
              )}
            </div>
          ) : null}
        </section>
      </main>
    );
  }