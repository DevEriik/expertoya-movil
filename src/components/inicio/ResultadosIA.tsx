//  se encargará exclusivamente de mostrar la carga y los oficios:
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  isLoading: boolean;
  oficios: string[];
}

export function ResultadosIA({ isLoading, oficios }: Props) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#33EFA5" />
        <Text style={styles.loadingText}>
          La IA está analizando la imagen...
        </Text>
      </View>
    );
  }

  if (oficios.length > 0) {
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Especialistas recomendados:</Text>
        <View style={styles.tagsContainer}>
          {oficios.map((oficio, index) => (
            <TouchableOpacity key={index} style={styles.tag}>
              <Text style={styles.tagText}>{oficio}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return null; 
}

const styles = StyleSheet.create({
  loadingContainer: { marginTop: 24, alignItems: "center" },
  loadingText: {
    color: "#9CA3AF",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  resultsContainer: {
    marginTop: 24,
    width: "100%",
    alignItems: "flex-start",
    backgroundColor: "#121826",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  resultsTitle: {
    color: "#FDFCF4",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: {
    backgroundColor: "rgba(51, 239, 165, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#33EFA5",
  },
  tagText: { color: "#33EFA5", fontWeight: "bold", fontSize: 14 },
});
