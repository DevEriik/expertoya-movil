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
import { apiClient } from "@/utils/api";

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
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState({
    nombre: usuario?.nombre || "Usuario",
    apellido: usuario?.apellido || "",
    trade: "Cuenta de Cliente",
    zonas: "Sin definir",
    foto_perfil: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    estado_validado: false,
    estado_auditoria: null as "PENDIENTE" | "APROBADO" | "RECHAZADO" | null,
    motivo_rechazo: null as string | null,
    tiene_solicitud: false,
    rol: usuario?.rol || "CLIENTE",
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const res = await apiClient('/api/professionals/profile');
          if (res.ok) {
            const data = await res.json();
            setProfile((prev) => ({
              ...prev,
              nombre: data.nombre || prev.nombre,
              apellido: data.apellido || prev.apellido,
              foto_perfil: data.foto_perfil || prev.foto_perfil,
              zonas: data.ubicacion_geografica || prev.zonas,
              trade: data.rol === 'PROFESIONAL' && data.estado_validado ? "Profesional" : "Cuenta de Cliente",
              estado_validado: Boolean(data.estado_validado),
              estado_auditoria: data.estado_auditoria || null,
              motivo_rechazo: data.motivo_rechazo || null,
              tiene_solicitud: Boolean(data.tiene_solicitud),
              rol: data.rol || prev.rol,
            }));
          }
        } catch {
          console.log("Error al cargar el perfil.");
        }
      };
      fetchProfile();
    }, [usuario])
  );

  const isAprobado = profile.estado_validado && profile.estado_auditoria === "APROBADO";
  const isPendiente = profile.tiene_solicitud && profile.estado_auditoria === "PENDIENTE";
  const isRechazado = profile.tiene_solicitud && profile.estado_auditoria === "RECHAZADO";
  const isClienteSinSolicitud = !profile.tiene_solicitud;

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
            <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
              {profile.nombre} {profile.apellido}
            </Text>

            {isAprobado && (
              <View style={[styles.badgeContainer, { backgroundColor: "rgba(14, 159, 110, 0.15)" }]}>
                <Ionicons name="checkmark-circle" size={14} color="#0E9F6E" />
                <Text style={[styles.badgeText, { color: "#0E9F6E" }]}>Auditado</Text>
              </View>
            )}

            {isPendiente && (
              <View style={[styles.badgeContainer, { backgroundColor: "rgba(217, 119, 6, 0.15)" }]}>
                <Ionicons name="time" size={14} color="#D97706" />
                <Text style={[styles.badgeText, { color: "#D97706" }]}>Pendiente</Text>
              </View>
            )}

            {isRechazado && (
              <View style={[styles.badgeContainer, { backgroundColor: "rgba(220, 38, 38, 0.15)" }]}>
                <Ionicons name="close-circle" size={14} color="#DC2626" />
                <Text style={[styles.badgeText, { color: "#DC2626" }]}>Rechazado</Text>
              </View>
            )}
          </View>

          <Text style={[styles.profileTrade, { color: colors.textSecondary }]}>
            {isAprobado ? `Profesional • ${profile.zonas}` : "Cuenta de Cliente"}
          </Text>

          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.primary }]}
            onPress={() => router.push("/edit-profile")}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>
              Editar Perfil
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CASO 1: Solicitud Aprobada / Auditada -> Funcionalidades de Profesional */}
      {isAprobado && (
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

      {/* CASO 2: Solicitud en Estado Pendiente de Auditoría */}
      {isPendiente && (
        <View style={styles.statusSectionContainer}>
          <View style={styles.pendingCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.pendingIconBubble}>
                <Ionicons name="time" size={24} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>Solicitud en Revisión</Text>
                <Text style={styles.pendingStatusBadge}>En proceso de auditoría</Text>
              </View>
            </View>

            <Text style={styles.pendingMessage}>
              Tus documentos de identidad, oficios y situación fiscal han sido recibidos y se encuentran en proceso de verificación por el equipo de administración.
            </Text>

            <View style={styles.infoRowNotice}>
              <Ionicons name="information-circle-outline" size={18} color="#92400E" />
              <Text style={styles.infoRowText}>
                Mientras tu legajo se encuentra en revisión, tu perfil opera como cliente común. Una vez aprobado, podrás publicar y ofrecer servicios.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* CASO 3: Solicitud Rechazada */}
      {isRechazado && (
        <View style={styles.statusSectionContainer}>
          <View style={styles.rejectedCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rejectedIconBubble}>
                <Ionicons name="alert-circle" size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rejectedTitle}>Solicitud Rechazada</Text>
                <Text style={styles.rejectedStatusBadge}>Requiere corrección de documentos</Text>
              </View>
            </View>

            <Text style={styles.rejectedIntro}>
              Tu solicitud para registrarte como profesional fue revisada y rechazada por el siguiente motivo:
            </Text>

            <View style={styles.reasonContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#991B1B" />
              <Text style={styles.reasonText}>
                {profile.motivo_rechazo || "La documentación cargada no cumple con los requisitos o es ilegible."}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.push('/onboarding')}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Corregir y Reenviar Documentación</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* CASO 4: Cliente normal que aún no inició Onboarding */}
      {isClienteSinSolicitud && (
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <View style={styles.promoCard}>
            <Text style={styles.promoTitle}>¿Quieres ofrecer tus servicios?</Text>
            <Text style={styles.promoText}>
              Regístrate como profesional para validar tu identidad, cargar tu matrícula y empezar a ofrecer servicios.
            </Text>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/onboarding')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionBtnText}>Registro Profesional</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    gap: 8,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
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

  statusSectionContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },

  // Estilos para tarjeta de PENDIENTE
  pendingCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    padding: 16,
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  pendingIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#92400E",
  },
  pendingStatusBadge: {
    fontSize: 12,
    color: "#B45309",
    fontWeight: "600",
  },
  pendingMessage: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 19,
    marginBottom: 12,
  },
  infoRowNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  infoRowText: {
    fontSize: 12,
    color: "#92400E",
    flex: 1,
    lineHeight: 16,
  },

  // Estilos para tarjeta de RECHAZADO
  rejectedCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    padding: 16,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rejectedIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#991B1B",
  },
  rejectedStatusBadge: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "600",
  },
  rejectedIntro: {
    fontSize: 13,
    color: "#7F1D1D",
    lineHeight: 18,
    marginBottom: 10,
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  reasonText: {
    fontSize: 13,
    color: "#991B1B",
    fontWeight: "600",
    flex: 1,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // Promo Card
  promoCard: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1E293B",
  },
  promoText: {
    color: "#64748B",
    marginBottom: 16,
    lineHeight: 22,
    fontSize: 13,
  },
  primaryActionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryActionBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
