import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import Constants from "expo-constants";

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

  const [profile, setProfile] = useState({
    nombre: "Carlos",
    apellido: "Gómez",
    trade: "Electricista Matriculado",
    zonas: "Neuquén y Cipolletti",
    foto_perfil:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    estado_validado: true,
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const hostIp = Constants.expoConfig?.hostUri?.split(":")[0];
          const API_URL =
            process.env.EXPO_PUBLIC_API_URL ||
            (hostIp ? `http://${hostIp}:3000` : "http://localhost:3000");
          const res = await fetch(`${API_URL}/api/professionals/profile`);
          if (res.ok) {
            const data = await res.json();
            setProfile((prev) => ({
              ...prev,
              nombre: data.nombre || prev.nombre,
              apellido: data.apellido || prev.apellido,
              foto_perfil: data.foto_perfil || prev.foto_perfil,
              zonas: data.ubicacion_geografica || prev.zonas,
              estado_validado: data.estado_validado ?? prev.estado_validado,
            }));
            console.log("Perfil cargado exitosamente:", data);
          }
        } catch {
          console.log("Error al cargar el perfil, usando datos en caché.");
        }
      };
      fetchProfile();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        <Image
          source={{
            uri: profile.foto_perfil,
          }}
          style={styles.avatar}
        />

        <View style={styles.profileDetails}>
          <View style={styles.nameRow}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {profile.nombre} {profile.apellido}
            </Text>
            <View style={styles.verifiedBadge}>
              <Ionicons
                name={profile.estado_validado ? "checkmark-circle" : "time-outline"}
                size={16}
                color={profile.estado_validado ? colors.secondary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.verifiedText,
                  { color: profile.estado_validado ? colors.secondary : colors.textSecondary },
                ]}
              >
                {profile.estado_validado ? "Aprobado" : "Pendiente"}
              </Text>
            </View>
          </View>

          <Text style={[styles.profileTrade, { color: colors.textSecondary }]}>
            {profile.trade} • {profile.zonas}
          </Text>

          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.primary }]}
            onPress={() => router.push("/edit-profile" as any)}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>
              Editar Perfil
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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

  profileCard: {
    flexDirection: "row",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#E0E1E6",
  },
  profileDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 191, 165, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "600",
  },
  profileTrade: {
    fontSize: 13,
    marginBottom: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    alignSelf: "flex-start",
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

});
