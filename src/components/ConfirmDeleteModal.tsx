import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAccessibility } from "@/context/AccessibilityContext";

const FONT_FAMILY = Platform.select({
  web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  ios: "System",
  default: "sans-serif",
});

interface ConfirmDeleteModalProps {
  visible: boolean;
  serviceTitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function ConfirmDeleteModal({
  visible,
  serviceTitle,
  onConfirm,
  onCancel,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  const { isDarkMode: isDark } = useAccessibility();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={isDeleting ? undefined : onCancel}
    >
      <TouchableWithoutFeedback onPress={isDeleting ? undefined : onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                  borderColor: isDark ? "#374151" : "#E2E8F0",
                },
              ]}
              accessible={true}
              accessibilityRole="alert"
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(239, 68, 68, 0.18)"
                      : "rgba(239, 68, 68, 0.10)",
                  },
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={32}
                  color={isDark ? "#F87171" : "#EF4444"}
                />
              </View>

              <Text
                style={[
                  styles.title,
                  { color: isDark ? "#FDFCF4" : "#1E293B" },
                ]}
              >
                ¿Eliminar servicio?
              </Text>

              {Boolean(serviceTitle) && (
                <View
                  style={[
                    styles.serviceBadgeContainer,
                    {
                      backgroundColor: isDark
                        ? "rgba(18, 24, 38, 0.8)"
                        : "#F8FAFC",
                      borderColor: isDark ? "#374151" : "#E2E8F0",
                    },
                  ]}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={16}
                    color={isDark ? "#94A3B8" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.serviceBadgeText,
                      { color: isDark ? "#FDFCF4" : "#0F172A" },
                    ]}
                    numberOfLines={2}
                  >
                    "{serviceTitle}"
                  </Text>
                </View>
              )}

              <Text
                style={[
                  styles.message,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Esta acción es permanente y no se puede deshacer. El servicio
                dejará de estar disponible para contratación en la plataforma.
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: isDark ? "#374151" : "#F1F5F9",
                    },
                  ]}
                  onPress={onCancel}
                  disabled={isDeleting}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar eliminación"
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: isDark ? "#FDFCF4" : "#475569" },
                    ]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    { opacity: isDeleting ? 0.75 : 1 },
                  ]}
                  onPress={onConfirm}
                  disabled={isDeleting}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Confirmar eliminación del servicio"
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="trash" size={16} color="#FFFFFF" />
                      <Text style={styles.deleteButtonText}>
                        Eliminar
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.35)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
      },
    }),
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  serviceBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    width: "100%",
    justifyContent: "center",
  },
  serviceBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  message: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: "700",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)",
      },
      default: {
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  deleteButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
