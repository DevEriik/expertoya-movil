import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from '@/components/ui/VectorIcons';
import { Redirect, useLocalSearchParams, useRouter } from '@/navigation/routerCompat';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type EstadoRetorno = "success" | "failure" | "pending";

const TEXTO: Record<
  EstadoRetorno,
  { titulo: string; descripcion: string; icono: keyof typeof Ionicons.glyphMap }
> = {
  success: {
    titulo: "Volviste de Mercado Pago",
    descripcion:
      "Estamos verificando el pago. No se confirma hasta que Mercado Pago lo informe al backend.",
    icono: "time-outline",
  },
  failure: {
    titulo: "El pago no se completó",
    descripcion: "Podés volver a intentarlo desde la pantalla del pago.",
    icono: "close-circle-outline",
  },
  pending: {
    titulo: "Pago pendiente",
    descripcion:
      "Mercado Pago todavía está procesando el pago. Actualizá el estado en unos segundos.",
    icono: "hourglass-outline",
  },
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MATCH_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function primerValor(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function validarUUID(id?: string): string | undefined {
  if (!id) return undefined;
  const trimmed = id.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : undefined;
}

function extraerSolicitudId(externalReference?: string): string | undefined {
  if (!externalReference) return undefined;
  return externalReference.match(UUID_MATCH_REGEX)?.[0];
}

export default function PagoRetornoScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    status?: string | string[];
    solicitud_id?: string | string[];
    solicitudId?: string | string[];
    external_reference?: string | string[];
    payment_id?: string | string[];
    mp_status?: string | string[];
  }>();

  const estado = primerValor(params.status);
  const rawSolicitudId = primerValor(params.solicitudId);
  const rawSolicitud_id = primerValor(params.solicitud_id);
  const rawExternalRef = primerValor(params.external_reference);
  const paymentId = primerValor(params.payment_id);
  const mpStatus = primerValor(params.mp_status);

  // Prioridad según contrato: 1. solicitudId -> 2. solicitud_id -> 3. external_reference (si contiene UUID)
  const solicitudId =
    validarUUID(rawSolicitudId) ||
    validarUUID(rawSolicitud_id) ||
    extraerSolicitudId(rawExternalRef);

  if (solicitudId) {
    return (
      <Redirect
        href={{
          pathname: "/pagos/[solicitudId]",
          params: {
            solicitudId,
            fromCheckout: "true",
            retornoStatus: estado ?? "pending",
            mpStatus: mpStatus ?? "",
            paymentId: paymentId ?? "",
          },
        }}
      />
    );
  }

  const retorno: EstadoRetorno =
    estado === "success" || estado === "failure" || estado === "pending"
      ? estado
      : "pending";
  const ui = TEXTO[retorno];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <Ionicons name="alert-circle-outline" size={64} color={colors.warning} />
      <Text style={[styles.title, { color: colors.text }]}>
        No pudimos identificar la solicitud
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        El retorno de Mercado Pago no incluyó un identificador de solicitud válido.
        Podés volver a tus solicitudes para verificar el estado de tu pago.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => router.replace("/(tabs)")}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Ir a mis solicitudes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 14,
  },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  description: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  button: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
