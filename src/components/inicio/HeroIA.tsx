// src/components/home/HeroIA.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  useColorScheme,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

export function HeroIA() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.backgroundElement,
          borderColor: colors.backgroundSelected,
          borderWidth: 1,
          shadowOpacity: isDark ? 0.35 : 0.08,
        }
      ]}
    >
      {/* Etiqueta de IA */}
      <View 
        style={[
          styles.badgeContainer,
          { 
            backgroundColor: isDark ? "rgba(51, 239, 165, 0.12)" : "rgba(0, 191, 165, 0.1)",
            borderColor: isDark ? "rgba(51, 239, 165, 0.25)" : "rgba(0, 191, 165, 0.2)",
            borderWidth: 1,
          }
        ]}
      >
        <MaterialCommunityIcons name="magic-staff" size={16} color={colors.secondary} />
        <Text style={[styles.badgeText, { color: colors.secondary }]}>
          Búsqueda con Inteligencia Artificial
        </Text>
      </View>

      {/* Título Principal */}
      <Text style={[styles.mainTitle, { color: colors.text }]}>
        ¿No estás seguro{"\n"}de a qué{"\n"}especialista{"\n"}llamar?
      </Text>

      {/* Subtítulo */}
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Describe tu problema o sube una foto/video, y nuestra IA te conectará al
        instante con el experto exacto que necesitas.
      </Text>

      {/* Caja de Búsqueda Interactiva */}
      <View 
        style={[
          styles.searchContainer,
          { 
            backgroundColor: colors.background,
            borderColor: colors.backgroundSelected,
          }
        ]}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Ej., Tengo una pérdida de agua..."
            placeholderTextColor={colors.textSecondary}
            multiline={true}
          />
        </View>

        {/* Fila inferior de herramientas e IA */}
        <View style={styles.toolsRow}>
          <View style={styles.iconGroup}>
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.backgroundSelected,
                  borderWidth: 1,
                }
              ]}
            >
              <Ionicons name="mic-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.backgroundSelected,
                  borderWidth: 1,
                }
              ]}
            >
              <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[
              styles.aiButton,
              { 
                backgroundColor: colors.secondary,
              }
            ]}
          >
            <MaterialCommunityIcons
              name="magic-staff"
              size={18}
              color={isDark ? "#121826" : "#FFFFFF"}
            />
            <Text style={[styles.aiButtonText, { color: isDark ? "#121826" : "#FFFFFF" }]}>
              Preguntar a la IA
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 28,
  },
  badgeText: {
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 13,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  searchContainer: {
    width: "100%",
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
  },
  inputRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  textInput: {
    fontSize: 15,
    minHeight: 40,
  },
  toolsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  aiButton: {
    flexDirection: "row",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  aiButtonText: {
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 8,
  },
});
