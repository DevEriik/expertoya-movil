// src/app/(tabs)/index.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Link } from "expo-router";

import { HeroIA } from "../../components/inicio/HeroIA";
import { PagosSeguros } from "../../components/inicio/pagosSeguros";

export default function InicioScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <HeroIA />
      <PagosSeguros />
      <View style={styles.buttonContainer}>
        <Link href="/onboarding" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
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
    backgroundColor: "#121826", // Fondo Base 
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
    backgroundColor: "#FFB74D", 
    paddingVertical: 18,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#FFB74D",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  primaryButtonText: {
    color: "#121826",
    fontSize: 16,
    fontWeight: "800",
  },
});
