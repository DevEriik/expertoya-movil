import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Platform } from "react-native";

export function useDiagnosticoIA() {
  const [isLoading, setIsLoading] = useState(false);
  const [oficios, setOficios] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [imagenSeleccionada, setImagenSeleccionada] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  // Solo abre la cámara y guarda la foto en la pantalla, NO la envía aún
  const seleccionarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Necesitamos acceso a la cámara para poder analizar el problema.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImagenSeleccionada(result.assets[0]);
    }
  };

  const quitarFoto = () => setImagenSeleccionada(null);

  // Esta función se ejecuta al presionar "Preguntar a la IA"
  const enviarConsulta = async () => {
    if (!imagenSeleccionada && !busqueda) {
      Alert.alert(
        "Falta información",
        "Por favor, adjunta una foto o describe el problema.",
      );
      return;
    }

    setIsLoading(true);
    setOficios([]);

    const API_URL =
      Platform.OS === "android" && !__DEV__
        ? "http://10.0.2.2:3000/api/ia/diagnostico-visual"
        : "http://localhost:3000/api/ia/diagnostico-visual";

    const formData = new FormData();

    if (imagenSeleccionada) {
      formData.append("imagen", {
        uri: imagenSeleccionada.uri,
        name: "diagnostico.jpg",
        type: "image/jpeg",
      } as any);
    }

    // Enviamos también el texto que escribió el usuario
    if (busqueda) {
      formData.append("descripcion", busqueda);
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Diagnóstico IA",
          data.error || "No pudimos procesar la solicitud.",
        );
      } else {
        setOficios(data.oficios_sugeridos);
      }
    } catch (error) {
      console.error("Error de red:", error);
      Alert.alert(
        "Error de conexión",
        "Verifica que el servidor backend esté corriendo.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    busqueda,
    setBusqueda,
    oficios,
    isLoading,
    imagenSeleccionada,
    seleccionarFoto,
    quitarFoto,
    enviarConsulta,
  };
}
