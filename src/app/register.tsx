import { Logo } from "@/components/Logo";
import { Ionicons } from "@/components/ui/VectorIcons";
import { useAccessibility } from "@/context/AccessibilityContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "@/navigation/routerCompat";
import { apiClient } from "@/utils/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();

  const router = useRouter();
  const { login } = useAuth();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !nombre.trim() ||
      !apellido.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert("Campos requeridos", "Por favor completa todos los campos.");
      return;
    }

    if (!fechaNacimiento) {
      Alert.alert(
        "Fecha requerida",
        "Debes ser mayor de 18 años para registrarte.",
      );
      return;
    }

    const ageDifMs = Date.now() - fechaNacimiento.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (age < 18) {
      Alert.alert(
        "Registro no permitido",
        "Debes ser mayor de edad para usar ExpertoYa.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient("/api/auth/register", {
        method: "POST",
        useToken: false,
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim().toLowerCase(),
          password,
          fecha_nacimiento: fechaNacimiento.toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "¡Registro Exitoso!",
          "Te hemos enviado un correo de bienvenida. Ahora serás redirigido para iniciar sesión.",
          [{ text: "Entendido", onPress: () => router.replace("/login") }],
        );
      } else {
        Alert.alert(
          "Error de registro",
          data.error || "No se pudo crear la cuenta.",
        );
      }
    } catch (error) {
      console.error("Register error:", error);
      Alert.alert("Error de red", "No se pudo conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setFechaNacimiento(selectedDate);
    }
  };

  const formatDateForWebInput = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleWebDateChange = (value: string) => {
    if (!value) {
      setFechaNacimiento(null);
      return;
    }
    const [year, month, day] = value.split("-").map(Number);
    if (year && month && day) {
      setFechaNacimiento(new Date(year, month - 1, day));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand Logo outside card */}
        <View style={styles.logoContainer}>
          <Logo width={220} height={48} style={{ alignSelf: "center" }} />
        </View>

        {/* Card Container */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.backgroundSelected,
              shadowOpacity: isDark ? 0.35 : 0.08,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Crear Cuenta
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Regístrate como cliente para empezar a contratar a los mejores
              profesionales.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View
                style={[
                  styles.inputContainer,
                  styles.halfInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.backgroundSelected,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Nombre"
                  value={nombre}
                  onChangeText={setNombre}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View
                style={[
                  styles.inputContainer,
                  styles.halfInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.backgroundSelected,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Apellido"
                  value={apellido}
                  onChangeText={setApellido}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.backgroundSelected,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {Platform.OS === "web" ? (
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.backgroundSelected,
                  },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <input
                  type="date"
                  aria-label="Fecha de nacimiento (Mayor de 18)"
                  value={formatDateForWebInput(fechaNacimiento)}
                  max={formatDateForWebInput(new Date())}
                  onChange={(e) => handleWebDateChange(e.target.value)}
                  style={{
                    flex: 1,
                    height: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    color: fechaNacimiento ? colors.text : colors.textSecondary,
                    fontSize: 15,
                    fontFamily: "inherit",
                    colorScheme: isDark ? "dark" : "light",
                  }}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.backgroundSelected,
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <Text
                    style={[
                      styles.input,
                      {
                        lineHeight: 54,
                        color: fechaNacimiento
                          ? colors.text
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {fechaNacimiento
                      ? fechaNacimiento.toLocaleDateString()
                      : "Fecha de nacimiento (Mayor de 18)"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={fechaNacimiento || new Date(2005, 0, 1)}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </>
            )}

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.backgroundSelected,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Contraseña segura"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Registrarse</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              ¿Ya tienes una cuenta?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Inicia Sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  form: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
