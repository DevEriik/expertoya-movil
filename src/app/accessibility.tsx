import { useAccessibility, TextSize } from "@/context/AccessibilityContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  activeColor: string;
  inactiveColor: string;
  accessibilityLabel: string;
}

const CustomSwitch = ({
  value,
  onValueChange,
  activeColor,
  inactiveColor,
  accessibilityLabel,
}: CustomSwitchProps) => {
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
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      accessible={true}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={{
          width: 52,
          height: 32,
          borderRadius: 16,
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
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 2.5,
              },
              android: { elevation: 3 },
              web: {
                boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              },
            }),
          }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function AccessibilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isDarkMode,
    setIsDarkMode,
    highContrast,
    setHighContrast,
    textSize,
    setTextSize,
    textScale,
    voiceDictation,
    setVoiceDictation,
    colors,
  } = useAccessibility();

  const FigmaToggle = ({
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (val: boolean) => void;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.settingTitle,
            { color: colors.text, fontSize: Math.round(15 * textScale) },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.settingSubtitle,
            {
              color: colors.textSecondary,
              fontSize: Math.round(13 * textScale),
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>
      <CustomSwitch
        value={value}
        onValueChange={onValueChange}
        activeColor={colors.primary}
        inactiveColor={
          highContrast
            ? isDarkMode
              ? "#3A3A3C"
              : "#D1D5DB"
            : colors.backgroundSelected
        }
        accessibilityLabel={title}
      />
    </View>
  );

  const SIZES: { label: string; key: TextSize; letterSize: number }[] = [
    { label: "Pequeño", key: "Small", letterSize: 16 },
    { label: "Mediano", key: "Medium", letterSize: 21 },
    { label: "Grande", key: "Large", letterSize: 26 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Volver atrás"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text, fontSize: Math.round(28 * textScale) },
            ]}
          >
            Centro de Accesibilidad
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              {
                color: colors.textSecondary,
                fontSize: Math.round(15 * textScale),
              },
            ]}
          >
            Personaliza la app para tu comodidad.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Apariencia */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: highContrast ? colors.border : "transparent",
              borderWidth: highContrast ? 2 : 0,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="sunny-outline" size={22} color={colors.primary} />
            <Text
              style={[
                styles.cardTitle,
                { color: colors.text, fontSize: Math.round(16 * textScale) },
              ]}
            >
              Apariencia
            </Text>
          </View>
          <FigmaToggle
            title="Modo Oscuro"
            subtitle="Cambia a un tema más oscuro para reducir la fatiga visual."
            value={isDarkMode}
            onValueChange={setIsDarkMode}
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

        {/* Card 2: Tamaño de Texto */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: highContrast ? colors.border : "transparent",
              borderWidth: highContrast ? 2 : 0,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="text-outline" size={22} color={colors.primary} />
            <Text
              style={[
                styles.cardTitle,
                { color: colors.text, fontSize: Math.round(16 * textScale) },
              ]}
            >
              Tamaño de Texto
            </Text>
          </View>
          <View style={styles.sizeSelectorContainer}>
            {SIZES.map((item) => {
              const isSelected = textSize === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Tamaño ${item.label}`}
                  activeOpacity={0.8}
                  style={[
                    styles.sizeBox,
                    {
                      backgroundColor: isSelected
                        ? colors.warningBg
                        : colors.backgroundSelected,
                      borderColor: isSelected
                        ? colors.primary
                        : highContrast
                        ? colors.border
                        : "transparent",
                      borderWidth: isSelected ? (highContrast ? 2.5 : 2) : 1,
                    },
                  ]}
                  onPress={() => setTextSize(item.key)}
                >
                  <Text
                    style={{
                      fontSize: item.letterSize,
                      fontWeight: "800",
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
                        fontSize: Math.round(12 * textScale),
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Card 3: Dictado por Voz */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: highContrast ? colors.border : "transparent",
              borderWidth: highContrast ? 2 : 0,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="mic-outline" size={22} color={colors.primary} />
            <Text
              style={[
                styles.cardTitle,
                { color: colors.text, fontSize: Math.round(16 * textScale) },
              ]}
            >
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
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
    alignSelf: "flex-start",
  },
  headerTitles: {
    marginTop: 8,
  },
  headerTitle: {
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      web: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  cardTitle: {
    fontWeight: "800",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  settingSubtitle: {
    fontWeight: "500",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  sizeSelectorContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  sizeBox: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeLabel: {
    fontWeight: "700",
    marginTop: 8,
  },
});
