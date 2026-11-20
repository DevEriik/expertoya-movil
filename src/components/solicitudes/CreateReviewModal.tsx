import { useAccessibility } from "@/context/AccessibilityContext";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/api";
import { createFormDataFile } from "@/utils/fileUpload";
import { Ionicons } from '@/components/ui/VectorIcons';
import { ImagePicker } from "@/utils/mediaPicker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CreateReviewModalProps {
  visible: boolean;
  solicitudId: string;
  profesionalNombre: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateReviewModal({
  visible,
  solicitudId,
  profesionalNombre,
  onClose,
  onSuccess,
}: CreateReviewModalProps) {
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();

  const [calificacion, setCalificacion] = useState<number>(5);
  const [comentario, setComentario] = useState<string>("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [enviando, setEnviando] = useState<boolean>(false);

  const calificacionTextos: Record<number, string> = {
    1: "Deficiente - No cumplió lo acordado",
    2: "Regular - Hubo inconvenientes",
    3: "Aceptable - Cumplió con lo básico",
    4: "Muy bueno - Buen servicio y trato",
    5: "Excelente - ¡Altamente recomendado!",
  };

  const handlePickImage = async () => {
    if (fotos.length >= 2) {
      Alert.alert(
        "Límite alcanzado",
        "Solo puedes adjuntar hasta 2 fotos como evidencia del trabajo."
      );
      return;
    }

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permiso denegado",
          "Se requiere acceso a la galería para adjuntar fotos a la reseña."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setFotos((prev) => [...prev, uri].slice(0, 2));
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      Alert.alert("Error", "No se pudo cargar la imagen seleccionada.");
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (calificacion < 1 || calificacion > 5) {
      Alert.alert("Atención", "Por favor selecciona una calificación de 1 a 5 estrellas.");
      return;
    }

    try {
      setEnviando(true);

      let response: Response;

      if (fotos.length === 0) {
        // Sin fotos: envío directo en JSON (compatible y veloz)
        response = await apiClient("/api/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            solicitudId,
            calificacion,
            comentario: comentario.trim() || undefined,
          }),
        });
      } else {
        // Con fotos: usar FormData compatible con WinterCG Fetch y React Native Web
        const formData = new FormData();
        formData.append("solicitudId", solicitudId);
        formData.append("calificacion", String(calificacion));

        if (comentario.trim()) {
          formData.append("comentario", comentario.trim());
        }

        for (let index = 0; index < fotos.length; index++) {
          const uri = fotos[index];
          const cleanUri = uri.split("?")[0];
          const rawFilename = cleanUri.split("/").pop() || `foto_${index}.jpg`;
          const extMatch = /\.(jpe?g|png|webp|heic)$/i.exec(rawFilename);
          const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
          const filename = rawFilename.includes(".") ? rawFilename : `${rawFilename}.${ext}`;
          const mimeType =
            ext === "png"
              ? "image/png"
              : ext === "webp"
              ? "image/webp"
              : "image/jpeg";

          const filePart = await createFormDataFile(uri, filename, mimeType);
          if (Platform.OS === "web" || filePart instanceof Blob) {
            const finalBlob =
              filePart instanceof Blob &&
              (!filePart.type || filePart.type === "application/octet-stream")
                ? filePart.slice(0, filePart.size, mimeType)
                : filePart;
            formData.append("fotos", finalBlob, filename);
          } else {
            (formData as any).append("fotos", filePart);
          }
        }

        response = await apiClient("/api/reviews", {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detalle || data.error || "No se pudo registrar la reseña");
      }

      Alert.alert(
        "¡Reseña Publicada!",
        "Tu calificación ha sido registrada de manera exitosa y definitiva.",
        [{ text: "Aceptar", onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error("Error al enviar reseña:", error);
      Alert.alert("Error", error.message || "Ocurrió un error al enviar tu reseña.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              borderColor: isDark ? "#334155" : "#E2E8F0",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? "#F8FAFC" : "#283593" },
                ]}
              >
                Calificar Servicio
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? "#94A3B8" : "#60646C" },
                ]}
                numberOfLines={1}
              >
                {profesionalNombre}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={enviando}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={22}
                color={isDark ? "#94A3B8" : "#60646C"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Selector de Estrellas Interactivas */}
            <View style={styles.starsContainer}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: isDark ? "#CBD5E1" : "#1E293B" },
                ]}
              >
                ¿Cómo calificarías el trabajo realizado?
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    activeOpacity={0.7}
                    onPress={() => setCalificacion(star)}
                    disabled={enviando}
                    style={styles.starTouchable}
                  >
                    <Ionicons
                      name={star <= calificacion ? "star" : "star-outline"}
                      size={36}
                      color={
                        star <= calificacion ? "#F59E0B" : isDark ? "#475569" : "#CBD5E1"
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.calificacionTexto}>
                {calificacionTextos[calificacion]}
              </Text>
            </View>

            {/* Campo de Comentario Opcional */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isDark ? "#CBD5E1" : "#1E293B" },
                  ]}
                >
                  Tu opinión sobre el servicio
                </Text>
                <Text style={styles.opcionalBadge}>Opcional</Text>
              </View>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                    borderColor: isDark ? "#334155" : "#E2E8F0",
                    color: isDark ? "#F8FAFC" : "#1E293B",
                  },
                ]}
                placeholder="Describe la puntualidad, prolijidad y resolución del oficio..."
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={comentario}
                onChangeText={setComentario}
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={!enviando}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {comentario.length}/500 caracteres
              </Text>
            </View>

            {/* Adjuntar Fotos (Máximo 2) */}
            <View style={styles.photosContainer}>
              <View style={styles.inputHeader}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isDark ? "#CBD5E1" : "#1E293B" },
                  ]}
                >
                  Fotos del resultado
                </Text>
                <Text style={styles.opcionalBadge}>Hasta 2 fotos</Text>
              </View>

              <View style={styles.thumbnailsRow}>
                {fotos.map((uri, index) => (
                  <View key={index} style={styles.thumbnailWrapper}>
                    <Image source={{ uri }} style={styles.thumbnailImage} />
                    <TouchableOpacity
                      onPress={() => handleRemovePhoto(index)}
                      disabled={enviando}
                      style={styles.removePhotoButton}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                {fotos.length < 2 && (
                  <TouchableOpacity
                    onPress={handlePickImage}
                    disabled={enviando}
                    style={[
                      styles.addPhotoButton,
                      {
                        backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                        borderColor: isDark ? "#334155" : "#CBD5E1",
                      },
                    ]}
                  >
                    <Ionicons name="camera-outline" size={24} color="#00BFA5" />
                    <Text
                      style={[
                        styles.addPhotoText,
                        { color: isDark ? "#94A3B8" : "#60646C" },
                      ]}
                    >
                      Adjuntar foto
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Banner de Advertencia: Inmutabilidad Closed-Loop */}
            <View style={styles.warningCard}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#D97706"
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Calificación Definitiva</Text>
                <Text style={styles.warningText}>
                  Las reseñas son permanentes y no pueden ser modificadas ni
                  eliminadas tras su publicación para garantizar la confianza de la
                  comunidad.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Botones de Acción */}
          <View
            style={[
              styles.actionsRow,
              {
                borderTopColor: isDark ? "#334155" : "#E2E8F0",
              },
            ]}
          >
            {/* Botón Ghost/Outline: Cancelar */}
            <TouchableOpacity
              onPress={onClose}
              disabled={enviando}
              style={[
                styles.ghostButton,
                {
                  borderColor: isDark ? "#475569" : "#CBD5E1",
                },
              ]}
            >
              <Text
                style={[
                  styles.ghostButtonText,
                  { color: isDark ? "#CBD5E1" : "#60646C" },
                ]}
              >
                Cancelar
              </Text>
            </TouchableOpacity>

            {/* Botón Primario: Publicar (#FF8C00) */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={enviando}
              style={[
                styles.primaryButton,
                enviando && { opacity: 0.7 },
              ]}
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Publicar reseña</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.15)",
  },
  title: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(150, 150, 150, 0.1)",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  starsContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 4,
  },
  starTouchable: {
    padding: 4,
  },
  calificacionTexto: {
    fontFamily: "PlusJakartaSans-SemiBold",
    fontSize: 13,
    color: "#F59E0B",
    marginTop: 6,
    fontWeight: "700",
  },
  inputContainer: {
    gap: 6,
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  opcionalBadge: {
    fontSize: 12,
    color: "#00BFA5",
    fontWeight: "600",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    minHeight: 88,
    fontFamily: "PlusJakartaSans-Regular",
  },
  charCount: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 2,
  },
  photosContainer: {
    gap: 8,
  },
  thumbnailsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  thumbnailWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  removePhotoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  warningCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400E",
    marginBottom: 2,
  },
  warningText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#78350F",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  ghostButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FF8C00",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});

