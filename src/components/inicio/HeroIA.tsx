import { useAccessibility } from "@/context/AccessibilityContext";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function enviarMultipart(url: string, formData: FormData) {
  return new Promise<{ status: number; data: any }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.timeout = 90000; // 90 segundos: Gemini puede tardar
    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      resolve({ status: xhr.status, data });
    };
    xhr.onerror = () => reject(new Error("Network request failed"));
    xhr.ontimeout = () => reject(new Error("Tiempo de espera agotado"));
    xhr.send(formData as any);
  });
}

export function HeroIA() {
  const colors = useTheme();
  const { isDarkMode, highContrast, voiceDictation, scaleFont } =
    useAccessibility();

  // Estados originales del equipo
  const [promptText, setPromptText] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Estados de la IA
  const [isLoading, setIsLoading] = useState(false);
  const [oficios, setOficios] = useState<string[]>([]);
  const [imagenSeleccionada, setImagenSeleccionada] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  // En Android, al abrir la cámara el sistema puede cerrar la app para liberar
  // memoria. Si pasa, al volver recuperamos la foto que se había sacado.
  useEffect(() => {
    if (Platform.OS !== "android") return;

    ImagePicker.getPendingResultAsync()
      .then((result) => {
        if (
          result &&
          "assets" in result &&
          !result.canceled &&
          result.assets?.length
        ) {
          setImagenSeleccionada(result.assets[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Lógica del Micrófono (del equipo)
  const handleMicPress = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    setIsListening(true);
    Alert.alert(
      "Dictado por Voz",
      "Escuchando tu consulta... Di lo que necesitas y lo transcribiremos en el campo de texto.",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => setIsListening(false),
        },
        {
          text: "Insertar ejemplo",
          onPress: () => {
            setPromptText("Necesito arreglar una filtración en el baño");
            setIsListening(false);
          },
        },
      ],
    );
  };

  // Cámara (sin recorte: allowsEditing en Android aumenta los cierres de la app)
  const seleccionarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Necesitamos acceso a la cámara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled) {
      setImagenSeleccionada(result.assets[0]);
    }
  };

  // Galería
  const seleccionarDeGaleria = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled) {
      setImagenSeleccionada(result.assets[0]);
    }
  };

  const quitarFoto = () => setImagenSeleccionada(null);

  // Envío al backend
  const enviarConsulta = async () => {
    if (isLoading) return; // evita envíos repetidos

    const texto = promptText.trim();

    if (!imagenSeleccionada && !texto) {
      Alert.alert(
        "Falta información",
        "Por favor, adjunta una foto o describe el problema.",
      );
      return;
    }

    setIsLoading(true);
    setOficios([]);

    const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
    const API_URL = `${API_BASE}/api/ia/diagnostico-visual`;

    console.log("API_URL usada:", API_URL);

    try {
      const formData = new FormData();

      if (imagenSeleccionada) {
        if (Platform.OS === "web") {
          // En web hay que convertir la foto a Blob
          const blob = await (await fetch(imagenSeleccionada.uri)).blob();
          formData.append("imagen", blob, "diagnostico.jpg");
        } else {
          formData.append("imagen", {
            uri: imagenSeleccionada.uri,
            name: "diagnostico.jpg",
            type: imagenSeleccionada.mimeType ?? "image/jpeg",
          } as any);
        }
      }

      if (texto) {
        formData.append("descripcion", texto);
      }

      const { status, data } = await enviarMultipart(API_URL, formData);

      if (status < 200 || status >= 300) {
        Alert.alert(
          "Diagnóstico IA",
          data?.error || "No pudimos procesar la solicitud.",
        );
      } else {
        setOficios(data?.oficios_sugeridos ?? []);
      }
    } catch (error) {
      console.error("Error de red:", error);
      Alert.alert(
        "Error de conexión",
        "No pudimos conectar con el servidor. Verifica que el backend esté corriendo.",
      );
    } finally {
      setIsLoading(false);
    }
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
          {/* Miniatura de la foto seleccionada */}
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
            accessibilityLabel="Caja de texto para describir tu problema a la inteligencia artificial"
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
              accessibilityHint="Toca para dictar tu problema por voz"
            >
              <Ionicons
                name="mic-outline"
                size={voiceDictation ? 28 : 22}
                color={isListening ? colors.secondary : colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Cámara */}
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

            {/* Galería */}
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

      {isLoading && (
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text
            numberOfLines={1}
            style={{ color: colors.textSecondary, marginTop: 8 }}
          >
            Analizando tu consulta...
          </Text>
        </View>
      )}

      {oficios.length > 0 && (
        <View style={{ marginTop: 24, width: "100%", alignItems: "center" }}>
          <Text
            style={{ color: colors.text, marginBottom: 8, fontWeight: "bold" }}
          >
            Sugerencias de la IA:
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {oficios.map((oficio, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: colors.secondary,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    color: isDarkMode ? "#121826" : "#FFF",
                    fontWeight: "bold",
                    fontSize: 14,
                  }}
                >
                  {oficio}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
  badgeText: {
    fontWeight: "700",
    marginLeft: 8,
  },
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
  searchContainer: {
    width: "100%",
    borderRadius: 24,
    padding: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
  },
  thumbnailWrapper: {
    position: "relative",
    marginRight: 12,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
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
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 1,
  },
  aiButtonText: {
    fontWeight: "700",
    marginLeft: 6,
    flexShrink: 1,
  },
});
