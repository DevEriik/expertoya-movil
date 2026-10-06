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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import ServiceCard from "@/components/ServiceCard";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/utils/secureStore";

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

export default function AccountDetailsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [profile, setProfile] = useState({
    nombre: user?.nombre || "Usuario",
    apellido: user?.apellido || "",
    trade: user?.rol === 'PROFESIONAL' ? "Profesional" : "Cliente",
    zonas: "Sin definir",
    foto_perfil: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    estado_validado: false,
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const hostIp = Constants.expoConfig?.hostUri?.split(":")[0];
          const API_URL =
            process.env.EXPO_PUBLIC_API_URL ||
            (hostIp ? `http://${hostIp}:3000` : "http://localhost:3000");
          const token = await getToken("auth_token");
          
          const res = await fetch(`${API_URL}/api/professionals/profile`, {
            headers: {
              ...(token ? { "Authorization": `Bearer ${token}` } : {})
            }
          });
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
          }
        } catch {
          console.log("Error al cargar el perfil, usando datos en caché.");
        }
      };
      if (user?.rol === 'PROFESIONAL') {
        fetchProfile();
      }
    }, [user])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Account Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        <Image
          source={{ uri: profile.foto_perfil }}
          style={styles.avatar}
        />

        <View style={styles.profileDetails}>
          <View style={styles.nameRow}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {profile.nombre} {profile.apellido}
            </Text>
            {user?.rol === 'PROFESIONAL' && (
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
            )}
          </View>

          <Text style={[styles.profileTrade, { color: colors.textSecondary }]}>
            {user?.rol === 'PROFESIONAL' ? `${profile.trade} • ${profile.zonas}` : 'Cuenta de Cliente'}
          </Text>

          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.primary }]}
            onPress={() => router.push("/edit-profile")}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>
              Editar Perfil
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {user?.rol === 'CLIENTE' && (
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#1E293B' }}>¿Quieres ofrecer tus servicios?</Text>
            <Text style={{ color: '#64748B', marginBottom: 16, lineHeight: 22 }}>
              Regístrate como profesional para validar tu identidad, cargar tu matrícula y empezar a ofrecer servicios.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
              onPress={() => router.push('/onboarding')}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Registro Profesional</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {user?.rol !== 'CLIENTE' && (
        <>
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  createButton: {
    flexDirection: "row",
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
