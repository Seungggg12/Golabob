import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppScreen } from "../types";

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  phone: string | null;
  imageUrl: string | null;
  category: string;
  description: string | null;
  maxCapacity: number;
  hasRoom: boolean;
  hasParking: boolean;
  openTime: string;
  closeTime: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onNavigate: (screen: AppScreen) => void;

  onSelectRestaurant: (
    restaurant: Restaurant,
  ) => void;

  requestJson: <T>(
    path: string,
    options?: RequestInit,
  ) => Promise<T>;
}

export default function RestaurantList({
  onNavigate,
  onSelectRestaurant,
  requestJson,
}: Props) {
  const [restaurants, setRestaurants] =
    useState<Restaurant[]>([]);

  const [keyword, setKeyword] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("전체");

  const [isLoading, setIsLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const categories = [
    "전체",
    "한식",
    "중식",
    "일식",
    "양식",
    "분식",
    "고기",
    "술집",
    "카페",
  ];

  useEffect(() => {
    const loadRestaurants = async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const data =
          await requestJson<Restaurant[]>(
            "/api/restaurants",
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

    void loadRestaurants();
  }, [requestJson]);

  const filteredRestaurants = useMemo(() => {
    const normalizedKeyword =
      keyword.trim().toLowerCase();

    return restaurants.filter(
      (restaurant) => {
        const matchesKeyword =
          !normalizedKeyword ||
          restaurant.name
            .toLowerCase()
            .includes(normalizedKeyword) ||
          restaurant.address
            .toLowerCase()
            .includes(normalizedKeyword) ||
          restaurant.category
            .toLowerCase()
            .includes(normalizedKeyword);

        const matchesCategory =
          selectedCategory === "전체" ||
          restaurant.category ===
            selectedCategory;

        return (
          matchesKeyword &&
          matchesCategory
        );
      },
    );
  }, [
    restaurants,
    keyword,
    selectedCategory,
  ]);

  const handleRestaurantClick = (
    restaurant: Restaurant,
  ) => {
    onSelectRestaurant(restaurant);
    onNavigate("restaurantDetail");
  };

  return (
    <main className="restaurant-list-page">
      <section className="restaurant-list-container">
        <header className="restaurant-list-header">
          <div>
            <p className="restaurant-list-eyebrow">
              골라밥 일반 예약
            </p>

            <h1>식당 예약</h1>

            <p>
              원하는 식당을 찾아 예약해보세요.
            </p>
          </div>
        </header>

        <div className="restaurant-list-search">
          <span className="material-symbols-outlined">
            search
          </span>

          <input
            type="text"
            placeholder="식당명, 주소, 카테고리 검색"
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
          />

          {keyword ? (
            <button
              type="button"
              className="restaurant-list-search-clear"
              onClick={() => setKeyword("")}
              aria-label="검색어 지우기"
            >
              <span className="material-symbols-outlined">
                close
              </span>
            </button>
          ) : null}
        </div>

        <div className="restaurant-list-categories">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={
                selectedCategory === category
                  ? "restaurant-category-button active"
                  : "restaurant-category-button"
              }
              onClick={() =>
                setSelectedCategory(category)
              }
            >
              {category}
            </button>
          ))}
        </div>

        <div className="restaurant-list-summary">
          <strong>
            {filteredRestaurants.length}개
          </strong>

          <span>의 식당이 있습니다.</span>
        </div>

        {isLoading ? (
          <div className="restaurant-list-state">
            <span className="material-symbols-outlined restaurant-loading-icon">
              progress_activity
            </span>

            <p>식당 목록을 불러오는 중...</p>
          </div>
        ) : null}

        {!isLoading && message ? (
          <div className="restaurant-list-state restaurant-list-error">
            <span className="material-symbols-outlined">
              error
            </span>

            <p>{message}</p>
          </div>
        ) : null}

        {!isLoading &&
        !message &&
        filteredRestaurants.length === 0 ? (
          <div className="restaurant-list-state">
            <span className="material-symbols-outlined">
              search_off
            </span>

            <p>검색된 식당이 없습니다.</p>
          </div>
        ) : null}

        {!isLoading &&
        !message &&
        filteredRestaurants.length > 0 ? (
          <div className="restaurant-list-grid">
            {filteredRestaurants.map(
              (restaurant) => (
                <article
                  key={restaurant.id}
                  className="restaurant-list-card"
                >
                  <button
                    type="button"
                    className="restaurant-list-image-button"
                    onClick={() =>
                      handleRestaurantClick(
                        restaurant,
                      )
                    }
                  >
                    {restaurant.imageUrl ? (
                      <img
                        src={
                          restaurant.imageUrl
                        }
                        alt={`${restaurant.name} 대표 사진`}
                        className="restaurant-list-image"
                      />
                    ) : (
                      <div className="restaurant-list-image-placeholder">
                        <span className="material-symbols-outlined">
                          restaurant
                        </span>

                        <span>
                          등록된 사진이 없습니다.
                        </span>
                      </div>
                    )}

                    <span className="restaurant-list-category-badge">
                      {restaurant.category}
                    </span>
                  </button>

                  <div className="restaurant-list-card-content">
                    <div className="restaurant-list-card-title">
                      <h2>{restaurant.name}</h2>

                      <span>
                        최대{" "}
                        {restaurant.maxCapacity}명
                      </span>
                    </div>

                    <div className="restaurant-list-info">
                      <p>
                        <span className="material-symbols-outlined">
                          location_on
                        </span>

                        <span>
                          {restaurant.address}
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
                          {restaurant.openTime} ~{" "}
                          {restaurant.closeTime}
                        </span>
                      </p>
                    </div>

                    {restaurant.description ? (
                      <p className="restaurant-list-description">
                        {restaurant.description}
                      </p>
                    ) : null}

                    <div className="restaurant-list-options">
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

                    <button
                      type="button"
                      className="restaurant-list-reserve-button"
                      onClick={() =>
                        handleRestaurantClick(
                          restaurant,
                        )
                      }
                    >
                      상세보기 및 예약
                    </button>
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