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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAccessibility } from '@/context/AccessibilityContext';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { Logo } from '@/components/Logo';

export default function ForgotPasswordScreen() {
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();

  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendRecoveryEmail = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      Alert.alert('Correo requerido', 'Por favor ingresa tu correo electrónico.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Formato inválido', 'Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient('/api/auth/forgot-password', {
        method: 'POST',
        useToken: false,
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        Alert.alert(
          'Correo Enviado ✉️',
          'Hemos enviado un correo con el enlace para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.',
          [
            {
              text: 'Entendido',
              style: 'default',
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudo enviar el correo de recuperación.');
      }
    } catch (error) {
      console.error('ForgotPassword error:', error);
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor. Revisa tu conexión a internet.');
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
            <Text style={[styles.title, { color: colors.text }]}>Recuperar Contraseña</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Ingresa el correo electrónico asociado a tu cuenta de ExpertoYa para recibir el enlace de recuperación.
            </Text>
          </View>

          {!isSuccess ? (
            <View style={styles.form}>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.background, borderColor: colors.backgroundSelected },
                ]}
              >
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary, shadowColor: colors.primary },
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleSendRecoveryEmail}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Enviar Instrucciones</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View
                style={[
                  styles.successCard,
                  { backgroundColor: colors.background, borderColor: colors.backgroundSelected },
                ]}
              >
                <Ionicons name="checkmark-circle" size={48} color={colors.secondary} />
                <Text style={[styles.successTitle, { color: colors.text }]}>¡Correo Enviado!</Text>
                <Text style={[styles.successText, { color: colors.textSecondary }]}>
                  Revisa tu bandeja de entrada o spam. Haz clic en el enlace del correo para restablecer tu contraseña.
                </Text>
              </View>
            </View>
          )}

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
    marginBottom: 16,
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
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    marginBottom: 16,
  },
  successCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  successText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
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
