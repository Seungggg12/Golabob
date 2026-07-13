import { FormEvent, useEffect, useState } from "react";
import { CreateOfferInput, DiningRequest, Navigate, OfferRestaurant } from "../types";

interface Props {
  request: DiningRequest | null;
  restaurants: OfferRestaurant[];
  isLoading: boolean;
  message: string;
  onNavigate: Navigate;
  onSubmit: (input: CreateOfferInput) => Promise<void>;
}

export function CreateOffer({ request, restaurants, isLoading, message, onNavigate, onSubmit }: Props) {
  const [restaurantId, setRestaurantId] = useState("");
  const [price, setPrice] = useState("");
  const [availableTime, setAvailableTime] = useState(request?.diningTime || "");
  const [menuDescription, setMenuDescription] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [seatDescription, setSeatDescription] = useState("");
  const [ownerComment, setOwnerComment] = useState("");

  useEffect(() => {
    if (!restaurantId && restaurants[0]) {
      setRestaurantId(restaurants[0].id);
    }
  }, [restaurantId, restaurants]);

  if (!request) return <section className="empty-state"><h1>선택한 요청이 없습니다.</h1><button onClick={() => onNavigate("ownerHome")}>목록으로</button></section>;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    return onSubmit({ restaurantId: restaurantId.trim(), pricePerPerson: Number(price), menuDescription: menuDescription.trim(), serviceDescription: serviceDescription.trim() || undefined, seatDescription: seatDescription.trim() || undefined, availableTime, ownerComment: ownerComment.trim() || undefined });
  };

  return (
    <form className="form-page" onSubmit={submit}>
      <div className="page-title"><p className="eyebrow">{request.region} · {request.headCount}명</p><h1>맞춤 오퍼 작성</h1><p>{request.title}에 보낼 오퍼를 입력해주세요.</p></div>
      <div className="field-grid">
        <label>
          오퍼를 보낼 식당
          <select value={restaurantId} onChange={(event) => setRestaurantId(event.target.value)} required>
            <option value="">식당을 선택해주세요</option>
            {restaurants.map((restaurant) => (
              <option value={restaurant.id} key={restaurant.id}>
                {restaurant.name} · {restaurant.address}
              </option>
            ))}
          </select>
        </label>
        <label>제안 가격<input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="28000" required /></label>
        <label>예약 가능 시간<input type="time" value={availableTime} onChange={(event) => setAvailableTime(event.target.value)} required /></label>
      </div>
      <label>메뉴 구성<input value={menuDescription} onChange={(event) => setMenuDescription(event.target.value)} placeholder="삼겹살 + 된장찌개 + 음료" required /></label>
      <label>제공 서비스<input value={serviceDescription} onChange={(event) => setServiceDescription(event.target.value)} placeholder="소주 2병 서비스" /></label>
      <label>좌석 정보<input value={seatDescription} onChange={(event) => setSeatDescription(event.target.value)} placeholder="룸 가능 / 최대 12명" /></label>
      <label className="memo-field">사장 코멘트<textarea value={ownerComment} onChange={(event) => setOwnerComment(event.target.value)} placeholder="조용한 룸으로 준비해드릴 수 있습니다." /></label>
      {restaurants.length === 0 && !isLoading ? <p className="form-message" role="alert">승인된 내 식당이 없습니다. 식당 등록 후 오퍼를 작성해주세요.</p> : null}
      {message ? <p className="form-message" role="alert">{message}</p> : null}
      <button className="wide-primary" type="submit" disabled={isLoading || !restaurantId}>{isLoading ? "불러오는 중..." : "오퍼 보내기"}</button>
    </form>
  );
}
