import ServiceCard from "@/components/ServiceCard";
import ServiceDetailModal from "@/components/ServiceDetailModal";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ServicioPublicadoItem } from "@/types/service";
import { apiClient } from "@/utils/api";
import { isProfesional } from "@/utils/roles";
import {
  deleteService,
  getServices,
  MAX_ACTIVE_SERVICES,
  toggleServiceStatus,
} from "@/utils/servicesStorage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/context/AccessibilityContext";

export default function AccountDetailsScreen() {
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();
  const router = useRouter();
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();

  const [services, setServices] = useState<ServicioPublicadoItem[]>([]);
  const [selectedServiceForDetail, setSelectedServiceForDetail] =
    useState<ServicioPublicadoItem | null>(null);
  const [serviceToDelete, setServiceToDelete] =
    useState<ServicioPublicadoItem | null>(null);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const [profile, setProfile] = useState({
    nombre: usuario?.nombre || "Usuario",
    apellido: usuario?.apellido || "",
    trade: isProfesional(usuario?.rol) ? "Profesional" : "Cuenta de Cliente",
    zonas: "Sin definir",
    foto_perfil:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    estado_validado: false,
    estado_auditoria: null as "PENDIENTE" | "APROBADO" | "RECHAZADO" | null,
    motivo_rechazo: null as string | null,
    tiene_solicitud: false,
    rol: usuario?.rol || "CLIENTE",
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const res = await apiClient("/api/professionals/profile");
          if (res.ok) {
            const data = await res.json();
            setProfile((prev) => ({
              ...prev,
              nombre: data.nombre || prev.nombre,
              apellido: data.apellido || prev.apellido,
              foto_perfil: data.foto_perfil || prev.foto_perfil,
              zonas: data.ubicacion_geografica || prev.zonas,
              trade:
                data.rol === "PROFESIONAL" && data.estado_validado
                  ? "Profesional"
                  : "Cuenta de Cliente",
              estado_validado: Boolean(data.estado_validado),
              estado_auditoria: data.estado_auditoria || null,
              motivo_rechazo: data.motivo_rechazo || null,
              tiene_solicitud: Boolean(data.tiene_solicitud),
              rol: data.rol || prev.rol,
            }));
          }
        } catch {
          console.log("Error al cargar el perfil.");
        }
      };

      const loadServices = async () => {
        try {
          const list = await getServices();
          setServices(list);
        } catch (e) {
          console.log("Error al cargar servicios:", e);
        }
      };

      fetchProfile();
      loadServices();
    }, [usuario]),
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("servicesChanged", async () => {
      const list = await getServices();
      setServices(list);
    });
    return () => {
      sub.remove();
    };
  }, []);

  const activeServicesCount = services.filter((s) => s.servicio_activo).length;

  const isAprobado =
    profile.estado_validado && profile.estado_auditoria === "APROBADO";
  const isPendiente =
    profile.tiene_solicitud && profile.estado_auditoria === "PENDIENTE";
  const isRechazado =
    profile.tiene_solicitud && profile.estado_auditoria === "RECHAZADO";
  const isClienteSinSolicitud =
    !profile.tiene_solicitud && !isProfesional(usuario?.rol);

  const FigmaActionCard = ({
    icon,
    title,
    subtitle,
    onPress,
    iconColor,
    buttonText,
  }: any) => (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={{ padding: 16, paddingTop: 0 }}>
        <Text
          style={{
            color: colors.textSecondary,
            marginBottom: 16,
            lineHeight: 20,
          }}
        >
          {subtitle}
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: iconColor }]}
          onPress={onPress}
        >
          <Text style={styles.primaryButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: colors.backgroundElement,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/profile");
            }
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Detalles de la Cuenta
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={isAprobado ? services : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            {/* Tarjeta de Perfil */}
            <View
              style={[
                styles.profileCard,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Image
                source={{
                  uri:
                    profile.foto_perfil &&
                    !avatarError &&
                    !(
                      Platform.OS === "web" &&
                      profile.foto_perfil.startsWith("file://")
                    )
                      ? profile.foto_perfil
                      : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
                }}
                onError={() => setAvatarError(true)}
                style={styles.avatar}
              />
              <View style={styles.profileDetails}>
                <View style={styles.nameRow}>
                  <Text
                    style={[styles.profileName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {profile.nombre} {profile.apellido}
                  </Text>

                  {/* Badges de Auditoría y Verificación */}
                  {isAprobado && (
                    <View
                      style={[
                        styles.badgeContainer,
                        {
                          backgroundColor:
                            (colors as any).successBg ||
                            "rgba(14, 159, 110, 0.15)",
                        },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={(colors as any).success || "#0E9F6E"}
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          { color: (colors as any).success || "#0E9F6E" },
                        ]}
                      >
                        Aprobado
                      </Text>
                    </View>
                  )}

                  {isPendiente && (
                    <View
                      style={[
                        styles.badgeContainer,
                        {
                          backgroundColor:
                            (colors as any).warningBg ||
                            "rgba(217, 119, 6, 0.15)",
                        },
                      ]}
                    >
                      <Ionicons
                        name="time"
                        size={14}
                        color={(colors as any).warning || "#D97706"}
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          { color: (colors as any).warning || "#D97706" },
                        ]}
                      >
                        Pendiente
                      </Text>
                    </View>
                  )}

                  {isRechazado && (
                    <View
                      style={[
                        styles.badgeContainer,
                        { backgroundColor: "rgba(220, 38, 38, 0.15)" },
                      ]}
                    >
                      <Ionicons name="close-circle" size={14} color="#DC2626" />
                      <Text style={[styles.badgeText, { color: "#DC2626" }]}>
                        Rechazado
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[styles.profileTrade, { color: colors.textSecondary }]}
                >
                  {isAprobado
                    ? `${profile.trade} • ${profile.zonas}`
                    : "Cuenta de Cliente"}
                </Text>

                <TouchableOpacity
                  style={[styles.editButton, { borderColor: colors.primary }]}
                  onPress={() => router.push("/edit-profile")}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.editButtonText, { color: colors.primary }]}
                  >
                    Editar Perfil
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CASO 1: Solicitud en Estado Pendiente de Auditoría */}
            {isPendiente && (
              <View style={styles.statusSectionContainer}>
                <View style={styles.pendingCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.pendingIconBubble}>
                      <Ionicons name="time" size={24} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pendingTitle}>
                        Solicitud en Revisión
                      </Text>
                      <Text style={styles.pendingStatusBadge}>
                        En proceso de auditoría
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.pendingMessage}>
                    Tus documentos de identidad, oficios y situación fiscal han
                    sido recibidos y se encuentran en proceso de verificación
                    por el equipo de administración.
                  </Text>

                  <View style={styles.infoRowNotice}>
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color="#92400E"
                    />
                    <Text style={styles.infoRowText}>
                      Mientras tu legajo se encuentra en revisión, tu perfil
                      opera como cliente común. Una vez aprobado, podrás
                      publicar y ofrecer servicios.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* CASO 2: Solicitud Rechazada */}
            {isRechazado && (
              <View style={styles.statusSectionContainer}>
                <View style={styles.rejectedCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.rejectedIconBubble}>
                      <Ionicons name="alert-circle" size={24} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rejectedTitle}>
                        Solicitud Rechazada
                      </Text>
                      <Text style={styles.rejectedStatusBadge}>
                        Requiere corrección de documentos
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.rejectedIntro}>
                    Tu solicitud para registrarte como profesional fue revisada
                    y rechazada por el siguiente motivo:
                  </Text>

                  <View style={styles.reasonContainer}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={16}
                      color="#991B1B"
                    />
                    <Text style={styles.reasonText}>
                      {profile.motivo_rechazo ||
                        "La documentación cargada no cumple con los requisitos o es ilegible."}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => router.push("/onboarding")}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh" size={18} color="#FFFFFF" />
                    <Text style={styles.retryButtonText}>
                      Corregir y Reenviar Documentación
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* CASO 3: Cliente normal que aún no inició Onboarding */}
            {isClienteSinSolicitud && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.primary, marginTop: 8 },
                  ]}
                >
                  TUS SERVICIOS
                </Text>
                <FigmaActionCard
                  icon="list-outline"
                  title="Historial de Solicitudes"
                  subtitle="Todavía no has solicitado ningún servicio. Explora el directorio para encontrar profesionales cerca de ti."
                  iconColor={(colors as any).info || "#1A73E8"}
                  buttonText="Buscar Profesionales"
                  onPress={() => router.push("/(tabs)")}
                />

                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.primary, marginTop: 8 },
                  ]}
                >
                  CONVIÉRTETE EN EXPERTO
                </Text>
                <FigmaActionCard
                  icon="star-outline"
                  title="Ofrece tus Servicios"
                  subtitle="Regístrate como profesional para validar tu identidad, cargar tu matrícula y empezar a ganar dinero."
                  iconColor={colors.primary}
                  buttonText="Registro Profesional"
                  onPress={() => router.push("/onboarding")}
                />
              </>
            )}

            {/* CASO 4: Profesional Validado y Aprobado */}
            {isAprobado && (
              <>
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    if (activeServicesCount >= MAX_ACTIVE_SERVICES) {
                      Alert.alert(
                        "Límite de Servicios Activos Alcanzado",
                        `Has alcanzado el límite inicial de ${MAX_ACTIVE_SERVICES} servicios activos. Puedes publicar nuevos servicios guardándolos como pausados, o pausar uno existente primero.`,
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Crear de todas formas",
                            onPress: () => router.push("/create-service"),
                          },
                        ],
                      );
                    } else {
                      router.push("/create-service");
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color="#FFF"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.createButtonText}>
                    Crear Nuevo Servicio
                  </Text>
                </TouchableOpacity>

                {/* Encabezado con contador accesible de 30 servicios */}
                <View style={styles.servicesHeaderRow}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.primary, marginBottom: 0, marginLeft: 0 },
                    ]}
                  >
                    MIS SERVICIOS PUBLICADOS
                  </Text>

                  <View
                    style={[
                      styles.counterPill,
                      {
                        backgroundColor:
                          activeServicesCount >= MAX_ACTIVE_SERVICES
                            ? "rgba(239, 68, 68, 0.12)"
                            : isDark
                            ? "rgba(255, 183, 77, 0.15)"
                            : "rgba(255, 140, 0, 0.1)",
                        borderColor:
                          activeServicesCount >= MAX_ACTIVE_SERVICES
                            ? "#EF4444"
                            : colors.primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        activeServicesCount >= MAX_ACTIVE_SERVICES
                          ? "alert-circle"
                          : "layers-outline"
                      }
                      size={12}
                      color={
                        activeServicesCount >= MAX_ACTIVE_SERVICES
                          ? "#EF4444"
                          : colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.counterPillText,
                        {
                          color:
                            activeServicesCount >= MAX_ACTIVE_SERVICES
                              ? "#EF4444"
                              : colors.primary,
                        },
                      ]}
                    >
                      {activeServicesCount}/{MAX_ACTIVE_SERVICES} activos
                    </Text>
                  </View>
                </View>

                {services.length === 0 && (
                  <View
                    style={[
                      styles.emptyServicesCard,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: isDark ? "#2A3649" : "#E2E8F0",
                      },
                    ]}
                  >
                    <Ionicons
                      name="briefcase-outline"
                      size={36}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.emptyServicesTitle,
                        { color: colors.text },
                      ]}
                    >
                      Sin servicios publicados
                    </Text>
                    <Text
                      style={[
                        styles.emptyServicesSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Publica tus tarifas y tiempos para que los clientes te contraten directamente sin consultas previas.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        }
        renderItem={({ item }) =>
          isAprobado ? (
            <View style={{ paddingHorizontal: 16 }}>
              <ServiceCard
                service={item}
                onPress={(srv) => setSelectedServiceForDetail(srv)}
                onEdit={(srv) => {
                  router.push({
                    pathname: "/create-service",
                    params: { serviceId: srv.id },
                  });
                }}
                onTogglePause={async (srv) => {
                  try {
                    await toggleServiceStatus(srv.id);
                  } catch (err: any) {
                    Alert.alert("Límite de Servicios Activos", err.message);
                  }
                }}
                onDelete={(srv) => {
                  setServiceToDelete(srv);
                }}
              />
            </View>
          ) : null
        }
      />

      <ServiceDetailModal
        visible={Boolean(selectedServiceForDetail)}
        service={selectedServiceForDetail}
        isClientView={false}
        onClose={() => setSelectedServiceForDetail(null)}
        onEditService={(srv) => {
          setSelectedServiceForDetail(null);
          router.push({
            pathname: "/create-service",
            params: { serviceId: srv.id },
          });
        }}
        onDeleteService={(srv) => {
          setServiceToDelete(srv);
        }}
      />

      <ConfirmDeleteModal
        visible={Boolean(serviceToDelete)}
        serviceTitle={serviceToDelete?.titulo_servicio}
        isDeleting={isDeletingService}
        onCancel={() => setServiceToDelete(null)}
        onConfirm={async () => {
          if (!serviceToDelete) return;
          setIsDeletingService(true);
          try {
            await deleteService(serviceToDelete.id);
            setServiceToDelete(null);
            setSelectedServiceForDetail(null);
          } catch (err: any) {
            if (Platform.OS === "web") {
              window.alert(err.message || "No se pudo eliminar el servicio.");
            } else {
              Alert.alert("Error", err.message || "No se pudo eliminar el servicio.");
            }
          } finally {
            setIsDeletingService(false);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: { paddingVertical: 8, alignSelf: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700" },

  card: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 12,
    marginLeft: 8,
    letterSpacing: 1,
  },

  profileCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#E0E1E6",
  },
  profileDetails: { flex: 1, marginLeft: 16, justifyContent: "center" },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 8,
  },
  profileName: { fontSize: 17, fontWeight: "700", flex: 1 },

  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  profileTrade: { fontSize: 13, marginBottom: 12 },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    alignSelf: "flex-start",
  },
  editButtonText: { fontSize: 13, fontWeight: "700" },

  createButton: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  buttonIcon: { marginRight: 8 },
  createButtonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  primaryButton: { padding: 14, borderRadius: 12, alignItems: "center" },
  primaryButtonText: { color: "#FFF", fontSize: 15, fontWeight: "700" },

  statusSectionContainer: {
    marginBottom: 20,
  },

  // Tarjeta Pendiente
  pendingCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    padding: 16,
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  pendingIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#92400E",
  },
  pendingStatusBadge: {
    fontSize: 12,
    color: "#B45309",
    fontWeight: "600",
  },
  pendingMessage: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 19,
    marginBottom: 12,
  },
  infoRowNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  infoRowText: {
    fontSize: 12,
    color: "#92400E",
    flex: 1,
    lineHeight: 16,
  },

  // Tarjeta Rechazado
  rejectedCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    padding: 16,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rejectedIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#991B1B",
  },
  rejectedStatusBadge: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "600",
  },
  rejectedIntro: {
    fontSize: 13,
    color: "#7F1D1D",
    lineHeight: 18,
    marginBottom: 10,
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  reasonText: {
    fontSize: 13,
    color: "#991B1B",
    fontWeight: "600",
    flex: 1,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  servicesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 12,
  },
  counterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
  },
  counterPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyServicesCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  emptyServicesTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  emptyServicesSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
