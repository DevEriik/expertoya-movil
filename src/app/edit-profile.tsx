import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";

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

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProfilePreviewModal from "@/components/ProfilePreviewModal";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/context/AccessibilityContext";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import { isAdmin, isCliente, isProfesional } from "@/utils/roles";

const ZONAS_SUGERIDAS = [
  "Neuquén",
  "Cipolletti",
  "Plottier",
  "Fernandez Oro",
  "Allen",
  "Cutral Co",
  "Zapala",
  "General Roca",
  "Centenario",
  "Villa Regina",
];

export interface OficioItem {
  id: number;
  nombre: string;
  nombre_oficio?: string;
  descripcion_oficio?: string;
  requiresLicense: boolean;
  licenseAuthority?: string;
}

export const OFICIOS_CATALOGO: OficioItem[] = [
  { id: 1, nombre: "Plomero", requiresLicense: false },
  {
    id: 2,
    nombre: "Gasista Matriculado",
    requiresLicense: true,
    licenseAuthority: "Carnet habilitante de Camuzzi Gas del Sur",
  },
  {
    id: 3,
    nombre: "Electricista",
    requiresLicense: true,
    licenseAuthority: "Matrícula habilitante EPEN / CALF",
  },
  { id: 4, nombre: "Pintor", requiresLicense: false },
  { id: 5, nombre: "Cerrajero", requiresLicense: false },
  { id: 6, nombre: "Refrigeración", requiresLicense: false },
  { id: 7, nombre: "Albañilería", requiresLicense: false },
  { id: 8, nombre: "Carpintero", requiresLicense: false },
];

export const isLicenseRequired = (oficio?: OficioItem | null): boolean => {
  if (!oficio) return false;
  if (oficio.requiresLicense) return true;
  if (oficio.id === 2 || oficio.id === 3) return true;
  const name = (oficio.nombre_oficio || oficio.nombre || "").toLowerCase();
  return (
    name.includes("gasista") ||
    name.includes("electricista") ||
    name.includes("matriculad")
  );
};

export const mapBackendOficiosToIds = (
  rawOficios: any,
  catalog: OficioItem[],
): number[] => {
  if (!rawOficios) return [];
  const list = Array.isArray(rawOficios) ? rawOficios : [rawOficios];
  const ids: number[] = [];

  for (const item of list) {
    if (typeof item === "number") {
      ids.push(item);
    } else if (typeof item === "object" && item !== null) {
      if (typeof item.id === "number") {
        ids.push(item.id);
      } else if (item.nombre_oficio || item.nombre) {
        const nameToMatch = (item.nombre_oficio || item.nombre || "")
          .toLowerCase()
          .trim();
        const found = catalog.find(
          (c) =>
            c.nombre.toLowerCase().trim() === nameToMatch ||
            (c.nombre_oficio &&
              c.nombre_oficio.toLowerCase().trim() === nameToMatch) ||
            nameToMatch.includes(c.nombre.toLowerCase().trim()) ||
            c.nombre.toLowerCase().trim().includes(nameToMatch),
        );
        if (found) ids.push(found.id);
      }
    } else if (typeof item === "string") {
      const trimmed = item.trim();
      const num = Number(trimmed);
      if (!isNaN(num) && num > 0) {
        ids.push(num);
      } else {
        const str = trimmed.toLowerCase();
        const found = catalog.find(
          (c) =>
            c.nombre.toLowerCase().includes(str) ||
            str.includes(c.nombre.toLowerCase()) ||
            (str === "plumber" && c.id === 1) ||
            (str === "gas_fitter" && c.id === 2) ||
            (str === "electrician" && c.id === 3) ||
            (str === "painter" && c.id === 4),
        );
        if (found) ids.push(found.id);
      }
    }
  }

  return Array.from(new Set(ids));
};

const DIAS_SEMANA_DEFAULT = [
  { dia_semana: 1, nombre: "Lunes", activo: false, hora_inicio: "08:00", hora_fin: "17:00" },
  { dia_semana: 2, nombre: "Martes", activo: false, hora_inicio: "08:00", hora_fin: "17:00" },
  { dia_semana: 3, nombre: "Miércoles", activo: false, hora_inicio: "08:00", hora_fin: "17:00" },
  { dia_semana: 4, nombre: "Jueves", activo: false, hora_inicio: "08:00", hora_fin: "17:00" },
  { dia_semana: 5, nombre: "Viernes", activo: false, hora_inicio: "08:00", hora_fin: "17:00" },
  { dia_semana: 6, nombre: "Sábado", activo: false, hora_inicio: "09:00", hora_fin: "13:00" },
  { dia_semana: 7, nombre: "Domingo", activo: false, hora_inicio: "09:00", hora_fin: "13:00" },
];

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop";

const getSafeAvatarUri = (uri?: string | null) => {
  if (!uri) return DEFAULT_AVATAR;
  if (Platform.OS === "web" && uri.startsWith("file://")) {
    return DEFAULT_AVATAR;
  }
  return uri;
};

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();
  const { usuario, login } = useAuth();

  const admin = isAdmin(usuario?.rol);
  const showClientCTA = isCliente(usuario?.rol);
  const showProFields = admin || isProfesional(usuario?.rol);

  const [isSaving, setIsSaving] = useState(false);
  const [dias, setDias] = useState(DIAS_SEMANA_DEFAULT);
  const [pickerState, setPickerState] = useState<{
    visible: boolean;
    diaSemana: number;
    campo: "hora_inicio" | "hora_fin";
    date: Date;
  }>({
    visible: false,
    diaSemana: 1,
    campo: "hora_inicio",
    date: new Date(),
  });

  const handleToggleDia = (diaSemana: number, activo: boolean) => {
    setDias((prev) =>
      prev.map((d) => (d.dia_semana === diaSemana ? { ...d, activo } : d)),
    );
  };

  const openTimePicker = (
    diaSemana: number,
    campo: "hora_inicio" | "hora_fin",
    horaActual: string,
  ) => {
    const [hours, minutes] = horaActual.split(":").map(Number);
    const d = new Date();
    d.setHours(hours || 8, minutes || 0, 0, 0);

    setPickerState({
      visible: true,
      diaSemana,
      campo,
      date: d,
    });
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === "android") {
      setPickerState((prev) => ({ ...prev, visible: false }));
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    const hours = String(selectedDate.getHours()).padStart(2, "0");
    const minutes = String(selectedDate.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    setDias((prev) =>
      prev.map((d) =>
        d.dia_semana === pickerState.diaSemana
          ? { ...d, [pickerState.campo]: formattedTime }
          : d,
      ),
    );

    if (Platform.OS === "ios") {
      setPickerState((prev) => ({ ...prev, visible: false }));
    }
  };

  const [avatarUri, setAvatarUri] = useState<string>(DEFAULT_AVATAR);
  const [zonasCobertura, setZonasCobertura] = useState(
    "Neuquén, Cipolletti, Plottier",
  );
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [apellido, setApellido] = useState(usuario?.apellido || "");
  const [telefono, setTelefono] = useState("");
  const [bio, setBio] = useState("");
  const [aniosExperiencia, setAniosExperiencia] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [oficiosList, setOficiosList] = useState<OficioItem[]>(OFICIOS_CATALOGO);
  const [selectedOficios, setSelectedOficios] = useState<number[]>([]);
  const [originalOficios, setOriginalOficios] = useState<number[]>([]);
  const [attachedDoc, setAttachedDoc] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
  } | null>(null);
  const [existingMatriculaUrl, setExistingMatriculaUrl] = useState<string | null>(null);
  const [pendingOficiosIds, setPendingOficiosIds] = useState<number[]>([]);

  const newOficiosRequiringLicense = useMemo(() => {
    return selectedOficios.filter((id) => {
      const isNew = !originalOficios.includes(id);
      const info = oficiosList.find((o) => o.id === id);
      return isNew && isLicenseRequired(info);
    });
  }, [selectedOficios, originalOficios, oficiosList]);

  const isSaveBlocked =
    newOficiosRequiringLicense.length > 0 &&
    !attachedDoc &&
    !existingMatriculaUrl;

  const handleAddZona = (zona: string) => {
    if (!zonasCobertura.toLowerCase().includes(zona.toLowerCase())) {
      setZonasCobertura((prev) =>
        prev.trim() ? `${prev.trim()}, ${zona}` : zona,
      );
    }
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        const fileName = asset.name || "matricula_profesional.pdf";
        const isPdf =
          asset.mimeType?.includes("pdf") ||
          fileName.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
          Alert.alert(
            "Formato inválido",
            "Únicamente se permite adjuntar documentación en formato PDF.",
          );
          return;
        }

        setAttachedDoc({
          uri: asset.uri,
          name: fileName,
          mimeType: "application/pdf",
          size: asset.size,
        });

        Alert.alert(
          "Documentación Adjunta",
          "Se ha adjuntado tu matrícula correctamente. Estaremos haciéndote llegar las novedades.",
          [{ text: "Entendido" }],
        );
      }
    } catch (err) {
      console.error("Error al seleccionar documento PDF:", err);
      Alert.alert(
        "Error al seleccionar",
        "No se pudo cargar el archivo PDF. Por favor intenta nuevamente.",
      );
    }
  };

  const toggleOficio = (oficioId: number) => {
    const isCurrentlySelected = selectedOficios.includes(oficioId);

    if (isCurrentlySelected) {
      setSelectedOficios((prev) => prev.filter((id) => id !== oficioId));
      return;
    }

    const oficioInfo = oficiosList.find((o) => o.id === oficioId);
    const isNewTrade = !originalOficios.includes(oficioId);
    const requiresLicense = isLicenseRequired(oficioInfo);

    if (isNewTrade && requiresLicense) {
      setSelectedOficios((prev) => [...prev, oficioId]);

      if (!attachedDoc && !existingMatriculaUrl) {
        Alert.alert(
          "Documentación Requerida",
          "Debe adjuntar la documentación correspondiente para que un administrador verifique y apruebe esta matrícula.",
          [
            {
              text: "Adjuntar Documentación",
              onPress: () => handlePickDocument(),
            },
            {
              text: "Entendido",
              style: "cancel",
            },
          ],
        );
      }
      return;
    }

    setSelectedOficios((prev) => [...prev, oficioId]);
  };

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        setIsLoading(true);
        try {
          if (showProFields) {
            const response = await apiClient("/api/professionals/profile");

            if (response.ok) {
              const data = await response.json();
              setNombre(data.nombre || "");
              setApellido(data.apellido || "");
              setTelefono(data.telefono || "");
              setBio(data.descripcion_perfil || "");
              setZonasCobertura(data.ubicacion_geografica || "");
              if (data.experiencia !== undefined && data.experiencia !== null) {
                setAniosExperiencia(String(data.experiencia));
              }
              if (data.foto_perfil) {
                const isExpired =
                  data.foto_perfil.startsWith("blob:") ||
                  (Platform.OS === "web" && data.foto_perfil.startsWith("file://"));
                if (!isExpired) {
                  setAvatarUri(data.foto_perfil);
                }
              }
              if (data.disponible !== undefined) {
                setDisponible(Boolean(data.disponible));
              }
              if (data.matricula_documento) {
                setExistingMatriculaUrl(data.matricula_documento);
              }

              if (Array.isArray(data.oficios_pendientes_ids)) {
                setPendingOficiosIds(data.oficios_pendientes_ids);
              } else {
                setPendingOficiosIds([]);
              }

              // Sincronización precisa de los oficios de la base de datos
              const rawOficios = data.oficios || data.oficios_ids || [];
              const parsedIds = mapBackendOficiosToIds(
                rawOficios,
                OFICIOS_CATALOGO,
              );
              setSelectedOficios(parsedIds);
              setOriginalOficios(parsedIds);
            }

            try {
              const resOficios = await apiClient("/api/professionals/oficios");
              if (resOficios.ok) {
                const dataOficios = await resOficios.json();
                if (Array.isArray(dataOficios) && dataOficios.length > 0) {
                  const merged: OficioItem[] = dataOficios.map((o: any) => {
                    const fallback = OFICIOS_CATALOGO.find(
                      (c) => c.id === Number(o.id),
                    );
                    return {
                      id: Number(o.id),
                      nombre:
                        o.nombre_oficio ||
                        o.nombre ||
                        fallback?.nombre ||
                        `Oficio ${o.id}`,
                      nombre_oficio: o.nombre_oficio,
                      descripcion_oficio: o.descripcion_oficio,
                      requiresLicense: fallback
                        ? fallback.requiresLicense
                        : isLicenseRequired(o),
                      licenseAuthority: fallback?.licenseAuthority,
                    };
                  });
                  setOficiosList(merged);
                }
              }
            } catch (errOficios) {
              console.warn("Error cargando oficios:", errOficios);
            }

            const resDispo = await apiClient("/api/professionals/availability");
            if (resDispo.ok) {
              const dataDispo = await resDispo.json();
              if (Array.isArray(dataDispo) && dataDispo.length > 0) {
                setDias((prevDias) =>
                  prevDias.map((dia) => {
                    const match = dataDispo.find(
                      (d: any) => d.dia_semana === dia.dia_semana,
                    );
                    if (match) {
                      return {
                        ...dia,
                        activo: true,
                        hora_inicio: match.hora_inicio,
                        hora_fin: match.hora_fin,
                      };
                    }
                    return { ...dia, activo: false };
                  }),
                );
              }
            }
          } else {
            const response = await apiClient("/api/auth/me");
            if (response.ok) {
              const data = await response.json();
              setNombre(data.usuarioAutenticado.nombre || "");
              setApellido(data.usuarioAutenticado.apellido || "");
              setTelefono(data.usuarioAutenticado.telefono || "");
            }
          }
        } catch (error) {
          console.error("Error cargando el perfil", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfile();
    }, [usuario]),
  );

  const handleSave = async () => {
    if (!nombre.trim() || !apellido.trim()) {
      Alert.alert(
        "Campos obligatorios",
        "Por favor ingresa tu nombre y apellido.",
      );
      return;
    }

    if (showProFields && selectedOficios.length === 0) {
      Alert.alert(
        "Oficio requerido",
        "Por favor selecciona al menos una especialidad u oficio.",
      );
      return;
    }

    if (showProFields) {
      const hayHorarioInvalido = dias.some(
        (d) => d.activo && d.hora_inicio >= d.hora_fin,
      );
      if (hayHorarioInvalido) {
        Alert.alert(
          "Horario inválido",
          "Por favor verifica que la hora de finalización sea posterior a la de inicio en todos los días activos.",
        );
        return;
      }

      // Validar si hay oficios nuevos que exijan matrícula y bloquear si falta documentación
      if (isSaveBlocked) {
        Alert.alert(
          "Documentación Requerida",
          "Debe adjuntar la documentación correspondiente para que un administrador verifique y apruebe esta matrícula.",
          [
            {
              text: "Adjuntar Ahora",
              onPress: () => handlePickDocument(),
            },
            {
              text: "Entendido",
              style: "cancel",
            },
          ],
        );
        return;
      }
    }

    setIsSaving(true);

    try {
      const isEphemeralUri =
        avatarUri.startsWith("blob:") || avatarUri.startsWith("file://");

      let response: Response;

      if (showProFields && attachedDoc) {
        const formData = new FormData();
        formData.append("nombre", nombre.trim());
        formData.append("apellido", apellido.trim());
        formData.append("telefono", telefono.trim());
        if (!isEphemeralUri && avatarUri) {
          formData.append("foto_perfil", avatarUri);
        }
        formData.append("descripcion_perfil", bio.trim());
        formData.append("ubicacion_geografica", zonasCobertura.trim());
        formData.append("disponible", String(disponible));
        if (aniosExperiencia.trim()) {
          formData.append("experiencia", aniosExperiencia.trim());
        }
        formData.append("oficios_ids", JSON.stringify(selectedOficios));
        if (Platform.OS === "web") {
          try {
            const resBlob = await fetch(attachedDoc.uri);
            const blob = await resBlob.blob();
            const fileName = attachedDoc.name || "matricula_profesional.pdf";
            formData.append("matricula_documento", blob, fileName);
          } catch (blobErr) {
            console.error("Error al preparar blob de documento en web:", blobErr);
            (formData as any).append("matricula_documento", {
              uri: attachedDoc.uri,
              name: attachedDoc.name || "matricula_profesional.pdf",
              type: attachedDoc.mimeType || "application/pdf",
            });
          }
        } else {
          (formData as any).append("matricula_documento", {
            uri: attachedDoc.uri,
            name: attachedDoc.name || "matricula_profesional.pdf",
            type: attachedDoc.mimeType || "application/pdf",
          });
        }

        response = await apiClient("/api/professionals/profile", {
          method: "PUT",
          body: formData,
        });
      } else {
        const payload: any = {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          telefono: telefono.trim(),
          foto_perfil: isEphemeralUri ? undefined : avatarUri,
          descripcion_perfil: bio.trim(),
          ubicacion_geografica: zonasCobertura.trim(),
          disponible,
          ...(aniosExperiencia.trim() ? { experiencia: parseInt(aniosExperiencia.trim(), 10) } : {}),
        };

        if (showProFields) {
          payload.oficios_ids = selectedOficios;
        }

        const endpoint = isCliente(usuario?.rol)
          ? "/api/auth/profile"
          : "/api/professionals/profile";

        response = await apiClient(endpoint, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        setOriginalOficios(selectedOficios);
        if (showProFields) {
          const horariosActivos = dias
            .filter((d) => d.activo)
            .map((d) => ({
              dia_semana: d.dia_semana,
              hora_inicio: d.hora_inicio,
              hora_fin: d.hora_fin,
            }));

          await apiClient("/api/professionals/availability", {
            method: "PUT",
            body: JSON.stringify({ horarios: horariosActivos }),
          });
        }

        Alert.alert(
          "¡Perfil Actualizado!",
          attachedDoc
            ? "Tus cambios y la documentación de tu matrícula han sido guardados exitosamente. Estaremos haciéndote llegar las novedades."
            : "Tus cambios han sido guardados exitosamente.",
          [{ text: "Aceptar", onPress: () => router.back() }],
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert(
          "Error al actualizar",
          errorData.error ||
          "Hubo un problema al guardar los datos en el servidor.",
          [{ text: "Aceptar" }],
        );
      }
    } catch (error) {
      console.warn("Error de conexión:", error);
      Alert.alert(
        "Error de red",
        "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
        [{ text: "Aceptar" }],
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a tu galería para poder actualizar tu foto de perfil.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: colors.backgroundElement,
            borderBottomColor: colors.backgroundSelected,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/profile");
            }
          }}
          accessibilityLabel="Volver atrás"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Editar Perfil
        </Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 100,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: getSafeAvatarUri(avatarUri) }}
                  style={styles.avatarImage}
                  onError={() => setAvatarUri(DEFAULT_AVATAR)}
                />
                <TouchableOpacity
                  style={[
                    styles.cameraButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Text
                style={[styles.avatarHint, { color: colors.textSecondary }]}
              >
                Toca el ícono de la cámara para cambiar tu foto
              </Text>
            </View>
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Información Personal
              </Text>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Nombre
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.backgroundSelected,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Tu nombre"
                    placeholderTextColor={colors.textSecondary}
                    value={nombre}
                    onChangeText={setNombre}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Apellido
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.backgroundSelected,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Tu apellido"
                    placeholderTextColor={colors.textSecondary}
                    value={apellido}
                    onChangeText={setApellido}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Teléfono de Contacto
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.backgroundSelected,
                        color: colors.text,
                      },
                    ]}
                    placeholder="+54 9 11..."
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    value={telefono}
                    onChangeText={setTelefono}
                  />
                </View>
                {showProFields && (
                  <View style={[styles.inputGroup, { width: 110, marginLeft: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Años Exp.</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.backgroundElement,
                          borderColor: colors.backgroundSelected,
                          color: colors.text,
                        },
                      ]}
                      placeholder="Ej: 8"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={aniosExperiencia}
                      onChangeText={setAniosExperiencia}
                    />
                  </View>
                )}
              </View>
            </View>

            {showClientCTA && (
              <View
                style={[
                  styles.inputGroup,
                  {
                    marginTop: 24,
                    padding: 16,
                    backgroundColor: colors.backgroundSelected,
                    borderRadius: 12,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, marginBottom: 8 },
                  ]}
                >
                  ¿Eres Profesional?
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: colors.textSecondary, marginBottom: 16 },
                  ]}
                >
                  Actualmente tienes una cuenta de cliente. Para ofrecer tus
                  servicios y configurar tu perfil profesional (oficios, zonas,
                  biografía), debes completar el proceso de acreditación.
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    width: "100%",
                    borderRadius: 8,
                    paddingVertical: 14,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => router.push("/onboarding")}
                >
                  <Text
                    style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}
                  >
                    Acreditarme como Profesional
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {showProFields && (
              <>
                {/* Switch de Disponibilidad / Modo Vacaciones */}
                <View
                  style={[
                    styles.statusCard,
                    {
                      backgroundColor: disponible
                        ? colors.backgroundElement
                        : ((colors as any).warningBg || "#FEF3E0"),
                      borderColor: disponible
                        ? colors.backgroundSelected
                        : ((colors as any).warning || "#F59E0B"),
                    },
                  ]}
                >
                  <View style={styles.statusHeaderRow}>
                    <View style={styles.statusIconTitleRow}>
                      <View
                        style={[
                          styles.statusIconBadge,
                          {
                            backgroundColor: disponible
                              ? ((colors as any).successBg || "#E6F4EA")
                              : ((colors as any).warningBg || "#FEF3E0"),
                          },
                        ]}
                      >
                        <Ionicons
                          name={disponible ? "checkmark-circle" : "pause-circle"}
                          size={22}
                          color={
                            disponible
                              ? ((colors as any).success || "#10B981")
                              : ((colors as any).warning || "#F59E0B")
                          }
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text
                          style={[
                            styles.statusCardTitle,
                            { color: colors.text },
                          ]}
                        >
                          {disponible
                            ? "Disponible para Trabajar"
                            : "Modo Pausa / Vacaciones"}
                        </Text>
                        <Text
                          style={[
                            styles.statusCardBadgeText,
                            {
                              color: disponible
                                ? ((colors as any).success || "#10B981")
                                : ((colors as any).warning || "#F59E0B"),
                            },
                          ]}
                        >
                          {disponible
                            ? "Visible en búsquedas"
                            : "Oculto de las búsquedas"}
                        </Text>
                      </View>
                    </View>

                    <Switch
                      value={disponible}
                      onValueChange={setDisponible}
                      trackColor={{
                        false: colors.backgroundSelected,
                        true: colors.secondary,
                      }}
                      thumbColor={disponible ? "#FFF" : "#F4F4F5"}
                    />
                  </View>

                  <Text
                    style={[
                      styles.statusCardDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {disponible
                      ? "Tu perfil aparece en los resultados de búsqueda y estás disponible para recibir nuevas contrataciones."
                      : "Tu perfil está en pausa. No aparecerás en los resultados de búsqueda hasta que lo reactives (tus chats y trabajos en curso siguen activos)."}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      Biografía Profesional
                    </Text>
                    <Text
                      style={[
                        styles.charCount,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {bio.length}/300
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.backgroundSelected,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Describe tu experiencia, certificaciones y especialidades..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={4}
                    maxLength={300}
                    textAlignVertical="top"
                    value={bio}
                    onChangeText={setBio}
                  />
                </View>

                {/* Sección 2: Mis Oficios y Especialidades */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeaderRow}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.text, marginBottom: 0 },
                      ]}
                    >
                      Mis Oficios y Especialidades
                    </Text>
                    <Text
                      style={[styles.badgeCount, { color: colors.secondary }]}
                    >
                      {selectedOficios.length} seleccionado
                      {selectedOficios.length !== 1 ? "s" : ""}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Selecciona los oficios en los que ofreces tus servicios
                    profesionales.
                  </Text>

                  <View style={styles.chipsContainer}>
                    {oficiosList.map((oficio) => {
                      const isSelected = selectedOficios.includes(oficio.id);
                      const requiresLic = isLicenseRequired(oficio);

                      return (
                        <TouchableOpacity
                          key={oficio.id}
                          style={[
                            styles.chip,
                            isSelected
                              ? {
                                backgroundColor: colors.secondary,
                                borderColor: colors.secondary,
                              }
                              : {
                                backgroundColor: colors.backgroundElement,
                                borderColor: colors.backgroundSelected,
                              },
                          ]}
                          onPress={() => toggleOficio(oficio.id)}
                          activeOpacity={0.7}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#FFF"
                              style={styles.chipIcon}
                            />
                          )}
                          <Text
                            style={[
                              styles.chipText,
                              isSelected
                                ? { color: "#FFF", fontWeight: "700" }
                                : { color: colors.text, fontWeight: "500" },
                            ]}
                          >
                            {oficio.nombre}
                          </Text>
                          {requiresLic && (
                            <View
                              style={[
                                styles.matriculaChipBadge,
                                {
                                  backgroundColor: isSelected
                                    ? "rgba(255, 255, 255, 0.25)"
                                    : isDark
                                      ? "rgba(255, 183, 77, 0.15)"
                                      : "rgba(255, 140, 0, 0.12)",
                                },
                              ]}
                            >
                              <Ionicons
                                name={pendingOficiosIds.includes(oficio.id) ? "time-outline" : "ribbon-outline"}
                                size={11}
                                color={
                                  isSelected
                                    ? "#FFF"
                                    : isDark
                                      ? "#FFB74D"
                                      : "#FF8C00"
                                }
                              />
                              <Text
                                style={[
                                  styles.matriculaChipBadgeText,
                                  {
                                    color: isSelected
                                      ? "#FFF"
                                      : isDark
                                        ? "#FFB74D"
                                        : "#FF8C00",
                                  },
                                ]}
                              >
                                {pendingOficiosIds.includes(oficio.id) ? "En revisión" : "Matrícula"}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Alerta y flujo para adjuntar documentación de matrícula si hay oficios nuevos requeridos */}
                  {newOficiosRequiringLicense.length > 0 && (
                    <View
                      style={[
                        styles.licenseNoticeCard,
                        {
                          backgroundColor: attachedDoc
                            ? isDark
                              ? "rgba(16, 185, 129, 0.1)"
                              : "#F0FDF4"
                            : isDark
                              ? "rgba(245, 158, 11, 0.1)"
                              : "#FFFBEB",
                          borderColor: attachedDoc
                            ? isDark
                              ? "#10B981"
                              : "#86EFAC"
                            : isDark
                              ? "#F59E0B"
                              : "#FCD34D",
                        },
                      ]}
                    >
                      <View style={styles.licenseNoticeHeader}>
                        <Ionicons
                          name={
                            attachedDoc ? "checkmark-circle" : "alert-circle"
                          }
                          size={22}
                          color={
                            attachedDoc
                              ? isDark
                                ? "#34D399"
                                : "#16A34A"
                              : isDark
                                ? "#FBBF24"
                                : "#D97706"
                          }
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text
                            style={[
                              styles.licenseNoticeTitle,
                              {
                                color: attachedDoc
                                  ? isDark
                                    ? "#34D399"
                                    : "#16A34A"
                                  : isDark
                                    ? "#FBBF24"
                                    : "#B45309",
                              },
                            ]}
                          >
                            {attachedDoc
                              ? "Documentación de Matrícula Adjuntada"
                              : "Documentación Requerida (Matrícula Legal)"}
                          </Text>
                          <Text
                            style={[
                              styles.licenseNoticeSubtitle,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {attachedDoc
                              ? `Archivo listo para verificar: ${attachedDoc.name}`
                              : "Debe adjuntar la documentación correspondiente para que un administrador verifique y apruebe esta matrícula."}
                          </Text>
                        </View>
                      </View>

                      {attachedDoc ? (
                        <View style={{ gap: 10 }}>
                          <View style={styles.attachedFileRow}>
                            <View style={styles.attachedFileInfo}>
                              <Ionicons
                                name="document-text"
                                size={18}
                                color={colors.primary}
                              />
                              <Text
                                style={[
                                  styles.attachedFileName,
                                  { color: colors.text },
                                ]}
                                numberOfLines={1}
                              >
                                {attachedDoc.name}
                              </Text>
                            </View>
                            <View style={styles.attachedActionsRow}>
                              <TouchableOpacity
                                style={[
                                  styles.changeDocBtn,
                                  { borderColor: colors.backgroundSelected },
                                ]}
                                onPress={handlePickDocument}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.changeDocBtnText,
                                    { color: colors.primary },
                                  ]}
                                >
                                  Cambiar
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.removeDocBtn}
                                onPress={() => setAttachedDoc(null)}
                                activeOpacity={0.7}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={16}
                                  color={colors.danger || "#EF4444"}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.sendDocButton,
                              { backgroundColor: colors.primary },
                            ]}
                            onPress={handleSave}
                            disabled={isSaving}
                            activeOpacity={0.8}
                          >
                            {isSaving ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <>
                                <Ionicons
                                  name="paper-plane"
                                  size={16}
                                  color="#FFF"
                                />
                                <Text style={styles.sendDocButtonText}>
                                  Enviar Documentación para Validación
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.uploadLicenseButton,
                            { backgroundColor: colors.primary },
                          ]}
                          onPress={handlePickDocument}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="cloud-upload-outline"
                            size={18}
                            color="#FFF"
                          />
                          <Text style={styles.uploadLicenseButtonText}>
                            Adjuntar Matrícula (PDF)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {/* Sección 3: Zonas de Cobertura */}
                <View style={styles.sectionContainer}>
                  <View style={styles.labelRow}>
                    <View style={styles.labelWithIcon}>
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={colors.text}
                      />
                      <Text
                        style={[
                          styles.sectionTitle,
                          {
                            color: colors.text,
                            marginBottom: 0,
                            marginLeft: 6,
                          },
                        ]}
                      >
                        Zonas de Cobertura
                      </Text>
                    </View>
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.backgroundSelected,
                        color: colors.text,
                        marginTop: 8,
                      },
                    ]}
                    placeholder="Ej: Neuquén, Cipolletti, Plottier..."
                    placeholderTextColor={colors.textSecondary}
                    value={zonasCobertura}
                    onChangeText={setZonasCobertura}
                  />

                  <Text
                    style={[
                      styles.quickAddTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Sugerencias rápidas:
                  </Text>
                  <View style={styles.quickAddRow}>
                    {ZONAS_SUGERIDAS.map((zona) => (
                      <TouchableOpacity
                        key={zona}
                        style={[
                          styles.quickAddChip,
                          {
                            backgroundColor: colors.backgroundElement,
                            borderColor: colors.backgroundSelected,
                          },
                        ]}
                        onPress={() => handleAddZona(zona)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.quickAddText,
                            { color: colors.secondary },
                          ]}
                        >
                          + {zona}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Sección 4: Franja Horaria de Trabajo */}
                <View style={styles.sectionContainer}>
                  <View style={styles.labelRow}>
                    <View style={styles.labelWithIcon}>
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={colors.text}
                      />
                      <Text
                        style={[
                          styles.sectionTitle,
                          {
                            color: colors.text,
                            marginBottom: 0,
                            marginLeft: 6,
                          },
                        ]}
                      >
                        Franja Horaria de Atención
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Define los días y rangos de horario en los que puedes recibir solicitudes.
                  </Text>

                  {dias.map((dia) => {
                    const esInvalido =
                      dia.activo && dia.hora_inicio >= dia.hora_fin;
                    return (
                      <View
                        key={dia.dia_semana}
                        style={[
                          styles.dayCard,
                          {
                            backgroundColor: colors.backgroundElement,
                            borderColor: colors.backgroundSelected,
                          },
                        ]}
                      >
                        <View style={styles.dayHeader}>
                          <Text
                            style={[
                              styles.dayName,
                              {
                                color: dia.activo
                                  ? colors.text
                                  : colors.textSecondary,
                                fontWeight: dia.activo ? "700" : "500",
                              },
                            ]}
                          >
                            {dia.nombre}
                          </Text>
                          <Switch
                            value={dia.activo}
                            onValueChange={(val) =>
                              handleToggleDia(dia.dia_semana, val)
                            }
                            trackColor={{
                              false: colors.backgroundSelected,
                              true: colors.secondary,
                            }}
                            thumbColor={dia.activo ? "#FFF" : "#F4F4F5"}
                          />
                        </View>

                        {dia.activo && (
                          <View style={styles.dayTimesContainer}>
                            <View style={styles.timeButtonsRow}>
                              <TouchableOpacity
                                style={[
                                  styles.timeButton,
                                  {
                                    backgroundColor: colors.background,
                                    borderColor: colors.backgroundSelected,
                                  },
                                ]}
                                onPress={() =>
                                  openTimePicker(
                                    dia.dia_semana,
                                    "hora_inicio",
                                    dia.hora_inicio,
                                  )
                                }
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.timeLabel,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  Desde
                                </Text>
                                <Text
                                  style={[
                                    styles.timeValue,
                                    { color: colors.text },
                                  ]}
                                >
                                  {dia.hora_inicio}
                                </Text>
                              </TouchableOpacity>

                              <Text
                                style={[
                                  styles.timeSeparator,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                —
                              </Text>

                              <TouchableOpacity
                                style={[
                                  styles.timeButton,
                                  {
                                    backgroundColor: colors.background,
                                    borderColor: colors.backgroundSelected,
                                  },
                                ]}
                                onPress={() =>
                                  openTimePicker(
                                    dia.dia_semana,
                                    "hora_fin",
                                    dia.hora_fin,
                                  )
                                }
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.timeLabel,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  Hasta
                                </Text>
                                <Text
                                  style={[
                                    styles.timeValue,
                                    { color: colors.text },
                                  ]}
                                >
                                  {dia.hora_fin}
                                </Text>
                              </TouchableOpacity>
                            </View>

                            {esInvalido && (
                              <Text
                                style={[
                                  styles.timeErrorText,
                                  { color: colors.danger },
                                ]}
                              >
                                La hora de finalización debe ser posterior a la de inicio.
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {showProFields && (
              <TouchableOpacity
                style={[
                  styles.previewButton,
                  {
                    borderColor: colors.primary,
                    backgroundColor:
                      isDark
                        ? "rgba(255, 140, 0, 0.12)"
                        : "rgba(255, 140, 0, 0.08)",
                  },
                ]}
                onPress={() => setShowPreview(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-outline" size={20} color={colors.primary} />
                <Text
                  style={[
                    styles.previewButtonText,
                    { color: colors.primary },
                  ]}
                >
                  Previsualizar Perfil (Vista Cliente)
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isSaving || isSaveBlocked ? 0.75 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <View style={styles.savingRow}>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.saveButtonText}>
                    Guardando Cambios...
                  </Text>
                </View>
              ) : (
                <View style={styles.savingRow}>
                  <Ionicons
                    name={
                      isSaveBlocked
                        ? "lock-closed-outline"
                        : "checkmark-circle-outline"
                    }
                    size={22}
                    color="#FFF"
                  />
                  <Text style={styles.saveButtonText}>
                    {isSaveBlocked
                      ? "Adjuntar Matrícula para Guardar"
                      : "Guardar Cambios"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        {pickerState.visible && (
          <DateTimePicker
            value={pickerState.date}
            mode="time"
            is24Hour={true}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleTimeChange}
          />
        )}
      </ScrollView>

      <ProfilePreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirmSave={handleSave}
        nombre={nombre}
        apellido={apellido}
        fotoPerfil={getSafeAvatarUri(avatarUri)}
        bio={bio}
        zonasCobertura={zonasCobertura}
        aniosExperiencia={aniosExperiencia}
        oficiosNombres={selectedOficios.map(
          (id) => oficiosList.find((o) => o.id === id)?.nombre || "Oficio",
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 16,
  },
  avatarWrapper: {
    position: "relative",
    width: 108,
    height: 108,
  },
  avatarImage: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  cameraButton: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarHint: {
    fontSize: 13,
    marginTop: 10,
    fontWeight: "500",
  },
  formSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  charCount: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeCount: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  quickAddTitle: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 6,
    fontWeight: "500",
  },
  quickAddRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickAddChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: "600",
  },

  saveButton: {
    marginTop: 28,
    marginBottom: 16,
    minHeight: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  savingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  dayCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayName: {
    fontSize: 15,
  },
  dayTimesContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  timeButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  timeSeparator: {
    fontSize: 16,
    fontWeight: "700",
  },
  timeErrorText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
  },
  statusCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  statusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusIconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  statusIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  statusCardBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 1,
  },
  statusCardDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 10,
  },
  previewButton: {
    marginTop: 24,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  matriculaChipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  matriculaChipBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  licenseNoticeCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    gap: 12,
  },
  licenseNoticeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  licenseNoticeTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  licenseNoticeSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  uploadLicenseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  uploadLicenseButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  attachedFileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 10,
    borderRadius: 10,
  },
  attachedFileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  attachedFileName: {
    fontSize: 12.5,
    fontWeight: "600",
    flex: 1,
  },
  attachedActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  changeDocBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  changeDocBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  removeDocBtn: {
    padding: 4,
  },
  sendDocButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sendDocButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
