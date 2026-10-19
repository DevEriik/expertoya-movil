import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { ServicioPublicadoItem } from "@/types/service";

export interface ServiceCardProps {
  service?: ServicioPublicadoItem;
  // Propiedades opcionales para compatibilidad con llamadas existentes
  title?: string;
  price?: number;
  duration?: string;
  imageUrl?: string;
  description?: string;
  active?: boolean;
  categoryName?: string;
  // Acciones interactivas
  onPress?: (service: ServicioPublicadoItem) => void;
  onEdit?: (service: ServicioPublicadoItem) => void;
  onTogglePause?: (service: ServicioPublicadoItem) => void;
  onDelete?: (service: ServicioPublicadoItem) => void;
}

export default function ServiceCard({
  service,
  title,
  price,
  duration,
  imageUrl,
  description,
  active,
  categoryName,
  onPress,
  onEdit,
  onTogglePause,
  onDelete,
}: ServiceCardProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  // Normalizar datos si se pasa el objeto `service` completo o props individuales
  const currentItem: ServicioPublicadoItem = service ?? {
    id: "temp",
    oficio_id: 1,
    titulo_servicio: title || "Servicio sin título",
    descripcion_servicio: description || "",
    costo_estimado: price ?? 0,
    duracion_estimada: duration || "A convenir",
    fotos_servicio: imageUrl ? [imageUrl] : [],
    servicio_activo: active ?? true,
    nombre_oficio: categoryName,
  };

  const isActivo = currentItem.servicio_activo;
  const fotos = currentItem.fotos_servicio || [];
  const primaryImage = fotos.length > 0 ? fotos[0] : null;
  const [imgError, setImgError] = React.useState(false);

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={() => onPress && onPress(currentItem)}
      disabled={!onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: isDark ? "#2A3649" : "#E2E8F0",
          opacity: isActivo ? 1 : 0.85,
        },
      ]}
    >
      {/* Top Header: Categoría y Estado Accesible */}
      <View style={styles.topHeader}>
        <View
          style={[
            styles.categoryPill,
            {
              backgroundColor: isDark
                ? "rgba(255, 183, 77, 0.15)"
                : "rgba(255, 140, 0, 0.1)",
            },
          ]}
        >
          <Ionicons
            name="construct-outline"
            size={12}
            color={colors.primary}
          />
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {currentItem.nombre_oficio || "Oficio"}
          </Text>
        </View>

        {/* Badge de estado accesible: Icono + Texto explicativo */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isActivo
                ? isDark
                  ? "rgba(52, 211, 153, 0.15)"
                  : "rgba(16, 185, 129, 0.12)"
                : isDark
                ? "rgba(251, 191, 36, 0.15)"
                : "rgba(245, 158, 11, 0.12)",
              borderColor: isActivo
                ? isDark
                  ? "rgba(52, 211, 153, 0.3)"
                  : "rgba(16, 185, 129, 0.25)"
                : isDark
                ? "rgba(251, 191, 36, 0.3)"
                : "rgba(245, 158, 11, 0.25)",
            },
          ]}
          accessible={true}
          accessibilityLabel={`Estado del servicio: ${isActivo ? "Activo" : "Pausado"}`}
        >
          <Ionicons
            name={isActivo ? "checkmark-circle" : "pause-circle"}
            size={13}
            color={
              isActivo
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
              styles.statusText,
              {
                color: isActivo
                  ? isDark
                    ? "#34D399"
                    : "#10B981"
                  : isDark
                  ? "#FBBF24"
                  : "#F59E0B",
              },
            ]}
          >
            {isActivo ? "Activo" : "Pausado"}
          </Text>
        </View>
      </View>

      {/* Main Content Row: Miniatura + Info */}
      <View style={styles.mainContentRow}>
        <View style={styles.imageContainer}>
          {primaryImage && !imgError ? (
            <Image
              source={{ uri: primaryImage }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: colors.backgroundSelected },
              ]}
            >
              <Ionicons
                name="images-outline"
                size={28}
                color={colors.textSecondary}
              />
            </View>
          )}

          {/* Contador de fotos superpuesto si hay más de 1 */}
          {fotos.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Ionicons name="camera" size={11} color="#FFF" />
              <Text style={styles.photoCountText}>{fotos.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {currentItem.titulo_servicio}
          </Text>

          {Boolean(currentItem.descripcion_servicio) && (
            <Text
              style={[
                styles.description,
                { color: colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {currentItem.descripcion_servicio}
            </Text>
          )}

          <View style={styles.metricsRow}>
            <View style={styles.durationRow}>
              <Ionicons
                name="time-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.durationText, { color: colors.textSecondary }]}
              >
                {currentItem.duracion_estimada}
              </Text>
            </View>

            <Text style={[styles.price, { color: colors.primary }]}>
              ${Number(currentItem.costo_estimado).toLocaleString()} ARS
            </Text>
          </View>
        </View>
      </View>

      {/* Action Bar: Editar, Pausar/Reanudar y Eliminar */}
      {(onEdit || onTogglePause || onDelete) && (
        <View
          style={[
            styles.actionBar,
            { borderTopColor: isDark ? "#2A3649" : "#F1F5F9" },
          ]}
        >
          {onEdit && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { borderColor: isDark ? "#374151" : "#E2E8F0" },
              ]}
              onPress={() => onEdit(currentItem)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Editar este servicio"
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={isDark ? "#93C5FD" : "#283593"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? "#93C5FD" : "#283593" },
                ]}
              >
                Editar
              </Text>
            </TouchableOpacity>
          )}

          {onTogglePause && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  borderColor: isActivo
                    ? isDark
                      ? "#451A03"
                      : "#FEF3E0"
                    : isDark
                    ? "#064E3B"
                    : "#E6F4EA",
                  backgroundColor: isActivo
                    ? isDark
                      ? "rgba(251, 191, 36, 0.1)"
                      : "#FFFBEB"
                    : isDark
                    ? "rgba(52, 211, 153, 0.1)"
                    : "#F0FDF4",
                },
              ]}
              onPress={() => onTogglePause(currentItem)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                isActivo ? "Pausar servicio" : "Activar servicio"
              }
            >
              <Ionicons
                name={isActivo ? "pause-outline" : "play-outline"}
                size={16}
                color={
                  isActivo
                    ? isDark
                      ? "#FBBF24"
                      : "#D97706"
                    : isDark
                    ? "#34D399"
                    : "#059669"
                }
              />
              <Text
                style={[
                  styles.actionBtnText,
                  {
                    color: isActivo
                      ? isDark
                        ? "#FBBF24"
                        : "#D97706"
                      : isDark
                      ? "#34D399"
                      : "#059669",
                  },
                ]}
              >
                {isActivo ? "Pausar" : "Activar"}
              </Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.deleteBtn,
                {
                  borderColor: isDark
                    ? "rgba(239, 68, 68, 0.3)"
                    : "rgba(239, 68, 68, 0.2)",
                  backgroundColor: isDark
                    ? "rgba(239, 68, 68, 0.08)"
                    : "#FEF2F2",
                },
              ]}
              onPress={() => onDelete(currentItem)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Eliminar este servicio"
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={isDark ? "#F87171" : "#DC2626"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? "#F87171" : "#DC2626" },
                ]}
              >
                Eliminar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  mainContentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCountBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  photoCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    fontSize: 13,
    fontWeight: "500",
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteBtn: {},
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
