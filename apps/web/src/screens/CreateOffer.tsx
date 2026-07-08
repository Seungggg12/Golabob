import { Navigate } from "../types";

export function CreateOffer({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="form-page">
      <div className="page-title">
        <h1>맞춤 오퍼 작성</h1>
        <p>고객 조건에 맞는 가격, 메뉴 구성, 좌석 정보를 입력해주세요.</p>
      </div>
      <div className="field-grid">
        <label>
          제안 가격
          <input placeholder="28000" inputMode="numeric" />
        </label>
        <label>
          예약 가능 시간
          <input type="time" />
        </label>
      </div>
      <label>
        메뉴 구성
        <input placeholder="삼겹살 + 된장찌개 + 음료" />
      </label>
      <label>
        제공 서비스
        <input placeholder="소주 2병 서비스" />
      </label>
      <label>
        좌석 정보
        <input placeholder="룸 가능 / 최대 12명" />
      </label>
      <label className="memo-field">
        사장 코멘트
        <textarea placeholder="조용한 룸으로 준비해드릴 수 있습니다." />
      </label>
      <button className="wide-primary" type="button" onClick={() => onNavigate("ownerHome")}>
        오퍼 보내기
      </button>
    </section>
  );
}
