import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

function enviarMultipart(url: string, formData: FormData) {
  return new Promise<{ status: number; data: any }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.timeout = 90000;
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

export const useDiagnosticoIA = () => {
  const [promptText, setPromptText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oficios, setOficios] = useState<string[]>([]);
  const [imagenSeleccionada, setImagenSeleccionada] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

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

  const enviarConsulta = async () => {
    if (isLoading) return;
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

    try {
      const formData = new FormData();

      if (imagenSeleccionada) {
        if (Platform.OS === "web") {
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

  return {
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
  };
};
