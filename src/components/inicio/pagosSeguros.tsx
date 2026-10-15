// src/components/home/PagosSeguros.tsx
import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

export function PagosSeguros() {
  return (
    <View style={styles.card}>
      {/* Etiqueta Superior */}
      <View style={styles.badgeWrapper}>
        <View style={styles.badgeContainer}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={16}
            color="#33EFA5"
          />
          <Text style={styles.badgeText}>Pagos 100% Seguros</Text>
        </View>
      </View>

      {/* Título Principal */}
      <Text style={styles.mainTitle}>
        Tu dinero está protegido hasta que el trabajo esté terminado
      </Text>

      {/* Descripción */}
      <Text style={styles.description}>
        Con nuestro sistema de{" "}
        <Text style={styles.highlightText}>Retención Segura (Escrow)</Text>, tu
        pago se guarda de forma neutral. El profesional solo recibe el dinero
        cuando tú confirmas que el trabajo se realizó correctamente.
      </Text>

      {/* Lista de beneficios */}
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: "rgba(255, 183, 77, 0.1)" },
            ]}
          >
            <Ionicons name="wallet-outline" size={22} color="#FFB74D" />
          </View>
          <Text style={styles.featureText}>
            Pagas al contratar, pero el dinero se retiene.
          </Text>
        </View>

        <View style={styles.featureItem}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: "rgba(51, 239, 165, 0.1)" },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={22}
              color="#33EFA5"
            />
          </View>
          <Text style={styles.featureText}>
            Garantía de satisfacción o devolución garantizada.
          </Text>
        </View>
      </View>

      {/* Tarjeta Interior (Fondos Retenidos) */}
      <View style={styles.innerCard}>
        <View style={styles.lockCircle}>
          <Ionicons name="lock-closed-outline" size={32} color="#33EFA5" />
        </View>
        <Text style={styles.innerTitle}>Fondos Retenidos</Text>
        <Text style={styles.innerText}>
          El pago se libera al profesional{" "}
          <Text style={styles.highlightTeal}>solo con tu aprobación</Text>{" "}
          final.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#1F2937", // Superficie Dark Mode
    borderRadius: 32,
    padding: 24,
    marginTop: 24, // Separación con el HeroIA
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  badgeWrapper: {
    alignItems: "flex-start",
    marginBottom: 20,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121826", // Fondo interior oscuro para resaltar
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(51, 239, 165, 0.2)",
  },
  badgeText: {
    color: "#33EFA5",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 13,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FDFCF4",
    lineHeight: 34,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#9CA3AF",
    lineHeight: 24,
    marginBottom: 24,
  },
  highlightText: {
    color: "#FDFCF4",
    fontWeight: "600",
  },
  featureList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#FDFCF4",
    lineHeight: 22,
  },
  innerCard: {
    backgroundColor: "#121826", // Fondo Base (hueco dentro de la superficie)
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(51, 239, 165, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  innerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FDFCF4",
    marginBottom: 8,
  },
  innerText: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
  },
  highlightTeal: {
    color: "#33EFA5",
    fontWeight: "600",
  },
});
