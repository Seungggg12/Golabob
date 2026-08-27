import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme";
import { AppScreen, Navigate, Role } from "../types";

const userItems: Array<{ icon: string; label: string; screen: AppScreen }> = [
  { icon: "⌂", label: "홈", screen: "userHome" },
  { icon: "＋", label: "요청", screen: "createRequest" },
  { icon: "⌕", label: "식당", screen: "restaurantList" },
  { icon: "▣", label: "내 예약", screen: "myReservation" },
  { icon: "●", label: "마이", screen: "myPage" },
];

const ownerItems: Array<{ icon: string; label: string; screen: AppScreen }> = [
  { icon: "⌂", label: "홈", screen: "ownerHome" },
  { icon: "◎", label: "요청", screen: "ownerHome" },
  { icon: "◇", label: "오퍼", screen: "ownerOffers" },
  { icon: "▣", label: "예약", screen: "ownerReservations" },
  { icon: "●", label: "마이", screen: "myPage" },
];

export function BottomNav({ role, active, onNavigate }: { role: Role; active: AppScreen; onNavigate: Navigate }) {
  const items = role === "owner" ? ownerItems : userItems;

  return (
    <View accessibilityRole="tablist" style={styles.nav}>
      {items.map((item) => {
        const selected = active === item.screen || (item.label === "요청" && active === "ownerRequestDetail");
        return (
          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={`${item.label}-${item.screen}`}
            onPress={() => onNavigate(item.screen)}
            style={styles.item}
          >
            <Text style={[styles.icon, selected && styles.active]}>{item.icon}</Text>
            <Text style={[styles.label, selected && styles.active]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    minHeight: 70,
    paddingTop: 7,
    paddingBottom: 4,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  icon: { color: "#8E9893", fontSize: 20, fontWeight: "900" },
  label: { color: "#8E9893", fontSize: 10, fontWeight: "700" },
  active: { color: colors.primary },
});
