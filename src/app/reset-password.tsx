import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { Logo } from '@/components/Logo';

export default function ResetPasswordScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();

  const [token, setToken] = useState(params.token || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = Boolean(token.trim()) && hasMinLength && hasNumber && passwordsMatch;

  const handleResetPassword = async () => {
    if (!token.trim()) {
      Alert.alert('Token requerido', 'Por favor ingresa el código o token de seguridad recibido.');
      return;
    }

    if (!hasMinLength) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!hasNumber) {
      Alert.alert('Falta número', 'La contraseña debe contener al menos un número.');
      return;
    }

    if (!passwordsMatch) {
      Alert.alert('No coinciden', 'Las contraseñas ingresadas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient('/api/auth/reset-password', {
        method: 'POST',
        useToken: false,
        body: JSON.stringify({
          token: token.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          '¡Contraseña Actualizada! 🎉',
          'Tu clave de acceso ha sido restablecida con éxito. Inicia sesión con tu nueva contraseña.',
          [
            {
              text: 'Iniciar Sesión',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudo restablecer la contraseña. El token puede ser inválido o haber expirado.');
      }
    } catch (error) {
      console.error('ResetPassword error:', error);
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand Logo outside card */}
        <View style={styles.logoContainer}>
          <Logo width={220} height={48} style={{ alignSelf: 'center' }} />
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
            <Text style={[styles.title, { color: colors.text }]}>Nueva Contraseña</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Crea una contraseña segura para tu cuenta. Exigimos confirmarla para evitar errores de tipeo.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Token o Código de Seguridad</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background, borderColor: colors.backgroundSelected },
              ]}
            >
              <Ionicons name="key-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, fontSize: 13 }]}
                placeholder="Pega el token aquí"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Nueva Contraseña</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background, borderColor: colors.backgroundSelected },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Confirmar Nueva Contraseña</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background, borderColor: colors.backgroundSelected },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.validationBox,
                { backgroundColor: colors.background, borderColor: colors.backgroundSelected },
              ]}
            >
              <Text style={[styles.validationHeader, { color: colors.textSecondary }]}>Requisitos de seguridad:</Text>

              <View style={styles.validationRow}>
                <Ionicons
                  name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={hasMinLength ? colors.secondary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.validationText,
                    { color: hasMinLength ? colors.secondary : colors.textSecondary, fontWeight: hasMinLength ? '700' : '400' },
                  ]}
                >
                  Mínimo 8 caracteres
                </Text>
              </View>

              <View style={styles.validationRow}>
                <Ionicons
                  name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={hasNumber ? colors.secondary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.validationText,
                    { color: hasNumber ? colors.secondary : colors.textSecondary, fontWeight: hasNumber ? '700' : '400' },
                  ]}
                >
                  Al menos un número
                </Text>
              </View>

              <View style={styles.validationRow}>
                <Ionicons
                  name={passwordsMatch ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={passwordsMatch ? colors.secondary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.validationText,
                    { color: passwordsMatch ? colors.secondary : colors.textSecondary, fontWeight: passwordsMatch ? '700' : '400' },
                  ]}
                >
                  Las contraseñas coinciden
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary, shadowColor: colors.primary },
                (!isFormValid || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Actualizar Contraseña</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Volver al Inicio de Sesión</Text>
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  form: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  validationBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  validationHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationText: {
    fontSize: 13,
  },
  button: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
