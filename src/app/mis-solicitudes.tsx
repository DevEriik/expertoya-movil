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
  profesional: {
    usuario: {
      nombre: string;
      apellido: string;
      fotoPerfil?: string;
    };
  };
  fechaTentativa: string;
  franjaHoraria: string;
  descripcion: string;
  estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "CANCELADA_AUTO";
  createdAt: string;
}

export default function MisSolicitudesScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets(); 
  const [solicitudes, setSolicitudes] = useState<SolicitudEnviada[]>([]);
  const [loading, setLoading] = useState(true);

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

        <Text style={[styles.descripcion, { color: colors.text }]}>
          "{item.descripcion}"
        </Text>
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
      {/* 3. NUEVA BARRA SUPERIOR CON FLECHA DE RETROCESO */}
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
    backgroundColor: "#121826",
    padding: 8,
    borderRadius: 8,
  },
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
});
