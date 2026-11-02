import { useAccessibility } from "@/context/AccessibilityContext";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/api";
import { clearBadge, syncBadgeCount } from "@/utils/badge";
import { resolverRutaNotificacion } from "@/utils/notificationRouting";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface NotificacionItem {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string;
  data: { ruta?: string; solicitudId?: string } | null;
  leida: boolean;
  critica: boolean;
  createdAt: string;
}

const ICONOS: Record<string, IconName> = {
  MENSAJE_CHAT: "chatbubble-ellipses-outline",
  NUEVA_SOLICITUD: "document-text-outline",
  PROPUESTA_VISITA: "calendar-outline",
  ESTADO_PAGO: "card-outline",
  LLAMADA_ENTRANTE: "call-outline",
};

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";

  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60000);
  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `Hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;

  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

export default function NotificacionesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();

  const [items, setItems] = useState<NotificacionItem[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (modo: "inicial" | "refresh") => {
    if (modo === "refresh") setRefrescando(true);
    else setCargando(true);

    setError(null);

    try {
      const res = await apiClient("/api/notificaciones?limit=50");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setItems(Array.isArray(data?.data) ? data.data : []);
      setNoLeidas(Number(data?.noLeidas) || 0);
    } catch (e) {
      console.warn("No se pudieron cargar las notificaciones:", e);
      setError("No se pudieron cargar las notificaciones.");
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar("inicial");
    }, [cargar]),
  );

  const marcarTodas = async () => {
    if (noLeidas === 0) return;

    try {
      const res = await apiClient("/api/notificaciones/leer-todas", {
        method: "PATCH",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
      await clearBadge();
    } catch (e) {
      console.warn("No se pudieron marcar como leídas:", e);
    }
  };

  const abrir = async (item: NotificacionItem) => {
    if (!item.leida) {
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, leida: true } : n)),
      );
      setNoLeidas((prev) => Math.max(prev - 1, 0));

      apiClient(`/api/notificaciones/${item.id}/leer`, {
        method: "PATCH",
      })
        .then(() => syncBadgeCount())
        .catch((e) => {
          console.warn("No se pudo marcar la notificación como leída:", e);
        });
    }

    router.push(resolverRutaNotificacion(item.data));
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>
          Notificaciones
        </Text>

        <TouchableOpacity
          onPress={marcarTodas}
          disabled={noLeidas === 0}
          style={styles.markAll}
        >
          <Text
            style={[
              styles.markAllText,
              { color: noLeidas === 0 ? colors.textSecondary : colors.primary },
            ]}
          >
            Leídas
          </Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            items.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => cargar("refresh")}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {error ?? "No tenés notificaciones"}
              </Text>
              {error && (
                <TouchableOpacity
                  onPress={() => cargar("inicial")}
                  style={[
                    styles.retryButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.retryText}>Reintentar</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => abrir(item)}
              activeOpacity={0.7}
              style={[
                styles.item,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: item.leida ? "transparent" : colors.primary,
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isDark ? "#003366" : "#E8F0FE" },
                ]}
              >
                <Ionicons
                  name={ICONOS[item.tipo] ?? "notifications-outline"}
                  size={22}
                  color={isDark ? "#66B2FF" : "#1A73E8"}
                />
              </View>

              <View style={styles.itemText}>
                <View style={styles.itemTitleRow}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.itemTitle,
                      {
                        color: colors.text,
                        fontWeight: item.leida ? "600" : "800",
                      },
                    ]}
                  >
                    {item.titulo}
                  </Text>
                  {!item.leida && (
                    <View
                      style={[
                        styles.unreadDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </View>

                <Text
                  numberOfLines={2}
                  style={[styles.itemBody, { color: colors.textSecondary }]}
                >
                  {item.cuerpo}
                </Text>

                <Text
                  style={[styles.itemDate, { color: colors.textSecondary }]}
                >
                  {formatearFecha(item.createdAt)}
                </Text>
              </View>

              {item.critica && (
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    marginLeft: 4,
  },
  markAll: { paddingHorizontal: 8, paddingVertical: 6 },
  markAllText: { fontSize: 14, fontWeight: "700" },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  emptyContainer: { flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: { color: "#FFFFFF", fontWeight: "700" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemText: { flex: 1 },
  itemTitleRow: { flexDirection: "row", alignItems: "center" },
  itemTitle: { flex: 1, fontSize: 15 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  itemBody: { fontSize: 13, marginTop: 2 },
  itemDate: { fontSize: 12, marginTop: 6, fontWeight: "500" },
});
