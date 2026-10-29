import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useSolicitudes } from "../../hooks/useSolicitudes";

interface SolicitudModalProps {
  visible: boolean;
  onClose: () => void;
  profesionalId: string;
}

const FRANJAS_HORARIAS = ["08:00-12:00", "12:00-16:00", "16:00-20:00"];

export default function SolicitudModal({
  visible,
  onClose,
  profesionalId,
}: SolicitudModalProps) {
  const [fecha, setFecha] = useState("");
  const [franja, setFranja] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const { crearSolicitud, loading } = useSolicitudes();

  const handleEnviar = async () => {
    if (!fecha || !franja || !descripcion.trim()) {
      Alert.alert(
        "Datos incompletos",
        "Por favor selecciona fecha, horario y añade una descripción.",
      );
      return;
    }

    try {
      await crearSolicitud({
        profesional_id: profesionalId,
        fecha_tentativa: fecha,
        franja_horaria: franja,
        descripcion,
      });
      Alert.alert("¡Éxito!", "La solicitud ha sido enviada al profesional.");
      setFecha("");
      setFranja("");
      setDescripcion("");
      onClose();
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo enviar la solicitud. Inténtalo de nuevo.",
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Solicitar Servicio</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>1. Selecciona la fecha tentativa</Text>
            <Calendar
              onDayPress={(day: any) => setFecha(day.dateString)}
              markedDates={{
                [fecha]: { selected: true, selectedColor: "#33EFA5" }, // Teal Brillante[cite: 21]
              }}
              minDate={new Date().toISOString().split("T")[0]}
              theme={{
                backgroundColor: "#1F2937",
                calendarBackground: "#1F2937",
                textSectionTitleColor: "#FFB74D", // Naranja Suave[cite: 21]
                selectedDayBackgroundColor: "#33EFA5",
                selectedDayTextColor: "#121826", // Fondo Base para contraste[cite: 21]
                todayTextColor: "#33EFA5",
                dayTextColor: "#FFFFFF",
                textDisabledColor: "#555555",
                monthTextColor: "#FFFFFF",
                arrowColor: "#FFB74D",
                textDayFontFamily: "PlusJakartaSans-Regular",
                textMonthFontFamily: "PlusJakartaSans-Bold",
                textDayHeaderFontFamily: "PlusJakartaSans-Medium",
              }}
            />

            <Text style={styles.label}>2. Franja horaria preferida</Text>
            <View style={styles.franjasContainer}>
              {FRANJAS_HORARIAS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.franjaBoton,
                    franja === f && styles.franjaSeleccionada,
                  ]}
                  onPress={() => setFranja(f)}
                >
                  <Text
                    style={[
                      styles.franjaTexto,
                      franja === f && styles.franjaTextoSeleccionado,
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>3. Describe el problema o trabajo</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              placeholder="Ej: Necesito revisar una tubería que pierde agua..."
              placeholderTextColor="#888"
              value={descripcion}
              onChangeText={setDescripcion}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBoton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelTexto}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBoton}
              onPress={handleEnviar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#121826" />
              ) : (
                <Text style={styles.submitTexto}>Enviar Solicitud</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(18, 24, 38, 0.8)", // Fondo Base con opacidad[cite: 21]
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#1F2937", // Superficies[cite: 21]
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  title: {
    fontFamily: "PlusJakartaSans-ExtraBold",
    fontSize: 24, // H1[cite: 20]
    color: "#FFFFFF",
    marginBottom: 15,
  },
  label: {
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 18, // H2[cite: 20]
    color: "#FFB74D", // Naranja Suave[cite: 21]
    marginTop: 15,
    marginBottom: 10,
  },
  franjasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  franjaBoton: {
    borderWidth: 1,
    borderColor: "#33EFA5", // Teal Brillante[cite: 21]
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#121826", // Fondo Base[cite: 21]
  },
  franjaSeleccionada: {
    backgroundColor: "#33EFA5", // Teal Brillante[cite: 21]
  },
  franjaTexto: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 14, // H3 alternativo[cite: 20]
    color: "#FFFFFF",
  },
  franjaTextoSeleccionado: {
    fontFamily: "PlusJakartaSans-Bold",
    color: "#121826", // Contraste oscuro[cite: 21]
  },
  input: {
    fontFamily: "PlusJakartaSans-Regular",
    fontSize: 11, // Texto Normal[cite: 20]
    borderWidth: 1,
    borderColor: "#33EFA5", // Teal Brillante[cite: 21]
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#121826", // Fondo Base[cite: 21]
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#121826",
  },
  cancelBoton: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelTexto: {
    fontFamily: "PlusJakartaSans-Bold",
    color: "#F87171", // Danger (Dark)[cite: 21]
    fontSize: 16,
  },
  submitBoton: {
    flex: 1,
    backgroundColor: "#FFB74D", // Naranja Suave[cite: 21]
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitTexto: {
    fontFamily: "PlusJakartaSans-Bold",
    color: "#121826", // Contraste oscuro[cite: 21]
    fontSize: 16,
  },
});
