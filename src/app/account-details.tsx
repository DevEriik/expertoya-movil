import ServiceCard from "@/components/ServiceCard";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const router = useRouter();
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState({
    nombre: usuario?.nombre || "Usuario",
    apellido: usuario?.apellido || "",
    trade: usuario?.rol === "PROFESIONAL" ? "Profesional" : "Cliente",
    zonas: "Sin definir",
    foto_perfil:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    estado_validado: false,
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const res = await apiClient("/api/professionals/profile");
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
      if (usuario?.rol === "PROFESIONAL") {
        fetchProfile();
      }
    }, [usuario]),
  );

  const FigmaActionCard = ({
    icon,
    title,
    subtitle,
    onPress,
    iconColor,
    buttonText,
  }: any) => (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={{ padding: 16, paddingTop: 0 }}>
        <Text
          style={{
            color: colors.textSecondary,
            marginBottom: 16,
            lineHeight: 20,
          }}
        >
          {subtitle}
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: iconColor }]}
          onPress={onPress}
        >
          <Text style={styles.primaryButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: colors.backgroundElement,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Detalles de la Cuenta
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={usuario?.rol === "PROFESIONAL" ? MOCK_SERVICES : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
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

                  {usuario?.rol === "PROFESIONAL" && (
                    <View
                      style={[
                        styles.verifiedBadge,
                        {
                          backgroundColor: profile.estado_validado
                            ? colors.successBg
                            : colors.warningBg,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          profile.estado_validado
                            ? "checkmark-circle"
                            : "time-outline"
                        }
                        size={14}
                        color={
                          profile.estado_validado
                            ? colors.success
                            : colors.warning
                        }
                      />
                      <Text
                        style={[
                          styles.verifiedText,
                          {
                            color: profile.estado_validado
                              ? colors.success
                              : colors.warning,
                          },
                        ]}
                      >
                        {profile.estado_validado ? "Aprobado" : "Pendiente"}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[styles.profileTrade, { color: colors.textSecondary }]}
                >
                  {usuario?.rol === "PROFESIONAL"
                    ? `${profile.trade} • ${profile.zonas}`
                    : "Cuenta de Cliente"}
                </Text>

                <TouchableOpacity
                  style={[styles.editButton, { borderColor: colors.primary }]}
                  onPress={() => router.push("/edit-profile")}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.editButtonText, { color: colors.primary }]}
                  >
                    Editar Perfil
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {usuario?.rol === "CLIENTE" && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.primary, marginTop: 8 },
                  ]}
                >
                  TUS SERVICIOS
                </Text>
                <FigmaActionCard
                  icon="list-outline"
                  title="Historial de Solicitudes"
                  subtitle="Todavía no has solicitado ningún servicio. Explora el directorio para encontrar profesionales cerca de ti."
                  iconColor={colors.info}
                  buttonText="Buscar Profesionales"
                  onPress={() => router.push("/(tabs)")}
                />

                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.primary, marginTop: 8 },
                  ]}
                >
                  CONVIÉRTETE EN EXPERTO
                </Text>
                <FigmaActionCard
                  icon="star-outline"
                  title="Ofrece tus Servicios"
                  subtitle="Regístrate como profesional para validar tu identidad, cargar tu matrícula y empezar a ganar dinero."
                  iconColor={colors.primary}
                  buttonText="Registro Profesional"
                  onPress={() => router.push("/onboarding")}
                />
              </>
            )}

            {usuario?.rol !== "CLIENTE" && (
              <>
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => router.push("/create-service")}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color="#FFF"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.createButtonText}>
                    Crear Nuevo Servicio
                  </Text>
                </TouchableOpacity>

                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.primary, marginTop: 16 },
                  ]}
                >
                  MIS SERVICIOS PUBLICADOS
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <ServiceCard
              title={item.title}
              price={item.price}
              duration={item.duration}
              imageUrl={item.imageUrl}
            />
          </View>
        )}
      />
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: { paddingVertical: 8, alignSelf: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700" },

  card: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 12,
    marginLeft: 8,
    letterSpacing: 1,
  },

  profileCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#E0E1E6",
  },
  profileDetails: { flex: 1, marginLeft: 16, justifyContent: "center" },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  profileName: { fontSize: 18, fontWeight: "800", flex: 1 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: { fontSize: 11, fontWeight: "700" },
  profileTrade: { fontSize: 13, marginBottom: 12 },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    alignSelf: "flex-start",
  },
  editButtonText: { fontSize: 13, fontWeight: "700" },

  createButton: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  buttonIcon: { marginRight: 8 },
  createButtonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  primaryButton: { padding: 14, borderRadius: 12, alignItems: "center" },
  primaryButtonText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
