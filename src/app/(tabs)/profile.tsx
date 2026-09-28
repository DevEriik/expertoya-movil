import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

import ServiceCard from "@/components/ServiceCard";

import { Ionicons } from "@expo/vector-icons";

const MOCK_SERVICES = [
  {
    id: "1",
    title: "Reparación de Tablero Eléctrico",
    price: 45000,
    duration: "2-3 horas",
    imageUrl:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Instalación de Tomacorrientes y Llaves de Luz",
    price: 15000,
    duration: "1 hora",
    imageUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=200&auto=format&fit=crop",
  },
];

export default function PerfilScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/create-service")}
      >
        <Ionicons
          name="add-circle-outline"
          size={24}
          color="#FFF"
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>Crear Nuevo Servicio</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Mis Servicios Publicados
      </Text>

      <FlatList
        data={MOCK_SERVICES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ServiceCard
            title={item.title}
            price={item.price}
            duration={item.duration}
            imageUrl={item.imageUrl}
          />
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  createButton: {
    flexDirection: "row",
    margin: 16,
    padding: 16,
    borderRadius: 12, // Estética Figma
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
