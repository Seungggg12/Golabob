import { ReactNode, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors, radius, spacing } from "../theme";

export function Page({
  title,
  eyebrow,
  subtitle,
  back,
  right,
  children,
  scroll = true,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  back?: () => void;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
}) {
  const content = (
    <View style={styles.pageContent}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.page}
    >
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={back ? "뒤로 가기" : "골라밥 홈"}
          disabled={!back}
          onPress={back}
          style={styles.headerSide}
        >
          <Text style={styles.headerIcon}>{back ? "‹" : "●"}</Text>
        </TouchableOpacity>
        <Text style={styles.brand}>골라밥</Text>
        <View style={[styles.headerSide, styles.headerRight]}>{right}</View>
      </View>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </KeyboardAvoidingView>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity disabled={!onAction} onPress={onAction}>
          <Text style={[styles.sectionAction, !onAction && styles.disabledText]}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        styles[`button_${variant}`],
        compact && styles.buttonCompact,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.buttonLabel, styles[`buttonLabel_${variant}`]]}>
        {loading ? "처리 중..." : label}
      </Text>
    </TouchableOpacity>
  );
}

export function Field({
  label,
  error,
  multiline,
  containerStyle,
  ...inputProps
}: TextInputProps & {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        placeholderTextColor="#98A29C"
        style={[
          styles.input,
          multiline && styles.textarea,
          focused && styles.inputFocused,
          Boolean(error) && styles.inputError,
          inputProps.style,
        ]}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "accent" | "success" | "danger" | "muted" }) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      <Text style={[styles.badgeLabel, styles[`badgeLabel_${tone}`]]}>{label}</Text>
    </View>
  );
}

export function Chip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ChipGroup({ children }: { children: ReactNode }) {
  return <View style={styles.chipGroup}>{children}</View>;
}

export function Counter({ value, onChange, min = 1, max = 100 }: { value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  return (
    <View style={styles.counter}>
      <TouchableOpacity disabled={value <= min} onPress={() => onChange(Math.max(min, value - 1))} style={styles.counterButton}>
        <Text style={styles.counterButtonLabel}>−</Text>
      </TouchableOpacity>
      <View style={styles.counterValueWrap}>
        <Text style={styles.counterValue}>{value}</Text>
        <Text style={styles.counterUnit}>명</Text>
      </View>
      <TouchableOpacity disabled={value >= max} onPress={() => onChange(Math.min(max, value + 1))} style={styles.counterButton}>
        <Text style={styles.counterButtonLabel}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

export function Tabs<T extends string>({ items, value, onChange }: { items: Array<{ label: string; value: T; count?: number }>; value: T; onChange: (value: T) => void }) {
  return (
    <View style={styles.tabs}>
      {items.map((item) => (
        <TouchableOpacity key={item.value} onPress={() => onChange(item.value)} style={[styles.tab, value === item.value && styles.tabActive]}>
          <Text style={[styles.tabLabel, value === item.value && styles.tabLabelActive]}>
            {item.label}{item.count === undefined ? "" : ` ${item.count}`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function InlineMessage({ message, tone = "info" }: { message: string; tone?: "info" | "error" | "success" }) {
  return (
    <View style={[styles.message, styles[`message_${tone}`]]}>
      <Text style={[styles.messageText, styles[`messageText_${tone}`]]}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>○</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyDescription}>{description}</Text> : null}
      {actionLabel && onAction ? <Button compact label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

export function ConfirmModal({
  visible,
  title,
  description,
  confirmLabel = "확인",
  destructive = false,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <Pressable onPress={onCancel} style={styles.modalBackdrop}>
        <Pressable onPress={() => undefined} style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalDescription}>{description}</Text>
          <View style={styles.modalActions}>
            <View style={styles.modalAction}><Button label="아니요" onPress={onCancel} variant="secondary" /></View>
            <View style={styles.modalAction}><Button label={confirmLabel} onPress={onConfirm} variant={destructive ? "danger" : "primary"} /></View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function MenuRow({ icon, title, description, onPress, danger = false }: { icon: string; title: string; description?: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuRow}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}><Text style={styles.menuIconText}>{icon}</Text></View>
      <View style={styles.menuBody}>
        <Text style={[styles.menuTitle, danger && styles.dangerText]}>{title}</Text>
        {description ? <Text style={styles.menuDescription}>{description}</Text> : null}
      </View>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { height: 56, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.background },
  headerSide: { width: 72, minHeight: 44, justifyContent: "center" },
  headerRight: { alignItems: "flex-end" },
  headerIcon: { color: colors.primary, fontSize: 30, fontWeight: "900" },
  brand: { flex: 1, color: colors.primary, textAlign: "center", fontSize: 19, fontWeight: "900" },
  scrollContent: { paddingBottom: 112 },
  pageContent: { padding: spacing.xl, gap: spacing.md },
  eyebrow: { color: colors.coral, fontSize: 11, fontWeight: "900", letterSpacing: 1.3, marginTop: spacing.xs },
  pageTitle: { color: colors.primary, fontSize: 28, lineHeight: 36, fontWeight: "900" },
  pageSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: spacing.xs },
  sectionHeader: { marginTop: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "900" },
  sectionAction: { color: colors.primary, fontSize: 12, fontWeight: "800", paddingVertical: spacing.sm },
  disabledText: { color: colors.disabled },
  card: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  button: { minHeight: 50, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  buttonCompact: { minHeight: 42, alignSelf: "flex-start" },
  button_primary: { backgroundColor: colors.primary },
  button_secondary: { backgroundColor: colors.surfaceLow, borderWidth: 1, borderColor: colors.line },
  button_danger: { backgroundColor: colors.danger },
  button_ghost: { backgroundColor: "transparent" },
  buttonDisabled: { opacity: 0.45 },
  buttonLabel: { fontSize: 14, fontWeight: "900" },
  buttonLabel_primary: { color: colors.surface },
  buttonLabel_secondary: { color: colors.primary },
  buttonLabel_danger: { color: colors.surface },
  buttonLabel_ghost: { color: colors.primary },
  field: { gap: 7 },
  fieldLabel: { color: colors.text, fontSize: 13, fontWeight: "800" },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.surface, color: colors.text, fontSize: 14 },
  textarea: { minHeight: 104, paddingTop: 14 },
  inputFocused: { borderColor: colors.primary, borderWidth: 1.5 },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 11, lineHeight: 16 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill },
  badge_default: { backgroundColor: colors.primarySoft },
  badge_accent: { backgroundColor: colors.coralSoft },
  badge_success: { backgroundColor: colors.successSoft },
  badge_danger: { backgroundColor: colors.dangerSoft },
  badge_muted: { backgroundColor: colors.surfaceLow },
  badgeLabel: { fontSize: 11, fontWeight: "900" },
  badgeLabel_default: { color: colors.primary },
  badgeLabel_accent: { color: colors.danger },
  badgeLabel_success: { color: colors.success },
  badgeLabel_danger: { color: colors.danger },
  badgeLabel_muted: { color: colors.muted },
  chip: { minHeight: 38, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipLabel: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  chipLabelSelected: { color: colors.surface },
  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  counter: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xl, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceLow },
  counterButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  counterButtonLabel: { color: colors.primary, fontSize: 22, fontWeight: "800" },
  counterValueWrap: { minWidth: 78, flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: spacing.xs },
  counterValue: { color: colors.primary, fontSize: 26, fontWeight: "900" },
  counterUnit: { color: colors.muted, fontSize: 13 },
  tabs: { padding: 4, flexDirection: "row", borderRadius: radius.md, backgroundColor: colors.surfaceLow },
  tab: { flex: 1, minHeight: 42, paddingHorizontal: spacing.xs, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surface },
  tabLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  tabLabelActive: { color: colors.primary, fontWeight: "900" },
  infoRow: { minHeight: 44, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.line },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { width: 98, color: colors.muted, fontSize: 12 },
  infoValue: { flex: 1, color: colors.text, textAlign: "right", fontSize: 13, lineHeight: 19, fontWeight: "800" },
  message: { padding: spacing.md, borderRadius: radius.sm },
  message_info: { backgroundColor: colors.primarySoft },
  message_error: { backgroundColor: colors.dangerSoft },
  message_success: { backgroundColor: colors.successSoft },
  messageText: { fontSize: 12, lineHeight: 18, fontWeight: "700" },
  messageText_info: { color: colors.primary },
  messageText_error: { color: colors.danger },
  messageText_success: { color: colors.success },
  empty: { paddingVertical: 34, paddingHorizontal: spacing.xl, alignItems: "center", gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.line, backgroundColor: colors.surface },
  emptyIcon: { color: colors.coral, fontSize: 42, fontWeight: "300" },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "900", textAlign: "center" },
  emptyDescription: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: "center" },
  modalBackdrop: { flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center", backgroundColor: colors.overlay },
  modalCard: { width: "100%", padding: spacing.xl, gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  modalDescription: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  modalActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { flex: 1 },
  menuRow: { minHeight: 68, paddingVertical: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  menuIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: colors.surfaceLow },
  menuIconDanger: { backgroundColor: colors.dangerSoft },
  menuIconText: { fontSize: 17 },
  menuBody: { flex: 1, gap: 3 },
  menuTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  menuDescription: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  menuChevron: { color: colors.muted, fontSize: 22 },
  dangerText: { color: colors.danger },
});
