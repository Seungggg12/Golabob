import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import {
  AppScreen,
  DiningRequest,
} from "../types";
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

interface OwnerReservation
  extends Reservation {
  restaurantName: string;
}

interface Props {
  requests: DiningRequest[];
  offerCount: number;
  isLoading: boolean;
  message: string;

  onSelect: (
    request: DiningRequest,
  ) => void;

  onNavigate: (
    screen: AppScreen,
  ) => void;

  requestJson: <T>(
    path: string,
    options?: RequestInit,
  ) => Promise<T>;
}

export function OwnerHome({
  requests,
  offerCount,
  isLoading,
  message,
  onSelect,
  onNavigate,
  requestJson,
}: Props) {
  const [
    reservations,
    setReservations,
  ] = useState<OwnerReservation[]>([]);

  const [
    isReservationLoading,
    setIsReservationLoading,
  ] = useState(true);

  const [
    reservationMessage,
    setReservationMessage,
  ] = useState("");

  const loadReservations =
    useCallback(async () => {
      setIsReservationLoading(true);
      setReservationMessage("");

      try {
        const reservationData =
          await requestJson<
            Reservation[]
          >("/api/owner/reservations");

        const reservationList =
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
                  };
                } catch {
                  return {
                    ...reservation,
                    restaurantName:
                      "식당 정보 없음",
                  };
                }
              },
            ),
          );

        setReservations(
          reservationList,
        );
      } catch (error) {
        setReservationMessage(
          error instanceof Error
            ? error.message
            : "예약 목록을 불러오지 못했습니다.",
        );
      } finally {
        setIsReservationLoading(false);
      }
    }, [requestJson]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const confirmedReservationCount =
    useMemo(
      () =>
        reservations.filter(
          (reservation) =>
            reservation.status.toLowerCase() ===
            "confirmed",
        ).length,
      [reservations],
    );

  const recentReservations =
    useMemo(
      () => reservations.slice(0, 5),
      [reservations],
    );

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

      case "rejected":
        return "예약 거절";

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

      case "rejected":
        return "rejected";

      default:
        return "";
    }
  };

  const formatDate = (
    date: string,
  ) => {
    const normalizedDate =
      date.includes("T")
        ? date.split("T")[0]
        : date;

    const [year, month, day] =
      normalizedDate.split("-");

    if (!year || !month || !day) {
      return date;
    }

    return `${year}.${month}.${day}`;
  };

  return (
    <>
      <section className="owner-metrics">

        <button
          type="button"
          className="owner-metric-button"
          onClick={() =>
            onNavigate("ownerReservations")
          }
        >
          <MetricCard
            label="새 요청"
            value={`${requests.length}건`}
          />
        </button>

        <MetricCard
          label="보낸 오퍼"
          value={`${offerCount}건`}
        />

        <MetricCard
          label="예약 확정"
          value={
            isReservationLoading
              ? "확인 중"
              : `${confirmedReservationCount}건`
          }
          accent
        />
      </section>

      <div className="owner-home-action-row">
        <button
          type="button"
          className="owner-home-manage-button"
          onClick={() =>
            onNavigate("myRestaurants")
          }
        >
          <span className="material-symbols-outlined">
            storefront
          </span>

          내 식당 관리
        </button>

        <button
          type="button"
          className="owner-home-register-button"
          onClick={() =>
            onNavigate(
              "restaurantRegister",
            )
          }
        >
          <span className="material-symbols-outlined">
            add_business
          </span>

          식당 등록
        </button>
      </div>

      <SectionHeader
        title="예약 일정"
        action={`${reservations.length}건`}
      />

      {reservationMessage ? (
        <div className="owner-reservation-error">
          <span className="material-symbols-outlined">
            error
          </span>

          <p>
            {reservationMessage}
          </p>

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

      {isReservationLoading ? (
        <p className="data-state">
          예약 일정을 불러오는 중...
        </p>
      ) : null}

      {!isReservationLoading &&
      !reservationMessage &&
      reservations.length === 0 ? (
        <div className="empty-state compact">
          <span className="material-symbols-outlined">
            event_busy
          </span>

          <h2>
            등록된 예약이 없어요.
          </h2>
        </div>
      ) : null}

      {!isReservationLoading &&
      !reservationMessage &&
      recentReservations.length >
        0 ? (
        <div className="owner-reservation-list">
          {recentReservations.map(
            (reservation) => (
              <article
                className="owner-reservation-card"
                key={reservation.id}
              >
                <div className="owner-reservation-date">
                  <strong>
                    {formatDate(
                      reservation.reservationDate,
                    )}
                  </strong>

                  <span>
                    {
                      reservation.reservationTime
                    }
                  </span>
                </div>

                <div className="owner-reservation-main">
                  <div className="owner-reservation-title-row">
                    <h3>
                      {
                        reservation.restaurantName
                      }
                    </h3>

                    <span
                      className={`owner-reservation-status ${getStatusClassName(
                        reservation.status,
                      )}`}
                    >
                      {getStatusText(
                        reservation.status,
                      )}
                    </span>
                  </div>

                  <div className="owner-reservation-info">
                    <span>
                      <span className="material-symbols-outlined">
                        group
                      </span>

                      {
                        reservation.headCount
                      }
                      명
                    </span>

                    <span>
                      <span className="material-symbols-outlined">
                        confirmation_number
                      </span>

                      예약번호{" "}
                      {reservation.id.slice(
                        0,
                        8,
                      )}
                    </span>
                  </div>

                  {reservation.requestMemo ? (
                    <p className="owner-reservation-memo">
                      요청사항:{" "}
                      {
                        reservation.requestMemo
                      }
                    </p>
                  ) : null}
                </div>
              </article>
            ),
          )}
        </div>
      ) : null}

      <div className="owner-home-section-gap">
        <SectionHeader
          title="실시간 회식 요청"
          action="최신순"
        />
      </div>

      {isLoading ? (
        <p className="data-state">
          불러오는 중...
        </p>
      ) : null}

      {message ? (
        <p className="data-state error">
          {message}
        </p>
      ) : null}

      {!isLoading &&
      !message &&
      requests.length === 0 ? (
        <div className="empty-state compact">
          <h2>
            현재 열린 요청이 없어요.
          </h2>
        </div>
      ) : null}

      <div className="owner-request-list">
        {requests.map((request) => (
          <article
            className="owner-request-card"
            key={request.id}
          >
            <div>
              <span>
                {request.diningDate}{" "}
                {request.diningTime}
              </span>

              <h2>
                {request.title}
              </h2>

              <p>
                {request.headCount}명 ·{" "}
                {request.preferredMenu ||
                  "메뉴 무관"}{" "}
                ·{" "}
                {request.requiredOptions ||
                  "추가 조건 없음"}
              </p>

              <strong>
                1인{" "}
                {request.budgetPerPerson.toLocaleString()}
                원 이하
              </strong>
            </div>

            <button
              type="button"
              onClick={() =>
                onSelect(request)
              }
            >
              요청 보기
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
