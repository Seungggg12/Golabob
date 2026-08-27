import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Badge, Button, Card, Chip, ChipGroup, ConfirmModal, Counter, EmptyState, Field, InfoRow, InlineMessage, Page, SectionHeader, Tabs } from "../components/ui";
import { colors, radius } from "../theme";
import { DiningRequest, Navigate, Offer, OfferDraft, Reservation, Restaurant, RestaurantDraft } from "../types";

const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const requestLabel = (status: DiningRequest["status"]) => ({ open: "모집 중", reserved: "예약 확정", canceled: "취소", expired: "마감" })[status];
const offerLabel = (status: Offer["status"]) => ({ pending: "대기 중", selected: "선택됨", rejected: "미선택", canceled: "취소", expired: "만료" })[status];
const reservationLabel = (status: Reservation["status"]) => ({ pending: "승인 대기", confirmed: "예약 확정", completed: "이용 완료", canceled: "예약 취소", rejected: "예약 거절" })[status];
const tone = (status: string): "accent" | "success" | "danger" | "muted" => status === "selected" || status === "confirmed" || status === "approved" ? "success" : status === "open" || status === "pending" ? "accent" : status === "canceled" || status === "rejected" || status === "suspended" ? "danger" : "muted";

function Metrics({ items }: { items: Array<{ label: string; value: number; accent?: boolean }> }) {
  return <View style={styles.metrics}>{items.map((item) => <View key={item.label} style={[styles.metric, item.accent && styles.metricAccent]}><Text style={[styles.metricValue, item.accent && styles.metricValueAccent]}>{item.value}</Text><Text style={styles.metricLabel}>{item.label}</Text></View>)}</View>;
}

export function OwnerHomeScreen({ requests, offers, reservations, onNavigate, onSelectRequest }: { requests: DiningRequest[]; offers: Offer[]; reservations: Reservation[]; onNavigate: Navigate; onSelectRequest: (request: DiningRequest) => void }) {
  const open = requests.filter((request) => request.status === "open");
  const pendingReservations = reservations.filter((reservation) => reservation.status === "pending");
  return (
    <Page eyebrow="OWNER DASHBOARD" title="새로운 회식 기회가 왔어요" subtitle="우리 식당과 잘 맞는 요청을 확인해보세요.">
      <Metrics items={[{ label: "새 요청", value: open.length, accent: true }, { label: "보낸 오퍼", value: offers.length }, { label: "예약 대기", value: pendingReservations.length }]} />
      {pendingReservations.length ? <TouchableOpacity onPress={() => onNavigate("ownerReservations")} style={styles.notice}><Text style={styles.noticeIcon}>!</Text><View style={styles.grow}><Text style={styles.noticeTitle}>확인이 필요한 예약 {pendingReservations.length}건</Text><Text style={styles.noticeCopy}>예약 요청을 확정하거나 거절해주세요.</Text></View><Text style={styles.chevron}>›</Text></TouchableOpacity> : null}
      <SectionHeader action={`${reservations.length}건`} onAction={() => onNavigate("ownerReservations")} title="예약 일정" />
      {reservations.length === 0 ? <EmptyState description="새 예약이 접수되면 일정이 표시됩니다." title="등록된 예약이 없어요" /> : reservations.slice(0, 3).map((reservation) => <Card key={reservation.id} onPress={() => onNavigate("ownerReservations")}><View style={styles.between}><View><Text style={styles.scheduleDate}>{reservation.reservationDate}</Text><Text style={styles.scheduleTime}>{reservation.reservationTime}</Text></View><View style={styles.grow}><Text style={styles.cardTitle}>{reservation.restaurantName}</Text><Text style={styles.cardCopy}>{reservation.headCount}명 · {reservation.userName}</Text></View><Badge label={reservationLabel(reservation.status)} tone={tone(reservation.status)} /></View></Card>)}
      <SectionHeader action="보낸 오퍼" onAction={() => onNavigate("ownerOffers")} title="추천 회식 요청" />
      {open.length === 0 ? <EmptyState description="새로운 요청이 올라오면 이곳에 표시됩니다." title="현재 모집 중인 요청이 없어요" /> : open.map((request) => <Card key={request.id} onPress={() => onSelectRequest(request)}><View style={styles.between}><Badge label={requestLabel(request.status)} tone="accent" /><Text style={styles.hint}>{request.region}</Text></View><Text style={styles.cardTitle}>{request.title}</Text><Text style={styles.cardCopy}>{request.diningDate} {request.diningTime}</Text><View style={styles.between}><Text style={styles.cardMeta}>{request.headCount}명 · 인당 {money(request.budgetPerPerson)}</Text><Text style={styles.chevron}>›</Text></View></Card>)}
      <Button label="내 식당 관리" onPress={() => onNavigate("myRestaurants")} variant="secondary" />
    </Page>
  );
}

export function OwnerRequestDetailScreen({ request, offers, onBack, onCreateOffer }: { request: DiningRequest | null; offers: Offer[]; onBack: () => void; onCreateOffer: () => void }) {
  if (!request) return <Page back={onBack} title="회식 요청"><EmptyState actionLabel="목록으로" onAction={onBack} title="선택한 요청이 없습니다" /></Page>;
  const sent = offers.filter((offer) => offer.diningRequestId === request.id);
  return (
    <Page back={onBack} eyebrow="REVERSE OFFER REQUEST" title={request.title} subtitle={`${request.region} · ${request.diningDate} ${request.diningTime}`}>
      <Card style={styles.darkCard}><View style={styles.between}><Badge label={requestLabel(request.status)} tone="accent" /><Text style={styles.darkHint}>요청 #{request.id}</Text></View><View style={styles.requestGrid}><Stat label="참석 인원" value={`${request.headCount}명`} dark /><Stat label="1인 예산" value={`${money(request.budgetPerPerson)} 이하`} dark /><Stat label="선호 메뉴" value={request.preferredMenu || "무관"} dark /><Stat label="보낸 오퍼" value={`${sent.length}건`} dark /></View></Card>
      <SectionHeader title="필수 조건" /><ChipGroup>{request.requiredOptions.length ? request.requiredOptions.map((option) => <Chip key={option} label={option} />) : <Chip label="추가 조건 없음" />}</ChipGroup>
      <Card><Text style={styles.cardTitle}>요청 메모</Text><Text style={styles.longCopy}>{request.memo || "별도 요청사항이 없습니다."}</Text></Card>
      {sent.length ? <InlineMessage message={`이 요청에 이미 ${sent.length}개의 오퍼를 보냈습니다. 식당별 중복 전송 여부를 확인하세요.`} /> : null}
      <Button disabled={request.status !== "open"} label={request.status === "open" ? "맞춤 오퍼 보내기" : "마감된 요청"} onPress={onCreateOffer} />
    </Page>
  );
}

function Stat({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) { return <View style={styles.stat}><Text style={[styles.statLabel, dark && styles.statLabelDark]}>{label}</Text><Text style={[styles.statValue, dark && styles.statValueDark]}>{value}</Text></View>; }

export function CreateOfferScreen({ request, restaurants, onBack, onSubmit }: { request: DiningRequest | null; restaurants: Restaurant[]; onBack: () => void; onSubmit: (draft: OfferDraft) => void | Promise<void> }) {
  const approved = restaurants.filter((restaurant) => restaurant.status === "approved");
  const [restaurantId, setRestaurantId] = useState(approved[0]?.id || ""); const [price, setPrice] = useState(""); const [time, setTime] = useState(request?.diningTime || ""); const [menu, setMenu] = useState(""); const [service, setService] = useState(""); const [seat, setSeat] = useState(""); const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({}); const [message, setMessage] = useState(""); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!restaurantId && approved[0]) setRestaurantId(approved[0].id); }, [approved, restaurantId]);
  if (!request) return <Page back={onBack} title="맞춤 오퍼 작성"><EmptyState title="선택한 요청이 없습니다" /></Page>;
  const submit = async () => {
    const numericPrice = Number(price.replace(/,/g, "")); const next: Record<string, string> = {};
    if (!restaurantId) next.restaurant = "오퍼를 보낼 식당을 선택해주세요."; if (!numericPrice) next.price = "제안 가격을 입력해주세요."; if (!/^\d{2}:\d{2}$/.test(time)) next.time = "예약 가능 시간을 입력해주세요."; if (!menu.trim()) next.menu = "메뉴 구성을 입력해주세요.";
    setErrors(next); if (Object.keys(next).length) return; setSubmitting(true); setMessage("");
    try { await onSubmit({ restaurantId, pricePerPerson: numericPrice, availableTime: time, menuDescription: menu.trim(), serviceDescription: service.trim(), seatDescription: seat.trim(), ownerComment: comment.trim() }); }
    catch (error) { setMessage(error instanceof Error ? error.message : "오퍼를 보내지 못했습니다."); }
    finally { setSubmitting(false); }
  };
  return (
    <Page back={onBack} eyebrow={`${request.region} · ${request.headCount}명`} title="맞춤 오퍼 작성" subtitle={`${request.title}에 보낼 제안을 입력해주세요.`}>
      <Card><InfoRow label="희망 일정" value={`${request.diningDate} ${request.diningTime}`} /><InfoRow label="희망 예산" value={`인당 ${money(request.budgetPerPerson)} 이하`} last /></Card>
      <Text style={styles.fieldTitle}>오퍼를 보낼 식당</Text>{approved.length ? <ChipGroup>{approved.map((restaurant) => <Chip key={restaurant.id} label={restaurant.name} onPress={() => setRestaurantId(restaurant.id)} selected={restaurantId === restaurant.id} />)}</ChipGroup> : <EmptyState description="식당을 등록하고 승인을 받은 뒤 오퍼를 보낼 수 있어요." title="승인된 내 식당이 없습니다" />}{errors.restaurant ? <Text style={styles.errorText}>{errors.restaurant}</Text> : null}
      <Field error={errors.price} keyboardType="number-pad" label="1인 제안 가격" onChangeText={setPrice} placeholder="예: 52000" value={price} />
      <Field error={errors.time} keyboardType="numbers-and-punctuation" label="예약 가능 시간" onChangeText={setTime} placeholder="19:00" value={time} />
      <Field error={errors.menu} label="메뉴 구성" multiline onChangeText={setMenu} placeholder="한우 모둠과 된장찌개 회식 세트" value={menu} />
      <Field label="제공 서비스" onChangeText={setService} placeholder="음료, 주류, 추가 메뉴 등" value={service} />
      <Field label="좌석 정보" onChangeText={setSeat} placeholder="16인 프라이빗 룸" value={seat} />
      <Field label="사장님 코멘트" multiline onChangeText={setComment} placeholder="고객에게 전할 내용을 입력해주세요." value={comment} />
      {message ? <InlineMessage message={message} tone="error" /> : null}<Button disabled={!approved.length} label="오퍼 보내기" loading={submitting} onPress={() => void submit()} />
    </Page>
  );
}

export function OwnerOfferListScreen({ offers, requests, onSelectOffer }: { offers: Offer[]; requests: DiningRequest[]; onSelectOffer: (offer: Offer) => void }) {
  const [tab, setTab] = useState<"all" | "pending" | "selected" | "closed">("all");
  const filtered = useMemo(() => offers.filter((offer) => tab === "all" || tab === "closed" ? tab === "all" || ["rejected", "canceled", "expired"].includes(offer.status) : offer.status === tab), [offers, tab]);
  return (
    <Page eyebrow="MY OFFERS" title="보낸 오퍼" subtitle="전송한 제안과 선택 결과를 확인하세요.">
      <Tabs items={[{ label: "전체", value: "all", count: offers.length }, { label: "대기", value: "pending", count: offers.filter((item) => item.status === "pending").length }, { label: "선택", value: "selected", count: offers.filter((item) => item.status === "selected").length }, { label: "종료", value: "closed" }]} onChange={setTab} value={tab} />
      {filtered.length === 0 ? <EmptyState title="이 상태의 오퍼가 없습니다" /> : filtered.map((offer) => { const request = requests.find((item) => item.id === offer.diningRequestId); return <Card key={offer.id} onPress={() => onSelectOffer(offer)}><View style={styles.between}><Badge label={offerLabel(offer.status)} tone={tone(offer.status)} /><Text style={styles.hint}>#{offer.id}</Text></View><Text style={styles.cardTitle}>{request?.title || `회식 요청 #${offer.diningRequestId}`}</Text><Text style={styles.cardCopy}>{offer.restaurantName} · {offer.availableTime}</Text><View style={styles.between}><Text style={styles.offerMenu}>{offer.menuDescription}</Text><Text style={styles.price}>{money(offer.pricePerPerson)}</Text></View></Card>; })}
    </Page>
  );
}

export function OwnerOfferDetailScreen({ offer, request, onBack }: { offer: Offer | null; request: DiningRequest | null; onBack: () => void }) {
  if (!offer) return <Page back={onBack} title="보낸 오퍼 상세"><EmptyState title="오퍼를 찾을 수 없습니다" /></Page>;
  return (
    <Page back={onBack} eyebrow={`OFFER #${offer.id}`} title="보낸 오퍼 상세" subtitle="전송한 제안 내용과 상태를 확인하세요.">
      <Card><View style={styles.between}><Badge label={offerLabel(offer.status)} tone={tone(offer.status)} /><Text style={styles.hint}>{offer.createdAt.slice(0, 10)}</Text></View><Text style={styles.cardTitle}>{request?.title || `회식 요청 #${offer.diningRequestId}`}</Text><Text style={styles.cardCopy}>{request ? `${request.diningDate} ${request.diningTime} · ${request.region}` : "요청 정보"}</Text></Card>
      {offer.status === "selected" ? <InlineMessage message="고객이 이 오퍼를 선택해 예약이 확정되었습니다." tone="success" /> : offer.status === "pending" ? <InlineMessage message="고객의 선택을 기다리고 있습니다." /> : <InlineMessage message="선택이 종료된 오퍼입니다." />}
      <Card><InfoRow label="식당" value={offer.restaurantName} /><InfoRow label="제안 가격" value={`1인 ${money(offer.pricePerPerson)}`} /><InfoRow label="예약 시간" value={offer.availableTime} /><InfoRow label="메뉴" value={offer.menuDescription} /><InfoRow label="서비스" value={offer.serviceDescription || "없음"} /><InfoRow label="좌석" value={offer.seatDescription || "별도 안내 없음"} /><InfoRow label="코멘트" value={offer.ownerComment || "없음"} last /></Card>
      <Button label="목록으로" onPress={onBack} variant="secondary" />
    </Page>
  );
}

export function MyRestaurantsScreen({ restaurants, onNavigate, onEdit, onDelete }: { restaurants: Restaurant[]; onNavigate: Navigate; onEdit: (restaurant: Restaurant) => void; onDelete: (restaurant: Restaurant) => void | Promise<void> }) {
  const [candidate, setCandidate] = useState<Restaurant | null>(null); const [message, setMessage] = useState("");
  const remove = async () => { if (!candidate) return; const item = candidate; setCandidate(null); try { await onDelete(item); setMessage("식당을 삭제했습니다."); } catch (error) { setMessage(error instanceof Error ? error.message : "식당을 삭제하지 못했습니다."); } };
  return (
    <Page eyebrow="MY RESTAURANTS" title="내 식당 관리" subtitle="식당 정보와 승인 상태를 관리하세요.">
      <Metrics items={[{ label: "전체 식당", value: restaurants.length }, { label: "승인", value: restaurants.filter((item) => item.status === "approved").length, accent: true }, { label: "검토 중", value: restaurants.filter((item) => item.status === "pending").length }]} />
      {message ? <InlineMessage message={message} tone={message.includes("못") ? "error" : "success"} /> : null}
      <Button label="새 식당 등록" onPress={() => onNavigate("restaurantRegister")} />
      {restaurants.length === 0 ? <EmptyState actionLabel="식당 등록" onAction={() => onNavigate("restaurantRegister")} title="등록한 식당이 없습니다" /> : restaurants.map((restaurant) => <View key={restaurant.id} style={styles.restaurantCard}><View style={[styles.restaurantVisual, { backgroundColor: restaurant.visualColor }]}><Badge label={restaurant.status === "approved" ? "승인됨" : restaurant.status === "pending" ? "검토 중" : "운영 중지"} tone={tone(restaurant.status)} /><Text style={styles.restaurantVisualName}>{restaurant.name}</Text></View><View style={styles.restaurantBody}><Text style={styles.restaurantCategory}>{restaurant.category}</Text><Text style={styles.cardTitle}>{restaurant.name}</Text><Text style={styles.cardCopy}>{restaurant.address}</Text><ChipGroup>{restaurant.facilities.slice(0, 3).map((facility) => <Chip key={facility} label={facility} />)}</ChipGroup><View style={styles.twoButtons}><View style={styles.grow}><Button label="수정" onPress={() => onEdit(restaurant)} variant="secondary" /></View><View style={styles.grow}><Button label="삭제" onPress={() => setCandidate(restaurant)} variant="danger" /></View></View></View></View>)}
      <ConfirmModal confirmLabel="삭제" description={candidate ? `${candidate.name} 정보를 삭제합니다. 이 작업은 API 연동 후 복구할 수 없습니다.` : ""} destructive onCancel={() => setCandidate(null)} onConfirm={() => void remove()} title="식당을 삭제할까요?" visible={Boolean(candidate)} />
    </Page>
  );
}

export function RestaurantFormScreen({ restaurant, onBack, onSubmit }: { restaurant: Restaurant | null; onBack: () => void; onSubmit: (draft: RestaurantDraft, restaurant?: Restaurant) => void | Promise<void> }) {
  const [name, setName] = useState(restaurant?.name || ""); const [category, setCategory] = useState(restaurant?.category || ""); const [address, setAddress] = useState(restaurant?.address || ""); const [phone, setPhone] = useState(restaurant?.phone || ""); const [hours, setHours] = useState(restaurant?.businessHours || ""); const [capacity, setCapacity] = useState(restaurant?.maxCapacity || 20); const [description, setDescription] = useState(restaurant?.description || ""); const [facilities, setFacilities] = useState<string[]>(restaurant?.facilities || []); const [imageUris, setImageUris] = useState<string[]>(restaurant?.imageUris || []); const [imageUri, setImageUri] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({}); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState("");
  const toggleFacility = (facility: string) => setFacilities((current) => current.includes(facility) ? current.filter((item) => item !== facility) : [...current, facility]);
  const addImage = () => { const uri = imageUri.trim(); if (!uri || imageUris.includes(uri)) return; setImageUris((current) => [...current, uri]); setImageUri(""); };
  const submit = async () => { const next: Record<string, string> = {}; if (!name.trim()) next.name = "식당 이름을 입력해주세요."; if (!category.trim()) next.category = "업종을 입력해주세요."; if (!address.trim()) next.address = "주소를 입력해주세요."; if (!phone.trim()) next.phone = "전화번호를 입력해주세요."; if (!hours.trim()) next.hours = "영업시간을 입력해주세요."; if (!description.trim()) next.description = "식당 소개를 입력해주세요."; setErrors(next); if (Object.keys(next).length) return; setSubmitting(true); try { await onSubmit({ name: name.trim(), category: category.trim(), address: address.trim(), phone: phone.trim(), businessHours: hours.trim(), maxCapacity: capacity, description: description.trim(), facilities, imageUris }, restaurant || undefined); } catch (error) { setMessage(error instanceof Error ? error.message : "식당 정보를 저장하지 못했습니다."); } finally { setSubmitting(false); } };
  return (
    <Page back={onBack} eyebrow="RESTAURANT PROFILE" title={restaurant ? "식당 정보 수정" : "식당 등록"} subtitle="고객이 예약 전에 확인할 정보를 입력해주세요.">
      <Field error={errors.name} label="식당 이름" onChangeText={setName} placeholder="식당 이름을 입력해주세요" value={name} />
      <Field error={errors.category} label="업종" onChangeText={setCategory} placeholder="한식 · 고기" value={category} />
      <Field error={errors.address} label="주소" onChangeText={setAddress} placeholder="도로명 주소" value={address} />
      <Field error={errors.phone} keyboardType="phone-pad" label="전화번호" onChangeText={setPhone} placeholder="02-000-0000" value={phone} />
      <Field error={errors.hours} label="영업시간" onChangeText={setHours} placeholder="11:30 – 23:00" value={hours} />
      <Text style={styles.fieldTitle}>최대 수용 인원</Text><Counter min={2} max={500} onChange={setCapacity} value={capacity} />
      <Text style={styles.fieldTitle}>편의시설</Text><ChipGroup>{["프라이빗 룸", "주차 가능", "단체석", "대관 가능", "콜키지", "프로젝터"].map((facility) => <Chip key={facility} label={facility} onPress={() => toggleFacility(facility)} selected={facilities.includes(facility)} />)}</ChipGroup>
      <Field error={errors.description} label="식당 소개" multiline onChangeText={setDescription} placeholder="식당의 특징과 단체 예약 장점을 소개해주세요." value={description} />
      <SectionHeader title="사진" /><Text style={styles.helpText}>사진 선택기/API 연결 전에도 레이아웃을 확인할 수 있도록 URI를 추가할 수 있습니다.</Text><View style={styles.imageInput}><View style={styles.grow}><Field label="이미지 URI" onChangeText={setImageUri} placeholder="https://... 또는 file://..." value={imageUri} /></View><Button compact label="추가" onPress={addImage} variant="secondary" /></View>
      {imageUris.length ? imageUris.map((uri, index) => <View key={`${uri}-${index}`} style={styles.imageRow}><View style={styles.imagePlaceholder}><Text style={styles.imageNumber}>{index + 1}</Text></View><Text numberOfLines={1} style={styles.imageUri}>{uri}</Text><TouchableOpacity onPress={() => setImageUris((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Text style={styles.remove}>삭제</Text></TouchableOpacity></View>) : <EmptyState description="대표 사진과 메뉴 사진을 추가할 수 있어요." title="등록된 사진이 없습니다" />}
      {message ? <InlineMessage message={message} tone="error" /> : null}<Button label={restaurant ? "변경사항 저장" : "등록 신청하기"} loading={submitting} onPress={() => void submit()} />
    </Page>
  );
}

export function OwnerReservationsScreen({ reservations, restaurants, onConfirm, onReject }: { reservations: Reservation[]; restaurants: Restaurant[]; onConfirm: (reservation: Reservation) => void | Promise<void>; onReject: (reservation: Reservation) => void | Promise<void> }) {
  const restaurantIds = new Set(restaurants.map((restaurant) => restaurant.id));
  const mine = reservations.filter((reservation) => restaurantIds.has(reservation.restaurantId));
  const [tab, setTab] = useState<"pending" | "confirmed" | "history">("pending"); const [candidate, setCandidate] = useState<{ item: Reservation; action: "confirm" | "reject" } | null>(null); const [message, setMessage] = useState(""); const [processing, setProcessing] = useState(false);
  const filtered = mine.filter((reservation) => tab === "pending" ? reservation.status === "pending" : tab === "confirmed" ? reservation.status === "confirmed" : ["completed", "canceled", "rejected"].includes(reservation.status));
  const process = async () => { if (!candidate) return; const { item, action } = candidate; setCandidate(null); setProcessing(true); setMessage(""); try { if (action === "confirm") { await onConfirm(item); setMessage("예약을 확정했습니다."); } else { await onReject(item); setMessage("예약을 거절했습니다."); } } catch (error) { setMessage(error instanceof Error ? error.message : "예약 상태를 변경하지 못했습니다."); } finally { setProcessing(false); } };
  return (
    <Page eyebrow="OWNER RESERVATIONS" title="예약 관리" subtitle="내 식당에 접수된 예약을 확정하거나 거절하세요.">
      <Metrics items={[{ label: "승인 대기", value: mine.filter((item) => item.status === "pending").length, accent: true }, { label: "확정", value: mine.filter((item) => item.status === "confirmed").length }, { label: "전체", value: mine.length }]} />
      <Tabs items={[{ label: "승인 대기", value: "pending", count: mine.filter((item) => item.status === "pending").length }, { label: "예약 확정", value: "confirmed", count: mine.filter((item) => item.status === "confirmed").length }, { label: "지난 예약", value: "history" }]} onChange={setTab} value={tab} />
      {message ? <InlineMessage message={message} tone={message.includes("못") ? "error" : "success"} /> : null}
      {filtered.length === 0 ? <EmptyState description="새 예약이 들어오면 이곳에 표시됩니다." title="이 상태의 예약이 없습니다" /> : filtered.map((reservation) => <Card key={reservation.id}><View style={styles.between}><Badge label={reservationLabel(reservation.status)} tone={tone(reservation.status)} /><Text style={styles.hint}>{reservation.source === "offer" ? "맞춤 오퍼" : "일반 예약"}</Text></View><Text style={styles.cardTitle}>{reservation.restaurantName}</Text><View style={styles.reservationCustomer}><View style={styles.customerAvatar}><Text style={styles.customerAvatarText}>{reservation.userName.slice(0, 1)}</Text></View><View style={styles.grow}><Text style={styles.customerName}>{reservation.userName}</Text><Text style={styles.cardCopy}>{reservation.userPhone}</Text></View></View><Card style={styles.innerCard}><InfoRow label="일정" value={`${reservation.reservationDate} ${reservation.reservationTime}`} /><InfoRow label="인원" value={`${reservation.headCount}명`} /><InfoRow label="요청사항" value={reservation.requestMemo || "없음"} last /></Card>{reservation.status === "pending" ? <View style={styles.twoButtons}><View style={styles.grow}><Button disabled={processing} label="예약 거절" onPress={() => setCandidate({ item: reservation, action: "reject" })} variant="danger" /></View><View style={styles.grow}><Button disabled={processing} label="예약 확정" onPress={() => setCandidate({ item: reservation, action: "confirm" })} /></View></View> : null}</Card>)}
      <ConfirmModal confirmLabel={candidate?.action === "confirm" ? "예약 확정" : "예약 거절"} description={candidate ? `${candidate.item.userName}님의 ${candidate.item.reservationDate} ${candidate.item.reservationTime}, ${candidate.item.headCount}명 예약을 ${candidate.action === "confirm" ? "확정" : "거절"}합니다.` : ""} destructive={candidate?.action === "reject"} onCancel={() => setCandidate(null)} onConfirm={() => void process()} title={candidate?.action === "confirm" ? "예약을 확정할까요?" : "예약을 거절할까요?"} visible={Boolean(candidate)} />
    </Page>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  metrics: { flexDirection: "row", gap: 8 },
  metric: { flex: 1, padding: 14, gap: 5, borderRadius: radius.md, backgroundColor: colors.surfaceLow },
  metricAccent: { backgroundColor: colors.coralSoft },
  metricValue: { color: colors.primary, fontSize: 20, fontWeight: "900" },
  metricValueAccent: { color: colors.danger },
  metricLabel: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  notice: { padding: 15, flexDirection: "row", alignItems: "center", gap: 11, borderRadius: radius.md, backgroundColor: colors.primary },
  noticeIcon: { width: 30, height: 30, paddingTop: 5, overflow: "hidden", color: colors.primary, textAlign: "center", fontWeight: "900", borderRadius: 15, backgroundColor: colors.coral },
  noticeTitle: { color: colors.surface, fontSize: 13, fontWeight: "900" },
  noticeCopy: { marginTop: 2, color: "#C8D8D1", fontSize: 10 },
  chevron: { color: colors.muted, fontSize: 23 },
  hint: { color: colors.muted, fontSize: 10 },
  cardTitle: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: "900" },
  cardCopy: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  cardMeta: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  scheduleDate: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  scheduleTime: { marginTop: 2, color: colors.coral, fontSize: 15, fontWeight: "900" },
  darkCard: { borderColor: colors.primary, backgroundColor: colors.primary },
  darkHint: { color: "#C8D8D1", fontSize: 10 },
  requestGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: { width: "47%", gap: 3 },
  statLabel: { color: colors.muted, fontSize: 10 },
  statLabelDark: { color: "#AFC6BC" },
  statValue: { color: colors.text, fontSize: 13, fontWeight: "900" },
  statValueDark: { color: colors.surface },
  longCopy: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  fieldTitle: { color: colors.text, fontSize: 13, fontWeight: "800" },
  errorText: { color: colors.danger, fontSize: 11 },
  offerMenu: { flex: 1, color: colors.primary, fontSize: 12, fontWeight: "700" },
  price: { color: colors.danger, fontSize: 16, fontWeight: "900" },
  restaurantCard: { overflow: "hidden", borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  restaurantVisual: { height: 118, padding: 13, justifyContent: "space-between" },
  restaurantVisualName: { color: colors.surface, fontSize: 21, fontWeight: "900" },
  restaurantBody: { padding: 15, gap: 8 },
  restaurantCategory: { color: colors.coral, fontSize: 10, fontWeight: "900" },
  twoButtons: { flexDirection: "row", gap: 8 },
  helpText: { marginTop: -8, color: colors.muted, fontSize: 11, lineHeight: 17 },
  imageInput: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  imageRow: { padding: 10, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  imagePlaceholder: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  imageNumber: { color: colors.primary, fontSize: 14, fontWeight: "900" },
  imageUri: { flex: 1, color: colors.muted, fontSize: 10 },
  remove: { color: colors.danger, fontSize: 11, fontWeight: "900", padding: 5 },
  reservationCustomer: { flexDirection: "row", alignItems: "center", gap: 10 },
  customerAvatar: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: colors.primarySoft },
  customerAvatarText: { color: colors.primary, fontSize: 15, fontWeight: "900" },
  customerName: { color: colors.text, fontSize: 13, fontWeight: "900" },
  innerCard: { backgroundColor: colors.surfaceLow },
});
