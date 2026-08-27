import { StyleSheet } from "react-native";

export const colors = {
  background: "#F6FAF8",
  surface: "#FFFFFF",
  surfaceLow: "#EEF4F1",
  primary: "#073B2A",
  primarySoft: "#DCEBE4",
  coral: "#F4775C",
  coralSoft: "#FFE4DC",
  gold: "#D3A933",
  text: "#18201D",
  muted: "#68736E",
  line: "#D8E1DC",
  danger: "#B44732",
  dangerSoft: "#FBE7E2",
  success: "#267254",
  successSoft: "#DFF1E8",
  disabled: "#AAB3AE",
  overlay: "rgba(7, 36, 27, 0.45)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const sharedStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  grow: { flex: 1 },
  title: { color: colors.primary, fontSize: 28, lineHeight: 36, fontWeight: "900" },
  sectionTitle: { color: colors.text, fontSize: 19, lineHeight: 25, fontWeight: "900" },
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  eyebrow: { color: colors.coral, fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
});
