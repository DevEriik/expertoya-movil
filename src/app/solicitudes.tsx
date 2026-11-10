import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SolicitudRecibida {
  id: string;
  _id: string;
  estado: "PENDIENTE" | "ACEPTADO" | "RECHAZADO" | "CANCELADA_AUTO";
  fechaTentativa: string;
  franjaHoraria: string;
  descripcion: string;
  cliente: {
    usuario: {
      nombre: string;
      apellido: string;
      telefono?: string;
      fotoPerfil?: string;
    };
  };
  servicio: {
    titulo_servicio: string;
  };
}

export default function SolicitudesProfesionalScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [solicitudes, setSolicitudes] = useState<SolicitudRecibida[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroTab, setFiltroTab] = useState<
    "PENDIENTE" | "ACEPTADO" | "RECHAZADO"
  >("PENDIENTE");

  const fetchSolicitudesRecibidas = async () => {
    try {
      const response = await apiClient("/api/solicitudes/recibidas");
      if (response.ok) {
        const json = await response.json();
        setSolicitudes(json.data || []);
      }
    } catch (error) {
      console.error("Error al obtener solicitudes recibidas:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSolicitudesRecibidas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSolicitudesRecibidas();
  };

  const handleResponder = async (
    id: string,
    accion: "ACEPTADO" | "RECHAZADO",
  ) => {
    try {
      const response = await apiClient(`/api/solicitudes/${id}/responder`, {
        method: "PATCH",
        body: JSON.stringify({ accion }),
      });

      if (response.ok) {
        Alert.alert(
          "Éxito",
          `La solicitud fue ${accion === "ACEPTADO" ? "aceptada" : "rechazada"} correctamente.`,
        );
        fetchSolicitudesRecibidas();
      } else {
        const err = await response.json();
        Alert.alert(
          "Error",
          err.error || "No se pudo actualizar la solicitud.",
        );
      }
    } catch (error) {
      console.error("Error al responder solicitud:", error);
      Alert.alert("Error de Red", "No se pudo conectar con el servidor.");
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

  const solicitudesFiltradas = solicitudes.filter((s) => {
    if (filtroTab === "RECHAZADO") {
      return s.estado === "RECHAZADO" || s.estado === "CANCELADA_AUTO";
    }
    return s.estado === filtroTab;
  });

  if (loading && !refreshing) {
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
            paddingTop: insets.top + 10,
            backgroundColor: colors.backgroundElement,
            borderBottomColor: colors.backgroundSelected || "#334155",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitleText, { color: colors.text }]}>
          Gestión de Solicitudes
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <View
        style={[
          styles.tabsContainer,
          {
            backgroundColor: colors.backgroundElement,
            borderBottomColor: colors.backgroundSelected || "#E2E8F0", // <-- AGREGADO
          },
        ]}
      >
        {(["PENDIENTE", "ACEPTADO", "RECHAZADO"] as const).map((tab) => {
          const count = solicitudes.filter((s) =>
            tab === "RECHAZADO"
              ? s.estado === "RECHAZADO" || s.estado === "CANCELADA_AUTO"
              : s.estado === tab,
          ).length;

          const isActive = filtroTab === tab;

          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                isActive && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => setFiltroTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive
                      ? colors.primary
                      : colors.textSecondary || "#94A3B8",
                  },
                ]}
              >
                {tab === "PENDIENTE"
                  ? "Pendientes"
                  : tab === "ACEPTADO"
                    ? "Aceptadas"
                    : "Rechazadas"}{" "}
                ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={solicitudesFiltradas}
        keyExtractor={(item) => item.id || item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFB74D"
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centerEmpty}>
            <Ionicons
              name="documents-outline"
              size={56}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No hay solicitudes{" "}
              {filtroTab === "PENDIENTE"
                ? "pendientes"
                : filtroTab === "ACEPTADO"
                  ? "aceptadas"
                  : "rechazadas"}{" "}
              en este momento.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const clienteNombre = item.cliente?.usuario
            ? `${item.cliente.usuario.nombre} ${item.cliente.usuario.apellido}`
            : "Cliente";

          const isPendiente = item.estado === "PENDIENTE";

          const badgeConfig =
            item.estado === "ACEPTADO"
              ? {
                  text: "Aceptada",
                  bg: "#34D39920",
                  color: "#34D399",
                  icon: "checkmark-circle-outline",
                }
              : item.estado === "RECHAZADO"
                ? {
                    text: "Rechazada",
                    bg: "#F8717120",
                    color: "#F87171",
                    icon: "close-circle-outline",
                  }
                : item.estado === "CANCELADA_AUTO"
                  ? {
                      text: "Expirada (+48h)",
                      bg: "#9CA3AF20",
                      color: "#9CA3AF",
                      icon: "alert-circle-outline",
                    }
                  : {
                      text: "Pendiente",
                      bg: "#FBBF2420",
                      color: "#FBBF24",
                      icon: "time-outline",
                    };

          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.backgroundSelected || "#334155",
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.clientName, { color: colors.text }]}>
                  {clienteNombre}
                </Text>
                <View
                  style={[styles.badge, { backgroundColor: badgeConfig.bg }]}
                >
                  <Ionicons
                    name={badgeConfig.icon as any}
                    size={12}
                    color={badgeConfig.color}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[styles.badgeText, { color: badgeConfig.color }]}
                  >
                    {badgeConfig.text}
                  </Text>
                </View>
              </View>

              <Text style={[styles.serviceTitle, { color: colors.primary }]}>
                Servicio: {item.servicio?.titulo_servicio || "General"}
              </Text>

              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={14} color="#FFB74D" />
                <Text
                  style={[styles.detailText, { color: colors.textSecondary }]}
                >
                  Fecha: {formatearFecha(item.fechaTentativa)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={14} color="#FFB74D" />
                <Text
                  style={[styles.detailText, { color: colors.textSecondary }]}
                >
                  Franja Horaria: {item.franjaHoraria || "A coordinar"}
                </Text>
              </View>

              <Text
                style={[
                  styles.descripcion,
                  { color: colors.text, backgroundColor: colors.background },
                ]}
              >
                "{item.descripcion || "Sin descripción proporcionada."}"
              </Text>

              {isPendiente && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() =>
                      handleResponder(item.id || item._id, "RECHAZADO")
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color="#FFF"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.actionBtnText}>Rechazar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() =>
                      handleResponder(item.id || item._id, "ACEPTADO")
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#121826"
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.actionBtnText,
                        { color: "#121826", fontWeight: "bold" },
                      ]}
                    >
                      Aceptar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
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
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitleText: { fontSize: 18, fontWeight: "bold" },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around", 
  },
  tabButton: {
    paddingVertical: 12,
    flex: 1,
    alignItems: "center",
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerEmpty: { marginTop: 80, alignItems: "center", paddingHorizontal: 24 },
  emptyText: { textAlign: "center", marginTop: 12, fontSize: 14 },
  listContent: { padding: 16, paddingBottom: 30 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clientName: { fontSize: 16, fontWeight: "bold", flex: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "bold" },
  serviceTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  detailText: { fontSize: 13, marginLeft: 6 },
  descripcion: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  rejectBtn: { backgroundColor: "#EF4444" },
  acceptBtn: { backgroundColor: "#34D399" },
  actionBtnText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
});
