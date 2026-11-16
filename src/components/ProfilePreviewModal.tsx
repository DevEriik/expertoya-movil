import SolicitudModal from "@/components/inicio/SolicitudModal";
import ServiceDetailModal from "@/components/ServiceDetailModal";
import { useAccessibility } from "@/context/AccessibilityContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { ServicioPublicadoItem } from "@/types/service";
import { apiClient } from "@/utils/api";
import { getServices } from "@/utils/servicesStorage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ProfilePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmSave?: () => void;
  onContact?: () => void;
  isCliente?: boolean;
  email?: string;
  telefono?: string;
  nombre: string;
  apellido: string;
  fotoPerfil?: string;
  bio?: string;
  zonasCobertura?: string;
  oficiosNombres?: string[];
  calificacion?: number;
  totalReviews?: number;
  servicios?: ServicioPublicadoItem[];
  aniosExperiencia?: string;
  profesionalId?: string;
}

export default function ProfilePreviewModal({
  visible,
  onClose,
  onConfirmSave,
  onContact,
  isCliente = false,
  email = "",
  telefono = "",
  nombre,
  apellido,
  fotoPerfil,
  bio,
  zonasCobertura,
  oficiosNombres = [],
  calificacion = 4.9,
  totalReviews = 310,
  servicios,
  aniosExperiencia,
  profesionalId = "",
}: ProfilePreviewModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();

  const [activeServices, setActiveServices] = useState<ServicioPublicadoItem[]>(
    servicios || [],
  );
  const [selectedDetailService, setSelectedDetailService] =
    useState<ServicioPublicadoItem | null>(null);

  const [solicitudVisible, setSolicitudVisible] = useState(false);

  const { usuario } = useAuth();
  const isCurrentPro = Boolean(
    usuario?.id &&
      (usuario.id === profesionalId ||
        usuario.rol === "PROFESIONAL" ||
        usuario.id === (usuario as any)?.userId)
  );

  interface ReviewItem {
    id: string;
    calificacion: number;
    comentario?: string | null;
    fotosUrls: string[];
    respuestaProfesional?: string | null;
    fechaRespuesta?: string | null;
    createdAt: string;
    cliente: {
      id: string;
      nombre: string;
      apellido: string;
      foto_perfil?: string | null;
    };
  }

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [cargandoReviews, setCargandoReviews] = useState(false);
  const [currentRating, setCurrentRating] = useState<number>(calificacion);
  const [currentTotalReviews, setCurrentTotalReviews] =
    useState<number>(totalReviews);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [sendingReply, setSendingReply] = useState<boolean>(false);

  useEffect(() => {
    if (!visible || !profesionalId || isCliente) return;

    const fetchReviews = async () => {
      setCargandoReviews(true);
      try {
        const res = await apiClient(
          `/api/professionals/${profesionalId}/reviews?page=1&limit=20`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data) {
            setReviews(json.data.resenas || []);
            if (json.data.stats) {
              setCurrentRating(
                json.data.stats.calificacionPromedio ?? calificacion
              );
              setCurrentTotalReviews(
                json.data.stats.totalResenas ?? totalReviews
              );
            }
          }
        }
      } catch (e) {
        console.error("Error al cargar reseñas del profesional:", e);
      } finally {
        setCargandoReviews(false);
      }
    };

    fetchReviews();
  }, [visible, profesionalId, calificacion, totalReviews]);

  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      Alert.alert("Atención", "Por favor ingresa una respuesta.");
      return;
    }

    try {
      setSendingReply(true);
      const res = await apiClient(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        body: JSON.stringify({ respuesta: replyText.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json.detalle || json.error || "No se pudo enviar la respuesta"
        );
      }

      Alert.alert(
        "Respuesta registrada",
        "Tu respuesta ha sido publicada de manera definitiva e inmutable."
      );
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                respuestaProfesional: replyText.trim(),
                fechaRespuesta: new Date().toISOString(),
              }
            : r
        )
      );
      setReplyingReviewId(null);
      setReplyText("");
    } catch (error: any) {
      console.error("Error al responder reseña:", error);
      Alert.alert("Error", error.message || "No se pudo registrar la respuesta.");
    } finally {
      setSendingReply(false);
    }
  };

  useEffect(() => {
    if (servicios && servicios.length > 0) {
      setActiveServices(servicios.filter((s) => s.servicio_activo));
    } else {
      getServices().then((list) => {
        setActiveServices(list.filter((s) => s.servicio_activo));
      });
    }
  }, [servicios, visible]);

  const nombreCompleto =
    `${nombre.trim()} ${apellido.trim()}`.trim() || "Tu Nombre";

  const oficioPrincipal =
    oficiosNombres.length > 0 ? oficiosNombres[0] : "Profesional Certificado";

  const [imgError, setImgError] = useState(false);

  const isWebLocalUri =
    Platform.OS === "web" && !!fotoPerfil && fotoPerfil.startsWith("file://");

  const avatarSource =
    fotoPerfil && !isWebLocalUri && !imgError
      ? { uri: fotoPerfil }
      : {
          uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
        };

  const bannerSource = {
    uri: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop",
  };

  const serviciosComunes = [
    { titulo: "Diagnóstico y Presupuesto", precio: "Desde $8,500" },
    { titulo: "Instalación y Montaje Estándar", precio: "Desde $15,000" },
    { titulo: "Reparación o Service de Urgencia", precio: "Desde $22,000" },
    { titulo: "Mantenimiento Integral Preventivo", precio: "Desde $35,000" },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#121826" : "#FDFCF4" },
        ]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.bannerContainer}>
            <Image source={bannerSource} style={styles.bannerImage} />
            <View style={styles.bannerOverlay} />

            <TouchableOpacity
              style={[styles.backButton, { top: Math.max(insets.top + 8, 20) }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View
              style={[
                styles.previewNoticeBadge,
                {
                  top: Math.max(insets.top + 10, 22),
                  backgroundColor: isCliente
                    ? "rgba(0, 191, 165, 0.9)"
                    : "rgba(40, 53, 147, 0.85)",
                },
              ]}
            >
              <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
              <Text style={styles.previewNoticeText}>
                {isCliente ? "Vista del Profesional" : "Vista del Cliente"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.mainCard,
              {
                backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                borderColor: isDark ? "#2A3649" : "#F0F0E8",
              },
            ]}
          >
            <View style={styles.avatarWrapper}>
              <Image
                source={avatarSource}
                style={styles.avatarImage}
                onError={() => setImgError(true)}
              />
              <View style={styles.verifiedShield}>
                <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
              </View>
            </View>

            <Text
              style={[
                styles.proName,
                { color: isDark ? "#FDFCF4" : "#283593" },
              ]}
            >
              {nombreCompleto}
            </Text>

            <View style={styles.verifiedBadgeRow}>
              <View
                style={[
                  styles.verifiedBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(51, 239, 165, 0.15)"
                      : "rgba(0, 191, 165, 0.12)",
                    borderColor: isDark
                      ? "rgba(51, 239, 165, 0.4)"
                      : "rgba(0, 191, 165, 0.3)",
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={15}
                  color={isDark ? "#33EFA5" : "#00BFA5"}
                />
                <Text
                  style={[
                    styles.verifiedBadgeText,
                    { color: isDark ? "#33EFA5" : "#00BFA5" },
                  ]}
                >
                  {isCliente
                    ? "Cuenta de Cliente Verificada"
                    : "Identidad y Matrícula Verificada"}
                </Text>
              </View>
            </View>

            {isCliente ? (
              <>
                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={16} color="#00BFA5" />
                  <Text
                    style={[
                      styles.metaText,
                      { color: isDark ? "#E2E8F0" : "#283593" },
                    ]}
                  >
                    Cliente de ExpertoYa • Pagos Protegidos
                  </Text>
                </View>

                {email ? (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="mail-outline"
                      size={16}
                      color={isDark ? "#94A3B8" : "#60646C"}
                    />
                    <Text
                      style={[
                        styles.metaSubText,
                        { color: isDark ? "#94A3B8" : "#60646C" },
                      ]}
                    >
                      {email}
                    </Text>
                  </View>
                ) : null}

                {telefono ? (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color={isDark ? "#94A3B8" : "#60646C"}
                    />
                    <Text
                      style={[
                        styles.metaSubText,
                        { color: isDark ? "#94A3B8" : "#60646C" },
                      ]}
                    >
                      {telefono}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.metaRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={isDark ? "#94A3B8" : "#60646C"}
                  />
                  <Text
                    style={[
                      styles.metaSubText,
                      { color: isDark ? "#94A3B8" : "#60646C" },
                    ]}
                    numberOfLines={1}
                  >
                    {zonasCobertura?.trim() || "Argentina"}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.metaRow}>
                  <Ionicons name="flash" size={16} color="#FF8C00" />
                  <Text
                    style={[
                      styles.metaText,
                      { color: isDark ? "#E2E8F0" : "#283593" },
                    ]}
                  >
                    {oficioPrincipal}
                  </Text>
                </View>

                {aniosExperiencia ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={16} color="#FF8C00" />
                    <Text
                      style={[
                        styles.metaText,
                        { color: isDark ? "#E2E8F0" : "#283593" },
                      ]}
                    >
                      {aniosExperiencia}{" "}
                      {Number(aniosExperiencia) === 1 ? "año" : "años"} de
                      experiencia
                    </Text>
                  </View>
                ) : null}

                <View style={styles.metaRow}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text
                    style={[
                      styles.metaBoldText,
                      { color: isDark ? "#FDFCF4" : "#1E293B" },
                    ]}
                  >
                    {currentRating > 0 ? currentRating.toFixed(1) : "Nuevo"}
                  </Text>
                  <Text
                    style={[
                      styles.metaSubText,
                      { color: isDark ? "#94A3B8" : "#60646C" },
                    ]}
                  >
                    ({currentTotalReviews}{" "}
                    {currentTotalReviews === 1 ? "opinión" : "opiniones"})
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={isDark ? "#94A3B8" : "#60646C"}
                  />
                  <Text
                    style={[
                      styles.metaSubText,
                      { color: isDark ? "#94A3B8" : "#60646C" },
                    ]}
                    numberOfLines={1}
                  >
                    {zonasCobertura?.trim() || "Neuquén Capital (1.2 km)"}
                  </Text>
                </View>
              </>
            )}
          </View>

          {isCliente ? (
            <>
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                    borderColor: isDark ? "#2A3649" : "#F0F0E8",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isDark ? "#FDFCF4" : "#283593" },
                  ]}
                >
                  Vista que recibe el Profesional
                </Text>
                <Text
                  style={[
                    styles.bioText,
                    { color: isDark ? "#CBD5E1" : "#475569" },
                  ]}
                >
                  Así es como los profesionales ven tu perfil cuando te comunicas por el chat o solicitas un presupuesto. Esta información les permite identificarte con confianza y coordinar los detalles del trabajo.
                </Text>
              </View>

              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                    borderColor: isDark ? "#2A3649" : "#F0F0E8",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isDark ? "#FDFCF4" : "#283593" },
                  ]}
                >
                  Garantía y Seguridad de Pagos (Escrow)
                </Text>
                <Text
                  style={[
                    styles.bioText,
                    { color: isDark ? "#CBD5E1" : "#475569" },
                  ]}
                >
                  Tus contrataciones cuentan con fondos en custodia segura. El profesional tiene la certeza de que el pago está retenido y solo se liberará cuando confirmes tu total conformidad con el trabajo realizado.
                </Text>
              </View>

              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                    borderColor: isDark ? "#2A3649" : "#F0F0E8",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isDark ? "#FDFCF4" : "#283593" },
                  ]}
                >
                  Sistema de Reseñas Closed-Loop
                </Text>
                <Text
                  style={[
                    styles.bioText,
                    { color: isDark ? "#CBD5E1" : "#475569" },
                  ]}
                >
                  Al concretarse y liberarse cada trabajo, tendrás habilitada la opción de calificar al profesional de manera inmutable con estrellas y fotos de evidencia.
                </Text>
              </View>
            </>
          ) : (
            <>
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                    borderColor: isDark ? "#2A3649" : "#F0F0E8",
                  },
                ]}
              >
            <Text
              style={[
                styles.cardTitle,
                { color: isDark ? "#FDFCF4" : "#283593" },
              ]}
            >
              Sobre Mí
            </Text>

            <Text
              style={[
                styles.bioText,
                { color: isDark ? "#CBD5E1" : "#475569" },
              ]}
            >
              {bio?.trim() ||
                "Hola, soy profesional matriculado con amplia trayectoria en instalaciones residenciales y comerciales. Garantizo trabajos limpios, seguros y bajo normativa vigente."}
            </Text>

            {aniosExperiencia ? (
              <View style={styles.experienceBadge}>
                <Ionicons name="ribbon-outline" size={16} color="#FF8C00" />
                <Text style={styles.experienceBadgeText}>
                  {aniosExperiencia}{" "}
                  {Number(aniosExperiencia) === 1 ? "año" : "años"} de
                  trayectoria profesional
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                borderColor: isDark ? "#2A3649" : "#F0F0E8",
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDark ? "#FDFCF4" : "#283593", marginBottom: 0 },
                ]}
              >
                Servicios del Profesional ({activeServices.length})
              </Text>
            </View>

            {activeServices.length === 0 ? (
              <Text
                style={{
                  color: isDark ? "#94A3B8" : "#60646C",
                  fontSize: 13,
                  marginVertical: 8,
                }}
              >
                El profesional no tiene servicios activos en este momento.
              </Text>
            ) : (
              activeServices.map((servicio, index) => (
                <TouchableOpacity
                  key={servicio.id}
                  style={[
                    styles.serviceRow,
                    index < activeServices.length - 1 && styles.serviceDivider,
                    {
                      borderBottomColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.06)",
                    },
                  ]}
                  onPress={() => setSelectedDetailService(servicio)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={[
                        styles.serviceTitle,
                        { color: isDark ? "#CBD5E1" : "#334155" },
                      ]}
                      numberOfLines={1}
                    >
                      {servicio.titulo_servicio}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDark ? "#94A3B8" : "#64748B",
                        marginTop: 2,
                      }}
                    >
                      ⏱️ {servicio.duracion_estimada}
                      {servicio.fotos_servicio?.length
                        ? ` • 📷 ${servicio.fotos_servicio.length} fotos`
                        : ""}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[
                        styles.servicePrice,
                        { color: isDark ? "#FFB74D" : "#FF8C00" },
                      ]}
                    >
                      ${Number(servicio.costo_estimado).toLocaleString()} ARS
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: isDark ? "#38BDF8" : "#1A73E8",
                        fontWeight: "700",
                        marginTop: 2,
                      }}
                    >
                      Ver detalle →
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                borderColor: isDark ? "#2A3649" : "#F0F0E8",
              },
            ]}
          >
            <View style={styles.reviewsHeaderRow}>
              <View style={styles.reviewsHeaderLeft}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isDark ? "#FDFCF4" : "#283593", marginBottom: 2 },
                  ]}
                >
                  Opiniones de Clientes
                </Text>
                <Text
                  style={[
                    styles.reviewsSubhead,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Sistema Closed-Loop: opiniones reales con pago liberado.
                </Text>
              </View>
              <View
                style={[
                  styles.ratingBigBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(245, 158, 11, 0.15)"
                      : "#FEF3C7",
                    borderColor: isDark ? "#78350F" : "#FDE68A",
                  },
                ]}
              >
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text
                  style={[
                    styles.ratingBigNumber,
                    { color: isDark ? "#FBBF24" : "#B45309" },
                  ]}
                >
                  {currentRating > 0 ? currentRating.toFixed(1) : "-"}
                </Text>
              </View>
            </View>

            {cargandoReviews ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator color="#FF8C00" size="small" />
              </View>
            ) : reviews.length === 0 ? (
              <View
                style={[
                  styles.emptyReviewsBox,
                  {
                    backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                    borderColor: isDark ? "#1E293B" : "#E2E8F0",
                  },
                ]}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={32}
                  color={isDark ? "#475569" : "#CBD5E1"}
                />
                <Text
                  style={[
                    styles.emptyReviewsText,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Este profesional todavía no tiene opiniones registradas. Las
                  calificaciones se habilitan únicamente al concretar y liberar un trabajo.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {reviews.map((rev) => {
                  const clienteNombre = rev.cliente
                    ? `${rev.cliente.nombre} ${rev.cliente.apellido?.[0] ? rev.cliente.apellido[0] + "." : ""}`.trim()
                    : "Cliente";

                  return (
                    <View
                      key={rev.id}
                      style={[
                        styles.reviewItemCard,
                        {
                          backgroundColor: isDark ? "#121826" : "#FDFCF4",
                          borderColor: isDark ? "#2A3649" : "#F0F0E8",
                        },
                      ]}
                    >
                      <View style={styles.reviewUserRow}>
                        {rev.cliente?.foto_perfil ? (
                          <Image
                            source={{ uri: rev.cliente.foto_perfil }}
                            style={styles.reviewerAvatar}
                          />
                        ) : (
                          <View
                            style={[
                              styles.reviewerAvatarFallback,
                              { backgroundColor: "#00BFA5" + "22" },
                            ]}
                          >
                            <Text style={styles.reviewerInitial}>
                              {clienteNombre[0] || "C"}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Text
                              style={[
                                styles.reviewerName,
                                { color: isDark ? "#FDFCF4" : "#1E293B" },
                              ]}
                            >
                              {clienteNombre}
                            </Text>
                            <Ionicons
                              name="shield-checkmark"
                              size={13}
                              color="#00BFA5"
                            />
                          </View>
                          <Text
                            style={[
                              styles.reviewDate,
                              { color: isDark ? "#64748B" : "#94A3B8" },
                            ]}
                          >
                            {new Date(rev.createdAt).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </Text>
                        </View>

                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                              key={s}
                              name={s <= rev.calificacion ? "star" : "star-outline"}
                              size={13}
                              color={s <= rev.calificacion ? "#F59E0B" : "#CBD5E1"}
                            />
                          ))}
                        </View>
                      </View>

                      {rev.comentario ? (
                        <Text
                          style={[
                            styles.reviewComment,
                            { color: isDark ? "#CBD5E1" : "#475569" },
                          ]}
                        >
                          {rev.comentario}
                        </Text>
                      ) : null}

                      {/* Fotos de la reseña (hasta 2) ampliables */}
                      {rev.fotosUrls && rev.fotosUrls.length > 0 && (
                        <View style={styles.reviewPhotosRow}>
                          {rev.fotosUrls.map((url, fIndex) => (
                            <TouchableOpacity
                              key={fIndex}
                              onPress={() => setExpandedImage(url)}
                              activeOpacity={0.8}
                            >
                              <Image
                                source={{ uri: url }}
                                style={styles.reviewPhotoThumb}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {/* Respuesta del Profesional Indentada */}
                      {rev.respuestaProfesional ? (
                        <View
                          style={[
                            styles.proReplyContainer,
                            {
                              backgroundColor: isDark
                                ? "#0F172A"
                                : "#F0FDFA",
                              borderColor: isDark ? "#1E293B" : "#CCFBF1",
                            },
                          ]}
                        >
                          <View style={styles.proReplyHeader}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Ionicons
                                name="return-down-forward"
                                size={14}
                                color="#00BFA5"
                              />
                              <Text style={styles.proReplyBadge}>
                                Respuesta del Profesional
                              </Text>
                            </View>
                            {rev.fechaRespuesta && (
                              <Text style={styles.proReplyDate}>
                                {new Date(rev.fechaRespuesta).toLocaleDateString(
                                  "es-AR",
                                  { day: "2-digit", month: "short" }
                                )}
                              </Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.proReplyText,
                              { color: isDark ? "#E2E8F0" : "#0F766E" },
                            ]}
                          >
                            {rev.respuestaProfesional}
                          </Text>
                        </View>
                      ) : isCurrentPro ? (
                        // Vista de Réplica (Profesional)
                        <View style={{ marginTop: 8 }}>
                          {replyingReviewId === rev.id ? (
                            <View style={styles.replyFormBox}>
                              <TextInput
                                style={[
                                  styles.replyInput,
                                  {
                                    backgroundColor: isDark
                                      ? "#0F172A"
                                      : "#F8FAFC",
                                    color: isDark ? "#F8FAFC" : "#1E293B",
                                    borderColor: isDark ? "#334155" : "#E2E8F0",
                                  },
                                ]}
                                placeholder="Escribe tu respuesta pública..."
                                placeholderTextColor={
                                  isDark ? "#64748B" : "#94A3B8"
                                }
                                value={replyText}
                                onChangeText={setReplyText}
                                multiline
                                editable={!sendingReply}
                              />
                              <Text style={styles.replyWarningText}>
                                ⚠️ Tu respuesta será única e inmutable tras ser publicada.
                              </Text>
                              <View style={styles.replyButtonsRow}>
                                <TouchableOpacity
                                  style={styles.replyCancelBtn}
                                  onPress={() => {
                                    setReplyingReviewId(null);
                                    setReplyText("");
                                  }}
                                  disabled={sendingReply}
                                >
                                  <Text style={styles.replyCancelText}>
                                    Cancelar
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.replySubmitBtn}
                                  onPress={() => handleSendReply(rev.id)}
                                  disabled={sendingReply}
                                >
                                  {sendingReply ? (
                                    <ActivityIndicator
                                      color="#FFFFFF"
                                      size="small"
                                    />
                                  ) : (
                                    <Text style={styles.replySubmitText}>
                                      Enviar respuesta
                                    </Text>
                                  )}
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.openReplyBtn}
                              onPress={() => {
                                setReplyingReviewId(rev.id);
                                setReplyText("");
                              }}
                            >
                              <Ionicons
                                name="chatbubble-ellipses-outline"
                                size={14}
                                color="#FF8C00"
                              />
                              <Text style={styles.openReplyBtnText}>
                                Responder a este cliente
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
          </>
          )}
        </ScrollView>

        <View
          style={[
            styles.bottomStickyBar,
            {
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              borderTopColor: isDark ? "#2A3649" : "#E2E8F0",
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: isDark ? "#4B5563" : "#CBD5E1" },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons
              name={onContact ? "arrow-back" : "create-outline"}
              size={18}
              color={isDark ? "#FDFCF4" : "#283593"}
            />
            <Text
              style={[
                styles.secondaryButtonText,
                { color: isDark ? "#FDFCF4" : "#283593" },
              ]}
            >
              {onContact ? "Volver" : "Seguir Editando"}
            </Text>
          </TouchableOpacity>

          {onContact && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onContact}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.primaryButtonText}>Contactar</Text>
            </TouchableOpacity>
          )}

          {!isCliente && onConfirmSave && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: isDark ? "#FFB74D" : "#FF8C00" },
              ]}
              onPress={() => setSolicitudVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={isDark ? "#121826" : "#FFFFFF"}
              />
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: isDark ? "#121826" : "#FFFFFF" },
                ]}
              >
                Solicitar servicio
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ServiceDetailModal
          visible={Boolean(selectedDetailService)}
          service={selectedDetailService}
          isClientView={true}
          onClose={() => setSelectedDetailService(null)}
          onBookService={(srv) => {
            setSelectedDetailService(null);
            Alert.alert(
              "Solicitud de Servicio",
              `Has solicitado el servicio "${srv.titulo_servicio}". El profesional recibirá la notificación con tus datos para coordinar el trabajo.`,
            );
          }}
        />
        <SolicitudModal
          visible={solicitudVisible}
          onClose={() => setSolicitudVisible(false)}
          profesionalId={profesionalId}
        />

        {/* Modal de previsualización ampliada de fotos (Lightbox) */}
        {expandedImage && (
          <Modal
            visible={!!expandedImage}
            transparent
            animationType="fade"
            onRequestClose={() => setExpandedImage(null)}
          >
            <View style={styles.lightboxOverlay}>
              <TouchableOpacity
                style={styles.lightboxCloseBtn}
                onPress={() => setExpandedImage(null)}
              >
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </TouchableOpacity>
              <Image
                source={{ uri: expandedImage }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  bannerContainer: {
    width: "100%",
    height: 240,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(18, 24, 38, 0.4)",
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  previewNoticeBadge: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(40, 53, 147, 0.85)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 10,
  },
  previewNoticeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  mainCard: {
    marginTop: -40,
    marginHorizontal: 16,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: "relative",
    width: 88,
    height: 88,
    marginBottom: 14,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: "#CBD5E1",
  },
  verifiedShield: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00BFA5",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  proName: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  verifiedBadgeRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  verifiedBadgeText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14.5,
    fontWeight: "600",
  },
  metaBoldText: {
    fontSize: 15,
    fontWeight: "700",
  },
  metaSubText: {
    fontSize: 13.5,
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  experienceBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 140, 0, 0.12)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 0, 0.25)",
  },
  experienceBadgeText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FF8C00",
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  serviceDivider: {
    borderBottomWidth: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 8,
  },
  reviewsHeaderLeft: {
    flex: 1,
  },
  reviewsSubhead: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  ratingBigBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 0,
    alignSelf: "flex-start",
  },
  ratingBigRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingBigNumber: {
    fontSize: 15,
    fontWeight: "800",
  },
  reviewItemCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  reviewUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "700",
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
    marginLeft: "auto",
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  reviewDate: {
    fontSize: 11,
  },
  bottomStickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FF8C00",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyReviewsBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyReviewsText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  reviewerAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerInitial: {
    fontSize: 13,
    fontWeight: "800",
    color: "#00BFA5",
  },
  reviewPhotosRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 6,
  },
  reviewPhotoThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  proReplyContainer: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#00BFA5",
    borderWidth: 1,
  },
  proReplyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  proReplyBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#00BFA5",
  },
  proReplyDate: {
    fontSize: 10,
    color: "#94A3B8",
  },
  proReplyText: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: "italic",
  },
  openReplyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255, 140, 0, 0.1)",
  },
  openReplyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF8C00",
  },
  replyFormBox: {
    gap: 8,
    marginTop: 6,
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    minHeight: 64,
  },
  replyWarningText: {
    fontSize: 10,
    color: "#D97706",
  },
  replyButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  replyCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  replyCancelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  replySubmitBtn: {
    backgroundColor: "#FF8C00",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  replySubmitText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  lightboxCloseBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImage: {
    width: "100%",
    height: "80%",
  },
});
