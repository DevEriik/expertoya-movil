import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CustomSwitch = ({
  value,
  onValueChange,
  activeColor,
  inactiveColor,
}: any) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor],
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onValueChange(!value)}>
      <Animated.View
        style={{
          width: 50,
          height: 30,
          borderRadius: 15,
          backgroundColor,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: "#FFFFFF",
            transform: [{ translateX }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function AccessibilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [textSize, setTextSize] = useState("Medium");
  const [voiceDictation, setVoiceDictation] = useState(true);

  const FigmaToggle = ({ title, subtitle, value, onValueChange }: any) => (
    <View style={styles.settingRow}>
      <View style={styles.textContainer}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <CustomSwitch
        value={value}
        onValueChange={onValueChange}
        activeColor={colors.primary}
        inactiveColor={colors.backgroundSelected}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Centro de Accesibilidad
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Personaliza la app para tu comodidad.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View
          style={[styles.card, { backgroundColor: colors.backgroundElement }]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="sunny-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Apariencia
            </Text>
          </View>
          <FigmaToggle
            title="Modo Oscuro"
            subtitle="Cambia a un tema más oscuro para reducir la fatiga visual."
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <View
            style={[
              styles.divider,
              { backgroundColor: colors.backgroundSelected },
            ]}
          />
          <FigmaToggle
            title="Modo de Alto Contraste"
            subtitle="Mejora la visibilidad de bordes y textos."
            value={highContrast}
            onValueChange={setHighContrast}
          />
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.backgroundElement }]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="text-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Tamaño de Texto
            </Text>
          </View>
          <View style={styles.sizeSelectorContainer}>
            {["Pequeño", "Mediano", "Grande"].map((size, index) => {
              const sizesEn = ["Small", "Medium", "Large"];
              const isSelected = textSize === sizesEn[index];
              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeBox,
                    {
                      backgroundColor: isSelected
                        ? colors.warningBg
                        : colors.backgroundSelected,
                      borderColor: isSelected ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => setTextSize(sizesEn[index])}
                >
                  <Text
                    style={{
                      fontSize: 14 + index * 4,
                      fontWeight: "700",
                      color: isSelected ? colors.primary : colors.text,
                    }}
                  >
                    A
                  </Text>
                  <Text
                    style={[
                      styles.sizeLabel,
                      {
                        color: isSelected
                          ? colors.primary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.backgroundElement }]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="mic-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Dictado por Voz
            </Text>
          </View>
          <FigmaToggle
            title="Mostrar siempre el micrófono"
            subtitle="Muestra un botón de micrófono grande en todos los campos de texto."
            value={voiceDictation}
            onValueChange={setVoiceDictation}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { paddingVertical: 8, alignSelf: "flex-start" },
  headerTitles: { marginTop: 8 },
  headerTitle: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  headerSubtitle: { fontSize: 15, fontWeight: "500" },
  content: { flex: 1, padding: 16 },
  card: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  textContainer: { flex: 1, paddingRight: 16 },
  settingTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  settingSubtitle: { fontSize: 13, fontWeight: "500" },
  divider: { height: 1, marginHorizontal: 16 },
  sizeSelectorContainer: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  sizeBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  sizeLabel: { fontSize: 12, fontWeight: "700", marginTop: 8 },
});
