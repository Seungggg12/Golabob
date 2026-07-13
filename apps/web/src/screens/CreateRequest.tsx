import { FormEvent, useState } from "react";
import { Stepper } from "../components/Stepper";
import { CreateDiningRequestInput } from "../types";

interface Props {
  isLoading: boolean;
  message: string;
  onSubmit: (input: CreateDiningRequestInput) => Promise<void>;
}

export function CreateRequest({ isLoading, message, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [diningDate, setDiningDate] = useState("");
  const [diningTime, setDiningTime] = useState("");
  const [region, setRegion] = useState("");
  const [budget, setBudget] = useState("");
  const [headCount, setHeadCount] = useState(10);
  const [preferredMenu, setPreferredMenu] = useState("");
  const [requiredOptions, setRequiredOptions] = useState<string[]>([]);
  const [memo, setMemo] = useState("");

  const toggleOption = (option: string) => setRequiredOptions((current) =>
    current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    return onSubmit({
      title: title.trim(), diningDate, diningTime, headCount, region: region.trim(),
      budgetPerPerson: Number(budget), preferredMenu: preferredMenu || undefined,
      requiredOptions: requiredOptions.join(", ") || undefined, memo: memo.trim() || undefined,
    });
  };

  return (
    <form className="form-page" onSubmit={submit}>
      <Stepper current={1} labels={["일정 정보", "요건 상세", "요청 확인"]} />
      <div className="page-title"><h1>단체 회식 일정</h1><p>회식 날짜와 시간, 방문 지역, 참석 인원을 입력해주세요.</p></div>
      <label>요청 제목<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 강남역 팀 회식" required /></label>
      <div className="field-grid">
        <label>날짜 선택<input type="date" value={diningDate} onChange={(event) => setDiningDate(event.target.value)} required /></label>
        <label>시간 선택<input type="time" value={diningTime} onChange={(event) => setDiningTime(event.target.value)} required /></label>
        <label>방문 지역<input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="예: 강남역, 여의도" required /></label>
        <label>1인 예산<input type="number" min="1" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="예: 50000" required /></label>
      </div>
      <div className="headcount-box"><button type="button" onClick={() => setHeadCount((count) => Math.max(2, count - 1))}>-</button><strong>{headCount}</strong><span>명</span><button type="button" onClick={() => setHeadCount((count) => count + 1)}>+</button></div>
      <div className="chip-section"><span>선호 메뉴</span>{["고기", "한식", "중식", "일식", "술집", "상관없음"].map((item) => <button className={preferredMenu === item ? "selected" : ""} type="button" key={item} onClick={() => setPreferredMenu(item)}>{item}</button>)}</div>
      <div className="chip-section"><span>필수 조건</span>{["룸 필요", "주차 가능", "조용한 분위기", "역 근처"].map((item) => <button className={requiredOptions.includes(item) ? "selected" : ""} type="button" key={item} onClick={() => toggleOption(item)}>{item}</button>)}</div>
      <label className="memo-field">추가 요청<textarea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="소주 2병 서비스 가능 여부, 조용한 자리 요청 등" /></label>
      {message ? <p className="form-message" role="alert">{message}</p> : null}
      <button className="wide-primary" type="submit" disabled={isLoading}>{isLoading ? "등록 중..." : "요청 등록하기"}</button>
    </form>
  );
}
