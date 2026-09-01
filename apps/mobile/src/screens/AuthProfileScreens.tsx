import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { ApiRequestError } from "../api";
import { Badge, Button, Card, ConfirmModal, Field, InfoRow, InlineMessage, MenuRow, Page } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { Navigate, Role, UserProfile } from "../types";

export function SplashScreen({ onStart, onLogin, onSignup }: { onStart: () => void; onLogin: () => void; onSignup: () => void }) {
  return (
    <View style={styles.splash}>
      <View style={styles.splashBrand}><Text style={styles.splashLogo}>●</Text><Text style={styles.splashBrandText}>골라밥</Text></View>
      <View style={styles.heroCard}>
        <Badge label="맞춤 오퍼 도착" tone="accent" />
        <View style={styles.heroVisual}><Text style={styles.heroVisualIcon}>♨</Text></View>
        <Text style={styles.heroRestaurant}>강남 화로정</Text>
        <Text style={styles.heroMenu}>한우 모둠 회식 세트</Text>
        <View style={styles.divider} />
        <View style={styles.between}><Text style={styles.heroMeta}>프라이빗 룸 · 음료 제공</Text><Text style={styles.heroPrice}>52,000원</Text></View>
      </View>
      <View style={styles.splashCopy}>
        <Text style={styles.splashTitle}>회식 장소 고민은{`\n`}식당에게 맡기세요</Text>
        <Text style={styles.splashDescription}>조건을 등록하면 식당들이 가격과 메뉴를 먼저 제안해요.</Text>
      </View>
      <View style={styles.splashActions}>
        <Button label="시작하기" onPress={onStart} />
        <View style={styles.inlineActions}>
          <TouchableOpacity onPress={onLogin}><Text style={styles.inlineLink}>로그인</Text></TouchableOpacity>
          <Text style={styles.inlineSeparator}>·</Text>
          <TouchableOpacity onPress={onSignup}><Text style={styles.inlineLink}>회원가입</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

type LoginValues = { email: string; password: string; rememberLogin: boolean };

export function LoginScreen({ notice = "", onBack, onSignup, onSubmit }: { notice?: string; onBack: () => void; onSignup: () => void; onSubmit: (values: LoginValues) => void | Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberLogin, setRememberLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setMessage(notice); }, [notice]);

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "이메일 형식을 확인해주세요.";
    if (password.length < 8) nextErrors.password = "비밀번호는 8자 이상 입력해주세요.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    setMessage("");
    try {
      await onSubmit({ email: email.trim(), password, rememberLogin });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        setErrors((current) => ({ ...current, password: error.message }));
        setMessage("입력한 정보를 다시 확인해주세요.");
      } else {
        setMessage(error instanceof Error ? error.message : "로그인하지 못했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page back={onBack} eyebrow="WELCOME BACK" title="다시 만나 반가워요" subtitle="가입한 계정으로 로그인해주세요.">
      <Field autoCapitalize="none" autoComplete="email" error={errors.email} keyboardType="email-address" label="이메일" onChangeText={(value) => { setEmail(value); setMessage(""); setErrors((current) => ({ ...current, email: "" })); }} placeholder="name@example.com" value={email} />
      <Field autoCapitalize="none" error={errors.password} label="비밀번호" onChangeText={(value) => { setPassword(value); setMessage(""); setErrors((current) => ({ ...current, password: "" })); }} onSubmitEditing={() => void submit()} placeholder="8자 이상 입력해주세요" secureTextEntry={!showPassword} value={password} />
      <View style={styles.authOptions}>
        <TouchableOpacity onPress={() => setRememberLogin((current) => !current)} style={styles.checkRow}>
          <View style={[styles.checkbox, rememberLogin && styles.checkboxSelected]}><Text style={styles.checkmark}>{rememberLogin ? "✓" : ""}</Text></View>
          <Text style={styles.checkLabel}>로그인 유지</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowPassword((current) => !current)}><Text style={styles.smallLink}>{showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}</Text></TouchableOpacity>
      </View>
      {message ? <InlineMessage message={message} tone="error" /> : null}
      <Button disabled={submitting} label="로그인" loading={submitting} onPress={() => void submit()} />
      <View style={styles.accountPrompt}><Text style={styles.accountPromptText}>처음이신가요?</Text><TouchableOpacity onPress={onSignup}><Text style={styles.accountPromptLink}>회원가입</Text></TouchableOpacity></View>
    </Page>
  );
}

type SignupValues = { name: string; email: string; phone: string; password: string; marketingConsent: boolean };

export function SignupScreen({ onBack, onLogin, onSubmit }: { onBack: () => void; onLogin: () => void; onSubmit: (values: SignupValues) => void | Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [serviceTerms, setServiceTerms] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const requiredAll = serviceTerms && privacyPolicy;

  const toggleAll = () => {
    const next = !(serviceTerms && privacyPolicy && marketingConsent);
    setServiceTerms(next); setPrivacyPolicy(next); setMarketingConsent(next);
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = "이름을 2자 이상 입력해주세요.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "이메일 형식을 확인해주세요.";
    if (!/^01\d[- ]?\d{3,4}[- ]?\d{4}$/.test(phone.trim())) nextErrors.phone = "휴대전화 번호를 확인해주세요.";
    if (password.length < 8) nextErrors.password = "비밀번호는 8자 이상 입력해주세요.";
    if (password !== confirmation) nextErrors.confirmation = "비밀번호가 일치하지 않습니다.";
    if (!requiredAll) nextErrors.agreements = "필수 약관에 동의해주세요.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true); setMessage("");
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim(), password, marketingConsent });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        const field = error.message.includes("전화") ? "phone" : "email";
        setErrors((current) => ({ ...current, [field]: error.message }));
        setMessage("이미 사용 중인 정보를 확인해주세요.");
      } else {
        setMessage(error instanceof Error ? error.message : "회원가입하지 못했습니다.");
      }
    } finally { setSubmitting(false); }
  };

  return (
    <Page back={onBack} eyebrow="JOIN GOLABOB" title="회원가입" subtitle="필수 정보를 입력하고 골라밥을 시작하세요.">
      <Field error={errors.name} label="이름" onChangeText={(value) => { setName(value); setErrors((current) => ({ ...current, name: "" })); }} placeholder="이름을 입력해주세요" value={name} />
      <Field autoCapitalize="none" error={errors.email} keyboardType="email-address" label="이메일" onChangeText={(value) => { setEmail(value); setMessage(""); setErrors((current) => ({ ...current, email: "" })); }} placeholder="name@example.com" value={email} />
      <Field error={errors.phone} keyboardType="phone-pad" label="휴대전화" onChangeText={(value) => { setPhone(value); setMessage(""); setErrors((current) => ({ ...current, phone: "" })); }} placeholder="010-0000-0000" value={phone} />
      <Field error={errors.password} label="비밀번호" onChangeText={(value) => { setPassword(value); setErrors((current) => ({ ...current, password: "" })); }} placeholder="8자 이상 입력해주세요" secureTextEntry value={password} />
      <Field error={errors.confirmation} label="비밀번호 확인" onChangeText={(value) => { setConfirmation(value); setErrors((current) => ({ ...current, confirmation: "" })); }} placeholder="비밀번호를 다시 입력해주세요" secureTextEntry value={confirmation} />
      <Card>
        <AgreementRow checked={serviceTerms && privacyPolicy && marketingConsent} label="전체 동의" onPress={toggleAll} strong />
        <View style={styles.divider} />
        <AgreementRow checked={serviceTerms} label="서비스 이용약관 동의 (필수)" onPress={() => setServiceTerms((current) => !current)} />
        <AgreementRow checked={privacyPolicy} label="개인정보 수집 및 이용 동의 (필수)" onPress={() => setPrivacyPolicy((current) => !current)} />
        <AgreementRow checked={marketingConsent} label="마케팅 정보 수신 동의 (선택)" onPress={() => setMarketingConsent((current) => !current)} />
        {errors.agreements ? <Text style={styles.errorText}>{errors.agreements}</Text> : null}
      </Card>
      {message ? <InlineMessage message={message} tone="error" /> : null}
      <Button disabled={submitting} label="가입하고 시작하기" loading={submitting} onPress={() => void submit()} />
      <View style={styles.accountPrompt}><Text style={styles.accountPromptText}>이미 계정이 있나요?</Text><TouchableOpacity onPress={onLogin}><Text style={styles.accountPromptLink}>로그인</Text></TouchableOpacity></View>
    </Page>
  );
}

function AgreementRow({ checked, label, onPress, strong = false }: { checked: boolean; label: string; onPress: () => void; strong?: boolean }) {
  return <TouchableOpacity onPress={onPress} style={styles.agreementRow}><View style={[styles.checkbox, checked && styles.checkboxSelected]}><Text style={styles.checkmark}>{checked ? "✓" : ""}</Text></View><Text style={[styles.agreementLabel, strong && styles.agreementStrong]}>{label}</Text></TouchableOpacity>;
}

export function RoleSelectionScreen({ roles, selectedRole, onSelect, onContinue }: { roles: Role[]; selectedRole: Role; onSelect: (role: Role) => void; onContinue: () => void }) {
  return (
    <Page eyebrow="WELCOME TO GOLABOB" title="어떻게 이용하시나요?" subtitle="언제든 마이페이지에서 모드를 바꿀 수 있어요.">
      <RoleCard active={selectedRole === "user"} description="조건을 등록하고 식당 오퍼를 비교해요." icon="🍽" label="회식 장소를 찾고 있어요" onPress={() => onSelect("user")} />
      {roles.includes("owner") ? <RoleCard active={selectedRole === "owner"} description="회식 요청을 보고 맞춤 오퍼를 보내요." icon="👨‍🍳" label="식당을 운영하고 있어요" onPress={() => onSelect("owner")} /> : <Card><Text style={styles.roleLockedTitle}>사장님 모드는 가입 후 활성화할 수 있어요</Text><Text style={styles.roleLockedCopy}>마이페이지에서 사장님 전환을 신청하면 바로 사용할 수 있습니다.</Text></Card>}
      <Button label="선택한 모드로 시작" onPress={onContinue} />
    </Page>
  );
}

function RoleCard({ active, icon, label, description, onPress }: { active: boolean; icon: string; label: string; description: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={[styles.roleCard, active && styles.roleCardActive]}><Text style={styles.roleIcon}>{icon}</Text><View style={styles.roleBody}><Text style={styles.roleTitle}>{label}</Text><Text style={styles.roleDescription}>{description}</Text></View><View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View></TouchableOpacity>;
}

export function MyPageScreen({ user, role, onNavigate, onUpdateProfile, onActivateOwner, onSwitchRole, onLogout }: { user: UserProfile; role: Role; onNavigate: Navigate; onUpdateProfile: (profile: Pick<UserProfile, "name" | "email" | "phone">) => void | Promise<void>; onActivateOwner: () => void | Promise<void>; onSwitchRole: (role: Role) => void; onLogout: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [ownerVisible, setOwnerVisible] = useState(false);

  useEffect(() => { setName(user.name); setEmail(user.email); setPhone(user.phone); }, [user]);
  const activities = useMemo(() => role === "owner" ? [
    { icon: "▣", title: "예약 관리", description: "식당에 접수된 예약 확인", screen: "ownerReservations" as const },
    { icon: "◇", title: "보낸 오퍼", description: "오퍼 상태와 선택 결과 확인", screen: "ownerOffers" as const },
    { icon: "▤", title: "내 식당 관리", description: "식당 등록·수정·삭제", screen: "myRestaurants" as const },
  ] : [
    { icon: "▣", title: "예약 내역", description: "일반 예약과 확정된 회식 확인", screen: "myReservation" as const },
    { icon: "＋", title: "회식 요청", description: "새 요청을 등록하고 오퍼 확인", screen: "userHome" as const },
    { icon: "⌕", title: "식당 찾기", description: "승인된 식당 검색 및 예약", screen: "restaurantList" as const },
  ], [role]);

  const save = async () => {
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = "이름을 확인해주세요.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "이메일을 확인해주세요.";
    if (!/^01\d[- ]?\d{3,4}[- ]?\d{4}$/.test(phone.trim())) nextErrors.phone = "휴대전화 번호를 확인해주세요.";
    setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    setSaving(true); setMessage("");
    try { await onUpdateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() }); setEditing(false); setMessage("프로필을 저장했습니다."); }
    catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        const field = error.message.includes("전화") ? "phone" : "email";
        setErrors((current) => ({ ...current, [field]: error.message }));
      }
      setMessage(error instanceof Error ? error.message : "프로필을 저장하지 못했습니다.");
    }
    finally { setSaving(false); }
  };

  const activateOwner = async () => {
    setOwnerVisible(false); setSaving(true);
    try { await onActivateOwner(); setMessage("사장님 모드가 활성화되었습니다."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "사장님 모드를 활성화하지 못했습니다."); }
    finally { setSaving(false); }
  };

  return (
    <Page eyebrow="ACCOUNT" title="마이페이지" subtitle="내 정보와 활동을 관리하세요.">
      <View style={styles.profileCard}><View style={styles.avatar}><Text style={styles.avatarText}>{user.name.slice(0, 1)}</Text></View><View style={styles.profileBody}><Text style={styles.profileName}>{user.name}</Text><Text style={styles.profileEmail}>{user.maskedEmail || user.email}</Text></View><Badge label={role === "owner" ? "사장님" : "예약자"} tone="accent" /></View>
      {!editing ? <Card><InfoRow label="휴대전화" value={user.maskedPhone || user.phone} /><InfoRow label="계정 상태" value={user.status === "active" ? "정상" : user.status || "정상"} /><InfoRow label="이메일 인증" value={user.emailVerified ? "인증 완료" : "인증 필요"} /><InfoRow label="휴대전화 인증" value={user.phoneVerified ? "인증 완료" : "준비 중"} /><InfoRow label="가입일" value={user.joinedAt || "정보 없음"} last /><Button label="프로필 수정" onPress={() => setEditing(true)} variant="secondary" /></Card> : <Card><Field error={errors.name} label="이름" onChangeText={(value) => { setName(value); setErrors((current) => ({ ...current, name: "" })); }} value={name} /><Field autoCapitalize="none" error={errors.email} keyboardType="email-address" label="이메일" onChangeText={(value) => { setEmail(value); setErrors((current) => ({ ...current, email: "" })); }} value={email} /><Field error={errors.phone} keyboardType="phone-pad" label="휴대전화" onChangeText={(value) => { setPhone(value); setErrors((current) => ({ ...current, phone: "" })); }} value={phone} /><View style={styles.twoButtons}><View style={styles.flex}><Button label="취소" onPress={() => { setEditing(false); setName(user.name); setEmail(user.email); setPhone(user.phone); setErrors({}); }} variant="secondary" /></View><View style={styles.flex}><Button label="저장" loading={saving} onPress={() => void save()} /></View></View></Card>}
      {message ? <InlineMessage message={message} tone={message.includes("못") ? "error" : "success"} /> : null}
      <View style={styles.modeCard}><View style={styles.modeText}><Text style={styles.modeTitle}>현재 {role === "owner" ? "사장님" : "예약자"} 모드</Text><Text style={styles.modeDescription}>{user.roles.includes(role === "owner" ? "user" : "owner") ? "다른 모드로 바로 전환할 수 있어요." : "사장님 모드를 활성화하면 오퍼를 보낼 수 있어요."}</Text></View>{user.roles.includes("owner") ? <Button compact label={role === "owner" ? "예약자 모드" : "사장님 모드"} onPress={() => onSwitchRole(role === "owner" ? "user" : "owner")} variant="secondary" /> : <Button compact label="사장님 전환" onPress={() => setOwnerVisible(true)} variant="secondary" />}</View>
      <Text style={styles.activityTitle}>내 활동</Text>
      <Card>{activities.map((item) => <MenuRow description={item.description} icon={item.icon} key={item.title} onPress={() => onNavigate(item.screen)} title={item.title} />)}</Card>
      <Button label="로그아웃" onPress={() => setLogoutVisible(true)} variant="ghost" />
      <ConfirmModal confirmLabel="로그아웃" description="현재 계정에서 로그아웃하시겠습니까?" onCancel={() => setLogoutVisible(false)} onConfirm={() => { setLogoutVisible(false); onLogout(); }} title="로그아웃" visible={logoutVisible} />
      <ConfirmModal confirmLabel="활성화" description="사장님 모드를 즉시 추가합니다. 이후 식당을 등록하고 회식 오퍼를 보낼 수 있어요." onCancel={() => setOwnerVisible(false)} onConfirm={() => void activateOwner()} title="사장님 모드를 활성화할까요?" visible={ownerVisible} />
    </Page>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, padding: 24, paddingTop: 44, paddingBottom: 28, justifyContent: "space-between", backgroundColor: colors.background },
  splashBrand: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  splashLogo: { color: colors.coral, fontSize: 18 },
  splashBrandText: { color: colors.primary, fontSize: 22, fontWeight: "900" },
  heroCard: { marginHorizontal: 14, padding: 20, gap: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, shadowColor: colors.primary, shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  heroVisual: { height: 105, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: "#C9A98E" },
  heroVisualIcon: { color: "rgba(255,255,255,0.8)", fontSize: 42 },
  heroRestaurant: { color: colors.primary, fontSize: 21, fontWeight: "900" },
  heroMenu: { color: colors.muted, fontSize: 13 },
  heroMeta: { flex: 1, color: colors.muted, fontSize: 11 },
  heroPrice: { color: colors.danger, fontSize: 17, fontWeight: "900" },
  divider: { height: 1, backgroundColor: colors.line },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  splashCopy: { alignItems: "center", gap: 12 },
  splashTitle: { color: colors.primary, textAlign: "center", fontSize: 30, lineHeight: 39, fontWeight: "900" },
  splashDescription: { maxWidth: 290, color: colors.muted, textAlign: "center", fontSize: 14, lineHeight: 21 },
  splashActions: { gap: 10 },
  inlineActions: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  inlineLink: { color: colors.primary, fontSize: 12, fontWeight: "800", padding: 5 },
  inlineSeparator: { color: colors.disabled },
  authOptions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: { width: 22, height: 22, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.surface },
  checkboxSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkmark: { color: colors.surface, fontSize: 13, fontWeight: "900" },
  checkLabel: { color: colors.text, fontSize: 12, fontWeight: "700" },
  smallLink: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  accountPrompt: { flexDirection: "row", justifyContent: "center", gap: 7, padding: 8 },
  accountPromptText: { color: colors.muted, fontSize: 13 },
  accountPromptLink: { color: colors.primary, fontSize: 13, fontWeight: "900" },
  agreementRow: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 10 },
  agreementLabel: { flex: 1, color: colors.muted, fontSize: 12 },
  agreementStrong: { color: colors.text, fontWeight: "900" },
  errorText: { color: colors.danger, fontSize: 11 },
  roleCard: { padding: 18, flexDirection: "row", alignItems: "center", gap: 13, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  roleCardActive: { borderWidth: 2, borderColor: colors.primary, backgroundColor: "#F1F8F4" },
  roleIcon: { fontSize: 29 },
  roleBody: { flex: 1, gap: 4 },
  roleTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  roleDescription: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  radio: { width: 22, height: 22, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 1, borderColor: colors.line },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  roleLockedTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
  roleLockedCopy: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  profileCard: { padding: 16, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  avatar: { width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 27, backgroundColor: colors.primary },
  avatarText: { color: colors.surface, fontSize: 21, fontWeight: "900" },
  profileBody: { flex: 1, gap: 3 },
  profileName: { color: colors.text, fontSize: 18, fontWeight: "900" },
  profileEmail: { color: colors.muted, fontSize: 12 },
  twoButtons: { flexDirection: "row", gap: 8 },
  flex: { flex: 1 },
  modeCard: { padding: 16, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  modeText: { flex: 1, gap: 3 },
  modeTitle: { color: colors.primary, fontSize: 14, fontWeight: "900" },
  modeDescription: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  activityTitle: { marginTop: 6, color: colors.text, fontSize: 18, fontWeight: "900" },
});
