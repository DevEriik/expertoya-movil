import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext"; // IMPORTANTE: Traemos tu contexto
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PaymentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { usuario } = useAuth(); // Sacamos al usuario logueado

  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const PaymentOption = ({
    icon,
    title,
    subtitle,
    iconColor,
    iconBg,
    isConfigured,
  }: any) => (
    <TouchableOpacity style={styles.settingRow}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      {isConfigured ? (
        <View style={[styles.badge, { backgroundColor: colors.successBg }]}>
          <Text style={[styles.badgeText, { color: colors.success }]}>
            Conectado
          </Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.grayIcon} />
      )}
    </TouchableOpacity>
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
          Métodos de Pago
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {usuario?.rol === "PROFESIONAL" && (
          <>
            <View
              style={[styles.balanceCard, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.balanceLabel}>SALDO ESCROW DISPONIBLE</Text>
              <Text style={styles.balanceAmount}>$ 0.00 ARS</Text>
              <Text style={styles.balanceHelper}>
                El dinero de tus trabajos se libera aquí.
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              CUENTAS PARA RETIRAR DINERO
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <PaymentOption
                icon="wallet-outline"
                title="Mercado Pago"
                subtitle="Retiros inmediatos sin costo"
                iconColor="#009EE3"
                iconBg="#E6F5FC"
                isConfigured={true}
              />
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.backgroundSelected },
                ]}
              />
              <PaymentOption
                icon="business-outline"
                title="Cuenta Bancaria (CBU)"
                subtitle="Transferencias en 24hs hábiles"
                iconColor={colors.info}
                iconBg={colors.infoBg}
                isConfigured={false}
              />
            </View>
          </>
        )}

        {usuario?.rol === "CLIENTE" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              TARJETAS GUARDADAS (PARA PAGAR)
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <PaymentOption
                icon="card-outline"
                title="Visa terminada en 4321"
                subtitle="Vence el 12/28"
                iconColor={colors.info}
                iconBg={colors.infoBg}
                isConfigured={true}
              />
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.backgroundSelected },
                ]}
              />

              <TouchableOpacity style={styles.addCardButton}>
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.addCardText, { color: colors.primary }]}>
                  Agregar nueva tarjeta
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
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
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  content: { flex: 1, padding: 16 },

  balanceCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  balanceAmount: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "800",
    marginVertical: 8,
  },
  balanceHelper: { color: "rgba(255,255,255,0.9)", fontSize: 13 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: { flex: 1, paddingRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  settingSubtitle: { fontSize: 13, fontWeight: "500" },
  divider: { height: 1, marginLeft: 80 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },

  addCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  addCardText: { fontSize: 16, fontWeight: "700" },
});
