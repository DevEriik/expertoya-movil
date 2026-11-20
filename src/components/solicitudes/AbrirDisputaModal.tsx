import { paleta } from "@/components/solicitudes/ui";
import { useAccessibility } from "@/context/AccessibilityContext";
import { abrirDisputaApi, type DisputaData } from "@/utils/disputasApi";
import { Ionicons } from '@/components/ui/VectorIcons';
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MOTIVOS_DISPUTA = [
  "Trabajo incompleto o sin terminar",
  "Incumplimiento del acuerdo o presupuesto",
  "El profesional no se presentó / abandonó el trabajo",
  "Calidad deficiente o desperfectos ocasionados",
  "Otro motivo",
];

interface AbrirDisputaModalProps {
  visible: boolean;
  solicitudId: string | null;
  tituloServicio?: string;
  montoRetenido?: string | number | null;
  onClose: () => void;
  onDisputaCreada: (disputa: DisputaData) => void;
}

export default function AbrirDisputaModal({
  visible,
  solicitudId,
  tituloServicio,
  montoRetenido,
  onClose,
  onDisputaCreada,
}: AbrirDisputaModalProps) {
  const { isDarkMode: isDark } = useAccessibility();
  const c = paleta(isDark);

  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>(
    MOTIVOS_DISPUTA[0],
  );
  const [descripcion, setDescripcion] = useState<string>("");
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [disputaCreadaInfo, setDisputaCreadaInfo] =
    useState<DisputaData | null>(null);

  const handleClose = () => {
    if (enviando) return;
    if (disputaCreadaInfo) {
      const info = disputaCreadaInfo;
      setDisputaCreadaInfo(null);
      setDescripcion("");
      setErrorMsg(null);
      onDisputaCreada(info);
      onClose();
      return;
    }
    setErrorMsg(null);
    onClose();
  };

  const handleConfirmarDisputa = async () => {
    if (!solicitudId) return;

    if (!motivoSeleccionado.trim()) {
      setErrorMsg("Selecciona un motivo para el reclamo.");
      return;
    }

    if (descripcion.trim().length < 10) {
      setErrorMsg(
        "Por favor describe qué ocurrió (mínimo 10 caracteres) para que moderación pueda auditar el caso.",
      );
      return;
    }

    try {
      setEnviando(true);
      setErrorMsg(null);

      const respuesta = await abrirDisputaApi({
        solicitud_id: solicitudId,
        motivo: motivoSeleccionado,
        descripcion: descripcion.trim(),
      });

      setDisputaCreadaInfo(respuesta.disputa);
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudo registrar el reclamo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalBox,
            { backgroundColor: c.superficie, borderColor: c.borde },
          ]}
        >
          {disputaCreadaInfo ? (
            <View style={styles.exitoContainer}>
              <View style={styles.exitoIconCircle}>
                <Ionicons name="lock-closed" size={32} color="#D97706" />
              </View>

              <Text style={[styles.exitoTitulo, { color: c.titulo }]}>
                Transacción congelada en garantía
              </Text>

              <Text style={[styles.exitoSubtitulo, { color: c.texto }]}>
                Tu reclamo quedó registrado correctamente. El dinero permanece
                protegido y{" "}
                <Text style={{ fontWeight: "700" }}>
                  no será liberado al profesional
                </Text>{" "}
                hasta que un moderador de ExpertoYa audite el historial del chat
                y emita una resolución.
              </Text>

              <View style={styles.exitoBadge}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color="#B45309"
                />
                <Text style={styles.exitoBadgeText}>
                  Estado del pago: EN DISPUTA · Revisión activa
                </Text>
              </View>

              <TouchableOpacity
                style={styles.btnEntendido}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Entendido, cerrar aviso"
              >
                <Text style={styles.btnEntendidoText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <Ionicons
                    name="shield-half-outline"
                    size={22}
                    color="#EF4444"
                  />
                  <Text style={[styles.title, { color: c.titulo }]}>
                    Iniciar Reclamo de Garantía
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={enviando}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar modal de reclamo"
                >
                  <Ionicons name="close" size={24} color={c.suave} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.warningBanner}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#B45309"
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.warningText}>
                    Al iniciar este reclamo, la transacción quedará{" "}
                    <Text style={{ fontWeight: "700" }}>congelada</Text> y el
                    pago no será liberado al profesional hasta que un
                    administrador audite el historial del chat y emita una
                    resolución.
                  </Text>
                </View>

                {tituloServicio ? (
                  <Text style={[styles.metaText, { color: c.suave }]}>
                    Servicio:{" "}
                    <Text style={{ color: c.texto, fontWeight: "700" }}>
                      {tituloServicio}
                    </Text>
                    {montoRetenido ? ` · Custodia: $${montoRetenido}` : ""}
                  </Text>
                ) : null}

                <Text style={[styles.label, { color: c.titulo }]}>
                  Motivo del reclamo *
                </Text>
                <View style={styles.motivosList}>
                  {MOTIVOS_DISPUTA.map((item) => {
                    const activo = motivoSeleccionado === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.motivoOption,
                          {
                            borderColor: activo ? "#EF4444" : c.borde,
                            backgroundColor: activo
                              ? "#EF444418"
                              : "transparent",
                          },
                        ]}
                        onPress={() => setMotivoSeleccionado(item)}
                        disabled={enviando}
                      >
                        <Ionicons
                          name={activo ? "radio-button-on" : "radio-button-off"}
                          size={18}
                          color={activo ? "#EF4444" : c.suave}
                        />
                        <Text
                          style={[
                            styles.motivoTexto,
                            {
                              color: c.texto,
                              fontWeight: activo ? "700" : "500",
                            },
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.label, { color: c.titulo }]}>
                  Detalle de lo sucedido *
                </Text>
                <TextInput
                  style={[
                    styles.inputArea,
                    {
                      color: c.texto,
                      borderColor: c.borde,
                      backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                    },
                  ]}
                  placeholder="Explica qué acordaron en el chat y qué problema ocurrió con el trabajo..."
                  placeholderTextColor={c.suave}
                  multiline
                  numberOfLines={4}
                  value={descripcion}
                  onChangeText={setDescripcion}
                  editable={!enviando}
                />

                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.btnCancelar, { borderColor: c.borde }]}
                  onPress={handleClose}
                  disabled={enviando}
                >
                  <Text style={[styles.btnCancelarText, { color: c.texto }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnEnviar, { opacity: enviando ? 0.7 : 1 }]}
                  onPress={handleConfirmarDisputa}
                  disabled={enviando}
                >
                  {enviando ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="warning-outline"
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.btnEnviarText}>
                        Congelar y Reclamar
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 16,
  },
  modalBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  warningBanner: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#92400E",
  },
  metaText: {
    fontSize: 13.5,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  motivosList: {
    gap: 8,
  },
  motivoOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  motivoTexto: {
    fontSize: 13.5,
    flex: 1,
  },
  inputArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 96,
    textAlignVertical: "top",
    fontSize: 14,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    flex: 1,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  btnCancelar: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  btnEnviar: {
    flex: 1.4,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnEnviarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  exitoContainer: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 14,
  },
  exitoIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },
  exitoTitulo: {
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  exitoSubtitulo: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
  },
  exitoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  exitoBadgeText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "700",
  },
  btnEntendido: {
    marginTop: 4,
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  btnEntendidoText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
