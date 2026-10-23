import { useAccessibility } from "@/context/AccessibilityContext";
import { useTheme } from "@/hooks/use-theme";
import { useDiagnosticoIA } from "@/hooks/useDiagnosticoIA";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ResultadosIA } from "./ResultadosIA";

export function HeroIA() {
  const colors = useTheme();
  const { isDarkMode, highContrast, voiceDictation, scaleFont } =
    useAccessibility();

  const {
    promptText,
    setPromptText,
    isListening,
    isLoading,
    oficios,
    imagenSeleccionada,
    handleMicPress,
    seleccionarFoto,
    seleccionarDeGaleria,
    quitarFoto,
    enviarConsulta,
  } = useDiagnosticoIA();

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
          {imagenSeleccionada && (
            <View style={styles.thumbnailWrapper}>
              <Image
                source={{ uri: imagenSeleccionada.uri }}
                style={styles.thumbnail}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={quitarFoto}
                accessibilityRole="button"
                accessibilityLabel="Quitar foto adjunta"
              >
                <Ionicons name="close" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={[
              styles.textInput,
              { color: colors.text, fontSize: scaleFont(16) },
            ]}
            placeholder={
              isListening
                ? "Escuchando... Di tu consulta"
                : "Ej., Tengo una pérdida de agua..."
            }
            placeholderTextColor={
              isListening ? colors.secondary : colors.textSecondary
            }
            multiline={true}
            value={promptText}
            onChangeText={setPromptText}
            editable={!isListening}
            accessibilityLabel="Caja de texto para describir tu problema"
          />
        </View>

        <View style={styles.toolsRow}>
          <View style={styles.iconGroup}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: isListening ? colors.secondary : "transparent",
                  borderWidth: isListening ? 1 : 0,
                },
                voiceDictation && {
                  padding: 14,
                  backgroundColor: colors.backgroundSelected,
                },
              ]}
              onPress={handleMicPress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dictado por voz"
            >
              <Ionicons
                name="mic-outline"
                size={voiceDictation ? 28 : 22}
                color={isListening ? colors.secondary : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: colors.backgroundElement },
                imagenSeleccionada && {
                  borderColor: colors.secondary,
                  borderWidth: 1,
                },
              ]}
              onPress={imagenSeleccionada ? quitarFoto : seleccionarFoto}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                imagenSeleccionada
                  ? "Quitar foto adjunta"
                  : "Sacar foto del problema"
              }
            >
              <Ionicons
                name={imagenSeleccionada ? "close-outline" : "camera-outline"}
                size={22}
                color={
                  imagenSeleccionada ? colors.secondary : colors.textSecondary
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: colors.backgroundElement },
              ]}
              onPress={seleccionarDeGaleria}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Elegir foto de la galería"
            >
              <Ionicons
                name="image-outline"
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
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
            onPress={enviarConsulta}
            disabled={isLoading}
            accessible={true}
            accessibilityRole="button"
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

      {/* Renderizado de Resultados Modularizado */}
      <ResultadosIA oficios={oficios} isLoading={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 28,
  },
  badgeText: { fontWeight: "700", marginLeft: 8 },
  mainTitle: {
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontWeight: "400",
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  searchContainer: { width: "100%", borderRadius: 24, padding: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  textInput: { flex: 1, minHeight: 40 },
  thumbnailWrapper: { position: "relative", marginRight: 12 },
  thumbnail: { width: 50, height: 50, borderRadius: 12 },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  toolsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  iconGroup: { flexDirection: "row", alignItems: "center" },
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
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 1,
  },
  aiButtonText: { fontWeight: "700", marginLeft: 6, flexShrink: 1 },
});
