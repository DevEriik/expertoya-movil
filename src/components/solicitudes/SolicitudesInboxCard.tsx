import { useAccessibility } from "@/context/AccessibilityContext";
import { useSolicitudes } from "@/hooks/useSolicitudes";
import { useSolicitudesRealtime } from "@/hooks/useSolicitudesRealtime";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


export default function SolicitudesInboxCard() {
  const router = useRouter();
  const { isDarkMode: isDark } = useAccessibility();
  const { contarPendientes } = useSolicitudes();
  const [pendientes, setPendientes] = useState(0);


  useFocusEffect(
    useCallback(() => {
      let activo = true;
      contarPendientes()
        .then((n) => {
          if (activo) setPendientes(n);
        })
        .catch(() => {});
      return () => {
        activo = false;
      };
    }, [contarPendientes]),
  );

 
  useSolicitudesRealtime({ onContador: setPendientes });

  const hayPendientes = pendientes > 0;
  const textoInsignia = pendientes > 99 ? "99+" : String(pendientes);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
          borderColor: hayPendientes
            ? isDark
              ? "#FFB74D"
              : "#FF8C00"
            : isDark
              ? "#2A3649"
              : "#E2E8F0",
        },
      ]}
      onPress={() => router.push("/solicitudes-trabajo")}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Solicitudes de trabajo, ${pendientes} ${
        pendientes === 1 ? "pendiente" : "pendientes"
      }`}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: isDark
              ? "rgba(255, 183, 77, 0.15)"
              : "rgba(255, 140, 0, 0.12)",
          },
        ]}
      >
        <Ionicons
          name="file-tray-full-outline"
          size={24}
          color={isDark ? "#FFB74D" : "#FF8C00"}
        />
      </View>

      <View style={styles.textos}>
        <Text
          style={[styles.titulo, { color: isDark ? "#FDFCF4" : "#283593" }]}
        >
          Solicitudes de Trabajo
        </Text>
        <Text
          style={[styles.subtitulo, { color: isDark ? "#94A3B8" : "#475569" }]}
        >
          Aquí verás los clientes que solicitan tus servicios
        </Text>
      </View>

      <View
        style={[
          styles.insignia,
          {
            backgroundColor: hayPendientes
              ? isDark
                ? "#FFB74D"
                : "#FF8C00"
              : isDark
                ? "#2A3649"
                : "#E2E8F0",
          },
        ]}
      >
        <Text
          style={[
            styles.insigniaTexto,
            {
              color: hayPendientes
                ? isDark
                  ? "#121826"
                  : "#FFFFFF"
                : isDark
                  ? "#CBD5E1"
                  : "#475569",
            },
          ]}
        >
          {textoInsignia}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={isDark ? "#94A3B8" : "#475569"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginVertical: 8,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "800",
  },
  subtitulo: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  insignia: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  insigniaTexto: {
    fontSize: 16,
    fontWeight: "800",
  },
});
