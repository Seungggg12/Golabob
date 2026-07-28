import { useState } from "react";
import { Stepper } from "../components/Stepper";
import { Navigate } from "../types";

interface ReservationResponse {
  id: string;
  restaurantId: string;
  userId: string;
  reservationDate: string;
  reservationTime: string;
  headCount: number;
  requestMemo?: string | null;
  status: string;
}

interface ReservationConfirmationProps {
  onNavigate: Navigate;
  requestJson: <T>(
    path: string,
    options?: RequestInit,
  ) => Promise<T>;
  restaurantId: string;
}

export function ReservationConfirmation({
  onNavigate,
  requestJson,
  restaurantId,
}: ReservationConfirmationProps) {
  const [reservationDate, setReservationDate] =
    useState("2026-12-24");

  const [reservationTime, setReservationTime] =
    useState("19:00");

  const [headCount, setHeadCount] = useState(15);

  const [requestMemo, setRequestMemo] = useState(
    "소주 2병 서비스, 프라이빗 룸 요청",
  );

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submitReservation = async () => {
    if (!restaurantId) {
      setMessage(
        "선택된 식당 정보가 없습니다. 오퍼를 다시 선택해주세요.",
      );
      return;
    }

    if (!reservationDate) {
      setMessage("예약 날짜를 입력해주세요.");
      return;
    }

    if (!reservationTime) {
      setMessage("예약 시간을 입력해주세요.");
      return;
    }

    if (!Number.isInteger(headCount) || headCount <= 0) {
      setMessage("예약 인원은 1명 이상이어야 합니다.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      await requestJson<ReservationResponse>(
        "/api/reservations",
        {
          method: "POST",
          body: JSON.stringify({
            restaurantId,
            reservationDate,
            reservationTime,
            headCount,
            requestMemo:
              requestMemo.trim() === ""
                ? undefined
                : requestMemo.trim(),
          }),
        },
      );

      window.alert("예약이 정상적으로 등록되었습니다.");
      onNavigate("userHome");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "예약 등록에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="confirmation-page">
      <Stepper current={2} labels={["요청", "확정", "완료"]} />

      <div className="confirmation-card">
        <span className="success-mark">
          <span
            className="material-symbols-outlined badge-icon"
            aria-hidden="true"
          >
            check_circle
          </span>
          예약 정보 확인
        </span>

        <h1>선택한 식당 예약</h1>

        <p>
          날짜, 시간, 인원을 확인한 뒤 예약을 등록해주세요.
        </p>

        <label>
          예약 날짜
          <input
            type="date"
            value={reservationDate}
            onChange={(event) =>
              setReservationDate(event.target.value)
            }
          />
        </label>

        <label>
          예약 시간
          <input
            type="time"
            value={reservationTime}
            onChange={(event) =>
              setReservationTime(event.target.value)
            }
          />
        </label>

        <label>
          예약 인원
          <input
            type="number"
            min={1}
            value={headCount}
            onChange={(event) =>
              setHeadCount(Number(event.target.value))
            }
          />
        </label>

        <label>
          요청 사항
          <textarea
            value={requestMemo}
            placeholder="룸, 주차, 서비스 요청 등을 입력해주세요."
            onChange={(event) =>
              setRequestMemo(event.target.value)
            }
          />
        </label>

        {message ? (
          <p
            style={{
              marginTop: "12px",
              fontWeight: 600,
            }}
          >
            {message}
          </p>
        ) : null}

        <button
          className="wide-primary"
          type="button"
          disabled={isLoading}
          onClick={submitReservation}
        >
          {isLoading ? "예약 처리 중..." : "예약 확정하기"}
        </button>

        <button
          className="wide-secondary"
          type="button"
          disabled={isLoading}
          onClick={() => onNavigate("offers")}
        >
          다른 오퍼 보기
        </button>
      </div>
    </section>
  );
}