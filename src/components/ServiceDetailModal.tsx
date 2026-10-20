import React, { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/context/AccessibilityContext";
import { ServicioPublicadoItem } from "@/types/service";

interface ServiceDetailModalProps {
  visible: boolean;
  onClose: () => void;
  service: ServicioPublicadoItem | null;
  isClientView?: boolean;
  onBookService?: (service: ServicioPublicadoItem) => void;
  onEditService?: (service: ServicioPublicadoItem) => void;
  onDeleteService?: (service: ServicioPublicadoItem) => void;
}

export default function ServiceDetailModal({
  visible,
  onClose,
  service,
  isClientView = true,
  onBookService,
  onEditService,
  onDeleteService,
}: ServiceDetailModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  if (!service) return null;

  const fotos = (service.fotos_servicio || []).filter(
    (f) => !(Platform.OS === "web" && typeof f === "string" && f.startsWith("blob:"))
  );
  const activeImage = fotos.length > 0 ? fotos[activePhotoIdx] || fotos[0] : null;
  const isActivo = service.servicio_activo;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#121826" : "#FDFCF4" },
        ]}
      >
        <View
          style={[
            styles.headerRow,
            {
              backgroundColor: colors.backgroundElement,
              borderBottomColor: isDark ? "#2A3649" : "#E2E8F0",
              paddingTop: Math.max(insets.top + 8, 16),
            },
          ]}
        >
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerCategory, { color: colors.primary }]}>
              {service.nombre_oficio || "SERVICIO PROFESIONAL"}
            </Text>
            <Text
              style={[styles.headerMainTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              Detalle del Servicio
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.closeBtn,
              { backgroundColor: isDark ? "#2A3649" : "#F1F5F9" },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityLabel="Cerrar detalle"
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.galleryContainer}>
            {activeImage && !imgError ? (
              <View style={styles.mainImageWrapper}>
                <Image
                  source={{ uri: activeImage }}
                  style={styles.mainImage}
                  resizeMode="cover"
                  onError={() => setImgError(true)}
                />
                {fotos.length > 1 && (
                  <View style={styles.photoCountBadge}>
                    <Ionicons name="camera" size={12} color="#FFF" />
                    <Text style={styles.photoCountText}>
                      {activePhotoIdx + 1} de {fotos.length} fotos
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  { backgroundColor: colors.backgroundSelected },
                ]}
              >
                <Ionicons
                  name="construct-outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.placeholderText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Sin fotos del trabajo
                </Text>
              </View>
            )}

            {fotos.length > 1 && (
              <View style={styles.thumbnailsRow}>
                {fotos.map((uri, idx) => (
                  <TouchableOpacity
                    key={uri + idx}
                    style={[
                      styles.thumbBtn,
                      {
                        borderColor:
                          activePhotoIdx === idx
                            ? colors.primary
                            : isDark
                              ? "#374151"
                              : "#E2E8F0",
                      },
                    ]}
                    onPress={() => setActivePhotoIdx(idx)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri }} style={styles.thumbImage} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: isDark ? "#2A3649" : "#E2E8F0",
              },
            ]}
          >
            <View style={styles.badgeRow}>
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
                  name="hammer-outline"
                  size={12}
                  color={colors.primary}
                />
                <Text style={[styles.categoryPillText, { color: colors.primary }]}>
                  {service.nombre_oficio || "Oficio"}
                </Text>
              </View>

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
                  {isActivo ? "Servicio Disponible" : "Servicio Pausado"}
                </Text>
              </View>
            </View>

            <Text style={[styles.serviceTitle, { color: colors.text }]}>
              {service.titulo_servicio}
            </Text>

            <View
              style={[
                styles.highlightMetricsRow,
                {
                  backgroundColor: isDark ? "#121826" : "#F8FAFC",
                  borderColor: isDark ? "#2A3649" : "#E2E8F0",
                },
              ]}
            >
              <View style={styles.metricItem}>
                <Text
                  style={[styles.metricLabel, { color: colors.textSecondary }]}
                >
                  Precio Estimado
                </Text>
                <Text style={[styles.metricPrice, { color: colors.primary }]}>
                  ${Number(service.costo_estimado).toLocaleString()} ARS
                </Text>
              </View>

              <View
                style={[
                  styles.metricDivider,
                  { backgroundColor: isDark ? "#2A3649" : "#E2E8F0" },
                ]}
              />

              <View style={styles.metricItem}>
                <Text
                  style={[styles.metricLabel, { color: colors.textSecondary }]}
                >
                  Tiempo de Ejecución
                </Text>
                <View style={styles.durationContentRow}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {service.duracion_estimada}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Descripción del Trabajo
              </Text>
              <Text
                style={[
                  styles.fullDescriptionText,
                  { color: isDark ? "#CBD5E1" : "#475569" },
                ]}
              >
                {service.descripcion_servicio ||
                  "El profesional no ha detallado una descripción comercial para este servicio. Contáctalo directamente para consultar alcance y especificaciones."}
              </Text>
            </View>

            <View
              style={[
                styles.securityBanner,
                {
                  backgroundColor: isDark
                    ? "rgba(0, 191, 165, 0.1)"
                    : "rgba(0, 191, 165, 0.08)",
                  borderColor: isDark
                    ? "rgba(51, 239, 165, 0.3)"
                    : "rgba(0, 191, 165, 0.25)",
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={22}
                color={isDark ? "#33EFA5" : "#00BFA5"}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.securityTitle,
                    { color: isDark ? "#33EFA5" : "#00BFA5" },
                  ]}
                >
                  Garantía y Pago Protegido Escrow
                </Text>
                <Text
                  style={[
                    styles.securitySubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Tu dinero queda retenido de forma segura en la plataforma y solo se libera al profesional una vez finalizado el trabajo a tu total conformidad.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomStickyBar,
            {
              backgroundColor: colors.backgroundElement,
              borderTopColor: isDark ? "#2A3649" : "#E2E8F0",
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {isClientView ? (
            <TouchableOpacity
              style={[
                styles.primaryCtaButton,
                {
                  backgroundColor: isActivo ? colors.primary : "#94A3B8",
                },
              ]}
              onPress={() => {
                if (isActivo && onBookService) {
                  onBookService(service);
                }
              }}
              disabled={!isActivo}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.primaryCtaText}>
                {isActivo ? "Solicitar este Servicio" : "Servicio Pausado"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.proActionButtonsRow}>
              {onDeleteService && (
                <TouchableOpacity
                  style={[
                    styles.deleteSquareBtn,
                    {
                      borderColor: isDark ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.3)",
                      backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2",
                    },
                  ]}
                  onPress={() => {
                    onClose();
                    onDeleteService(service);
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Eliminar este servicio"
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.secondaryOutlineBtn,
                  { borderColor: isDark ? "#4B5563" : "#CBD5E1" },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.secondaryOutlineText,
                    { color: colors.text },
                  ]}
                >
                  Cerrar
                </Text>
              </TouchableOpacity>

              {onEditService && (
                <TouchableOpacity
                  style={[
                    styles.primaryCtaButton,
                    { backgroundColor: colors.primary, flex: 2 },
                  ]}
                  onPress={() => {
                    onClose();
                    onEditService(service);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryCtaText} numberOfLines={1}>
                    Editar Servicio
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerCategory: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerMainTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  scroll: {
    flex: 1,
  },
  galleryContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  mainImageWrapper: {
    width: "100%",
    height: 230,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  photoCountBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  photoCountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: "600",
  },
  thumbnailsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  thumbBtn: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
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
  serviceTitle: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  highlightMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  metricItem: {
    flex: 1,
    gap: 4,
  },
  metricDivider: {
    width: 1,
    height: 38,
    marginHorizontal: 12,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  metricPrice: {
    fontSize: 18,
    fontWeight: "800",
  },
  durationContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  descriptionSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  fullDescriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  securitySubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  bottomStickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCtaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteSquareBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1.5,
  },
  proActionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  secondaryOutlineBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  secondaryOutlineText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
