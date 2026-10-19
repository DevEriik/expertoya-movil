import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { Logo } from '@/components/Logo';

export default function LoginScreen() {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const colors = Colors[isDark ? 'dark' : 'light'];

    const router = useRouter();
    const { login } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Campos requeridos", "Por favor ingresa tu correo y contraseña.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiClient('/api/auth/login', {
                method: 'POST',
                useToken: false,
                body: JSON.stringify({ email: email.trim().toLowerCase(), password, plataforma: 'MOBILE' })
            });

            const data = await response.json();

            if (response.ok) {
                await login(data.token, data.usuario);
                router.replace('/(tabs)');
            } else {
                Alert.alert("Error", data.error || "No se pudo iniciar sesión. Verifica tus credenciales.");
            }
        } catch (error) {
            console.error("Login error:", error);
            Alert.alert("Error de red", "No se pudo conectar con el servidor.");
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
                        }
                    ]}
                >
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>¡Hola de nuevo!</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Inicia sesión para contratar o gestionar tus servicios en ExpertoYa.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
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

                        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Contraseña"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholderTextColor={colors.textSecondary}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={styles.forgotPassword}
                            onPress={() => router.push({
                                pathname: '/forgot-password',
                                params: { email: email.trim() }
                            })}
                        >
                            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }, isLoading && styles.buttonDisabled]} 
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.buttonText}>Iniciar Sesión</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>¿No tienes una cuenta? </Text>
                        <TouchableOpacity onPress={() => router.push('/register')}>
                            <Text style={[styles.footerLink, { color: colors.primary }]}>Regístrate gratis</Text>
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        fontSize: 13,
        fontWeight: '600',
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
    },
    footerText: {
        fontSize: 14,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '700',
    },
});
