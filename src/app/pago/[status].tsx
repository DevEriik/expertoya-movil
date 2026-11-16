import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
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

function primerValor(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function extraerSolicitudId(externalReference?: string) {
  if (!externalReference) return undefined;
  return externalReference.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  )?.[0];
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
  }>();

  const estado = primerValor(params.status);
  const solicitudId =
    primerValor(params.solicitud_id) ||
    primerValor(params.solicitudId) ||
    extraerSolicitudId(primerValor(params.external_reference));

  if (solicitudId) {
    return (
      <Redirect
        href={{
          pathname: "/pagos/[solicitudId]",
          params: { solicitudId },
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
      <Ionicons name={ui.icono} size={64} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>{ui.titulo}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {ui.descripcion}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => router.replace("/(tabs)")}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Volver al inicio</Text>
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
