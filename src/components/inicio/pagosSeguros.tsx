import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/context/AccessibilityContext";

export function PagosSeguros() {
  const colors = useTheme();
  const { isDarkMode, highContrast, scaleFont } = useAccessibility();

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.backgroundElement,
          borderColor: highContrast ? colors.border : colors.backgroundSelected,
          borderWidth: highContrast ? 2 : 1,
          shadowOpacity: isDarkMode ? 0.35 : 0.08,
        }
      ]}
    >
      {/* Etiqueta Superior */}
      <View style={styles.badgeWrapper}>
        <View 
          style={[
            styles.badgeContainer,
            { 
              backgroundColor: colors.background,
              borderColor: isDarkMode ? "rgba(51, 239, 165, 0.25)" : "rgba(0, 191, 165, 0.2)",
            }
          ]}
        >
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={16}
            color={colors.secondary}
          />
          <Text style={[styles.badgeText, { color: colors.secondary, fontSize: scaleFont(13) }]}>Pagos 100% Seguros</Text>
        </View>
      </View>

      {/* Título Principal */}
      <Text style={[styles.mainTitle, { color: colors.text, fontSize: scaleFont(26), lineHeight: scaleFont(32) }]}>
        Tu dinero está protegido hasta que el trabajo esté terminado
      </Text>

      {/* Descripción */}
      <Text style={[styles.description, { color: colors.textSecondary, fontSize: scaleFont(15), lineHeight: scaleFont(22) }]}>
        Con nuestro sistema de{" "}
        <Text style={[styles.highlightText, { color: colors.text }]}>Retención Segura (Escrow)</Text>, tu
        pago se guarda de forma neutral. El profesional solo recibe el dinero
        cuando tú confirmas que el trabajo se realizó correctamente.
      </Text>

      {/* Lista de beneficios */}
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <View
            style={[
              styles.iconBox,
              { 
                backgroundColor: colors.background,
                borderColor: highContrast ? colors.border : colors.backgroundSelected,
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons name="wallet-outline" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.featureText, { color: colors.text, fontSize: scaleFont(14) }]}>
            Pagas al contratar, pero el dinero se retiene.
          </Text>
        </View>

        <View style={styles.featureItem}>
          <View
            style={[
              styles.iconBox,
              { 
                backgroundColor: colors.background,
                borderColor: highContrast ? colors.border : colors.backgroundSelected,
                borderWidth: 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={22}
              color={colors.secondary}
            />
          </View>
          <Text style={[styles.featureText, { color: colors.text, fontSize: scaleFont(14) }]}>
            Garantía de satisfacción o devolución garantizada.
          </Text>
        </View>
      </View>

      {/* Tarjeta Interior (Fondos Retenidos) */}
      <View 
        style={[
          styles.innerCard,
          { 
            backgroundColor: colors.background,
            borderColor: highContrast ? colors.border : colors.backgroundSelected,
            borderWidth: highContrast ? 2 : 1,
          }
        ]}
      >
        <View 
          style={[
            styles.lockCircle,
            { 
              backgroundColor: isDarkMode ? "rgba(51, 239, 165, 0.12)" : "rgba(0, 191, 165, 0.1)",
            }
          ]}
        >
          <Ionicons name="lock-closed-outline" size={32} color={colors.secondary} />
        </View>
        <Text style={[styles.innerTitle, { color: colors.text, fontSize: scaleFont(18) }]}>Fondos Retenidos</Text>
        <Text style={[styles.innerText, { color: colors.textSecondary, fontSize: scaleFont(14), lineHeight: scaleFont(20) }]}>
          El pago se libera al profesional{" "}
          <Text style={[styles.highlightTeal, { color: colors.secondary }]}>solo con tu aprobación</Text>{" "}
          final.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 32,
    padding: 24,
    marginTop: 24, // Separación con el HeroIA
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  badgeWrapper: {
    alignItems: "flex-start",
    marginBottom: 20,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 13,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  highlightText: {
    fontWeight: "700",
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
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  innerCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  innerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  innerText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  highlightTeal: {
    fontWeight: "700",
  },
});
