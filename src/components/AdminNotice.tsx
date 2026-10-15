import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

interface AdminNoticeProps {
  message: string;
}

export function AdminNotice({ message }: AdminNoticeProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.notice,
        {
          backgroundColor: colors.warningBg,
          borderColor: colors.warning,
        },
      ]}
    >
      <Ionicons
        name="shield-checkmark-outline"
        size={18}
        color={colors.warning}
      />
      <Text style={[styles.text, { color: colors.warning }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
