// src/components/inicio/HeroIA.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useDiagnosticoIA } from "../../hooks/useDiagnosticoIA";
import { BuscadorInteractivo } from "./BuscadorInteractivo";
import { ResultadosIA } from "./ResultadosIA";

export function HeroIA() {
  const {
    busqueda,
    setBusqueda,
    oficios,
    isLoading,
    imagenSeleccionada,
    seleccionarFoto,
    quitarFoto,
    enviarConsulta,
  } = useDiagnosticoIA();

  return (
    <View style={styles.card}>
      <View style={styles.badgeContainer}>
        <MaterialCommunityIcons name="magic-staff" size={16} color="#33EFA5" />
        <Text style={styles.badgeText}>
          Búsqueda con Inteligencia Artificial
        </Text>
      </View>

      <Text style={styles.mainTitle}>
        ¿No estás seguro{"\n"}de a qué{"\n"}especialista{"\n"}llamar?
      </Text>

      <Text style={styles.subtitle}>
        Describe tu problema o sube una foto/video, y nuestra IA te conectará al
        instante con el experto exacto que necesitas.
      </Text>

      <BuscadorInteractivo
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        onCameraPress={seleccionarFoto}
        onSubmit={enviarConsulta}
        imagenSeleccionada={imagenSeleccionada}
        onRemoveImage={quitarFoto}
      />

      <ResultadosIA isLoading={isLoading} oficios={oficios} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#1F2937",
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(51, 239, 165, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 32,
  },
  badgeText: {
    color: "#33EFA5",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 13,
  },
  mainTitle: {
    fontSize: 38,
    fontWeight: "800",
    color: "#FDFCF4",
    textAlign: "center",
    lineHeight: 44,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
});
