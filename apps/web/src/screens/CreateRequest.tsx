import { Stepper } from "../components/Stepper";
import { Navigate } from "../types";

export function CreateRequest({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="form-page">
      <Stepper current={1} labels={["일정 정보", "요건 상세", "요청 확인"]} />
      <div className="page-title">
        <h1>단체 회식 일정</h1>
        <p>회식 날짜와 시간, 방문 지역, 참석 인원을 입력해주세요.</p>
      </div>
      <div className="field-grid">
        <label>
          날짜 선택
          <input type="date" />
        </label>
        <label>
          시간 선택
          <input type="time" />
        </label>
        <label>
          방문 지역
          <input placeholder="예: 강남역, 여의도" />
        </label>
        <label>
          1인 예산
          <input placeholder="예: 50000" inputMode="numeric" />
        </label>
      </div>
      <div className="headcount-box">
        <button type="button">-</button>
        <strong>10</strong>
        <span>명</span>
        <button type="button">+</button>
      </div>
      <div className="chip-section">
        <span>선호 메뉴</span>
        {["고기", "한식", "중식", "일식", "술집", "상관없음"].map((item) => (
          <button type="button" key={item}>
            {item}
          </button>
        ))}
      </div>
      <div className="chip-section">
        <span>필수 조건</span>
        {["룸 필요", "주차 가능", "조용한 분위기", "역 근처"].map((item) => (
          <button type="button" key={item}>
            {item}
          </button>
        ))}
      </div>
      <label className="memo-field">
        추가 요청
        <textarea placeholder="소주 2병 서비스 가능 여부, 조용한 자리 요청 등" />
      </label>
      <button className="wide-primary" type="button" onClick={() => onNavigate("requestWaiting")}>
        요청 등록하기
      </button>
    </section>
  );
}
