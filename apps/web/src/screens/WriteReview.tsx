import {
  FormEvent,
  useState,
} from "react";
import { Navigate } from "../types";

interface ReviewResponse {
  id: string;
  reservationId: string;
  restaurantId: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  reservationId: string;
  restaurantId: string;
  restaurantName: string;
  onNavigate: Navigate;

  requestJson: <T>(
    path: string,
    options?: RequestInit,
  ) => Promise<T>;
}

export function WriteReview({
  reservationId,
  restaurantId,
  restaurantName,
  onNavigate,
  requestJson,
}: Props) {
  const [rating, setRating] =
    useState(5);

  const [content, setContent] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!reservationId) {
      setMessage(
        "예약 정보를 찾을 수 없습니다.",
      );
      return;
    }

    if (!restaurantId) {
      setMessage(
        "식당 정보를 찾을 수 없습니다.",
      );
      return;
    }

    if (!content.trim()) {
      setMessage(
        "리뷰 내용을 입력해주세요.",
      );
      return;
    }

    if (
      rating < 1 ||
      rating > 5
    ) {
      setMessage(
        "별점은 1점부터 5점까지 선택해주세요.",
      );
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await requestJson<ReviewResponse>(
        "/api/reviews",
        {
          method: "POST",

          body: JSON.stringify({
            reservationId,
            restaurantId,
            rating,
            content: content.trim(),
          }),
        },
      );

      window.alert(
        "리뷰가 등록되었습니다.",
      );

      onNavigate("myReservation");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "리뷰 등록 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="review-write-page">
      <button
        type="button"
        className="back-button"
        onClick={() =>
          onNavigate("myReservation")
        }
      >
        ← 돌아가기
      </button>

      <div className="review-write-header">
        <span>WRITE REVIEW</span>

        <h1>리뷰 작성</h1>

        <p>
          <strong>
            {restaurantName ||
              "선택한 식당"}
          </strong>
          에서의 경험을 알려주세요.
        </p>
      </div>

      <form
        className="review-form"
        onSubmit={handleSubmit}
      >
        <fieldset className="rating-field">
          <legend>별점</legend>

          <div className="star-rating">
            {[1, 2, 3, 4, 5].map(
              (score) => (
                <button
                  key={score}
                  type="button"
                  className={
                    score <= rating
                      ? "star active"
                      : "star"
                  }
                  onClick={() => {
                    setRating(score);
                    setMessage("");
                  }}
                  aria-label={`${score}점`}
                >
                  ★
                </button>
              ),
            )}
          </div>

          <p>{rating}점</p>
        </fieldset>

        <label className="review-content-field">
          리뷰 내용

          <textarea
            value={content}
            onChange={(event) => {
              setContent(
                event.target.value,
              );

              setMessage("");
            }}
            placeholder="식당의 음식, 서비스, 분위기는 어땠나요?"
            maxLength={500}
            rows={7}
          />

          <span>
            {content.length}/500
          </span>
        </label>

        {message ? (
          <p className="review-form-message">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          className="primary-button"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "등록 중..."
            : "리뷰 등록하기"}
        </button>
      </form>
    </section>
  );
}
