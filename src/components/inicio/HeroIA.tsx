// src/components/inicio/HeroIA.tsx
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/context/AccessibilityContext";

export function HeroIA() {
  const colors = useTheme();
  const { isDarkMode, highContrast, voiceDictation, scaleFont } =
    useAccessibility();

  const [promptText, setPromptText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleMicPress = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    Alert.alert(
      "Dictado por Voz",
      "Escuchando tu consulta... Di lo que necesitas y lo transcribiremos en el campo.",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => setIsListening(false),
        },
        {
          text: "Insertar ejemplo",
          onPress: () => {
            setPromptText(
              "Tengo una fuga de agua en el baño y necesito un plomero urgente."
            );
            setIsListening(false);
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: highContrast ? colors.border : colors.backgroundSelected,
          borderWidth: highContrast ? 2 : 1,
          shadowOpacity: isDarkMode ? 0.35 : 0.08,
        },
      ]}
    >
      {/* Etiqueta de IA */}
      <View
        style={[
          styles.badgeContainer,
          {
            backgroundColor: isDarkMode
              ? "rgba(51, 239, 165, 0.12)"
              : "rgba(0, 191, 165, 0.1)",
            borderColor: isDarkMode
              ? "rgba(51, 239, 165, 0.25)"
              : "rgba(0, 191, 165, 0.2)",
            borderWidth: 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="magic-staff"
          size={16}
          color={colors.secondary}
        />
        <Text
          style={[
            styles.badgeText,
            { color: colors.secondary, fontSize: scaleFont(13) },
          ]}
        >
          Búsqueda con Inteligencia Artificial
        </Text>
      </View>

      {/* Título Principal */}
      <Text
        style={[
          styles.mainTitle,
          {
            color: colors.text,
            fontSize: scaleFont(34),
            lineHeight: scaleFont(40),
          },
        ]}
      >
        ¿No estás seguro{"\n"}de a qué{"\n"}especialista{"\n"}llamar?
      </Text>

      {/* Subtítulo */}
      <Text
        style={[
          styles.subtitle,
          {
            color: colors.textSecondary,
            fontSize: scaleFont(15),
            lineHeight: scaleFont(22),
          },
        ]}
      >
        Describe tu problema o sube una foto/video, y nuestra IA te conectará al
        instante con el experto exacto que necesitas.
      </Text>

      {/* Caja de Búsqueda Interactiva */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.background,
            borderColor: highContrast
              ? colors.border
              : colors.backgroundSelected,
            borderWidth: highContrast ? 2 : 1,
          },
        ]}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.textInput,
              { color: colors.text, fontSize: scaleFont(15) },
            ]}
            placeholder={
              isListening
                ? "Escuchando tu voz..."
                : "Ej., Tengo una pérdida de agua..."
            }
            placeholderTextColor={
              isListening ? colors.primary : colors.textSecondary
            }
            value={promptText}
            onChangeText={setPromptText}
            multiline={true}
          />
        </View>

        {/* Fila inferior de herramientas e IA */}
        <View style={styles.toolsRow}>
          <View style={styles.iconGroup}>
            {/* Botón de micrófono reactivo a Dictado por Voz */}
            <TouchableOpacity
              onPress={handleMicPress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dictado por voz"
              accessibilityHint="Presiona para dictar tu consulta con la voz"
              style={[
                styles.iconButton,
                voiceDictation
                  ? {
                      backgroundColor: isListening
                        ? colors.danger
                        : isDarkMode
                        ? "#3A2200"
                        : "#FEF3E0",
                      borderColor: colors.primary,
                      borderWidth: highContrast ? 2.5 : 2,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 22,
                    }
                  : {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.backgroundSelected,
                      borderWidth: 1,
                    },
              ]}
            >
              <Ionicons
                name={
                  voiceDictation
                    ? isListening
                      ? "mic"
                      : "mic"
                    : "mic-outline"
                }
                size={voiceDictation ? 24 : 22}
                color={
                  voiceDictation
                    ? isListening
                      ? "#FFFFFF"
                      : colors.primary
                    : colors.textSecondary
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.backgroundSelected,
                  borderWidth: 1,
                },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Subir foto o video"
            >
              <Ionicons
                name="camera-outline"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.aiButton,
              {
                backgroundColor: colors.secondary,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Preguntar a la IA"
          >
            <MaterialCommunityIcons
              name="magic-staff"
              size={18}
              color={isDarkMode ? "#121826" : "#FFFFFF"}
            />
            <Text
              style={[
                styles.aiButtonText,
                {
                  color: isDarkMode ? "#121826" : "#FFFFFF",
                  fontSize: scaleFont(14),
                },
              ]}
            >
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
      web: {
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      },
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
  },
  mainTitle: {
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontWeight: "400",
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  searchContainer: {
    width: "100%",
    borderRadius: 24,
    padding: 8,
  },
  inputRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  textInput: {
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
    alignItems: "center",
    justifyContent: "center",
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
    marginLeft: 8,
  },
});
