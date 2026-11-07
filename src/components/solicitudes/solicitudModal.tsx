import { Ionicons } from "@expo/vector-icons";
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
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [franjaSeleccionada, setFranjaSeleccionada] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const handleEnviar = () => {
    if (!fechaSeleccionada || !franjaSeleccionada || !descripcion.trim()) {
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
      descripcion,
    });
    setFechaSeleccionada("");
    setFranjaSeleccionada("");
    setDescripcion("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Solicitar Servicio</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Con profesional: {professionalName}
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.formContainer}
          >
            {/* Calendario Interactivo */}
            <Text style={styles.label}>Seleccioná la fecha del arreglo</Text>
            <Calendar
              onDayPress={(day) => setFechaSeleccionada(day.dateString)}
              markedDates={{
                [fechaSeleccionada]: {
                  selected: true,
                  selectedColor: "#FFB74D",
                },
              }}
              theme={{
                backgroundColor: "#1F2937",
                calendarBackground: "#121826",
                textSectionTitleColor: "#9CA3AF",
                selectedDayBackgroundColor: "#FFB74D",
                selectedDayTextColor: "#121826",
                todayTextColor: "#FFB74D",
                dayTextColor: "#FFFFFF",
                textDisabledColor: "#374151",
                monthTextColor: "#FFFFFF",
                arrowColor: "#FFB74D",
              }}
              style={styles.calendarStyle}
            />
            {fechaSeleccionada ? (
              <Text style={styles.selectedDateText}>
                Fecha elegida: {fechaSeleccionada}
              </Text>
            ) : null}

            {/* Franja Horaria */}
            <Text style={styles.label}>Franja horaria preferida</Text>
            <View style={styles.franjasRow}>
              {FRANJAS_HORARIAS.map((franja) => {
                const activo = franja === franjaSeleccionada;
                return (
                  <TouchableOpacity
                    key={franja}
                    style={[
                      styles.franjaChip,
                      {
                        backgroundColor: activo ? "#FFB74D" : "#121826",
                        borderColor: activo ? "#FFB74D" : "#374151",
                      },
                    ]}
                    onPress={() => setFranjaSeleccionada(franja)}
                  >
                    <Text
                      style={[
                        styles.franjaText,
                        { color: activo ? "#121826" : "#FFFFFF" },
                      ]}
                    >
                      {franja}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Descripción */}
            <Text style={styles.label}>Descripción de lo que necesitás</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detallá brevemente el trabajo a realizar..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
              value={descripcion}
              onChangeText={setDescripcion}
            />

            {/* Botón Enviar */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleEnviar}
            >
              <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={errorModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Ionicons name="alert-circle" size={48} color="#F87171" />
            <Text style={styles.alertTitle}>Campos incompletos</Text>
            <Text style={styles.alertText}>
              Por favor seleccioná una fecha, una franja horaria y completá la
              descripción.
            </Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.alertButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Ionicons name="checkmark-circle" size={48} color="#34D399" />
            <Text style={styles.alertTitle}>¡Solicitud Enviada!</Text>
            <Text style={styles.alertText}>
              Tu solicitud será aceptada o rechazada en menos de 48 horas.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleConfirmSuccess}
            >
              <Text style={styles.alertButtonText}>Aceptar</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1F2937",
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
    color: "#FDFCF4",
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 15,
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFB74D",
    marginBottom: 8,
    marginTop: 12,
  },
  calendarStyle: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#374151",
  },
  selectedDateText: {
    color: "#34D399",
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
    backgroundColor: "#121826",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#FFB74D",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  submitButtonText: {
    color: "#121826",
    fontSize: 16,
    fontWeight: "700",
  },
  alertBox: {
    backgroundColor: "#1F2937",
    marginHorizontal: 30,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: "#9CA3AF",
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
    backgroundColor: "#34D399",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  alertButtonText: {
    color: "#121826",
    fontWeight: "700",
    fontSize: 14,
  },
});
