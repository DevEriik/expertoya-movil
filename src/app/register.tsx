import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiClient } from '@/utils/api';

export default function RegisterScreen() {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const colors = Colors[isDark ? 'dark' : 'light'];

    const router = useRouter();
    const { login } = useAuth();
    
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        if (!nombre.trim() || !apellido.trim() || !email.trim() || !password.trim()) {
            Alert.alert("Campos requeridos", "Por favor completa todos los campos.");
            return;
        }

        if (!fechaNacimiento) {
            Alert.alert("Fecha requerida", "Debes ser mayor de 18 años para registrarte.");
            return;
        }

        const ageDifMs = Date.now() - fechaNacimiento.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        
        if (age < 18) {
            Alert.alert("Registro no permitido", "Debes ser mayor de edad para usar ExpertoYa.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiClient('/api/auth/register', {
                method: 'POST',
                useToken: false,
                body: JSON.stringify({ 
                    nombre: nombre.trim(),
                    apellido: apellido.trim(),
                    email: email.trim().toLowerCase(), 
                    password,
                    fecha_nacimiento: fechaNacimiento.toISOString()
                })
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert(
                    "¡Registro Exitoso!", 
                    "Te hemos enviado un correo de bienvenida. Ahora serás redirigido para iniciar sesión.",
                    [{ text: "Entendido", onPress: () => router.replace('/login') }]
                );
            } else {
                Alert.alert("Error de registro", data.error || "No se pudo crear la cuenta.");
            }
        } catch (error) {
            console.error("Register error:", error);
            Alert.alert("Error de red", "No se pudo conectar con el servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setFechaNacimiento(selectedDate);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Crear Cuenta</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Regístrate como cliente para empezar a contratar a los mejores profesionales.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.row}>
                        <View style={[styles.inputContainer, styles.halfInput, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Nombre"
                                value={nombre}
                                onChangeText={setNombre}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <View style={[styles.inputContainer, styles.halfInput, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Apellido"
                                value={apellido}
                                onChangeText={setApellido}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
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

                    <TouchableOpacity 
                        style={[styles.inputContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]} 
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <Text style={[styles.input, { lineHeight: 54, color: fechaNacimiento ? colors.text : colors.textSecondary }]}>
                            {fechaNacimiento ? fechaNacimiento.toLocaleDateString() : "Fecha de nacimiento (Mayor de 18)"}
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

                    <View style={[styles.inputContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Contraseña segura"
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
                        style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }, isLoading && styles.buttonDisabled]} 
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
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>¿Ya tienes una cuenta? </Text>
                    <TouchableOpacity onPress={() => router.push('/login')}>
                        <Text style={[styles.footerLink, { color: colors.primary }]}>Inicia Sesión</Text>
                    </TouchableOpacity>
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
    header: {
        marginBottom: 40,
        marginTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
    },
    form: {
        marginBottom: 30,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    eyeIcon: {
        padding: 8,
    },
    button: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    footerText: {
        fontSize: 15,
    },
    footerLink: {
        fontSize: 15,
        fontWeight: '700',
    },
});
