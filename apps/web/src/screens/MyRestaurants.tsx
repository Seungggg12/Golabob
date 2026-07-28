import { useEffect, useState } from "react";
import { AppScreen } from "../types";
import { Restaurant } from "./RestaurantList";

interface Props {
  onNavigate: (screen: AppScreen) => void;

  onSelectRestaurant: (
    restaurant: Restaurant | null,
  ) => void;

  requestJson: <T>(
    path: string,
    options?: RequestInit,
  ) => Promise<T>;
}

export default function MyRestaurants({
  onNavigate,
  onSelectRestaurant,
  requestJson,
}: Props) {
  const [restaurants, setRestaurants] =
    useState<Restaurant[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const loadRestaurants = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const data =
        await requestJson<Restaurant[]>(
          "/api/owner/restaurants",
        );

      setRestaurants(data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "식당 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRestaurants();
  }, []);

  const handleRegister = () => {
    onSelectRestaurant(null);
    onNavigate("restaurantRegister");
  };

  const handleEdit = (
    restaurant: Restaurant,
  ) => {
    onSelectRestaurant(restaurant);
    onNavigate("restaurantRegister");
  };

  const handleDelete = async (
    restaurant: Restaurant,
  ) => {
    const confirmed = window.confirm(
      `${restaurant.name} 식당을 삭제하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      await requestJson<void>(
        `/api/owner/restaurants/${restaurant.id}`,
        {
          method: "DELETE",

        },
      );

      setRestaurants((current) =>
        current.filter(
          (item) =>
            item.id !== restaurant.id,
        ),
      );

      window.alert(
        "식당이 삭제되었습니다.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "식당 삭제에 실패했습니다.",
      );
    }
  };

  const getStatusText = (
    status: string,
  ) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "승인 완료";

      case "rejected":
        return "승인 거절";

      case "pending":
      default:
        return "승인 대기";
    }
  };

  const getStatusClassName = (
    status: string,
  ) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "approved";

      case "rejected":
        return "rejected";

      case "pending":
      default:
        return "pending";
    }
  };

  return (
    <main className="my-restaurants-page">
      <section className="my-restaurants-container">
        <header className="my-restaurants-header">
          <div>
            <p className="my-restaurants-eyebrow">
              사장님 식당 관리
            </p>

            <h1>내 식당 관리</h1>

            <p>
              등록한 식당 정보를 확인하고
              수정할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            className="my-restaurants-register-button"
            onClick={handleRegister}
          >
            <span className="material-symbols-outlined">
              add
            </span>

            식당 등록
          </button>
        </header>

        {message ? (
          <div className="my-restaurants-message">
            <span className="material-symbols-outlined">
              error
            </span>

            <p>{message}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="my-restaurants-state">
            <span className="material-symbols-outlined my-restaurants-loading">
              progress_activity
            </span>

            <p>
              내 식당 목록을 불러오는 중...
            </p>
          </div>
        ) : null}

        {!isLoading &&
        restaurants.length === 0 ? (
          <div className="my-restaurants-state">
            <span className="material-symbols-outlined">
              storefront
            </span>

            <h2>
              등록된 식당이 없습니다.
            </h2>

            <p>
              첫 번째 식당을 등록해보세요.
            </p>

            <button
              type="button"
              onClick={handleRegister}
            >
              식당 등록하기
            </button>
          </div>
        ) : null}

        {!isLoading &&
        restaurants.length > 0 ? (
          <div className="my-restaurants-list">
            {restaurants.map(
              (restaurant) => (
                <article
                  key={restaurant.id}
                  className="my-restaurants-card"
                >
                  <div className="my-restaurants-image-area">
                    {restaurant.imageUrl ? (
                      <img
                        src={
                          restaurant.imageUrl
                        }
                        alt={`${restaurant.name} 대표 사진`}
                        className="my-restaurants-image"
                      />
                    ) : (
                      <div className="my-restaurants-image-placeholder">
                        <span className="material-symbols-outlined">
                          restaurant
                        </span>

                        <span>
                          등록된 사진이 없습니다.
                        </span>
                      </div>
                    )}

                    <span
                      className={`my-restaurants-status ${getStatusClassName(
                        restaurant.status,
                      )}`}
                    >
                      {getStatusText(
                        restaurant.status,
                      )}
                    </span>
                  </div>

                  <div className="my-restaurants-content">
                    <div className="my-restaurants-title">
                      <div>
                        <span className="my-restaurants-category">
                          {
                            restaurant.category
                          }
                        </span>

                        <h2>
                          {restaurant.name}
                        </h2>
                      </div>

                      <span className="my-restaurants-capacity">
                        최대{" "}
                        {
                          restaurant.maxCapacity
                        }
                        명
                      </span>
                    </div>

                    <div className="my-restaurants-info">
                      <p>
                        <span className="material-symbols-outlined">
                          location_on
                        </span>

                        <span>
                          {
                            restaurant.address
                          }
                        </span>
                      </p>

                      <p>
                        <span className="material-symbols-outlined">
                          call
                        </span>

                        <span>
                          {restaurant.phone ||
                            "전화번호 정보 없음"}
                        </span>
                      </p>

                      <p>
                        <span className="material-symbols-outlined">
                          schedule
                        </span>

                        <span>
                          {
                            restaurant.openTime
                          }
                          {" ~ "}
                          {
                            restaurant.closeTime
                          }
                        </span>
                      </p>
                    </div>

                    {restaurant.description ? (
                      <p className="my-restaurants-description">
                        {
                          restaurant.description
                        }
                      </p>
                    ) : null}

                    <div className="my-restaurants-options">
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
                          편의시설 정보 없음
                        </span>
                      ) : null}
                    </div>

                    <div className="my-restaurants-actions">
                      <button
                        type="button"
                        className="my-restaurants-edit-button"
                        onClick={() =>
                          handleEdit(
                            restaurant,
                          )
                        }
                      >
                        <span className="material-symbols-outlined">
                          edit
                        </span>

                        수정
                      </button>

                      <button
                        type="button"
                        className="my-restaurants-delete-button"
                        onClick={() =>
                          void handleDelete(
                            restaurant,
                          )
                        }
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>

                        삭제
                      </button>
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
