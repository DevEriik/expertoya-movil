import React, { useEffect, useMemo, useRef, useState } from "react";
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
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/context/AccessibilityContext";
import { OficioOption } from "@/types/service";
import { apiClient } from "@/utils/api";
import {
  deleteService,
  getServiceById,
  MAX_ACTIVE_SERVICES,
  saveService,
} from "@/utils/servicesStorage";

const FONT_FAMILY = Platform.select({
  web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  ios: "System",
  default: "sans-serif",
});

const FALLBACK_OFICIOS: OficioOption[] = [
  { id: 1, nombre_oficio: "Plomero" },
  { id: 2, nombre_oficio: "Gasista Matriculado" },
  { id: 3, nombre_oficio: "Electricista" },
  { id: 4, nombre_oficio: "Pintor" },
  { id: 5, nombre_oficio: "Cerrajero" },
  { id: 6, nombre_oficio: "Refrigeración" },
  { id: 7, nombre_oficio: "Albañilería" },
  { id: 8, nombre_oficio: "Carpintero" },
];

const SUGGESTED_DURATIONS = [
  "1 hora",
  "1 a 2 horas",
  "2 a 3 horas",
  "Media jornada",
  "1 día",
  "2 a 3 días",
];

export default function CreateServiceModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();

  const params = useLocalSearchParams<{ serviceId?: string }>();
  const isEditing = Boolean(params.serviceId);

  const [title, setTitle] = useState("");
  const [selectedOficioId, setSelectedOficioId] = useState<number>(1);
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [servicioActivo, setServicioActivo] = useState(true);

  const [oficios, setOficios] = useState<OficioOption[]>(FALLBACK_OFICIOS);
  const [approvedOficios, setApprovedOficios] = useState<OficioOption[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (Platform.OS === "web" && typeof navigator !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiElapsedSeconds, setAiElapsedSeconds] = useState(0);
  const [aiGeneratedSuccess, setAiGeneratedSuccess] = useState(false);
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const approvedIds = useMemo(() => {
    return new Set(approvedOficios.map((o) => o.id));
  }, [approvedOficios]);

  const displayOficios = useMemo(() => {
    if (approvedOficios.length === 0) return oficios;
    return [...oficios].sort((a, b) => {
      const aApp = approvedIds.has(a.id) ? 1 : 0;
      const bApp = approvedIds.has(b.id) ? 1 : 0;
      return bApp - aApp;
    });
  }, [oficios, approvedIds, approvedOficios.length]);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) {
        clearInterval(aiTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        setLoadingProfile(true);
        const resOficios = await apiClient("/api/professionals/oficios");
        if (resOficios.ok) {
          const dataOficios = await resOficios.json();
          if (Array.isArray(dataOficios) && dataOficios.length > 0 && isMounted) {
            setOficios(dataOficios);
          }
        }

        const resProfile = await apiClient("/api/professionals/profile");
        if (resProfile.ok) {
          const proData = await resProfile.json();
          if (Array.isArray(proData.oficios) && proData.oficios.length > 0 && isMounted) {
            const userApproved: OficioOption[] = proData.oficios.map((o: any) => ({
              id: Number(o.id),
              nombre_oficio: o.nombre_oficio || o.nombre || `Oficio ${o.id}`,
              descripcion_oficio: o.descripcion_oficio || null,
            }));
            setApprovedOficios(userApproved);

            if (!params.serviceId && userApproved.length > 0) {
              setSelectedOficioId(userApproved[0].id);
            }
          }
        }
      } catch (err) {
        console.warn("Error cargando oficios o perfil profesional:", err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [params.serviceId]);

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

  const resolveImageUri = async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
    if (asset.base64) {
      return `data:image/jpeg;base64,${asset.base64}`;
    }
    if (Platform.OS === "web" && asset.uri && asset.uri.startsWith("blob:")) {
      try {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(asset.uri);
          reader.readAsDataURL(blob);
        });
      } catch {
        return asset.uri;
      }
    }
    return asset.uri;
  };

  const handlePickFromGallery = async () => {
    if (fotos.length >= 3) {
      Alert.alert(
        "Límite de fotografías",
        "Solo puedes adjuntar hasta 3 fotografías representativas del trabajo terminado.",
      );
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permisos requeridos",
          "Se requiere acceso a la galería para seleccionar fotos del trabajo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const resolvedUri = await resolveImageUri(result.assets[0]);
        setFotos((prev) => [...prev, resolvedUri]);
      }
    } catch (err) {
      console.error("Error al seleccionar imagen:", err);
      Alert.alert("Error", "No se pudo cargar la imagen de la galería.");
    }
  };

  const handleTakePhoto = async () => {
    if (fotos.length >= 3) {
      Alert.alert(
        "Límite de fotografías",
        "Solo puedes adjuntar hasta 3 fotografías representativas del trabajo terminado.",
      );
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permisos requeridos",
          "Se requiere acceso a la cámara para tomar fotos de tus trabajos.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const resolvedUri = await resolveImageUri(result.assets[0]);
        setFotos((prev) => [...prev, resolvedUri]);
      }
    } catch (err) {
      console.error("Error al tomar foto:", err);
      Alert.alert("Error", "No se pudo abrir la cámara.");
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setFotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleGenerateAIDescription = () => {
    if (!isOnline) {
      Alert.alert(
        "Sin conexión a internet",
        "No es posible utilizar el Asistente IA mientras el dispositivo no cuente con una conexión a internet activa. Revisa tu red móvil o Wi-Fi.",
        [{ text: "Entendido", style: "default" }],
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert(
        "Título requerido",
        "Por favor escribe el título del servicio antes de generar la descripción.",
        [{ text: "Completar Título", style: "default" }],
      );
      return;
    }

    setAiGenerating(true);
    setAiElapsedSeconds(0);
    setAiGeneratedSuccess(false);

    let elapsed = 0;
    const targetSimulatedTime = 3;

    if (aiTimerRef.current) clearInterval(aiTimerRef.current);

    aiTimerRef.current = setInterval(() => {
      elapsed += 1;
      setAiElapsedSeconds(elapsed);

      if (elapsed >= targetSimulatedTime) {
        if (aiTimerRef.current) clearInterval(aiTimerRef.current);

        const cleanTitle = title.trim();
        const generated = `Servicio profesional de ${cleanTitle}. Trabajo integral realizado con materiales de primera calidad, diagnóstico técnico exhaustivo y cumplimiento estricto de normas de seguridad. Se garantiza prolijidad, puntualidad y asesoramiento personalizado para asegurar un resultado óptimo y duradero.`;

        setDescription(generated);
        setAiGenerating(false);
        setAiGeneratedSuccess(true);
      }
    }, 1000);
  };

  const handleCancelAIGeneration = () => {
    if (aiTimerRef.current) {
      clearInterval(aiTimerRef.current);
    }
    setAiGenerating(false);
    setAiElapsedSeconds(0);
  };

  const handleDeleteService = () => {
    if (!params.serviceId) return;

    Alert.alert(
      "Eliminar Servicio",
      `¿Estás seguro de que deseas eliminar permanentemente "${title || "este servicio"}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar Servicio",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteService(params.serviceId!);
              handleClose();
            } catch (err: any) {
              Alert.alert("Error", err.message || "No se pudo eliminar el servicio.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

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

    if (approvedOficios.length > 0 && !approvedIds.has(selectedOficioId)) {
      Alert.alert(
        "Oficio No Habilitado",
        "Solo puedes crear o editar servicios en oficios que tengas aprobados en tu perfil profesional.",
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
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              borderColor: isDark ? "#374151" : "#E2E8F0",
              marginTop: Math.max(insets.top + 12, 24),
              marginBottom: Math.max(insets.bottom + 12, 20),
            },
          ]}
        >
          <View
            style={[
              styles.headerRow,
              {
                backgroundColor: isDark ? "#121826" : "#FDFCF4",
                borderBottomColor: isDark ? "#374151" : "#E2E8F0",
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.headerTitleRow}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? "#FDFCF4" : "#283593" },
                  ]}
                  numberOfLines={1}
                >
                  {isEditing ? "Editar Servicio" : "Nuevo Servicio"}
                </Text>
                <View
                  style={[
                    styles.modeBadge,
                    {
                      backgroundColor: isEditing
                        ? isDark
                          ? "rgba(51, 239, 165, 0.15)"
                          : "rgba(0, 191, 165, 0.12)"
                        : isDark
                          ? "rgba(255, 183, 77, 0.15)"
                          : "rgba(255, 140, 0, 0.12)",
                      borderColor: isEditing
                        ? isDark
                          ? "#33EFA5"
                          : "#00BFA5"
                        : isDark
                          ? "#FFB74D"
                          : "#FF8C00",
                    },
                  ]}
                >
                  <Ionicons
                    name={isEditing ? "create-outline" : "sparkles"}
                    size={12}
                    color={
                      isEditing
                        ? isDark
                          ? "#33EFA5"
                          : "#00BFA5"
                        : isDark
                          ? "#FFB74D"
                          : "#FF8C00"
                    }
                  />
                  <Text
                    style={[
                      styles.modeBadgeText,
                      {
                        color: isEditing
                          ? isDark
                            ? "#33EFA5"
                            : "#00BFA5"
                          : isDark
                            ? "#FFB74D"
                            : "#FF8C00",
                      },
                    ]}
                  >
                    {isEditing ? "Edición" : "Creación"}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.modalSubtitle,
                  { color: isDark ? "#94A3B8" : "#475569" },
                ]}
                numberOfLines={1}
              >
                Configura tarifas, fotos y descripción comercial
              </Text>
            </View>

            <View style={styles.headerActions}>
              {isEditing && (
                <TouchableOpacity
                  style={[
                    styles.headerIconBtn,
                    {
                      backgroundColor: isDark
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(239, 68, 68, 0.08)",
                      borderColor: isDark ? "#EF4444" : "#FCA5A5",
                    },
                  ]}
                  onPress={handleDeleteService}
                  activeOpacity={0.7}
                  accessibilityLabel="Eliminar este servicio"
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.headerIconBtn,
                  {
                    backgroundColor: isDark ? "#2A3649" : "#F1F5F9",
                    borderColor: isDark ? "#374151" : "#E2E8F0",
                  },
                ]}
                onPress={handleClose}
                activeOpacity={0.7}
                accessibilityLabel="Cerrar modal"
                accessibilityRole="button"
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={isDark ? "#FDFCF4" : "#283593"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {!isOnline && (
            <View
              style={[
                styles.offlineBanner,
                {
                  backgroundColor: isDark ? "#451A03" : "#FFFBEB",
                  borderColor: isDark ? "#F59E0B" : "#FBBF24",
                },
              ]}
              accessible={true}
              accessibilityRole="alert"
            >
              <Ionicons
                name="cloud-offline-outline"
                size={18}
                color={isDark ? "#FBBF24" : "#D97706"}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.offlineBannerTitle,
                    { color: isDark ? "#FBBF24" : "#B45309" },
                  ]}
                >
                  Sin conexión a internet activa
                </Text>
                <Text
                  style={[
                    styles.offlineBannerText,
                    { color: isDark ? "#FDE68A" : "#92400E" },
                  ]}
                >
                  Se requiere conexión activa para utilizar el Asistente IA.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.retryConnectionBtn}
                onPress={() => setIsOnline(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="refresh"
                  size={14}
                  color={isDark ? "#FBBF24" : "#B45309"}
                />
                <Text
                  style={[
                    styles.retryConnectionText,
                    { color: isDark ? "#FBBF24" : "#B45309" },
                  ]}
                >
                  Reconectar
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View
            style={[
              styles.connectionStatusBar,
              {
                backgroundColor: isDark ? "#121826" : "#F8FAFC",
                borderBottomColor: isDark ? "#2A3649" : "#E2E8F0",
              },
            ]}
          >
            <View style={styles.connectionStatusIndicator}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? "#10B981" : "#EF4444" },
                ]}
              />
              <Ionicons
                name={isOnline ? "wifi" : "cloud-offline"}
                size={12}
                color={isOnline ? (isDark ? "#34D399" : "#10B981") : "#EF4444"}
              />
              <Text
                style={[
                  styles.connectionStatusLabel,
                  { color: isDark ? "#94A3B8" : "#475569" },
                ]}
              >
                {isOnline ? "Dispositivo con Internet activo" : "Modo Sin Red (Offline)"}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.toggleSimBtn,
                {
                  borderColor: isDark ? "#374151" : "#CBD5E1",
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                },
              ]}
              onPress={() => setIsOnline((prev) => !prev)}
              activeOpacity={0.7}
              accessibilityLabel="Simular cambio de estado de red"
            >
              <Text
                style={[
                  styles.toggleSimText,
                  { color: isDark ? "#33EFA5" : "#00BFA5" },
                ]}
              >
                {isOnline ? "Simular Offline" : "Simular Online"}
              </Text>
            </TouchableOpacity>
          </View>

          {isLoadingData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={isDark ? "#FFB74D" : "#FF8C00"}
              />
              <Text
                style={[
                  styles.loadingText,
                  { color: isDark ? "#94A3B8" : "#475569" },
                ]}
              >
                Cargando información del servicio...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollInner}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#FDFCF4" : "#283593" },
                  ]}
                >
                  Título del Servicio <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: isDark ? "#374151" : "#CBD5E1",
                      backgroundColor: isDark ? "#121826" : "#FFFFFF",
                      color: isDark ? "#FDFCF4" : "#283593",
                    },
                  ]}
                  placeholder="Ej: Cambio de Disyuntor y Térmica"
                  placeholderTextColor={isDark ? "#94A3B8" : "#60646C"}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={90}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelWithActionRow}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? "#FDFCF4" : "#283593" },
                    ]}
                  >
                    Categoría / Oficio <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  {approvedOficios.length > 0 && (
                    <View
                      style={[
                        styles.approvedBadge,
                        {
                          backgroundColor: isDark
                            ? "rgba(52, 211, 153, 0.15)"
                            : "rgba(16, 185, 129, 0.12)",
                        },
                      ]}
                    >
                      <Ionicons
                        name="shield-checkmark"
                        size={12}
                        color={isDark ? "#34D399" : "#10B981"}
                      />
                      <Text
                        style={[
                          styles.approvedBadgeText,
                          { color: isDark ? "#34D399" : "#10B981" },
                        ]}
                      >
                        {approvedOficios.length} oficio{approvedOficios.length !== 1 ? "s" : ""} habilitado{approvedOficios.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  )}
                </View>

                {approvedOficios.length === 0 && !loadingProfile && (
                  <View
                    style={[
                      styles.noApprovedNotice,
                      {
                        backgroundColor: isDark ? "#451A03" : "#FFFBEB",
                        borderColor: isDark ? "#F59E0B" : "#FBBF24",
                      },
                    ]}
                  >
                    <Ionicons
                      name="warning-outline"
                      size={16}
                      color={isDark ? "#FBBF24" : "#D97706"}
                    />
                    <Text
                      style={[
                        styles.noApprovedNoticeText,
                        { color: isDark ? "#FDE68A" : "#92400E" },
                      ]}
                    >
                      Aún no tienes oficios aprobados en tu perfil profesional.
                      Debes tener al menos un oficio acreditado para publicar servicios.
                    </Text>
                  </View>
                )}

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.oficiosRow}
                >
                  {displayOficios.map((oficio) => {
                    const isApproved =
                      approvedOficios.length === 0 || approvedIds.has(oficio.id);
                    const isSelected = isApproved && oficio.id === selectedOficioId;

                    return (
                      <TouchableOpacity
                        key={oficio.id}
                        disabled={!isApproved}
                        style={[
                          styles.oficioChip,
                          !isApproved && styles.oficioChipDisabled,
                          isApproved && isSelected && {
                            borderColor: isDark ? "#FFB74D" : "#FF8C00",
                            backgroundColor: isDark
                              ? "rgba(255, 183, 77, 0.2)"
                              : "rgba(255, 140, 0, 0.12)",
                          },
                          isApproved && !isSelected && {
                            borderColor: isDark ? "#374151" : "#E2E8F0",
                            backgroundColor: isDark ? "#121826" : "#FDFCF4",
                          },
                          !isApproved && {
                            borderColor: isDark ? "#2A3649" : "#E2E8F0",
                            backgroundColor: isDark ? "#161E2E" : "#F1F5F9",
                          },
                        ]}
                        onPress={() => {
                          if (!isApproved) {
                            Alert.alert(
                              "Oficio No Aprobado",
                              "Solo puedes publicar servicios en oficios que ya tienes aprobados en tu perfil.",
                            );
                            return;
                          }
                          setSelectedOficioId(oficio.id);
                        }}
                        activeOpacity={isApproved ? 0.7 : 1}
                      >
                        {!isApproved && (
                          <Ionicons
                            name="lock-closed"
                            size={12}
                            color={isDark ? "#64748B" : "#94A3B8"}
                          />
                        )}
                        {isApproved && isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={isDark ? "#FFB74D" : "#FF8C00"}
                          />
                        )}
                        <Text
                          style={[
                            styles.oficioChipText,
                            !isApproved && {
                              color: isDark ? "#64748B" : "#94A3B8",
                              fontWeight: "400",
                            },
                            isApproved && isSelected && {
                              color: isDark ? "#FFB74D" : "#FF8C00",
                              fontWeight: "700",
                            },
                            isApproved && !isSelected && {
                              color: isDark ? "#FDFCF4" : "#283593",
                              fontWeight: "500",
                            },
                          ]}
                        >
                          {oficio.nombre_oficio}
                          {!isApproved && " (No habilitado)"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? "#FDFCF4" : "#283593" },
                    ]}
                  >
                    Precio Estimado (ARS) <Text style={styles.requiredAsterisk}>*</Text>
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
                        { color: isDark ? "#FFB74D" : "#FF8C00" },
                      ]}
                    >
                      $
                    </Text>
                    <TextInput
                      style={[
                        styles.priceInput,
                        { color: isDark ? "#FDFCF4" : "#283593" },
                      ]}
                      placeholder="Ej: 25000"
                      placeholderTextColor={isDark ? "#94A3B8" : "#60646C"}
                      keyboardType="numeric"
                      value={price}
                      onChangeText={setPrice}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? "#FDFCF4" : "#283593" },
                    ]}
                  >
                    Duración Estimada <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: isDark ? "#374151" : "#CBD5E1",
                        backgroundColor: isDark ? "#121826" : "#FFFFFF",
                        color: isDark ? "#FDFCF4" : "#283593",
                      },
                    ]}
                    placeholder="Ej: 1 a 2 horas"
                    placeholderTextColor={isDark ? "#94A3B8" : "#60646C"}
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
              </View>

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
                              ? isDark
                                ? "#FFB74D"
                                : "#FF8C00"
                              : isDark
                                ? "#374151"
                                : "#E2E8F0",
                          backgroundColor:
                            duration === dur
                              ? isDark
                                ? "rgba(255, 183, 77, 0.15)"
                                : "rgba(255, 140, 0, 0.08)"
                              : isDark
                                ? "#121826"
                                : "#FDFCF4",
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
                                ? isDark
                                  ? "#FFB74D"
                                  : "#FF8C00"
                                : isDark
                                  ? "#94A3B8"
                                  : "#475569",
                          },
                        ]}
                      >
                        ⏱️ {dur}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* ASISTENTE IA PARA REDACCIÓN COMERCIAL */}
              <View
                style={[
                  styles.aiCardContainer,
                  {
                    backgroundColor: isDark ? "#121826" : "#FDFCF4",
                    borderColor: isDark ? "#33EFA5" : "#00BFA5",
                  },
                ]}
              >
                <View style={styles.aiCardHeaderRow}>
                  <View style={styles.aiTitleWithIcon}>
                    <Ionicons
                      name="sparkles"
                      size={18}
                      color={isDark ? "#33EFA5" : "#00BFA5"}
                    />
                    <Text
                      style={[
                        styles.aiCardTitle,
                        { color: isDark ? "#33EFA5" : "#00897B" },
                      ]}
                      numberOfLines={1}
                    >
                      Asistente IA
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.aiCardDescription,
                    { color: isDark ? "#94A3B8" : "#475569" },
                  ]}
                >
                  Genera automáticamente un texto persuasivo, claro y profesional
                  adaptado al título de tu servicio para captar más clientes.
                </Text>

                <TouchableOpacity
                  style={[
                    styles.generateAiMainButton,
                    {
                      borderColor: !isOnline
                        ? isDark
                          ? "#4B5563"
                          : "#CBD5E1"
                        : isDark
                          ? "#33EFA5"
                          : "#283593",
                      backgroundColor: !isOnline
                        ? isDark
                          ? "#1F2937"
                          : "#F1F5F9"
                        : isDark
                          ? "rgba(51, 239, 165, 0.12)"
                          : "rgba(40, 53, 147, 0.06)",
                      opacity: aiGenerating ? 0.8 : 1,
                    },
                  ]}
                  onPress={handleGenerateAIDescription}
                  disabled={aiGenerating || !isOnline}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Generar descripción con IA"
                  accessibilityHint="Presiona para autogenerar una propuesta de texto comercial"
                >
                  {aiGenerating ? (
                    <View style={styles.aiLoadingRow}>
                      <ActivityIndicator
                        size="small"
                        color={isDark ? "#33EFA5" : "#283593"}
                      />
                      <Text
                        style={[
                          styles.aiLoadingText,
                          { color: isDark ? "#33EFA5" : "#283593" },
                        ]}
                      >
                        Generando propuesta con IA... ({aiElapsedSeconds}s / máx 10s)
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.aiButtonContentRow}>
                      <Ionicons
                        name={isOnline ? "sparkles" : "cloud-offline-outline"}
                        size={18}
                        color={
                          !isOnline
                            ? isDark
                              ? "#94A3B8"
                              : "#64748B"
                            : isDark
                              ? "#33EFA5"
                              : "#283593"
                        }
                      />
                      <Text
                        style={[
                          styles.generateAiMainButtonText,
                          {
                            color: !isOnline
                              ? isDark
                                ? "#94A3B8"
                                : "#64748B"
                              : isDark
                                ? "#33EFA5"
                                : "#283593",
                            fontSize: !isOnline ? 13 : 14,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {isOnline
                          ? "Generar descripción con IA"
                          : "IA no disponible sin conexión"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {aiGenerating && (
                  <View style={styles.aiCancelRow}>
                    <TouchableOpacity
                      onPress={handleCancelAIGeneration}
                      style={styles.aiCancelBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
                      <Text style={styles.aiCancelBtnText}>
                        Cancelar espera
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {aiGeneratedSuccess && (
                  <View
                    style={[
                      styles.aiSuccessBadge,
                      {
                        backgroundColor: isDark
                          ? "rgba(52, 211, 153, 0.15)"
                          : "rgba(16, 185, 129, 0.12)",
                        borderColor: isDark ? "#34D399" : "#10B981",
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={isDark ? "#34D399" : "#10B981"}
                    />
                    <Text
                      style={[
                        styles.aiSuccessText,
                        { color: isDark ? "#34D399" : "#047857" },
                      ]}
                    >
                      ¡Texto generado con éxito! Puedes editarlo libremente en el recuadro a continuación.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelWithActionRow}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? "#FDFCF4" : "#283593" },
                    ]}
                  >
                    Descripción Comercial
                  </Text>

                  <View style={styles.descActionsRow}>
                    {Boolean(description) && (
                      <TouchableOpacity
                        onPress={() => setDescription("")}
                        style={styles.clearDescBtn}
                        activeOpacity={0.7}
                        accessibilityLabel="Limpiar texto de descripción"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={13}
                          color={isDark ? "#94A3B8" : "#64748B"}
                        />
                        <Text
                          style={[
                            styles.clearDescText,
                            { color: isDark ? "#94A3B8" : "#64748B" },
                          ]}
                        >
                          Limpiar
                        </Text>
                      </TouchableOpacity>
                    )}

                    <Text
                      style={[
                        styles.charCounter,
                        { color: isDark ? "#94A3B8" : "#64748B" },
                      ]}
                    >
                      {description.length}/600
                    </Text>
                  </View>
                </View>

                <TextInput
                  style={[
                    styles.textArea,
                    {
                      borderColor: isDark ? "#374151" : "#CBD5E1",
                      backgroundColor: isDark ? "#121826" : "#FFFFFF",
                      color: isDark ? "#FDFCF4" : "#283593",
                    },
                  ]}
                  placeholder="Detalla qué incluye el trabajo, materiales, garantías o condiciones..."
                  placeholderTextColor={isDark ? "#94A3B8" : "#60646C"}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={600}
                />
              </View>

              <View
                style={[
                  styles.imageUploadCard,
                  {
                    backgroundColor: isDark ? "#121826" : "#FDFCF4",
                    borderColor: isDark ? "#374151" : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.labelWithActionRow}>
                  <View style={[styles.sectionHeaderWithIcon, { flex: 1, marginRight: 8 }]}>
                    <Ionicons
                      name="images-outline"
                      size={18}
                      color={isDark ? "#FFB74D" : "#FF8C00"}
                    />
                    <Text
                      style={[
                        styles.label,
                        { color: isDark ? "#FDFCF4" : "#283593", marginBottom: 0, flex: 1 },
                      ]}
                      numberOfLines={1}
                    >
                      Fotos
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.photoCountBadge,
                      {
                        backgroundColor:
                          fotos.length >= 3
                            ? isDark
                              ? "rgba(255, 183, 77, 0.2)"
                              : "rgba(255, 140, 0, 0.15)"
                            : isDark
                              ? "#1F2937"
                              : "#F1F5F9",
                        borderColor:
                          fotos.length >= 3
                            ? isDark
                              ? "#FFB74D"
                              : "#FF8C00"
                            : isDark
                              ? "#374151"
                              : "#CBD5E1",
                      },
                    ]}
                  >
                    <Ionicons
                      name="camera"
                      size={12}
                      color={
                        fotos.length >= 3
                          ? isDark
                            ? "#FFB74D"
                            : "#FF8C00"
                          : isDark
                            ? "#94A3B8"
                            : "#64748B"
                      }
                    />
                    <Text
                      style={[
                        styles.photoCounter,
                        {
                          color:
                            fotos.length >= 3
                              ? isDark
                                ? "#FFB74D"
                                : "#FF8C00"
                              : isDark
                                ? "#94A3B8"
                                : "#64748B",
                        },
                      ]}
                    >
                      {fotos.length}/3 fotos
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.uploadInstructions,
                    { color: isDark ? "#94A3B8" : "#475569" },
                  ]}
                >
                  Adjunta hasta 3 fotos de trabajos reales realizados para aumentar la
                  confianza de tus clientes potenciales.
                </Text>

                {fotos.length < 3 && (
                  <View style={styles.uploadButtonsRow}>
                    <TouchableOpacity
                      style={[
                        styles.uploadActionButton,
                        {
                          borderColor: isDark ? "#374151" : "#CBD5E1",
                          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                        },
                      ]}
                      onPress={handlePickFromGallery}
                      activeOpacity={0.7}
                      accessibilityLabel="Subir foto desde galería"
                    >
                      <Ionicons
                        name="images-outline"
                        size={20}
                        color={isDark ? "#33EFA5" : "#00BFA5"}
                      />
                      <Text
                        style={[
                          styles.uploadActionText,
                          { color: isDark ? "#FDFCF4" : "#283593" },
                        ]}
                      >
                        Abrir Galería
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.uploadActionButton,
                        {
                          borderColor: isDark ? "#374151" : "#CBD5E1",
                          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                        },
                      ]}
                      onPress={handleTakePhoto}
                      activeOpacity={0.7}
                      accessibilityLabel="Tomar fotografía con cámara"
                    >
                      <Ionicons
                        name="camera-outline"
                        size={20}
                        color={isDark ? "#FFB74D" : "#FF8C00"}
                      />
                      <Text
                        style={[
                          styles.uploadActionText,
                          { color: isDark ? "#FDFCF4" : "#283593" },
                        ]}
                      >
                        Tomar Foto
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}


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
                      <View style={styles.photoNumberBadge}>
                        <Text style={styles.photoNumberText}>#{idx + 1}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removePhotoBtn}
                        onPress={() => handleRemovePhoto(idx)}
                        activeOpacity={0.8}
                        accessibilityLabel={`Eliminar foto número ${idx + 1}`}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {fotos.length === 0 && (
                    <View
                      style={[
                        styles.emptyPhotosState,
                        {
                          borderColor: isDark ? "#374151" : "#CBD5E1",
                          backgroundColor: isDark ? "#121826" : "#FFFFFF",
                        },
                      ]}
                    >
                      <Ionicons
                        name="cloud-upload-outline"
                        size={32}
                        color={isDark ? "#94A3B8" : "#94A3B8"}
                      />
                      <Text
                        style={[
                          styles.emptyPhotosTitle,
                          { color: isDark ? "#FDFCF4" : "#283593" },
                        ]}
                      >
                        Sin fotos adjuntadas
                      </Text>
                      <Text
                        style={[
                          styles.emptyPhotosSubtitle,
                          { color: isDark ? "#94A3B8" : "#64748B" },
                        ]}
                      >
                        Toca arriba para elegir de la galería o tomar una foto
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View
                style={[
                  styles.switchContainer,
                  {
                    borderColor: isDark ? "#374151" : "#E2E8F0",
                    backgroundColor: isDark ? "#121826" : "#FDFCF4",
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
                        { color: isDark ? "#FDFCF4" : "#283593" },
                      ]}
                    >
                      {servicioActivo ? "Servicio Activo" : "Servicio Pausado"}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.switchDescription,
                      { color: isDark ? "#94A3B8" : "#475569" },
                    ]}
                  >
                    {servicioActivo
                      ? "Visible para clientes en el directorio de búsqueda de ExpertoYa."
                      : "Oculto temporalmente. No suma a los 30 servicios activos."}
                  </Text>
                </View>

                <Switch
                  value={servicioActivo}
                  onValueChange={setServicioActivo}
                  trackColor={{
                    false: colors.backgroundSelected,
                    true: colors.secondary,
                  }}
                  thumbColor={servicioActivo ? "#FFFFFF" : "#F4F4F5"}
                />
              </View>

              {isEditing && (
                <View
                  style={[
                    styles.dangerZoneCard,
                    {
                      borderColor: isDark
                        ? "rgba(239, 68, 68, 0.4)"
                        : "rgba(239, 68, 68, 0.3)",
                      backgroundColor: isDark
                        ? "rgba(239, 68, 68, 0.08)"
                        : "#FEF2F2",
                    },
                  ]}
                >
                  <View style={styles.dangerZoneHeader}>
                    <Ionicons name="warning-outline" size={18} color="#EF4444" />
                    <Text style={styles.dangerZoneTitle}>
                      Gestión del Servicio
                    </Text>
                  </View>

                  <Text style={styles.dangerZoneSubtitle}>
                    Si ya no ofreces este trabajo, puedes darlo de baja permanentemente.
                  </Text>

                  <TouchableOpacity
                    style={styles.deleteFullButton}
                    onPress={handleDeleteService}
                    disabled={isDeleting}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar definitivamente este servicio"
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <>
                        <Ionicons name="trash" size={16} color="#EF4444" />
                        <Text style={styles.deleteFullButtonText}>
                          Eliminar este Servicio
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          <View
            style={[
              styles.footer,
              {
                backgroundColor: isDark ? "#121826" : "#FDFCF4",
                borderTopColor: isDark ? "#374151" : "#E2E8F0",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelFooterBtn,
                {
                  borderColor: isDark ? "#4B5563" : "#CBD5E1",
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                },
              ]}
              onPress={handleClose}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cancelFooterText,
                  { color: isDark ? "#FDFCF4" : "#475569" },
                ]}
              >
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: isDark ? "#FFB74D" : "#FF8C00",
                  opacity: isSaving ? 0.7 : 1,
                  flex: 2,
                },
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator
                  color={isDark ? "#121826" : "#FFFFFF"}
                  size="small"
                />
              ) : (
                <>
                  <Ionicons
                    name={isEditing ? "save-outline" : "cloud-upload-outline"}
                    size={20}
                    color={isDark ? "#121826" : "#FFFFFF"}
                  />
                  <Text
                    style={[
                      styles.buttonText,
                      { color: isDark ? "#121826" : "#FFFFFF" },
                    ]}
                  >
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
    maxWidth: 600,
    maxHeight: "92%",
    borderRadius: 24,
    borderWidth: 1.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
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
    borderBottomWidth: 1.2,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "nowrap",
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  offlineBannerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: "700",
  },
  offlineBannerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: "500",
  },
  retryConnectionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  retryConnectionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: "700",
  },
  connectionStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  connectionStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionStatusLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: "600",
  },
  toggleSimBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleSimText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: "700",
  },
  loadingContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: "500",
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
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  requiredAsterisk: {
    color: "#EF4444",
  },
  labelWithActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: "800",
    marginRight: 6,
  },
  priceInput: {
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  oficioChipDisabled: {
    opacity: 0.5,
    borderStyle: "dashed",
  },
  approvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  approvedBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: "700",
  },
  noApprovedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  noApprovedNoticeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
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
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: "600",
  },
  aiCardContainer: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  aiCardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiTitleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  aiCardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
  },
  aiCardDescription: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 17,
  },
  generateAiMainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.8,
    width: "100%",
  },
  aiButtonContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    maxWidth: "100%",
    paddingHorizontal: 4,
  },
  generateAiMainButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.1,
    textAlign: "center",
    flexShrink: 1,
  },
  aiLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiLoadingText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: "700",
  },
  aiCancelRow: {
    alignItems: "center",
  },
  aiCancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  aiCancelBtnText: {
    fontFamily: FONT_FAMILY,
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "600",
  },
  aiSuccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  aiSuccessText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    lineHeight: 16,
  },
  descActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clearDescBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clearDescText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: "600",
  },
  charCounter: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: "600",
  },
  textArea: {
    fontFamily: FONT_FAMILY,
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 110,
    lineHeight: 20,
  },
  imageUploadCard: {
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  sectionHeaderWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  photoCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 0,
  },
  photoCounter: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: "700",
  },
  uploadInstructions: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 16,
  },
  uploadButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  uploadActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.2,
  },
  uploadActionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: "700",
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 2,
  },
  photoThumbWrapper: {
    width: 86,
    height: 86,
    borderRadius: 12,
    borderWidth: 1.2,
    overflow: "hidden",
    position: "relative",
  },
  photoThumb: {
    width: "100%",
    height: "100%",
  },
  photoNumberBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  photoNumberText: {
    fontFamily: FONT_FAMILY,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  removePhotoBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  emptyPhotosState: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyPhotosTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyPhotosSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  switchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  switchLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: "700",
  },
  switchDescription: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 16,
  },
  dangerZoneCard: {
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 14,
    gap: 8,
  },
  dangerZoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dangerZoneTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: "800",
    color: "#EF4444",
  },
  dangerZoneSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: "#EF4444",
    opacity: 0.9,
    lineHeight: 16,
  },
  deleteFullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: "#EF4444",
    backgroundColor: "#FFFFFF",
    marginTop: 4,
  },
  deleteFullButtonText: {
    fontFamily: FONT_FAMILY,
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1.2,
  },
  cancelFooterBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelFooterText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: "700",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: "800",
  },
});
