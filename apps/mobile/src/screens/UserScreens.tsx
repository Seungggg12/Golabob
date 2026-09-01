import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Badge, Button, Card, Chip, ChipGroup, ConfirmModal, Counter, EmptyState, Field, InfoRow, InlineMessage, Page, SectionHeader, Tabs } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { DiningRequest, DiningRequestDraft, Navigate, Offer, Reservation, ReservationDraft, Restaurant, ReviewDraft } from "../types";

const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const requestStatus = (status: DiningRequest["status"]) => ({ open: "오퍼 모집 중", reserved: "예약 확정", canceled: "요청 취소", expired: "요청 만료" })[status];
const reservationStatus = (status: Reservation["status"]) => ({ pending: "예약 대기", confirmed: "예약 확정", completed: "이용 완료", canceled: "예약 취소", rejected: "예약 거절" })[status];
const toneForStatus = (status: string): "accent" | "success" | "danger" | "muted" => status === "confirmed" || status === "selected" ? "success" : status === "pending" || status === "open" ? "accent" : status === "canceled" || status === "rejected" ? "danger" : "muted";

export function UserHomeScreen({ requests, offers, onNavigate, onSelectRequest }: { requests: DiningRequest[]; offers: Offer[]; onNavigate: Navigate; onSelectRequest: (request: DiningRequest) => void }) {
  const active = requests.filter((request) => request.status === "open");
  return (
    <Page eyebrow="GOOD EVENING" title="오늘의 회식 장소를 찾아보세요!" subtitle="조건만 알려주면 식당이 먼저 맞춤 제안을 보내요.">
      <View style={styles.userCta}><Text style={styles.ctaEyebrow}>NEW REQUEST</Text><Text style={styles.ctaTitle}>회식 요청 등록하기</Text><Text style={styles.ctaCopy}>장소, 인원, 예산을 알려주세요.</Text><Button label="시작하기" onPress={() => onNavigate("createRequest")} variant="secondary" /></View>
      <SectionHeader action="새 요청" onAction={() => onNavigate("createRequest")} title="내 회식 요청" />
      {requests.length === 0 ? <EmptyState actionLabel="요청 등록" description="조건을 등록하면 맞춤 오퍼를 받을 수 있어요." onAction={() => onNavigate("createRequest")} title="아직 등록한 요청이 없어요" /> : requests.map((request) => {
        const count = offers.filter((offer) => offer.diningRequestId === request.id).length;
        return <Card key={request.id} onPress={() => onSelectRequest(request)}><View style={styles.between}><Badge label={requestStatus(request.status)} tone={toneForStatus(request.status)} /><Text style={styles.cardHint}>{request.region}</Text></View><Text style={styles.cardTitle}>{request.title}</Text><Text style={styles.cardCopy}>{request.diningDate} {request.diningTime}</Text><View style={styles.requestMeta}><Text style={styles.metaStrong}>{request.headCount}명</Text><Text style={styles.dot}>·</Text><Text style={styles.metaStrong}>인당 {money(request.budgetPerPerson)}</Text><View style={styles.grow} /><Badge label={`오퍼 ${count}개`} tone={count ? "accent" : "muted"} /></View></Card>;
      })}
      {active.length > 0 ? <InlineMessage message={`현재 ${active.length}개의 요청에서 오퍼를 모집하고 있습니다.`} /> : null}
    </Page>
  );
}

export function CreateRequestScreen({ onBack, onSubmit }: { onBack: () => void; onSubmit: (draft: DiningRequestDraft) => void | Promise<void> }) {
  const [title, setTitle] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState(""); const [region, setRegion] = useState(""); const [budget, setBudget] = useState("");
  const [headCount, setHeadCount] = useState(10); const [menu, setMenu] = useState(""); const [options, setOptions] = useState<string[]>([]); const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({}); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState("");
  const toggleOption = (option: string) => setOptions((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = "요청 제목을 입력해주세요.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) nextErrors.date = "날짜를 YYYY-MM-DD 형식으로 입력해주세요.";
    if (!/^\d{2}:\d{2}$/.test(time)) nextErrors.time = "시간을 HH:MM 형식으로 입력해주세요.";
    if (!region.trim()) nextErrors.region = "희망 지역을 입력해주세요.";
    const numericBudget = Number(budget.replace(/,/g, "")); if (!numericBudget || numericBudget < 1000) nextErrors.budget = "1인 예산을 숫자로 입력해주세요.";
    setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    setSubmitting(true); setMessage("");
    try { await onSubmit({ title: title.trim(), diningDate: date, diningTime: time, headCount, region: region.trim(), budgetPerPerson: numericBudget, preferredMenu: menu, requiredOptions: options, memo: memo.trim() }); }
    catch (error) { setMessage(error instanceof Error ? error.message : "요청을 등록하지 못했습니다."); }
    finally { setSubmitting(false); }
  };
  return (
    <Page back={onBack} eyebrow="STEP 1 OF 3" title="단체 회식 일정" subtitle="날짜와 시간, 지역, 참석 인원을 입력해주세요.">
      <View style={styles.steps}><View style={[styles.step, styles.stepActive]} /><View style={styles.step} /><View style={styles.step} /></View>
      <Field error={errors.title} label="요청 제목" onChangeText={setTitle} placeholder="예: 강남역 팀 회식" value={title} />
      <Field error={errors.date} keyboardType="numbers-and-punctuation" label="날짜" onChangeText={setDate} placeholder="2026-08-28" value={date} />
      <Field error={errors.time} keyboardType="numbers-and-punctuation" label="시간" onChangeText={setTime} placeholder="19:00" value={time} />
      <Field error={errors.region} label="방문 지역" onChangeText={setRegion} placeholder="예: 강남역, 여의도" value={region} />
      <Text style={styles.fieldTitle}>참석 인원</Text><Counter min={2} onChange={setHeadCount} value={headCount} />
      <Field error={errors.budget} keyboardType="number-pad" label="1인 예산" onChangeText={setBudget} placeholder="예: 50000" value={budget} />
      <Text style={styles.fieldTitle}>선호 메뉴</Text><ChipGroup>{["고기", "한식", "중식", "일식", "술집", "상관없음"].map((item) => <Chip key={item} label={item} onPress={() => setMenu(item)} selected={menu === item} />)}</ChipGroup>
      <Text style={styles.fieldTitle}>필수 조건</Text><ChipGroup>{["룸 필요", "주차 가능", "조용한 분위기", "역 근처"].map((item) => <Chip key={item} label={item} onPress={() => toggleOption(item)} selected={options.includes(item)} />)}</ChipGroup>
      <Field label="추가 요청" multiline onChangeText={setMemo} placeholder="알레르기, 좌석, 서비스 요청 등을 알려주세요." value={memo} />
      {message ? <InlineMessage message={message} tone="error" /> : null}<Button label="요청 등록하기" loading={submitting} onPress={() => void submit()} />
    </Page>
  );
}

export function RequestWaitingScreen({ request, offers, onBack, onRefresh, onCancel, onCompare }: { request: DiningRequest | null; offers: Offer[]; onBack: () => void; onRefresh: () => void | Promise<void>; onCancel: (request: DiningRequest) => void | Promise<void>; onCompare: () => void }) {
  const [refreshing, setRefreshing] = useState(false); const [cancelVisible, setCancelVisible] = useState(false); const [processing, setProcessing] = useState(false); const [message, setMessage] = useState("");
  if (!request) return <Page back={onBack} title="요청을 찾을 수 없어요"><EmptyState actionLabel="목록으로" onAction={onBack} title="선택한 요청이 없습니다" /></Page>;
  const related = offers.filter((offer) => offer.diningRequestId === request.id);
  const refresh = async () => { setRefreshing(true); setMessage(""); try { await onRefresh(); setMessage("최신 오퍼를 확인했습니다."); } catch (error) { setMessage(error instanceof Error ? error.message : "새로고침하지 못했습니다."); } finally { setRefreshing(false); } };
  const cancel = async () => { setCancelVisible(false); setProcessing(true); try { await onCancel(request); } catch (error) { setMessage(error instanceof Error ? error.message : "요청을 취소하지 못했습니다."); } finally { setProcessing(false); } };
  return (
    <Page back={onBack} eyebrow="REQUEST STATUS" title="오퍼를 기다리고 있어요" subtitle="도착한 제안을 확인하고 가장 좋은 오퍼를 선택하세요.">
      <Card style={styles.summaryCard}><View style={styles.between}><Badge label={requestStatus(request.status)} tone={toneForStatus(request.status)} /><TouchableOpacity disabled={refreshing} onPress={() => void refresh()}><Text style={styles.refresh}>{refreshing ? "확인 중" : "↻ 새로고침"}</Text></TouchableOpacity></View><Text style={styles.summaryTitle}>{request.title}</Text><Text style={styles.summaryCopy}>{request.diningDate} {request.diningTime} · {request.region}</Text><ChipGroup><Chip label={`${request.headCount}명`} /><Chip label={`인당 ${money(request.budgetPerPerson)} 이하`} /><Chip label={request.preferredMenu || "메뉴 무관"} />{request.requiredOptions.map((option) => <Chip key={option} label={option} />)}</ChipGroup>{request.memo ? <InlineMessage message={request.memo} /> : null}</Card>
      <View style={styles.progressCard}><Text style={styles.progressIcon}>{request.status === "canceled" ? "×" : "◌"}</Text><View style={styles.grow}><Text style={styles.progressTitle}>{request.status === "canceled" ? "취소된 요청입니다" : `현재 받은 오퍼 ${related.length}건`}</Text><Text style={styles.progressCopy}>{request.status === "open" ? "식당들이 맞춤 제안을 보내고 있어요." : "이 요청의 모집이 종료되었습니다."}</Text></View></View>
      {message ? <InlineMessage message={message} tone={message.includes("못") ? "error" : "success"} /> : null}
      <SectionHeader action="새로고침" onAction={() => void refresh()} title="도착한 오퍼" />
      {related.length === 0 ? <EmptyState description="오퍼가 도착하면 바로 비교할 수 있어요." title="아직 도착한 오퍼가 없어요" /> : related.slice(0, 3).map((offer) => <Card key={offer.id}><View style={styles.between}><Text style={styles.offerRestaurant}>{offer.restaurantName}</Text><Text style={styles.offerPrice}>{money(offer.pricePerPerson)}</Text></View><Text style={styles.cardCopy}>{offer.menuDescription}</Text><Text style={styles.benefit}>✦ {offer.serviceDescription || "추가 혜택 없음"}</Text></Card>)}
      {request.status === "open" ? <Button disabled={processing} label="요청 취소" onPress={() => setCancelVisible(true)} variant="danger" /> : null}<Button disabled={!related.length || request.status !== "open"} label="오퍼 비교하기" onPress={onCompare} />
      <ConfirmModal confirmLabel="요청 취소" description="취소하면 더 이상 오퍼를 받거나 선택할 수 없습니다." destructive onCancel={() => setCancelVisible(false)} onConfirm={() => void cancel()} title="이 요청을 취소할까요?" visible={cancelVisible} />
    </Page>
  );
}

export function OfferComparisonScreen({ request, offers, onBack, onSelect }: { request: DiningRequest | null; offers: Offer[]; onBack: () => void; onSelect: (offer: Offer) => void | Promise<void> }) {
  const [sort, setSort] = useState<"price" | "latest">("price"); const [candidate, setCandidate] = useState<Offer | null>(null); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState("");
  const related = useMemo(() => offers.filter((offer) => offer.diningRequestId === request?.id).sort((a, b) => sort === "price" ? a.pricePerPerson - b.pricePerPerson : Date.parse(b.createdAt) - Date.parse(a.createdAt)), [offers, request?.id, sort]);
  if (!request) return <Page back={onBack} title="오퍼 비교"><EmptyState title="비교할 요청이 없습니다" /></Page>;
  const select = async () => { if (!candidate) return; setSubmitting(true); setMessage(""); try { await onSelect(candidate); } catch (error) { setMessage(error instanceof Error ? error.message : "오퍼를 선택하지 못했습니다."); } finally { setSubmitting(false); setCandidate(null); } };
  return (
    <Page back={onBack} eyebrow="COMPARE OFFERS" title={`맞춤 오퍼 ${related.length}개`} subtitle="가격과 메뉴, 혜택을 한눈에 비교하세요.">
      <View style={styles.darkBanner}><Text style={styles.bannerEyebrow}>현재 진행 중인 요청</Text><Text style={styles.bannerTitle}>{request.diningDate} {request.diningTime} · {request.region}</Text><Text style={styles.bannerCopy}>{request.headCount}명 · 희망 예산 {money(request.budgetPerPerson)} 이하</Text></View>
      <Tabs items={[{ label: "가격 낮은 순", value: "price" }, { label: "최신순", value: "latest" }]} onChange={setSort} value={sort} />
      {message ? <InlineMessage message={message} tone="error" /> : null}
      {related.length === 0 ? <EmptyState title="도착한 오퍼가 없습니다" /> : related.map((offer, index) => <View key={offer.id} style={[styles.offerCard, index === 0 && sort === "price" && styles.bestOffer]}>{index === 0 && sort === "price" ? <View style={styles.bestLabel}><Text style={styles.bestLabelText}>LOWEST PRICE</Text></View> : null}<View style={[styles.offerVisual, { backgroundColor: ["#B99178", "#8FB8B2", "#C9A98E"][index % 3] }]}><Text style={styles.offerVisualName}>{offer.restaurantName}</Text></View><View style={styles.offerBody}><View style={styles.between}><View style={styles.grow}><Text style={styles.offerAddress}>{offer.restaurantAddress}</Text><Text style={styles.offerMenu}>{offer.menuDescription}</Text></View><Badge label={offer.status === "pending" ? "대기 중" : offer.status} tone={toneForStatus(offer.status)} /></View><View style={styles.priceRow}><View><Text style={styles.priceLabel}>1인당 가격</Text><Text style={styles.largePrice}>{money(offer.pricePerPerson)}</Text></View><View><Text style={styles.priceLabel}>예약 가능 시간</Text><Text style={styles.availableTime}>{offer.availableTime}</Text></View></View><Text style={styles.benefit}>✦ {offer.serviceDescription || "추가 혜택 없음"}</Text><Text style={styles.ownerComment}>“{offer.ownerComment || "정성껏 준비하겠습니다."}”</Text><Button disabled={offer.status !== "pending" || submitting} label="이 오퍼로 예약 확정" onPress={() => setCandidate(offer)} /></View></View>)}
      <ConfirmModal confirmLabel="예약 확정" description={candidate ? `${candidate.restaurantName}의 ${money(candidate.pricePerPerson)} 오퍼를 선택합니다. 선택 후 다른 오퍼는 자동으로 마감됩니다.` : ""} onCancel={() => setCandidate(null)} onConfirm={() => void select()} title="이 오퍼를 선택할까요?" visible={Boolean(candidate)} />
    </Page>
  );
}

export function ReservationConfirmationScreen({ request, offer, reservation, onHome, onReservations }: { request: DiningRequest | null; offer: Offer | null; reservation: Reservation | null; onHome: () => void; onReservations: () => void }) {
  return (
    <Page eyebrow="RESERVATION COMPLETE" title="예약이 확정됐어요!" subtitle="즐거운 회식 시간이 되길 바랄게요.">
      <View style={styles.successCircle}><Text style={styles.successCheck}>✓</Text></View>
      <Text style={styles.confirmRestaurant}>{offer?.restaurantName || reservation?.restaurantName || "예약 식당"}</Text>
      <Card><InfoRow label="일정" value={`${reservation?.reservationDate || request?.diningDate || "-"} ${reservation?.reservationTime || offer?.availableTime || request?.diningTime || ""}`} /><InfoRow label="인원" value={`${reservation?.headCount || request?.headCount || 0}명`} /><InfoRow label="메뉴" value={offer?.menuDescription || "일반 예약"} /><InfoRow label="1인 가격" value={offer ? money(offer.pricePerPerson) : "현장 결제"} last /></Card>
      <InlineMessage message="결제 및 예약금 없이 예약 정보만 확정됩니다." />
      <Button label="내 예약 보기" onPress={onReservations} /><Button label="홈으로" onPress={onHome} variant="secondary" />
    </Page>
  );
}

export function RestaurantListScreen({ restaurants, onSelectRestaurant }: { restaurants: Restaurant[]; onSelectRestaurant: (restaurant: Restaurant) => void }) {
  const [keyword, setKeyword] = useState(""); const [category, setCategory] = useState("전체");
  const categories = ["전체", "한식", "고기", "일식", "양식", "술집", "룸"];
  const filtered = useMemo(() => restaurants.filter((restaurant) => restaurant.status === "approved").filter((restaurant) => { const haystack = `${restaurant.name} ${restaurant.address} ${restaurant.category} ${restaurant.keywords.join(" ")}`.toLowerCase(); const keywordMatch = haystack.includes(keyword.trim().toLowerCase()); const categoryMatch = category === "전체" || haystack.includes(category.toLowerCase()); return keywordMatch && categoryMatch; }), [restaurants, keyword, category]);
  return (
    <Page eyebrow="DISCOVER" title="식당 예약" subtitle="원하는 식당을 찾아 날짜와 인원을 선택하세요.">
      <Field label="식당 검색" onChangeText={setKeyword} placeholder="지역 또는 식당 이름 검색" returnKeyType="search" value={keyword} />
      <ChipGroup>{categories.map((item) => <Chip key={item} label={item} onPress={() => setCategory(item)} selected={category === item} />)}</ChipGroup>
      <View style={styles.between}><Text style={styles.resultTitle}>검색 결과</Text><Text style={styles.resultCount}>{filtered.length}개</Text></View>
      {filtered.length === 0 ? <EmptyState description="검색어 또는 카테고리를 바꿔보세요." title="조건에 맞는 식당이 없어요" /> : filtered.map((restaurant) => <TouchableOpacity key={restaurant.id} onPress={() => onSelectRestaurant(restaurant)} style={styles.restaurantCard}><View style={[styles.restaurantVisual, { backgroundColor: restaurant.visualColor }]}><Badge label={restaurant.status === "approved" ? "예약 가능" : restaurant.status} tone="success" /><Text style={styles.restaurantVisualText}>GOLABOB PICK</Text></View><View style={styles.restaurantBody}><Text style={styles.restaurantCategory}>{restaurant.category}</Text><Text style={styles.restaurantName}>{restaurant.name}</Text><Text style={styles.restaurantAddress}>{restaurant.address}</Text><ChipGroup>{restaurant.facilities.slice(0, 3).map((facility) => <Chip key={facility} label={facility} />)}</ChipGroup><View style={styles.detailLink}><Text style={styles.detailLinkText}>상세보기 및 예약</Text><Text style={styles.detailLinkText}>›</Text></View></View></TouchableOpacity>)}
    </Page>
  );
}

export function RestaurantDetailScreen({ restaurant, onBack, onReserve }: { restaurant: Restaurant | null; onBack: () => void; onReserve: (draft: ReservationDraft) => void | Promise<void> }) {
  const [date, setDate] = useState(""); const [time, setTime] = useState(""); const [headCount, setHeadCount] = useState(4); const [memo, setMemo] = useState(""); const [errors, setErrors] = useState<Record<string, string>>({}); const [submitting, setSubmitting] = useState(false); const [confirm, setConfirm] = useState(false); const [message, setMessage] = useState("");
  if (!restaurant) return <Page back={onBack} title="식당 상세"><EmptyState actionLabel="목록으로" onAction={onBack} title="식당 정보를 찾을 수 없습니다" /></Page>;
  const validate = () => { const next: Record<string, string> = {}; if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = "예약 날짜를 입력해주세요."; if (!/^\d{2}:\d{2}$/.test(time)) next.time = "예약 시간을 입력해주세요."; if (headCount > restaurant.maxCapacity) next.headCount = `최대 ${restaurant.maxCapacity}명까지 예약할 수 있습니다.`; setErrors(next); if (!Object.keys(next).length) setConfirm(true); };
  const reserve = async () => { setConfirm(false); setSubmitting(true); setMessage(""); try { await onReserve({ restaurantId: restaurant.id, reservationDate: date, reservationTime: time, headCount, requestMemo: memo.trim() }); } catch (error) { setMessage(error instanceof Error ? error.message : "예약하지 못했습니다."); } finally { setSubmitting(false); } };
  return (
    <Page back={onBack} eyebrow={restaurant.category.toUpperCase()} title={restaurant.name} subtitle={restaurant.address}>
      <View style={[styles.detailHero, { backgroundColor: restaurant.visualColor }]}><Text style={styles.detailHeroLabel}>GOLABOB RESTAURANT</Text><Text style={styles.detailHeroName}>{restaurant.name}</Text></View>
      <Text style={styles.restaurantIntro}>{restaurant.description}</Text><ChipGroup>{restaurant.facilities.map((facility) => <Chip key={facility} label={facility} />)}<Chip label={`최대 ${restaurant.maxCapacity}명`} /></ChipGroup>
      <Card><InfoRow label="주소" value={restaurant.address} /><InfoRow label="영업시간" value={restaurant.businessHours} /><InfoRow label="전화" value={restaurant.phone} last /></Card>
      <SectionHeader title="예약 정보" />
      <Field error={errors.date} keyboardType="numbers-and-punctuation" label="예약 날짜" onChangeText={setDate} placeholder="2026-09-01" value={date} />
      <Field error={errors.time} keyboardType="numbers-and-punctuation" label="예약 시간" onChangeText={setTime} placeholder="19:00" value={time} />
      <Text style={styles.fieldTitle}>예약 인원</Text><Counter max={restaurant.maxCapacity} onChange={setHeadCount} value={headCount} />{errors.headCount ? <Text style={styles.errorText}>{errors.headCount}</Text> : null}
      <Field label="요청사항" multiline onChangeText={setMemo} placeholder="좌석, 알레르기 등 요청사항을 입력해주세요." value={memo} />
      {message ? <InlineMessage message={message} tone="error" /> : null}<Button disabled={submitting} label="예약 요청하기" loading={submitting} onPress={validate} />
      <ConfirmModal confirmLabel="예약 요청" description={`${date} ${time}, ${headCount}명으로 예약을 요청합니다.`} onCancel={() => setConfirm(false)} onConfirm={() => void reserve()} title={`${restaurant.name}에 예약할까요?`} visible={confirm} />
    </Page>
  );
}

export function MyReservationsScreen({ reservations, onOpenRestaurant, onCancel, onReview, onDeleteReview }: { reservations: Reservation[]; onOpenRestaurant: (reservation: Reservation) => void; onCancel: (reservation: Reservation) => void | Promise<void>; onReview: (reservation: Reservation) => void; onDeleteReview: (reservation: Reservation) => void | Promise<void> }) {
  const [tab, setTab] = useState<"upcoming" | "past" | "canceled">("upcoming"); const [candidate, setCandidate] = useState<Reservation | null>(null); const [message, setMessage] = useState("");
  const filtered = useMemo(() => reservations.filter((reservation) => tab === "upcoming" ? ["pending", "confirmed"].includes(reservation.status) : tab === "past" ? reservation.status === "completed" : ["canceled", "rejected"].includes(reservation.status)), [reservations, tab]);
  const cancel = async () => { if (!candidate) return; const item = candidate; setCandidate(null); try { await onCancel(item); setMessage("예약이 취소되었습니다."); } catch (error) { setMessage(error instanceof Error ? error.message : "예약을 취소하지 못했습니다."); } };
  return (
    <Page eyebrow="MY RESERVATIONS" title="내 예약" subtitle="일반 예약과 확정된 회식을 한곳에서 확인하세요.">
      <Tabs items={[{ label: "예정", value: "upcoming", count: reservations.filter((item) => ["pending", "confirmed"].includes(item.status)).length }, { label: "지난 예약", value: "past", count: reservations.filter((item) => item.status === "completed").length }, { label: "취소", value: "canceled", count: reservations.filter((item) => ["canceled", "rejected"].includes(item.status)).length }]} onChange={setTab} value={tab} />
      {message ? <InlineMessage message={message} tone={message.includes("못") ? "error" : "success"} /> : null}
      {filtered.length === 0 ? <EmptyState description="새로운 예약을 진행해보세요." title="이 상태의 예약이 없습니다" /> : filtered.map((reservation) => <Card key={reservation.id}><View style={styles.between}><Badge label={reservationStatus(reservation.status)} tone={toneForStatus(reservation.status)} /><Text style={styles.cardHint}>{reservation.source === "offer" ? "맞춤 오퍼" : "일반 예약"}</Text></View><Text style={styles.cardTitle}>{reservation.restaurantName}</Text><Text style={styles.cardCopy}>{reservation.reservationDate} {reservation.reservationTime} · {reservation.headCount}명</Text>{reservation.requestMemo ? <Text style={styles.memoText}>요청: {reservation.requestMemo}</Text> : null}{reservation.reviewed ? <InlineMessage message="리뷰 작성 완료" tone="success" /> : null}<View style={styles.cardActions}><View style={styles.grow}><Button label="식당 보기" onPress={() => onOpenRestaurant(reservation)} variant="secondary" /></View>{["pending", "confirmed"].includes(reservation.status) ? <View style={styles.grow}><Button label="예약 취소" onPress={() => setCandidate(reservation)} variant="danger" /></View> : null}{reservation.status === "completed" && !reservation.reviewed ? <View style={styles.grow}><Button label="리뷰 작성" onPress={() => onReview(reservation)} /></View> : null}{reservation.reviewed ? <View style={styles.grow}><Button label="리뷰 삭제" onPress={() => void onDeleteReview(reservation)} variant="danger" /></View> : null}</View></Card>)}      
      <ConfirmModal confirmLabel="예약 취소" description={candidate ? `${candidate.restaurantName}의 ${candidate.reservationDate} 예약을 취소합니다.` : ""} destructive onCancel={() => setCandidate(null)} onConfirm={() => void cancel()} title="예약을 취소할까요?" visible={Boolean(candidate)} />
    </Page>
  );
}

export function WriteReviewScreen({ reservation, onBack, onSubmit }: { reservation: Reservation | null; onBack: () => void; onSubmit: (review: ReviewDraft) => void | Promise<void> }) {
  const [rating, setRating] = useState(0); const [content, setContent] = useState(""); const [errors, setErrors] = useState<Record<string, string>>({}); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState("");
  if (!reservation) return <Page back={onBack} title="리뷰 작성"><EmptyState title="리뷰를 작성할 예약이 없습니다" /></Page>;
  const submit = async () => { const next: Record<string, string> = {}; if (!rating) next.rating = "별점을 선택해주세요."; if (content.trim().length < 10) next.content = "후기를 10자 이상 입력해주세요."; setErrors(next); if (Object.keys(next).length) return; setSubmitting(true); try { await onSubmit({ reservationId: reservation.id, restaurantId: reservation.restaurantId, rating, content: content.trim() }); } catch (error) { setMessage(error instanceof Error ? error.message : "리뷰를 등록하지 못했습니다."); } finally { setSubmitting(false); } };
  return (
    <Page back={onBack} eyebrow="HOW WAS IT?" title="리뷰 작성" subtitle="다른 사용자를 위해 방문 경험을 들려주세요.">
      <Card style={styles.reviewRestaurant}><Text style={styles.cardHint}>이용 완료</Text><Text style={styles.cardTitle}>{reservation.restaurantName}</Text><Text style={styles.cardCopy}>{reservation.reservationDate} · {reservation.headCount}명</Text></Card>
      <View style={styles.ratingBox}><Text style={styles.ratingTitle}>식당은 어떠셨나요?</Text><View style={styles.stars}>{[1, 2, 3, 4, 5].map((star) => <TouchableOpacity accessibilityLabel={`${star}점`} key={star} onPress={() => { setRating(star); setErrors((current) => ({ ...current, rating: "" })); }}><Text style={[styles.star, star <= rating && styles.starActive]}>★</Text></TouchableOpacity>)}</View><Text style={styles.ratingCopy}>{rating ? `${rating}점을 선택했어요` : "별점을 눌러 선택해주세요"}</Text>{errors.rating ? <Text style={styles.errorText}>{errors.rating}</Text> : null}</View>
      <Field error={errors.content} label="방문 후기" maxLength={500} multiline onChangeText={(value) => { setContent(value); setErrors((current) => ({ ...current, content: "" })); }} placeholder="음식, 공간, 서비스는 어땠나요?" value={content} /><Text style={styles.characterCount}>{content.length}/500</Text>
      {message ? <InlineMessage message={message} tone="error" /> : null}<Button label="리뷰 등록하기" loading={submitting} onPress={() => void submit()} />
    </Page>
  );
}

const styles = StyleSheet.create({
  userCta: { padding: 20, gap: 8, borderRadius: radius.lg, backgroundColor: colors.primary },
  ctaEyebrow: { color: colors.coral, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  ctaTitle: { color: colors.surface, fontSize: 22, fontWeight: "900" },
  ctaCopy: { color: "#C8D8D1", fontSize: 13, marginBottom: 5 },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  grow: { flex: 1 },
  cardHint: { color: colors.muted, fontSize: 11 },
  cardTitle: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: "900" },
  cardCopy: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  requestMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaStrong: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  dot: { color: colors.disabled },
  steps: { flexDirection: "row", gap: 7 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line },
  stepActive: { backgroundColor: colors.coral },
  fieldTitle: { color: colors.text, fontSize: 13, fontWeight: "800" },
  errorText: { color: colors.danger, fontSize: 11 },
  summaryCard: { backgroundColor: "#FBFDFC" },
  summaryTitle: { color: colors.primary, fontSize: 20, lineHeight: 27, fontWeight: "900" },
  summaryCopy: { color: colors.muted, fontSize: 13 },
  refresh: { color: colors.primary, fontSize: 12, fontWeight: "900", padding: 6 },
  progressCard: { padding: 16, flexDirection: "row", alignItems: "center", gap: 13, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  progressIcon: { color: colors.coral, fontSize: 36 },
  progressTitle: { color: colors.primary, fontSize: 15, fontWeight: "900" },
  progressCopy: { marginTop: 3, color: colors.muted, fontSize: 11, lineHeight: 16 },
  offerRestaurant: { color: colors.text, fontSize: 16, fontWeight: "900" },
  offerPrice: { color: colors.danger, fontSize: 16, fontWeight: "900" },
  benefit: { padding: 10, overflow: "hidden", borderRadius: radius.sm, color: colors.primary, backgroundColor: colors.surfaceLow, fontSize: 12, fontWeight: "700" },
  darkBanner: { padding: 18, gap: 6, borderRadius: radius.md, backgroundColor: colors.primary },
  bannerEyebrow: { color: colors.coral, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  bannerTitle: { color: colors.surface, fontSize: 18, fontWeight: "900" },
  bannerCopy: { color: "#C8D8D1", fontSize: 12 },
  offerCard: { overflow: "hidden", borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  bestOffer: { borderWidth: 2, borderColor: colors.coral },
  bestLabel: { position: "absolute", right: 10, top: 10, zIndex: 2, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.coral },
  bestLabelText: { color: colors.surface, fontSize: 9, fontWeight: "900" },
  offerVisual: { height: 110, padding: 15, justifyContent: "flex-end" },
  offerVisualName: { color: colors.surface, fontSize: 19, fontWeight: "900", textShadowColor: "rgba(0,0,0,0.25)", textShadowRadius: 4 },
  offerBody: { padding: 16, gap: 12 },
  offerAddress: { color: colors.muted, fontSize: 11 },
  offerMenu: { marginTop: 3, color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: "900" },
  priceRow: { paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  priceLabel: { color: colors.muted, fontSize: 10 },
  largePrice: { marginTop: 3, color: colors.danger, fontSize: 20, fontWeight: "900" },
  availableTime: { marginTop: 3, color: colors.primary, textAlign: "right", fontSize: 16, fontWeight: "900" },
  ownerComment: { color: colors.muted, fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  successCircle: { width: 70, height: 70, alignSelf: "center", alignItems: "center", justifyContent: "center", borderRadius: 35, backgroundColor: colors.primary },
  successCheck: { color: colors.surface, fontSize: 30, fontWeight: "900" },
  confirmRestaurant: { color: colors.primary, textAlign: "center", fontSize: 23, fontWeight: "900" },
  resultTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  resultCount: { color: colors.muted, fontSize: 12 },
  restaurantCard: { overflow: "hidden", borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  restaurantVisual: { height: 125, padding: 13, justifyContent: "space-between" },
  restaurantVisualText: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  restaurantBody: { padding: 15, gap: 7 },
  restaurantCategory: { color: colors.coral, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  restaurantName: { color: colors.text, fontSize: 19, fontWeight: "900" },
  restaurantAddress: { color: colors.muted, fontSize: 12 },
  detailLink: { marginTop: 6, paddingTop: 11, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderColor: colors.line },
  detailLinkText: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  detailHero: { height: 210, padding: 18, justifyContent: "flex-end", gap: 5, borderRadius: radius.lg },
  detailHeroLabel: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  detailHeroName: { color: colors.surface, fontSize: 27, fontWeight: "900" },
  restaurantIntro: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  memoText: { padding: 9, color: colors.muted, fontSize: 11, borderRadius: radius.sm, backgroundColor: colors.surfaceLow },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 3 },
  reviewRestaurant: { alignItems: "center" },
  ratingBox: { padding: 20, alignItems: "center", gap: 9, borderRadius: radius.md, backgroundColor: colors.surface },
  ratingTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  stars: { flexDirection: "row", gap: 4 },
  star: { color: colors.line, fontSize: 35 },
  starActive: { color: colors.gold },
  ratingCopy: { color: colors.muted, fontSize: 12 },
  characterCount: { marginTop: -8, color: colors.muted, textAlign: "right", fontSize: 10 },
});
