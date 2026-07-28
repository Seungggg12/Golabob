import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { AppScreen } from "../types";
import { Restaurant } from "./RestaurantList";

interface Props {
  onNavigate: (screen: AppScreen) => void;

  selectedRestaurant: Restaurant | null;

  onClearSelectedRestaurant: () => void;

  requestJson: <T>(
    path: string,
    options?: RequestInit,
  ) => Promise<T>;
}

interface RestaurantForm {
  name: string;
  address: string;
  phone: string;
  imageUrl: string;
  category: string;
  description: string;
  maxCapacity: string;
  hasRoom: boolean;
  hasParking: boolean;
  openTime: string;
  closeTime: string;
}

const initialForm: RestaurantForm = {
  name: "",
  address: "",
  phone: "",
  imageUrl: "",
  category: "한식",
  description: "",
  maxCapacity: "",
  hasRoom: false,
  hasParking: false,
  openTime: "",
  closeTime: "",
};

export default function RestaurantRegister({
  onNavigate,
  selectedRestaurant,
  onClearSelectedRestaurant,
  requestJson,
}: Props) {
  const [form, setForm] =
    useState<RestaurantForm>(initialForm);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const isEditing =
    selectedRestaurant !== null;

  useEffect(() => {
    if (!selectedRestaurant) {
      setForm(initialForm);
      return;
    }

    setForm({
      name: selectedRestaurant.name,
      address: selectedRestaurant.address,
      phone:
        selectedRestaurant.phone || "",
      imageUrl:
        selectedRestaurant.imageUrl || "",
      category:
        selectedRestaurant.category,
      description:
        selectedRestaurant.description || "",
      maxCapacity: String(
        selectedRestaurant.maxCapacity,
      ),
      hasRoom:
        selectedRestaurant.hasRoom,
      hasParking:
        selectedRestaurant.hasParking,
      openTime:
        selectedRestaurant.openTime,
      closeTime:
        selectedRestaurant.closeTime,
    });
  }, [selectedRestaurant]);

  const updateField = <
    K extends keyof RestaurantForm,
  >(
    field: K,
    value: RestaurantForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage(
        "이미지 파일만 선택할 수 있습니다.",
      );
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage(
        "이미지는 5MB 이하만 등록할 수 있습니다.",
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result === "string"
      ) {
        updateField(
          "imageUrl",
          reader.result,
        );

        setMessage("");
      }
    };

    reader.onerror = () => {
      setMessage(
        "이미지를 불러오지 못했습니다.",
      );
    };

    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "식당명을 입력해주세요.";
    }

    if (!form.address.trim()) {
      return "주소를 입력해주세요.";
    }

    if (!form.phone.trim()) {
      return "전화번호를 입력해주세요.";
    }

    if (!form.category) {
      return "카테고리를 선택해주세요.";
    }

    const maxCapacity = Number(
      form.maxCapacity,
    );

    if (
      !Number.isInteger(maxCapacity) ||
      maxCapacity < 1
    ) {
      return "최대 수용 인원은 1명 이상이어야 합니다.";
    }

    if (!form.openTime) {
      return "영업 시작 시간을 선택해주세요.";
    }

    if (!form.closeTime) {
      return "영업 종료 시간을 선택해주세요.";
    }

    if (
      form.openTime >= form.closeTime
    ) {
      return "영업 종료 시간은 시작 시간보다 늦어야 합니다.";
    }

    return "";
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const validationMessage =
      validateForm();

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const body = {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      imageUrl: form.imageUrl,
      category: form.category,
      description:
        form.description.trim(),
      maxCapacity: Number(
        form.maxCapacity,
      ),
      hasRoom: form.hasRoom,
      hasParking: form.hasParking,
      openTime: form.openTime,
      closeTime: form.closeTime,
    };

    try {
      if (selectedRestaurant) {
        await requestJson<Restaurant>(
          `/api/owner/restaurants/${selectedRestaurant.id}`,
          {
            method: "PATCH",

            body: JSON.stringify(body),
          },
        );

        window.alert(
          "식당 정보가 수정되었습니다.",
        );
      } else {
        await requestJson<Restaurant>(
          "/api/owner/restaurants",
          {
            method: "POST",

            body: JSON.stringify(body),
          },
        );

        window.alert(
          "식당이 등록되었습니다.",
        );
      }

      setForm(initialForm);

      onClearSelectedRestaurant();

      onNavigate("myRestaurants");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : isEditing
            ? "식당 수정에 실패했습니다."
            : "식당 등록에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClearSelectedRestaurant();

    onNavigate("myRestaurants");
  };

  return (
    <main className="restaurant-register-page">
      <section className="restaurant-register-container">
        <button
          type="button"
          className="restaurant-register-back"
          onClick={handleCancel}
        >
          <span className="material-symbols-outlined">
            arrow_back
          </span>

          내 식당 관리
        </button>

        <header className="restaurant-register-header">
          <p className="restaurant-register-eyebrow">
            사장님 식당 관리
          </p>

          <h1>
            {isEditing
              ? "식당 정보 수정"
              : "식당 등록"}
          </h1>

          <p>
            {isEditing
              ? "등록한 식당 정보를 수정해주세요."
              : "사용자에게 노출할 식당 정보를 등록해주세요."}
          </p>
        </header>

        <form
          className="restaurant-register-form"
          onSubmit={handleSubmit}
        >
          <section className="restaurant-register-section">
            <h2>기본 정보</h2>

            <div className="restaurant-register-grid">
              <div className="restaurant-register-field restaurant-register-full">
                <label htmlFor="restaurant-name">
                  식당명
                  <strong>*</strong>
                </label>

                <input
                  id="restaurant-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="식당명을 입력해주세요."
                />
              </div>

              <div className="restaurant-register-field restaurant-register-full">
                <label htmlFor="restaurant-address">
                  주소
                  <strong>*</strong>
                </label>

                <input
                  id="restaurant-address"
                  type="text"
                  value={form.address}
                  onChange={(event) =>
                    updateField(
                      "address",
                      event.target.value,
                    )
                  }
                  placeholder="식당 주소를 입력해주세요."
                />
              </div>

              <div className="restaurant-register-field">
                <label htmlFor="restaurant-phone">
                  전화번호
                  <strong>*</strong>
                </label>

                <input
                  id="restaurant-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value,
                    )
                  }
                  placeholder="02-1234-5678"
                />
              </div>

              <div className="restaurant-register-field">
                <label htmlFor="restaurant-category">
                  카테고리
                  <strong>*</strong>
                </label>

                <select
                  id="restaurant-category"
                  value={form.category}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value,
                    )
                  }
                >
                  <option value="한식">
                    한식
                  </option>

                  <option value="중식">
                    중식
                  </option>

                  <option value="일식">
                    일식
                  </option>

                  <option value="양식">
                    양식
                  </option>

                  <option value="분식">
                    분식
                  </option>

                  <option value="고기">
                    고기
                  </option>

                  <option value="술집">
                    술집
                  </option>

                  <option value="카페">
                    카페
                  </option>
                </select>
              </div>

              <div className="restaurant-register-field">
                <label htmlFor="restaurant-open-time">
                  영업 시작 시간
                  <strong>*</strong>
                </label>

                <input
                  id="restaurant-open-time"
                  type="time"
                  value={form.openTime}
                  onChange={(event) =>
                    updateField(
                      "openTime",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="restaurant-register-field">
                <label htmlFor="restaurant-close-time">
                  영업 종료 시간
                  <strong>*</strong>
                </label>

                <input
                  id="restaurant-close-time"
                  type="time"
                  value={form.closeTime}
                  onChange={(event) =>
                    updateField(
                      "closeTime",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="restaurant-register-field">
                <label htmlFor="restaurant-capacity">
                  최대 수용 인원
                  <strong>*</strong>
                </label>

                <input
                  id="restaurant-capacity"
                  type="number"
                  min={1}
                  value={form.maxCapacity}
                  onChange={(event) =>
                    updateField(
                      "maxCapacity",
                      event.target.value,
                    )
                  }
                  placeholder="예: 30"
                />
              </div>
            </div>
          </section>

          <section className="restaurant-register-section">
            <h2>대표 이미지</h2>

            <div className="restaurant-register-image-area">
              {form.imageUrl ? (
                <div className="restaurant-register-preview">
                  <img
                    src={form.imageUrl}
                    alt="식당 대표 이미지 미리보기"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "imageUrl",
                        "",
                      )
                    }
                  >
                    <span className="material-symbols-outlined">
                      delete
                    </span>

                    이미지 삭제
                  </button>
                </div>
              ) : (
                <label
                  className="restaurant-register-upload"
                  htmlFor="restaurant-image"
                >
                  <span className="material-symbols-outlined">
                    add_photo_alternate
                  </span>

                  <strong>
                    대표 이미지 등록
                  </strong>

                  <span>
                    JPG, PNG 등 이미지 파일
                  </span>
                </label>
              )}

              <input
                id="restaurant-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />

              {form.imageUrl ? (
                <label
                  className="restaurant-register-change-image"
                  htmlFor="restaurant-image"
                >
                  이미지 변경
                </label>
              ) : null}
            </div>
          </section>

          <section className="restaurant-register-section">
            <h2>편의시설</h2>

            <div className="restaurant-register-options">
              <label>
                <input
                  type="checkbox"
                  checked={form.hasRoom}
                  onChange={(event) =>
                    updateField(
                      "hasRoom",
                      event.target.checked,
                    )
                  }
                />

                <span className="material-symbols-outlined">
                  meeting_room
                </span>

                룸 있음
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.hasParking}
                  onChange={(event) =>
                    updateField(
                      "hasParking",
                      event.target.checked,
                    )
                  }
                />

                <span className="material-symbols-outlined">
                  local_parking
                </span>

                주차 가능
              </label>
            </div>
          </section>

          <section className="restaurant-register-section">
            <h2>식당 소개</h2>

            <div className="restaurant-register-field">
              <label htmlFor="restaurant-description">
                소개 내용
              </label>

              <textarea
                id="restaurant-description"
                rows={6}
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                placeholder="대표 메뉴, 식당 분위기 등을 입력해주세요."
              />
            </div>
          </section>

          {message ? (
            <p className="restaurant-register-message">
              {message}
            </p>
          ) : null}

          <div className="restaurant-register-actions">
            <button
              type="button"
              className="restaurant-register-cancel"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              취소
            </button>

            <button
              type="submit"
              className="restaurant-register-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditing
                  ? "수정 중..."
                  : "등록 중..."
                : isEditing
                  ? "수정 완료"
                  : "식당 등록"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
