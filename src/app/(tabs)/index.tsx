import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/context/AccessibilityContext";
import { HeroIA } from "../../components/inicio/HeroIA";
import { PagosSeguros } from "../../components/inicio/pagosSeguros";

export default function InicioScreen() {
  const colors = useTheme();
  const { isDarkMode, scaleFont } = useAccessibility();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/*<Logo
        width={180}
        height={40}
        style={{ alignSelf: "flex-start", marginBottom: 16, marginLeft: 4 }}
      />*/}
      <HeroIA />
      <PagosSeguros />
      <View style={styles.buttonContainer}>
        <Link href="/onboarding" asChild>
          <TouchableOpacity
            style={StyleSheet.flatten([
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary
              }
            ])}
          >
            <Text style={[styles.primaryButtonText, { color: isDarkMode ? "#121826" : "#FFFFFF", fontSize: scaleFont(16) }]}>
              Probar Registro de Profesional
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 40,
    alignItems: "center",
    paddingBottom: 60,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 40,
    paddingHorizontal: 8,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
});
