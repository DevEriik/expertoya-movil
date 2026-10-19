import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/context/AccessibilityContext";
import ServiceDetailModal from "@/components/ServiceDetailModal";
import { ServicioPublicadoItem } from "@/types/service";
import { getServices } from "@/utils/servicesStorage";

interface ProfilePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmSave?: () => void;
  nombre: string;
  apellido: string;
  fotoPerfil?: string;
  bio?: string;
  zonasCobertura?: string;
  oficiosNombres?: string[];
  calificacion?: number;
  totalReviews?: number;
  servicios?: ServicioPublicadoItem[];
}

export default function ProfilePreviewModal({
  visible,
  onClose,
  onConfirmSave,
  nombre,
  apellido,
  fotoPerfil,
  bio,
  zonasCobertura,
  oficiosNombres = [],
  calificacion = 4.9,
  totalReviews = 310,
  servicios,
}: ProfilePreviewModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();

  const [activeServices, setActiveServices] = useState<ServicioPublicadoItem[]>(
    servicios || [],
  );
  const [selectedDetailService, setSelectedDetailService] =
    useState<ServicioPublicadoItem | null>(null);

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
    oficiosNombres.length > 0
      ? oficiosNombres[0]
      : "Profesional Certificado";

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
              style={[
                styles.backButton,
                { top: Math.max(insets.top + 8, 20) },
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View
              style={[
                styles.previewNoticeBadge,
                { top: Math.max(insets.top + 10, 22) },
              ]}
            >
              <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
              <Text style={styles.previewNoticeText}>Vista del Cliente</Text>
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
                  Identidad y Matrícula Verificada
                </Text>
              </View>
            </View>

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

            <View style={styles.metaRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text
                style={[
                  styles.metaBoldText,
                  { color: isDark ? "#FDFCF4" : "#1E293B" },
                ]}
              >
                {calificacion.toFixed(1)}
              </Text>
              <Text
                style={[
                  styles.metaSubText,
                  { color: isDark ? "#94A3B8" : "#60646C" },
                ]}
              >
                ({totalReviews} opiniones)
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

            <View style={styles.aiBadge}>
              <View style={styles.aiDot} />
              <Text style={styles.aiBadgeText}>Descripción optimizada con IA</Text>
            </View>
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
                  { color: isDark ? "#FDFCF4" : "#283593" },
                ]}
              >
                Servicios del Profesional ({activeServices.length})
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#94A3B8" : "#60646C",
                  fontWeight: "600",
                }}
              >
                Toca para ver detalle
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
              <View>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isDark ? "#FDFCF4" : "#283593", marginBottom: 2 },
                  ]}
                >
                  Reseñas Verificadas
                </Text>
                <Text
                  style={[
                    styles.reviewsSubhead,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Solo clientes con pagos liberados en ExpertoYa.
                </Text>
              </View>
              <View style={styles.ratingBigRow}>
                <Text
                  style={[
                    styles.ratingBigNumber,
                    { color: isDark ? "#FDFCF4" : "#1E293B" },
                  ]}
                >
                  4.9
                </Text>
                <Ionicons name="star" size={20} color="#F59E0B" />
              </View>
            </View>

            <View
              style={[
                styles.reviewItemCard,
                {
                  backgroundColor: isDark ? "#121826" : "#FDFCF4",
                  borderColor: isDark ? "#2A3649" : "#F0F0E8",
                },
              ]}
            >
              <View style={styles.reviewUserRow}>
                <Text
                  style={[
                    styles.reviewerName,
                    { color: isDark ? "#FDFCF4" : "#1E293B" },
                  ]}
                >
                  Martín G.
                </Text>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={12} color="#F59E0B" />
                  ))}
                </View>
              </View>
              <Text
                style={[
                  styles.reviewComment,
                  { color: isDark ? "#94A3B8" : "#60646C" },
                ]}
              >
                Super profesional. Diagnosticó y resolvió el problema en tiempo récord. Muy recomendado.
              </Text>
              <Text
                style={[
                  styles.reviewDate,
                  { color: isDark ? "#64748B" : "#94A3B8" },
                ]}
              >
                Hace 2 semanas
              </Text>
            </View>
          </View>
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
              name="create-outline"
              size={18}
              color={isDark ? "#FDFCF4" : "#283593"}
            />
            <Text
              style={[
                styles.secondaryButtonText,
                { color: isDark ? "#FDFCF4" : "#283593" },
              ]}
            >
              Seguir Editando
            </Text>
          </TouchableOpacity>

          {onConfirmSave && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                onClose();
                onConfirmSave();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Guardar y Publicar</Text>
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
  aiBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 191, 165, 0.12)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00BFA5",
  },
  aiBadgeText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#00BFA5",
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
  },
  reviewsSubhead: {
    fontSize: 12,
    marginTop: 2,
  },
  ratingBigRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingBigNumber: {
    fontSize: 22,
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
});
