import { useAccessibility } from "@/context/AccessibilityContext";
import { Ionicons } from '@/components/ui/VectorIcons';
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

interface SolicitudModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    fecha: string;
    franjaHoraria: string;
    descripcion: string;
  }) => void;
  professionalName: string;
}

const FRANJAS_HORARIAS = ["08:00 - 12:00", "12:00 - 16:00", "16:00 - 20:00"];

export const SolicitudModal: React.FC<SolicitudModalProps> = ({
  visible,
  onClose,
  onSubmit,
  professionalName,
}) => {
  const { isDarkMode: isDark } = useAccessibility();

  const orangeAccent = isDark ? "#FFB74D" : "#FF8C00";
  const orangeTextOnButton = isDark ? "#121826" : "#FFFFFF";
  const bgModal = isDark ? "#1F2937" : "#FFFFFF";
  const bgSurface = isDark ? "#121826" : "#FFFFFF";
  const textMain = isDark ? "#FFFFFF" : "#111827";
  const textMuted = isDark ? "#9CA3AF" : "#6B7280";
  const borderCol = isDark ? "#374151" : "#E5E7EB";
  const titleColor = isDark ? "#FFFFFF" : "#283593";
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [franjaSeleccionada, setFranjaSeleccionada] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const handleEnviar = () => {
    if (
      !fechaSeleccionada ||
      fechaSeleccionada < hoyStr ||
      !franjaSeleccionada ||
      !descripcion.trim()
    ) {
      setErrorModalVisible(true);
      return;
    }
    setSuccessModalVisible(true);
  };

  const handleConfirmSuccess = () => {
    setSuccessModalVisible(false);
    onSubmit({
      fecha: fechaSeleccionada,
      franjaHoraria: franjaSeleccionada,
      descripcion: descripcion.trim(),
    });
    setFechaSeleccionada("");
    setFranjaSeleccionada("");
    setDescripcion("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: bgModal }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.modalTitle, { color: titleColor }]}>
              Solicitar Servicio
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.subtitle, { color: textMuted }]}>
            Con profesional: {professionalName}
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.formContainer}
          >
            {/* Calendario Interactivo */}
            <Text style={[styles.label, { color: orangeAccent }]}>
              Seleccioná la fecha del arreglo
            </Text>
            <Calendar
              key={isDark ? "dark-cal" : "light-cal"}
              minDate={hoyStr}
              disableAllTouchEventsForDisabledDays={true}
              onDayPress={(day) => {
                if (day.dateString < hoyStr) return;
                setFechaSeleccionada(day.dateString);
              }}
              markedDates={
                fechaSeleccionada
                  ? {
                      [fechaSeleccionada]: {
                        selected: true,
                        selectedColor: orangeAccent,
                        selectedTextColor: orangeTextOnButton,
                      },
                    }
                  : {}
              }
              theme={{
                backgroundColor: bgSurface,
                calendarBackground: bgSurface,
                textSectionTitleColor: textMuted,
                selectedDayBackgroundColor: orangeAccent,
                selectedDayTextColor: orangeTextOnButton,
                todayTextColor: orangeAccent,
                dayTextColor: textMain,
                textDisabledColor: isDark ? "#374151" : "#D1D5DB",
                monthTextColor: textMain,
                arrowColor: orangeAccent,
              }}
              style={[
                styles.calendarStyle,
                { backgroundColor: bgSurface, borderColor: borderCol },
              ]}
            />
            {fechaSeleccionada ? (
              <Text style={[styles.selectedDateText, { color: orangeAccent }]}>
                Fecha elegida: {fechaSeleccionada}
              </Text>
            ) : null}

            {/* Franja Horaria */}
            <Text style={[styles.label, { color: orangeAccent }]}>
              Franja horaria preferida
            </Text>
            <View style={styles.franjasRow}>
              {FRANJAS_HORARIAS.map((franja) => {
                const activo = franja === franjaSeleccionada;
                return (
                  <TouchableOpacity
                    key={franja}
                    style={[
                      styles.franjaChip,
                      {
                        backgroundColor: activo ? orangeAccent : bgSurface,
                        borderColor: activo ? orangeAccent : borderCol,
                      },
                    ]}
                    onPress={() => setFranjaSeleccionada(franja)}
                  >
                    <Text
                      style={[
                        styles.franjaText,
                        { color: activo ? orangeTextOnButton : textMain },
                      ]}
                    >
                      {franja}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Descripción */}
            <Text style={[styles.label, { color: orangeAccent }]}>
              Descripción de lo que necesitás
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: bgSurface,
                  borderColor: borderCol,
                  color: textMain,
                },
              ]}
              placeholder="Detallá brevemente el trabajo a realizar..."
              placeholderTextColor={textMuted}
              multiline
              numberOfLines={4}
              value={descripcion}
              onChangeText={setDescripcion}
            />

            {/* Botón Enviar */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: orangeAccent }]}
              onPress={handleEnviar}
            >
              <Text
                style={[styles.submitButtonText, { color: orangeTextOnButton }]}
              >
                Enviar Solicitud
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Modal de Campos Incompletos */}
      <Modal
        visible={errorModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.centerOverlay}>
          <View
            style={[
              styles.alertBox,
              { backgroundColor: bgModal, borderColor: borderCol },
            ]}
          >
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={[styles.alertTitle, { color: textMain }]}>
              Campos incompletos
            </Text>
            <Text style={[styles.alertText, { color: textMuted }]}>
              Por favor seleccioná una fecha válida (desde hoy), una franja
              horaria y completá la descripción.
            </Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.alertButtonTextWhite}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmación */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.centerOverlay}>
          <View
            style={[
              styles.alertBox,
              { backgroundColor: bgModal, borderColor: borderCol },
            ]}
          >
            <Ionicons name="checkmark-circle" size={48} color={orangeAccent} />
            <Text style={[styles.alertTitle, { color: textMain }]}>
              ¡Solicitud Enviada!
            </Text>
            <Text style={[styles.alertText, { color: textMuted }]}>
              Tu solicitud será aceptada o rechazada en menos de 48 horas.
            </Text>
            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: orangeAccent }]}
              onPress={handleConfirmSuccess}
            >
              <Text
                style={[styles.alertButtonText, { color: orangeTextOnButton }]}
              >
                Aceptar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  centerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  calendarStyle: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  selectedDateText: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600",
  },
  franjasRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  franjaChip: {
    flex: 1,
    minWidth: "30%",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  franjaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  submitButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  alertBox: {
    marginHorizontal: 30,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  successButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  alertButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },
  alertButtonTextWhite: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
