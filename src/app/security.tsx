import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CustomSwitch = ({
  value,
  onValueChange,
  activeColor,
  inactiveColor,
}: any) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor],
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onValueChange(!value)}>
      <Animated.View
        style={{
          width: 50,
          height: 30,
          borderRadius: 15,
          backgroundColor,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: "#FFFFFF",
            transform: [{ translateX }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { usuario } = useAuth();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const [twoFactor, setTwoFactor] = useState(false);
  const [hideAddress, setHideAddress] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [exactLocation, setExactLocation] = useState(false);

  const FigmaToggle = ({ title, subtitle, value, onValueChange }: any) => (
    <View style={styles.settingRow}>
      <View style={styles.textContainer}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <CustomSwitch
        value={value}
        onValueChange={onValueChange}
        activeColor={colors.primary}
        inactiveColor={colors.backgroundSelected}
      />
    </View>
  );

  const FigmaAction = ({ title, subtitle, danger = false }: any) => (
    <TouchableOpacity style={styles.settingRow}>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.settingTitle,
            { color: danger ? "#FF3B30" : colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.settingSubtitle,
              { color: danger ? "#FF8A8A" : colors.textSecondary },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={danger ? "#FF8A8A" : colors.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Privacidad y Seguridad
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Controla el acceso y visibilidad.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View
          style={[styles.card, { backgroundColor: colors.backgroundElement }]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="key-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Acceso a la Cuenta
            </Text>
          </View>
          <FigmaAction
            title="Cambiar Contraseña"
            subtitle="Actualiza tu clave de acceso"
          />
          <View
            style={[
              styles.divider,
              { backgroundColor: colors.backgroundSelected },
            ]}
          />
          <FigmaToggle
            title="Autenticación en 2 pasos"
            subtitle="Mayor seguridad al iniciar sesión"
            value={twoFactor}
            onValueChange={setTwoFactor}
          />
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.backgroundElement }]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="eye-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Privacidad de tus Datos
            </Text>
          </View>

          {usuario?.rol === "CLIENTE" && (
            <FigmaToggle
              title="Ocultar mi dirección exacta"
              subtitle="Solo se mostrará tu zona hasta confirmar presupuesto"
              value={hideAddress}
              onValueChange={setHideAddress}
            />
          )}

          {usuario?.rol === "PROFESIONAL" && (
            <>
              <FigmaToggle
                title="Perfil Público"
                subtitle="Permitir que te encuentren en búsquedas"
                value={publicProfile}
                onValueChange={setPublicProfile}
              />
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.backgroundSelected },
                ]}
              />
              <FigmaToggle
                title="Mostrar ubicación exacta"
                subtitle="Verán a cuántos metros estás (apagado: solo el barrio)"
                value={exactLocation}
                onValueChange={setExactLocation}
              />
            </>
          )}
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.backgroundElement }]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="warning-outline" size={20} color={"#FF3B30"} />
            <Text style={[styles.cardTitle, { color: "#FF3B30" }]}>
              Zona de Peligro
            </Text>
          </View>
          <FigmaAction
            title="Eliminar cuenta permanentemente"
            subtitle="Esta acción no se puede deshacer"
            danger={true}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { paddingVertical: 8, alignSelf: "flex-start" },
  headerTitles: { marginTop: 8 },
  headerTitle: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  headerSubtitle: { fontSize: 15, fontWeight: "500" },
  content: { flex: 1, padding: 16 },
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
    paddingBottom: 8,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  textContainer: { flex: 1, paddingRight: 16 },
  settingTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  settingSubtitle: { fontSize: 13, fontWeight: "500" },
  divider: { height: 1, marginHorizontal: 16 },
});
