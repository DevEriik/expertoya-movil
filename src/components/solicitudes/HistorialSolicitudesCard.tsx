import {
  estaPendiente,
  paleta,
  type IconName,
} from "@/components/solicitudes/ui";
import { useAccessibility } from "@/context/AccessibilityContext";
import { type Solicitud, useSolicitudes } from "@/hooks/useSolicitudes";
import { useSolicitudesRealtime } from "@/hooks/useSolicitudesRealtime";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Tarjeta "Historial de Solicitudes" de Detalles de la Cuenta (cliente).
 * Sin solicitudes: invita a buscar profesionales.
 * Con solicitudes: muestra un resumen y lleva a /mis-solicitudes.
 */
export default function HistorialSolicitudesCard() {
  const router = useRouter();
  const { isDarkMode: isDark } = useAccessibility();
  const c = paleta(isDark);
  const { obtenerMisSolicitudes } = useSolicitudes();
  const [items, setItems] = useState<Solicitud[] | null>(null);

  const cargar = useCallback(() => {
    obtenerMisSolicitudes()
      .then(setItems)
      .catch(() => setItems((prev) => prev ?? []));
  }, [obtenerMisSolicitudes]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  useSolicitudesRealtime({ onCambioCliente: cargar });

  const total = items?.length ?? 0;
  const pendientes = items?.filter(estaPendiente).length ?? 0;
  const aceptadas = items?.filter((s) => s.estado === "ACEPTADO").length ?? 0;

  const Chip = ({
    icono,
    texto,
    color,
  }: {
    icono: IconName;
    texto: string;
    color: string;
  }) => (
    <View
      style={[
        styles.chip,
        { borderColor: color, backgroundColor: `${color}22` },
      ]}
    >
      <Ionicons name={icono} size={14} color={color} />
      <Text style={[styles.chipTexto, { color: c.texto }]}>{texto}</Text>
    </View>
  );

  const contenido = (
    <>
      <View style={styles.titulo}>
        <Ionicons name="list-outline" size={22} color={c.teal} />
        <Text style={[styles.tituloTexto, { color: c.titulo }]}>
          Historial de Solicitudes
        </Text>
        {total > 0 && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={c.suave}
            style={{ marginLeft: "auto" }}
          />
        )}
      </View>

      {items === null ? (
        <ActivityIndicator color={c.naranja} style={{ marginVertical: 16 }} />
      ) : total === 0 ? (
        <>
          <Text style={[styles.texto, { color: c.suave }]}>
            Todavía no has solicitado ningún servicio. Explora el directorio
            para encontrar profesionales cerca de ti.
          </Text>
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: c.naranja }]}
            onPress={() => router.push("/(tabs)/search")}
            accessibilityRole="button"
          >
            <Text style={[styles.botonTexto, { color: c.sobreColor }]}>
              Buscar Profesionales
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.texto, { color: c.suave }]}>
            Enviaste {total} {total === 1 ? "solicitud" : "solicitudes"}. Toca
            para ver el estado de cada una.
          </Text>
          {(pendientes > 0 || aceptadas > 0) && (
            <View style={styles.chips}>
              {pendientes > 0 && (
                <Chip
                  icono="time-outline"
                  texto={`${pendientes} ${
                    pendientes === 1 ? "pendiente" : "pendientes"
                  }`}
                  color={c.aviso}
                />
              )}
              {aceptadas > 0 && (
                <Chip
                  icono="checkmark-circle"
                  texto={`${aceptadas} ${
                    aceptadas === 1 ? "aceptada" : "aceptadas"
                  }`}
                  color={c.exito}
                />
              )}
            </View>
          )}
          <View style={[styles.boton, { backgroundColor: c.naranja }]}>
            <Text style={[styles.botonTexto, { color: c.sobreColor }]}>
              Ver mis solicitudes
            </Text>
          </View>
        </>
      )}
    </>
  );

  const estiloCard = [
    styles.card,
    { backgroundColor: c.superficie, borderColor: c.borde },
  ];

  if (total > 0) {
    return (
      <TouchableOpacity
        style={estiloCard}
        onPress={() => router.push("/mis-solicitudes")}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Historial de solicitudes, ${total} enviadas, ${pendientes} pendientes, ${aceptadas} aceptadas`}
      >
        {contenido}
      </TouchableOpacity>
    );
  }

  return <View style={estiloCard}>{contenido}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  titulo: { flexDirection: "row", alignItems: "center", gap: 8 },
  tituloTexto: { fontSize: 17, fontWeight: "700" },
  texto: { fontSize: 14, lineHeight: 21, fontWeight: "400" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipTexto: { fontSize: 12.5, fontWeight: "700" },
  boton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: { fontSize: 15, fontWeight: "700" },
});
