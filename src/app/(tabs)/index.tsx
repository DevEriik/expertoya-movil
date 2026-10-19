// src/app/(tabs)/index.tsx
import { Logo } from "@/components/Logo";
import { Colors } from "@/constants/theme";
import { Link } from "expo-router";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { HeroIA } from "../../components/inicio/HeroIA";
import { PagosSeguros } from "../../components/inicio/pagosSeguros";

export default function InicioScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Logo
        width={180}
        height={40}
        style={{ alignSelf: "flex-start", marginBottom: 16, marginLeft: 4 }}
      />
      <HeroIA />
      <PagosSeguros />
      <View style={styles.buttonContainer}>
        <Link href="/onboarding" asChild>
          <TouchableOpacity
            style={StyleSheet.flatten([
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ])}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { color: isDark ? "#121826" : "#FFFFFF" },
              ]}
            >
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
