import { useAccessibility } from "@/context/AccessibilityContext";
import { useTheme } from "@/hooks/use-theme";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface ResultadosIAProps {
  oficios: string[];
  isLoading: boolean;
}

export function ResultadosIA({ oficios, isLoading }: ResultadosIAProps) {
  const colors = useTheme();
  const { isDarkMode } = useAccessibility();

  if (isLoading) {
    return (
      <View style={{ marginTop: 24, alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text
          numberOfLines={1}
          style={{ color: colors.textSecondary, marginTop: 8 }}
        >
          Analizando tu consulta...
        </Text>
      </View>
    );
  }

  if (oficios.length === 0) return null;

  return (
    <View style={{ marginTop: 24, width: "100%", alignItems: "center" }}>
      <Text style={{ color: colors.text, marginBottom: 8, fontWeight: "bold" }}>
        Sugerencias de la IA:
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {oficios.map((oficio, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: colors.secondary,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                color: isDarkMode ? "#121826" : "#FFF",
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              {oficio}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
