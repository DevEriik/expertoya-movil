import { useAuth } from "@/context/AuthContext";
import { usePaymentDetails } from "@/hooks/usePaymentDetails";
import { useTheme } from "@/hooks/use-theme";
import {
  getCheckoutUrl,
  paymentsApi,
  type Confirmaciones,
  type EstadoPago,
  type Pago,
  type Payout,
} from "@/services/payments";
import { isAdmin, isCliente, isProfesional } from "@/utils/roles";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";
type IconName = keyof typeof Ionicons.glyphMap;

const ESTADO_UI: Record<
  EstadoPago,
  { titulo: string; descripcion: string; icono: IconName; tone: Tone }
> = {
  PENDIENTE: {
    titulo: "Pago pendiente",
    descripcion: "El checkout fue generado, pero Mercado Pago todavía no confirmó el pago.",
    icono: "time-outline",
    tone: "warning",
  },
  RETENIDO: {
    titulo: "Pago retenido en garantía",
    descripcion: "ExpertoYa retiene el dinero hasta que ambas partes confirmen la finalización.",
    icono: "shield-checkmark-outline",
    tone: "success",
  },
  LIBERADO: {
    titulo: "Pago liberado al profesional",
    descripcion: "El servicio fue confirmado por ambas partes y el pago ya fue liberado.",
    icono: "checkmark-done-circle-outline",
    tone: "success",
  },
  FALLIDO: {
    titulo: "Pago rechazado",
    descripcion: "Mercado Pago rechazó el pago. Podés intentarlo nuevamente.",
    icono: "close-circle-outline",
    tone: "danger",
  },
  CANCELADO: {
    titulo: "Pago cancelado",
    descripcion: "La preferencia de pago fue cancelada. Podés generar una nueva.",
    icono: "ban-outline",
    tone: "danger",
  },
  REEMBOLSADO: {
    titulo: "Pago reembolsado",
    descripcion: "El dinero fue devuelto al cliente.",
    icono: "return-down-back-outline",
    tone: "info",
  },
  CONTRACARGO: {
    titulo: "Contracargo en revisión",
    descripcion: "Mercado Pago está revisando un contracargo de este pago.",
    icono: "alert-circle-outline",
    tone: "danger",
  },
  EN_DISPUTA: {
    titulo: "Pago en disputa",
    descripcion: "Hay una disputa abierta. La liberación está bloqueada hasta que se resuelva.",
    icono: "warning-outline",
    tone: "danger",
  },
  REVISION_MANUAL: {
    titulo: "En revisión manual",
    descripcion: "El equipo de ExpertoYa está revisando este pago. Las acciones están bloqueadas.",
    icono: "search-outline",
    tone: "warning",
  },
};

function money(value?: string | null): string {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return `$ ${value ?? "0.00"}`;
  return `$ ${number.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function dateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toneColor(colors: ReturnType<typeof useTheme>, tone: Tone): string {
  switch (tone) {
    case "success":
      return colors.success;
    case "warning":
      return colors.warning;
    case "danger":
      return colors.danger;
    case "info":
      return colors.info;
    default:
      return colors.textSecondary;
  }
}

function DetailRow({
  label,
  value,
  strong,
  colors,
}: {
  label: string;
  value: string;
  strong?: boolean;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.detailValue,
          { color: strong ? colors.primary : colors.text },
          strong && styles.detailValueStrong,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function ConfirmationRow({
  label,
  confirmed,
  date,
  colors,
}: {
  label: string;
  confirmed: boolean;
  date?: string | null;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.confirmationRow}>
      <Ionicons
        name={confirmed ? "checkmark-circle" : "ellipse-outline"}
        size={22}
        color={confirmed ? colors.success : colors.grayIcon}
      />
      <View style={styles.confirmationText}>
        <Text style={[styles.confirmationLabel, { color: colors.text }]}>
          {label}
        </Text>
        <Text
          style={[styles.confirmationDate, { color: colors.textSecondary }]}
        >
          {confirmed
            ? date
              ? `Confirmado el ${dateTime(date)}`
              : "Confirmado"
            : "Pendiente de confirmación"}
        </Text>
      </View>
    </View>
  );
}

export default function PagoSolicitudScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { usuario } = useAuth();

  const params = useLocalSearchParams<{
    solicitudId?: string | string[];
  }>();
  const solicitudId = Array.isArray(params.solicitudId)
    ? params.solicitudId[0]
    : params.solicitudId;

  const {
    details,
    loading,
    refreshing,
    error,
    polling,
    pollingTimedOut,
    refresh,
    startPolling,
  } = usePaymentDetails(solicitudId);

  const [actionLoading, setActionLoading] = useState<
    "pago" | "confirmar" | "comprobante" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const esCliente = isCliente(usuario?.rol);
  const esProfesional = isProfesional(usuario?.rol);
  const esAdmin = isAdmin(usuario?.rol);

  const pago: Pago | null = details?.pago ?? null;
  const confirmaciones: Confirmaciones | undefined = details?.confirmaciones;
  const payout: Payout | null = details?.payout ?? null;
  const estado = pago?.estado ?? null;
  const ui = estado ? ESTADO_UI[estado] : null;
  const color = ui ? toneColor(colors, ui.tone) : colors.warning;

  const solicitudHabilitada = ["ACEPTADO", "EN_CURSO"].includes(
    details?.estado_solicitud ?? "",
  );
  const puedePagar =
    esCliente &&
    solicitudHabilitada &&
    (!pago ||
      pago.estado === "PENDIENTE" ||
      pago.estado === "FALLIDO" ||
      pago.estado === "CANCELADO");

  const yaConfirme = esCliente
    ? confirmaciones?.cliente
    : esProfesional
      ? confirmaciones?.profesional
      : false;
  const faltaCliente = !confirmaciones?.cliente;
  const faltaProfesional = !confirmaciones?.profesional;
  const faltaOtraParte = esCliente ? faltaProfesional : faltaCliente;

  const puedeConfirmar =
    Boolean(pago) &&
    pago?.estado === "RETENIDO" &&
    (esCliente || esProfesional) &&
    !yaConfirme;

  const mostrarConfirmaciones =
    Boolean(pago) &&
    ["RETENIDO", "LIBERADO", "EN_DISPUTA", "REVISION_MANUAL"].includes(
      pago?.estado ?? "",
    );

  if (!solicitudId) {
    return <Redirect href="/(tabs)" />;
  }

  const handlePagar = async () => {
    setActionError(null);
    setActionLoading("pago");
    try {
      const { preferencia } = await paymentsApi.createPreference(solicitudId);
      const checkoutUrl = getCheckoutUrl(preferencia);

      await WebBrowser.openBrowserAsync(checkoutUrl);
      await refresh();
      startPolling();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "No se pudo iniciar el pago.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmar = async () => {
    setActionError(null);
    setActionLoading("confirmar");
    try {
      const resultado = await paymentsApi.confirmCompletion(solicitudId);
      await refresh();

      if (resultado.liberado || resultado.estado_pago === "LIBERADO") {
        Alert.alert(
          "Pago liberado",
          "Ambas partes confirmaron la finalización. El pago ya fue liberado.",
        );
      } else if (resultado.puede_liberar) {
        Alert.alert(
          "Confirmación registrada",
          "Ambas partes confirmaron. El pago se está liberando.",
        );
      } else {
        Alert.alert(
          "Confirmación registrada",
          `Falta que ${esCliente ? "el profesional" : "el cliente"} confirme la finalización.`,
        );
      }
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "No se pudo confirmar la finalización.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleComprobante = async () => {
    if (!details?.comprobante_url) return;
    setActionError(null);
    setActionLoading("comprobante");
    try {
      await WebBrowser.openBrowserAsync(details.comprobante_url);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "No se pudo abrir el comprobante.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: colors.backgroundElement,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)");
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Estado del pago
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {loading && !details ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Consultando el pago...
          </Text>
        </View>
      ) : error && !details ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={56} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            No pudimos cargar el pago
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={refresh}
          >
            <Text style={styles.primaryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 32 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
        >
          {esAdmin && (
            <View
              style={[
                styles.notice,
                {
                  backgroundColor: colors.infoBg,
                  borderColor: colors.info,
                },
              ]}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.info} />
              <Text style={[styles.noticeText, { color: colors.text }]}>
                Vista de administrador: el pago es de solo lectura.
              </Text>
            </View>
          )}

          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: `${color}18`,
                borderColor: `${color}45`,
              },
            ]}
          >
            <Ionicons
              name={ui?.icono ?? "wallet-outline"}
              size={30}
              color={color}
            />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusTitle, { color }]}>
                {ui?.titulo ??
                  (esProfesional
                    ? "Esperando el pago del cliente"
                    : "Pago no iniciado")}
              </Text>
              <Text style={[styles.statusDescription, { color: colors.text }]}>
                {ui?.descripcion ??
                  (esProfesional
                    ? "El cliente todavía no generó la preferencia de pago."
                    : "Todavía no se generó una preferencia de Mercado Pago.")}
              </Text>
            </View>
          </View>

          {polling && (
            <View
              style={[
                styles.pollingBox,
                {
                  backgroundColor: colors.infoBg,
                  borderColor: colors.info,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.info} />
              <Text style={[styles.pollingText, { color: colors.text }]}>
                Procesando pago... verificando el estado cada 3 segundos.
              </Text>
            </View>
          )}

          {pollingTimedOut && !polling && (
            <View
              style={[
                styles.pollingBox,
                {
                  backgroundColor: colors.warningBg,
                  borderColor: colors.warning,
                },
              ]}
            >
              <Ionicons name="time-outline" size={20} color={colors.warning} />
              <Text style={[styles.pollingText, { color: colors.text }]}>
                Mercado Pago todavía no confirmó el pago. Podés actualizar el
                estado manualmente.
              </Text>
            </View>
          )}

          {actionError && (
            <View
              style={[
                styles.notice,
                {
                  backgroundColor: `${colors.danger}15`,
                  borderColor: colors.danger,
                },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
              <Text style={[styles.noticeText, { color: colors.text }]}>
                {actionError}
              </Text>
            </View>
          )}

          {error && details && (
            <View
              style={[
                styles.notice,
                {
                  backgroundColor: `${colors.warning}15`,
                  borderColor: colors.warning,
                },
              ]}
            >
              <Ionicons name="warning-outline" size={20} color={colors.warning} />
              <Text style={[styles.noticeText, { color: colors.text }]}>
                {error}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Resumen del pago
            </Text>
            <DetailRow
              label="Monto acordado"
              value={money(details?.monto_acordado)}
              strong
              colors={colors}
            />
            {pago && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <DetailRow
                  label="Monto total"
                  value={money(pago.monto_total)}
                  colors={colors}
                />
                <DetailRow
                  label="Comisión de ExpertoYa"
                  value={money(pago.comision_plataforma)}
                  colors={colors}
                />
                <DetailRow
                  label="Neto del profesional"
                  value={money(pago.neto_profesional)}
                  colors={colors}
                />
                {Number(pago.fee_mp) > 0 && (
                  <DetailRow
                    label="Costo de Mercado Pago"
                    value={money(pago.fee_mp)}
                    colors={colors}
                  />
                )}
                <DetailRow
                  label="Moneda"
                  value="ARS"
                  colors={colors}
                />
              </>
            )}
            {!pago && (
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                La comisión y el neto se calculan al generar la preferencia de
                pago.
              </Text>
            )}
          </View>

          {puedePagar && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handlePagar}
              disabled={actionLoading === "pago"}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {actionLoading === "pago" ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    {pago?.estado === "PENDIENTE"
                      ? "Abrir checkout de Mercado Pago"
                      : "Pagar con Mercado Pago"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {esProfesional && !pago && (
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Cuando el cliente pague, vas a ver el monto retenido en garantía y
              vas a poder confirmar la finalización.
            </Text>
          )}

          {mostrarConfirmaciones && confirmaciones && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Confirmación de finalización
              </Text>
              <ConfirmationRow
                label="Cliente"
                confirmed={confirmaciones.cliente}
                date={confirmaciones.cliente_en}
                colors={colors}
              />
              <ConfirmationRow
                label="Profesional"
                confirmed={confirmaciones.profesional}
                date={confirmaciones.profesional_en}
                colors={colors}
              />

              {puedeConfirmar && (
                <>
                  <Text
                    style={[styles.helperText, { color: colors.textSecondary }]}
                  >
                    Cuando ambas partes confirmen, ExpertoYa libera el pago al
                    profesional.
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { backgroundColor: colors.success },
                    ]}
                    onPress={handleConfirmar}
                    disabled={actionLoading === "confirmar"}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                  >
                    {actionLoading === "confirmar" ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.primaryButtonText}>
                          Confirmar finalización
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {yaConfirme && faltaOtraParte && pago?.estado === "RETENIDO" && (
                <View
                  style={[
                    styles.pendingConfirmation,
                    {
                      backgroundColor: colors.warningBg,
                      borderColor: colors.warning,
                    },
                  ]}
                >
                  <Ionicons name="hourglass-outline" size={20} color={colors.warning} />
                  <Text style={[styles.pendingConfirmationText, { color: colors.text }]}>
                    Ya confirmaste. Esperando la confirmación de{" "}
                    {esCliente ? "el profesional" : "el cliente"}.
                  </Text>
                </View>
              )}

              {!faltaCliente && !faltaProfesional && pago?.estado === "RETENIDO" && (
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  Ambas partes confirmaron. Actualizá el estado para ver la
                  liberación del pago.
                </Text>
              )}

              {pago?.estado === "EN_DISPUTA" && (
                <Text style={[styles.helperText, { color: colors.danger }]}>
                  Hay una disputa abierta. La liberación está bloqueada; si
                  necesitás ayuda, contactá a soporte.
                </Text>
              )}

              {pago?.estado === "REVISION_MANUAL" && (
                <Text style={[styles.helperText, { color: colors.warning }]}>
                  El pago está en revisión manual. Las acciones están bloqueadas.
                </Text>
              )}
            </View>
          )}

          {payout && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {esProfesional ? "Tu payout" : "Pago al profesional"}
              </Text>
              <DetailRow
                label="Estado"
                value={payout.estado}
                colors={colors}
              />
              <DetailRow label="Monto" value={money(payout.monto)} strong colors={colors} />
              <DetailRow label="Método" value={payout.metodo} colors={colors} />
              {payout.pagado_en && (
                <DetailRow
                  label="Pagado el"
                  value={dateTime(payout.pagado_en)}
                  colors={colors}
                />
              )}
            </View>
          )}

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Comprobante digital
            </Text>
            {details?.comprobante_url ? (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { borderColor: colors.primary },
                ]}
                onPress={handleComprobante}
                disabled={actionLoading === "comprobante"}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {actionLoading === "comprobante" ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: colors.primary },
                      ]}
                    >
                      Ver comprobante
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                El comprobante estará disponible cuando el pago sea aprobado.
              </Text>
            )}
          </View>

          <Text style={[styles.footer, { color: colors.textSecondary }]}>
            ExpertoYa retiene el pago hasta que el cliente y el profesional
            confirmen la finalización. La app no almacena datos de tarjetas: el
            checkout se completa en Mercado Pago.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: { fontSize: 14 },
  errorTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  errorMessage: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  content: { padding: 16, gap: 14 },
  statusCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  statusTextContainer: { flex: 1, gap: 4 },
  statusTitle: { fontSize: 17, fontWeight: "800" },
  statusDescription: { fontSize: 13.5, lineHeight: 19 },
  pollingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pollingText: { flex: 1, fontSize: 13, lineHeight: 18 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18 },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  detailLabel: { fontSize: 13.5, flex: 1 },
  detailValue: { fontSize: 14, fontWeight: "600", textAlign: "right" },
  detailValueStrong: { fontSize: 18, fontWeight: "800" },
  divider: { height: 1, marginVertical: 4 },
  helperText: { fontSize: 13, lineHeight: 19 },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "800" },
  confirmationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  confirmationText: { flex: 1 },
  confirmationLabel: { fontSize: 14, fontWeight: "700" },
  confirmationDate: { fontSize: 12, marginTop: 1 },
  pendingConfirmation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pendingConfirmationText: { flex: 1, fontSize: 13, lineHeight: 18 },
  footer: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 4,
  },
});
