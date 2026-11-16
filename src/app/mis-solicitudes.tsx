import CreateReviewModal from "@/components/solicitudes/CreateReviewModal";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SolicitudEnviada {
  _id: string;
  id?: string;
  profesionalId?: string;
  profesional: {
    id?: string;
    usuario: {
      nombre: string;
      apellido: string;
      fotoPerfil?: string;
    };
  };
  fechaTentativa: string;
  franjaHoraria: string;
  descripcion: string;
  estado: "PENDIENTE" | "ACEPTADO" | "EN_CURSO" | "RECHAZADA" | "RECHAZADO" | "CANCELADA_AUTO";
  createdAt: string;
  pagoLiberado?: boolean;
  resena?: {
    id: string;
    calificacion: number;
    comentario?: string | null;
    fotosUrls?: string[];
    createdAt: string;
  } | null;
}

export default function MisSolicitudesScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [solicitudes, setSolicitudes] = useState<SolicitudEnviada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEnviada | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await apiClient("/api/solicitudes/mias");
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error al cargar el historial de solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "FINALIZADO":
      case "FINALIZADA":
        return {
          text: "Finalizada",
          color: "#00BFA5",
          icon: "checkmark-done-circle-outline",
        };
      case "PENDIENTE":
        return {
          text: "Pendiente (Esperando respuesta)",
          color: "#FBBF24",
          icon: "time-outline",
        };
      case "ACEPTADO":
        return {
          text: "Aceptada",
          color: "#34D399",
          icon: "checkmark-circle-outline",
        };
      case "EN_CURSO":
        return {
          text: "En curso",
          color: "#38BDF8",
          icon: "construct-outline",
        };
      case "RECHAZADO":
        return {
          text: "Rechazada",
          color: "#F87171",
          icon: "close-circle-outline",
        };
      case "CANCELADA_AUTO":
        return {
          text: "Expirada (+48h sin respuesta)",
          color: "#9CA3AF",
          icon: "alert-circle-outline",
        };
      default:
        return { text: estado, color: "#9CA3AF", icon: "help-outline" };
    }
  };

  const formatearFecha = (fechaIso: string) => {
    if (!fechaIso) return "Fecha no especificada";
    const date = new Date(fechaIso);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const renderItem = ({ item }: { item: SolicitudEnviada }) => {
    const badge = getStatusBadge(item.estado);
    const nombrePro = item.profesional?.usuario
      ? `${item.profesional.usuario.nombre} ${item.profesional.usuario.apellido}`
      : "Profesional";

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.backgroundElement,
            borderColor: colors.backgroundSelected,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.proName, { color: colors.text }]}>
            {nombrePro}
          </Text>
          <View
            style={[
              styles.badgeContainer,
              { backgroundColor: badge.color + "20" },
            ]}
          >
            <Ionicons
              name={badge.icon as any}
              size={14}
              color={badge.color}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.badgeText, { color: badge.color }]}>
              {badge.text}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color="#FFB74D" />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Fecha: {formatearFecha(item.fechaTentativa)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color="#FFB74D" />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Franja: {item.franjaHoraria}
          </Text>
        </View>

        <Text
          style={[
            styles.descripcion,
            { color: colors.text, backgroundColor: colors.background },
          ]}
        >
          "{item.descripcion}"
        </Text>

        {(() => {
          const esFinalizada =
            item.estado === "FINALIZADO" || item.estado === "FINALIZADA";
          const esLiberada = item.pagoLiberado !== false;

          if (!esFinalizada || !esLiberada) return null;

          if (item.resena) {
            return (
              <View style={styles.badgeCalificadoContainer}>
                <View style={styles.badgeCalificado}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.badgeCalificadoText}>
                    Calificado ⭐ {item.resena.calificacion}/5
                  </Text>
                </View>
                <Text style={styles.fechaResenaText}>
                  {item.resena.createdAt
                    ? formatearFecha(item.resena.createdAt)
                    : ""}
                </Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              style={styles.calificarBtn}
              onPress={() => {
                setSelectedSolicitud(item);
                setShowReviewModal(true);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Calificar servicio"
            >
              <Ionicons name="star" size={16} color="#FFFFFF" />
              <Text style={styles.calificarBtnText}>Calificar servicio</Text>
            </TouchableOpacity>
          );
        })()}
        {(item.estado === "ACEPTADO" || item.estado === "EN_CURSO") && (
          <TouchableOpacity
            style={[styles.payButton, { borderColor: colors.primary }]}
            onPress={() => router.push(`/pagos/${item._id}`)}
            accessibilityRole="button"
            accessibilityLabel="Gestionar el pago de esta solicitud"
          >
            <Ionicons name="card-outline" size={18} color={colors.primary} />
            <Text style={[styles.payButtonText, { color: colors.primary }]}>
              Gestionar pago
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FFB74D" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <View
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top + 15,
            backgroundColor: colors.backgroundElement,
            borderBottomColor: colors.backgroundSelected || "#334155",
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


        <Text style={[styles.headerTitleText, { color: colors.text }]}>
          Historial de Solicitudes
        </Text>


        <View style={{ width: 24 }} />
      </View>


      {solicitudes.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="document-text-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Todavía no has solicitado ningún servicio.
          </Text>
          <TouchableOpacity
            style={styles.buscarBtn}
            onPress={() => router.push("/(tabs)/search")}
          >
            <Text style={styles.buscarBtnText}>Buscar Profesionales</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={solicitudes}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {selectedSolicitud && (
        <CreateReviewModal
          visible={showReviewModal}
          solicitudId={selectedSolicitud._id || selectedSolicitud.id!}
          profesionalNombre={`${selectedSolicitud.profesional?.usuario?.nombre || "Profesional"} ${selectedSolicitud.profesional?.usuario?.apellido || ""}`.trim()}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedSolicitud(null);
          }}
          onSuccess={() => {
            setShowReviewModal(false);
            setSelectedSolicitud(null);
            fetchSolicitudes();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },


  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  proName: { fontSize: 16, fontWeight: "bold", flex: 1 },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  detailText: { fontSize: 13, marginLeft: 6 },
  descripcion: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  payButton: {
    marginTop: 12,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  payButtonText: { fontSize: 14, fontWeight: "700" },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 12,
    marginBottom: 20,
  },
  buscarBtn: {
    backgroundColor: "#FFB74D",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buscarBtnText: { color: "#121826", fontWeight: "bold", fontSize: 14 },
  reviewTriggerContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.15)",
  },
  badgeCalificadoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.15)",
  },
  badgeCalificado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  badgeCalificadoText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
  fechaResenaText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  calificarBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF8C00",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  calificarBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
