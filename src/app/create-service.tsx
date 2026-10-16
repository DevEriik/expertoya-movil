import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { OficioOption } from "@/types/service";
import { apiClient } from "@/utils/api";
import {
  getServiceById,
  MAX_ACTIVE_SERVICES,
  saveService,
} from "@/utils/servicesStorage";

const FALLBACK_OFICIOS: OficioOption[] = [
  { id: 1, nombre_oficio: "Electricista" },
  { id: 2, nombre_oficio: "Plomero" },
  { id: 3, nombre_oficio: "Gasista" },
  { id: 4, nombre_oficio: "Pintor" },
  { id: 5, nombre_oficio: "Cerrajero" },
  { id: 6, nombre_oficio: "Refrigeración" },
  { id: 7, nombre_oficio: "Albañilería" },
];

const SUGGESTED_DURATIONS = [
  "1 hora",
  "1 a 2 horas",
  "2 a 3 horas",
  "Media jornada",
  "1 día",
];

export default function CreateServiceModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const params = useLocalSearchParams<{ serviceId?: string }>();
  const isEditing = Boolean(params.serviceId);

  // Form State
  const [title, setTitle] = useState("");
  const [selectedOficioId, setSelectedOficioId] = useState<number>(1);
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [servicioActivo, setServicioActivo] = useState(true);

  // Aux state
  const [oficios, setOficios] = useState<OficioOption[]>(FALLBACK_OFICIOS);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Cargar lista de oficios desde el backend o usar fallback
  useEffect(() => {
    let isMounted = true;
    const fetchOficios = async () => {
      try {
        const res = await apiClient("/api/professionals/oficios");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            setOficios(data);
          }
        }
      } catch {
        // Mantiene fallback silenciosamente
      }
    };
    fetchOficios();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (params.serviceId) {
      setIsLoadingData(true);
      getServiceById(params.serviceId)
        .then((existing) => {
          if (existing) {
            setTitle(existing.titulo_servicio || "");
            setSelectedOficioId(existing.oficio_id || 1);
            setPrice(existing.costo_estimado ? String(existing.costo_estimado) : "");
            setDuration(existing.duracion_estimada || "");
            setDescription(existing.descripcion_servicio || "");
            setFotos(existing.fotos_servicio || []);
            setServicioActivo(existing.servicio_activo ?? true);
          }
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [params.serviceId]);

  const handleClose = () => {
    if (router.canDismiss()) {
      router.dismiss();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/account-details");
    }
  };

  // Selector de Fotos con expo-image-picker (máximo 3 fotos)
  const handlePickImage = async () => {
    if (fotos.length >= 3) {
      Alert.alert(
        "Límite de fotografías",
        "Solo puedes adjuntar hasta 3 fotografías representativas del trabajo terminado.",
      );
      return;
    }

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permisos Requeridos",
          "Se requiere acceso a la galería para seleccionar fotos del trabajo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        setFotos((prev) => [...prev, newUri]);
      }
    } catch (err) {
      console.error("Error al seleccionar imagen:", err);
      Alert.alert("Error", "No se pudo cargar la imagen seleccionada.");
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setFotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Botón Asistente IA (Generador de descripciones comerciales)
  const handleAIAssistant = () => {
    if (!title.trim()) {
      Alert.alert(
        "Asistente IA",
        "Por favor escribe un título primero para que la IA genere una descripción adaptada a tu servicio.",
      );
      return;
    }

    setAiGenerating(true);
    // Simulación de respuesta inmediata de IA (UI solicitada en alcance prioritario)
    setTimeout(() => {
      const oficioNombre =
        oficios.find((o) => o.id === selectedOficioId)?.nombre_oficio || "Oficio";
      const generated = `Servicio integral de ${title.trim()} (${oficioNombre}). Trabajo profesional con materiales de primera calidad, diagnóstico exhaustivo y cumplimiento estricto de normas de seguridad. Se garantiza prolijidad, puntualidad y asesoramiento personalizado para asegurar el óptimo funcionamiento y durabilidad.`;

      setDescription(generated);
      setAiGenerating(false);
    }, 600);
  };

  // Guardar Servicio (Creación o Edición) con validación
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Campo Obligatorio", "Por favor ingresa el título del servicio.");
      return;
    }

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert(
        "Precio Inválido",
        "Ingresa un costo estimado válido para el servicio.",
      );
      return;
    }

    if (!duration.trim()) {
      Alert.alert(
        "Campo Obligatorio",
        "Indica el tiempo o duración estimada del trabajo.",
      );
      return;
    }

    const currentOficio = oficios.find((o) => o.id === selectedOficioId);

    setIsSaving(true);
    try {
      await saveService({
        ...(isEditing && params.serviceId ? { id: params.serviceId } : {}),
        oficio_id: selectedOficioId,
        nombre_oficio: currentOficio?.nombre_oficio || "Oficio",
        titulo_servicio: title.trim(),
        descripcion_servicio: description.trim(),
        costo_estimado: numericPrice,
        duracion_estimada: duration.trim(),
        fotos_servicio: fotos,
        servicio_activo: servicioActivo,
      });

      handleClose();
    } catch (err: any) {
      Alert.alert(
        "No se pudo guardar",
        err.message ||
          `Verifica las condiciones o el límite máximo de ${MAX_ACTIVE_SERVICES} servicios activos.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: isDark ? "#2A3649" : "#E2E8F0",
              marginTop: Math.max(insets.top + 16, 28),
              marginBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.headerRow,
              { borderBottomColor: isDark ? "#2A3649" : "#F1F5F9" },
            ]}
          >
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isEditing ? "Editar Servicio" : "Nuevo Servicio"}
              </Text>
              <Text
                style={[
                  styles.modalSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Completa los datos de tu tarifa y trabajo
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? "#2A3649" : "#F1F5F9" },
              ]}
              onPress={handleClose}
              activeOpacity={0.7}
              accessibilityLabel="Cerrar modal"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {isLoadingData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollInner}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Título */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Título del Servicio <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: isDark ? "#374151" : "#CBD5E1",
                      backgroundColor: isDark ? "#121826" : "#FFFFFF",
                      color: colors.text,
                    },
                  ]}
                  placeholder="Ej: Cambio de Disyuntor y Térmica"
                  placeholderTextColor={colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={90}
                />
              </View>

              {/* Categoría / Oficio */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Categoría / Oficio <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.oficiosRow}
                >
                  {oficios.map((oficio) => {
                    const isSelected = oficio.id === selectedOficioId;
                    return (
                      <TouchableOpacity
                        key={oficio.id}
                        style={[
                          styles.oficioChip,
                          {
                            borderColor: isSelected
                              ? colors.primary
                              : isDark
                              ? "#374151"
                              : "#E2E8F0",
                            backgroundColor: isSelected
                              ? isDark
                                ? "rgba(255, 183, 77, 0.2)"
                                : "rgba(255, 140, 0, 0.12)"
                              : isDark
                              ? "#121826"
                              : "#F8FAFC",
                          },
                        ]}
                        onPress={() => setSelectedOficioId(oficio.id)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={colors.primary}
                          />
                        )}
                        <Text
                          style={[
                            styles.oficioChipText,
                            {
                              color: isSelected ? colors.primary : colors.text,
                              fontWeight: isSelected ? "700" : "500",
                            },
                          ]}
                        >
                          {oficio.nombre_oficio}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Fila: Precio Estimado y Duración */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Precio Estimado (ARS) <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.priceInputWrapper,
                      {
                        borderColor: isDark ? "#374151" : "#CBD5E1",
                        backgroundColor: isDark ? "#121826" : "#FFFFFF",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyPrefix,
                        { color: colors.textSecondary },
                      ]}
                    >
                      $
                    </Text>
                    <TextInput
                      style={[styles.priceInput, { color: colors.text }]}
                      placeholder="Ej: 25000"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={price}
                      onChangeText={setPrice}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Duración Estimada <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: isDark ? "#374151" : "#CBD5E1",
                        backgroundColor: isDark ? "#121826" : "#FFFFFF",
                        color: colors.text,
                      },
                    ]}
                    placeholder="Ej: 1 a 2 horas"
                    placeholderTextColor={colors.textSecondary}
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
              </View>

              {/* Chips sugeridos de duración */}
              <View style={styles.suggestedDurationContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {SUGGESTED_DURATIONS.map((dur) => (
                    <TouchableOpacity
                      key={dur}
                      style={[
                        styles.smallDurationChip,
                        {
                          borderColor:
                            duration === dur
                              ? colors.primary
                              : isDark
                              ? "#374151"
                              : "#E2E8F0",
                          backgroundColor:
                            duration === dur
                              ? isDark
                                ? "rgba(255, 183, 77, 0.15)"
                                : "rgba(255, 140, 0, 0.08)"
                              : "transparent",
                        },
                      ]}
                      onPress={() => setDuration(dur)}
                    >
                      <Text
                        style={[
                          styles.smallDurationText,
                          {
                            color:
                              duration === dur
                                ? colors.primary
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        ⏱️ {dur}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Descripción Comercial y Botón IA */}
              <View style={styles.inputGroup}>
                <View style={styles.labelWithActionRow}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Descripción Comercial
                  </Text>

                  {/* Botón Secundario Asistente IA (Brand Guidelines) */}
                  <TouchableOpacity
                    style={[
                      styles.secondaryAiButton,
                      {
                        borderColor: isDark ? "#4B5563" : "#283593",
                        backgroundColor: isDark
                          ? "rgba(40, 53, 147, 0.15)"
                          : "rgba(40, 53, 147, 0.04)",
                      },
                    ]}
                    onPress={handleAIAssistant}
                    activeOpacity={0.7}
                    disabled={aiGenerating}
                  >
                    {aiGenerating ? (
                      <ActivityIndicator
                        size="small"
                        color={isDark ? "#FFB74D" : "#283593"}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name="sparkles-outline"
                          size={14}
                          color={isDark ? "#FFB74D" : "#283593"}
                        />
                        <Text
                          style={[
                            styles.secondaryAiButtonText,
                            { color: isDark ? "#FFB74D" : "#283593" },
                          ]}
                        >
                          Asistente IA
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.textArea,
                    {
                      borderColor: isDark ? "#374151" : "#CBD5E1",
                      backgroundColor: isDark ? "#121826" : "#FFFFFF",
                      color: colors.text,
                    },
                  ]}
                  placeholder="Detalla qué incluye el trabajo, materiales, garantías o condiciones..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Fotos del Trabajo Terminado (Hasta 3 fotos) */}
              <View style={styles.inputGroup}>
                <View style={styles.labelWithActionRow}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Fotografías del trabajo terminado
                  </Text>
                  <Text
                    style={[
                      styles.photoCounter,
                      {
                        color:
                          fotos.length >= 3
                            ? colors.primary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {fotos.length}/3 fotos
                  </Text>
                </View>

                <View style={styles.photosGrid}>
                  {fotos.map((uri, idx) => (
                    <View
                      key={uri + idx}
                      style={[
                        styles.photoThumbWrapper,
                        { borderColor: isDark ? "#374151" : "#CBD5E1" },
                      ]}
                    >
                      <Image source={{ uri }} style={styles.photoThumb} />
                      <TouchableOpacity
                        style={styles.removePhotoBtn}
                        onPress={() => handleRemovePhoto(idx)}
                        activeOpacity={0.8}
                        accessibilityLabel="Eliminar foto"
                      >
                        <Ionicons
                          name="close-circle"
                          size={22}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {fotos.length < 3 && (
                    <TouchableOpacity
                      style={[
                        styles.addPhotoButton,
                        {
                          borderColor: isDark ? "#374151" : "#CBD5E1",
                          backgroundColor: isDark ? "#121826" : "#F8FAFC",
                        },
                      ]}
                      onPress={handlePickImage}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={26}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.addPhotoText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Adjuntar foto
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Interruptor: Servicio Activo / Pausado */}
              <View
                style={[
                  styles.switchContainer,
                  {
                    borderColor: isDark ? "#2A3649" : "#E2E8F0",
                    backgroundColor: isDark ? "#121826" : "#F8FAFC",
                  },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={styles.switchTitleRow}>
                    <Ionicons
                      name={servicioActivo ? "checkmark-circle" : "pause-circle"}
                      size={18}
                      color={
                        servicioActivo
                          ? isDark
                            ? "#34D399"
                            : "#10B981"
                          : isDark
                          ? "#FBBF24"
                          : "#F59E0B"
                      }
                    />
                    <Text
                      style={[
                        styles.switchLabel,
                        { color: colors.text },
                      ]}
                    >
                      {servicioActivo ? "Servicio Activo" : "Servicio Pausado"}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.switchDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {servicioActivo
                      ? "Visible para clientes en el directorio de búsqueda."
                      : "Oculto temporalmente. No suma a los 30 servicios activos."}
                  </Text>
                </View>

                <Switch
                  value={servicioActivo}
                  onValueChange={setServicioActivo}
                  trackColor={{
                    false: isDark ? "#374151" : "#CBD5E1",
                    true: colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </ScrollView>
          )}

          {/* Footer Save Button */}
          <View
            style={[
              styles.footer,
              { borderTopColor: isDark ? "#2A3649" : "#F1F5F9" },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isSaving ? 0.7 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color="#FFF"
                  />
                  <Text style={styles.buttonText}>
                    {isEditing ? "Guardar Cambios" : "Publicar Servicio"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "92%",
    maxWidth: 580,
    maxHeight: "90%",
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  labelWithActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: 12,
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },
  oficiosRow: {
    gap: 8,
    paddingVertical: 4,
  },
  oficioChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.2,
  },
  oficioChipText: {
    fontSize: 13,
  },
  suggestedDurationContainer: {
    marginTop: -8,
  },
  smallDurationChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  smallDurationText: {
    fontSize: 11,
    fontWeight: "600",
  },
  textArea: {
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 88,
  },
  secondaryAiButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  secondaryAiButtonText: {
    fontSize: 11,
    fontWeight: "700",
  },
  photoCounter: {
    fontSize: 12,
    fontWeight: "600",
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  photoThumbWrapper: {
    width: 84,
    height: 84,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  photoThumb: {
    width: "100%",
    height: "100%",
  },
  removePhotoBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 84,
    height: 84,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  switchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  switchDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
