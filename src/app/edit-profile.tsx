import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";

import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

const ZONAS_SUGERIDAS = ["Neuquén", "Cipolletti", "Plottier", "Fernandez Oro", "Allen", "Cutral Co", "Zapala", "General Roca", "Centenario", "Villa Regina"];

const OFICIOS_DISPONIBLES = [
    { id: 1, nombre: "Electricista" },
    { id: 2, nombre: "Plomero" },
    { id: 3, nombre: "Gasista" },
    { id: 4, nombre: "Pintor" },
    { id: 5, nombre: "Cerrajero" },
    { id: 6, nombre: "Refrigeración" },
    { id: 7, nombre: "Albañilería" },
];


export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const colors = Colors[scheme === "unspecified" ? "light" : scheme];
    const { usuario, login } = useAuth();

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!nombre.trim() || !apellido.trim()) {
            Alert.alert("Campos obligatorios", "Por favor ingresa tu nombre y apellido.");
            return;
        }

        if (selectedOficios.length === 0) {
            Alert.alert(
                "Oficio requerido",
                "Por favor selecciona al menos una especialidad u oficio."
            );
            return;
        }

        setIsSaving(true);

        try {
            const payload = {
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim(),
                foto_perfil: avatarUri,
                descripcion_perfil: bio.trim(),
                ubicacion_geografica: zonasCobertura.trim(),
            };

            const endpoint = usuario?.rol === 'CLIENTE' ? '/api/auth/profile' : '/api/professionals/profile';

            const response = await apiClient(endpoint, {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                Alert.alert(
                    "¡Perfil Actualizado!",
                    "Tus cambios han sido guardados exitosamente.",
                    [{ text: "Aceptar", onPress: () => router.back() }]
                );
            } else {
                const errorData = await response.json().catch(() => ({}));
                Alert.alert(
                    "Error al actualizar",
                    errorData.error || "Hubo un problema al guardar los datos en el servidor.",
                    [{ text: "Aceptar" }]
                );
            }
        } catch (error) {
            console.warn("Error de conexión:", error);
            Alert.alert(
                "Error de red",
                "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
                [{ text: "Aceptar" }]
            );
        } finally {
            setIsSaving(false);
        }
    };

    const [avatarUri, setAvatarUri] = useState<string>(
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
    );

    const [zonasCobertura, setZonasCobertura] = useState("Neuquén, Cipolletti, Plottier");

    const handleAddZona = (zona: string) => {
        if (!zonasCobertura.toLowerCase().includes(zona.toLowerCase())) {
            setZonasCobertura((prev) => (prev.trim() ? `${prev.trim()}, ${zona}` : zona));
        }
    };


    const [nombre, setNombre] = useState(usuario?.nombre || "");
    const [apellido, setApellido] = useState(usuario?.apellido || "");
    const [telefono, setTelefono] = useState("");
    const [bio, setBio] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                setIsLoading(true);
                try {
                    if (usuario?.rol === 'PROFESIONAL' || usuario?.rol === 'ADMIN') {
                        const response = await apiClient('/api/professionals/profile');
                        
                        if (response.ok) {
                            const data = await response.json();
                            setNombre(data.nombre || "");
                            setApellido(data.apellido || "");
                            setTelefono(data.telefono || "");
                            setBio(data.descripcion_perfil || "");
                            setZonasCobertura(data.ubicacion_geografica || "");
                            if (data.foto_perfil) setAvatarUri(data.foto_perfil);
                        }
                    } else {
                        const response = await apiClient('/api/auth/me');
                        if (response.ok) {
                            const data = await response.json();
                            setNombre(data.usuarioAutenticado.nombre || "");
                            setApellido(data.usuarioAutenticado.apellido || "");
                            setTelefono(data.usuarioAutenticado.telefono || "");
                        }
                    }
                } catch (error) {
                    console.error("Error cargando el perfil", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchProfile();
        }, [usuario])
    );

    const [selectedOficios, setSelectedOficios] = useState<number[]>([1]);

    const toggleOficio = (oficioId: number) => {
        setSelectedOficios((prev) =>
            prev.includes(oficioId)
                ? prev.filter((id) => id !== oficioId)
                : [...prev, oficioId]
        );
    };


    const handlePickImage = async () => {
        try {
            const permissionResult =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert(
                    "Permiso requerido",
                    "Necesitamos acceso a tu galería para poder actualizar tu foto de perfil."
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setAvatarUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error("Error al seleccionar imagen:", error);
            Alert.alert("Error", "No se pudo seleccionar la imagen.");
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: Math.max(insets.top, 16),
                        backgroundColor: colors.backgroundElement,
                        borderBottomColor: colors.backgroundSelected,
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    accessibilityLabel="Volver atrás"
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Editar Perfil
                </Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 24 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <>
                        <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        <TouchableOpacity
                            style={[styles.cameraButton, { backgroundColor: colors.primary }]}
                            onPress={handlePickImage}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="camera" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
                        Toca el ícono de la cámara para cambiar tu foto
                    </Text>

                </View>
                <View style={styles.formSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Información Personal
                    </Text>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.backgroundElement,
                                        borderColor: colors.backgroundSelected,
                                        color: colors.text,
                                    },
                                ]}
                                placeholder="Tu nombre"
                                placeholderTextColor={colors.textSecondary}
                                value={nombre}
                                onChangeText={setNombre}
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Apellido</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.backgroundElement,
                                        borderColor: colors.backgroundSelected,
                                        color: colors.text,
                                    },
                                ]}
                                placeholder="Tu apellido"
                                placeholderTextColor={colors.textSecondary}
                                value={apellido}
                                onChangeText={setApellido}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>
                            Teléfono de Contacto
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.backgroundElement,
                                    borderColor: colors.backgroundSelected,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="+54 9 11..."
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="phone-pad"
                            value={telefono}
                            onChangeText={setTelefono}
                        />
                    </View>

                    </View>

                    {usuario?.rol === 'CLIENTE' && (
                        <View style={[styles.inputGroup, { marginTop: 24, padding: 16, backgroundColor: colors.backgroundSelected, borderRadius: 12 }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>¿Eres Profesional?</Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 16 }]}>
                                Actualmente tienes una cuenta de cliente. Para ofrecer tus servicios y configurar tu perfil profesional (oficios, zonas, biografía), debes completar el proceso de acreditación.
                            </Text>
                            <TouchableOpacity 
                                style={{ backgroundColor: colors.primary, width: '100%', borderRadius: 8, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
                                onPress={() => router.push('/onboarding')}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Acreditarme como Profesional</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {usuario?.rol !== 'CLIENTE' && (
                        <>
                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={[styles.label, { color: colors.text }]}>
                                        Biografía Profesional
                                    </Text>
                            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                                {bio.length}/300
                            </Text>
                        </View>
                        <TextInput
                            style={[
                                styles.textArea,
                                {
                                    backgroundColor: colors.backgroundElement,
                                    borderColor: colors.backgroundSelected,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Describe tu experiencia, certificaciones y especialidades..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={4}
                            maxLength={300}
                            textAlignVertical="top"
                            value={bio}
                            onChangeText={setBio}
                        />
                    </View>

                {/* Sección 2: Mis Oficios y Especialidades */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                            Mis Oficios y Especialidades
                        </Text>
                        <Text style={[styles.badgeCount, { color: colors.secondary }]}>
                            {selectedOficios.length} seleccionado{selectedOficios.length !== 1 ? "s" : ""}
                        </Text>
                    </View>

                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                        Selecciona los oficios en los que ofreces tus servicios profesionales.
                    </Text>

                    <View style={styles.chipsContainer}>
                        {OFICIOS_DISPONIBLES.map((oficio) => {
                            const isSelected = selectedOficios.includes(oficio.id);
                            return (
                                <TouchableOpacity
                                    key={oficio.id}
                                    style={[
                                        styles.chip,
                                        isSelected
                                            ? {
                                                backgroundColor: colors.secondary,
                                                borderColor: colors.secondary,
                                            }
                                            : {
                                                backgroundColor: colors.backgroundElement,
                                                borderColor: colors.backgroundSelected,
                                            },
                                    ]}
                                    onPress={() => toggleOficio(oficio.id)}
                                    activeOpacity={0.7}
                                >
                                    {isSelected && (
                                        <Ionicons
                                            name="checkmark"
                                            size={16}
                                            color="#FFF"
                                            style={styles.chipIcon}
                                        />
                                    )}
                                    <Text
                                        style={[
                                            styles.chipText,
                                            isSelected
                                                ? { color: "#FFF", fontWeight: "700" }
                                                : { color: colors.text, fontWeight: "500" },
                                        ]}
                                    >
                                        {oficio.nombre}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Sección 3: Zonas de Cobertura */}
                <View style={styles.sectionContainer}>
                    <View style={styles.labelRow}>
                        <View style={styles.labelWithIcon}>
                            <Ionicons name="location-outline" size={18} color={colors.text} />
                            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 6 }]}>
                                Zonas de Cobertura
                            </Text>
                        </View>
                    </View>

                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.backgroundElement,
                                borderColor: colors.backgroundSelected,
                                color: colors.text,
                                marginTop: 8,
                            },
                        ]}
                        placeholder="Ej: Neuquén, Cipolletti, Plottier..."
                        placeholderTextColor={colors.textSecondary}
                        value={zonasCobertura}
                        onChangeText={setZonasCobertura}
                    />

                    <Text style={[styles.quickAddTitle, { color: colors.textSecondary }]}>
                        Sugerencias rápidas:
                    </Text>
                    <View style={styles.quickAddRow}>
                        {ZONAS_SUGERIDAS.map((zona) => (
                            <TouchableOpacity
                                key={zona}
                                style={[
                                    styles.quickAddChip,
                                    {
                                        backgroundColor: colors.backgroundElement,
                                        borderColor: colors.backgroundSelected,
                                    },
                                ]}
                                onPress={() => handleAddZona(zona)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.quickAddText, { color: colors.secondary }]}>
                                    + {zona}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                </>
                )}

                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        {
                            backgroundColor: colors.primary,
                            opacity: isSaving ? 0.7 : 1,
                        },
                    ]}
                    onPress={handleSave}
                    disabled={isSaving}
                    activeOpacity={0.8}
                >
                    {isSaving ? (
                        <View style={styles.savingRow}>
                            <ActivityIndicator size="small" color="#FFF" />
                            <Text style={styles.saveButtonText}>Guardando Cambios...</Text>
                        </View>
                    ) : (
                        <View style={styles.savingRow}>
                            <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" />
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        </View>
                    )}
                </TouchableOpacity>
                </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    headerRightPlaceholder: {
        width: 40,
    },
    scrollContent: {
        padding: 20,
    },
    avatarSection: {
        alignItems: "center",
        marginVertical: 16,
    },
    avatarWrapper: {
        position: "relative",
        width: 108,
        height: 108,
    },
    avatarImage: {
        width: 108,
        height: 108,
        borderRadius: 54,
        borderWidth: 3,
        borderColor: "#FFF",
    },
    cameraButton: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarHint: {
        fontSize: 13,
        marginTop: 10,
        fontWeight: "500",
    },
    formSection: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 16,
    },
    row: {
        flexDirection: "row",
        marginBottom: 14,
    },
    inputGroup: {
        marginBottom: 14,
    },
    labelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 6,
    },
    charCount: {
        fontSize: 12,
        marginBottom: 6,
    },
    input: {
        height: 50,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    textArea: {
        minHeight: 100,
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
    },
    sectionContainer: {
        marginTop: 20,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    badgeCount: {
        fontSize: 13,
        fontWeight: "700",
    },
    sectionSubtitle: {
        fontSize: 13,
        marginTop: 4,
        marginBottom: 12,
    },
    chipsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        borderWidth: 1.5,
    },
    chipIcon: {
        marginRight: 6,
    },
    chipText: {
        fontSize: 14,
    },
    labelWithIcon: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    quickAddTitle: {
        fontSize: 12,
        marginTop: 8,
        marginBottom: 6,
        fontWeight: "500",
    },
    quickAddRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    quickAddChip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    quickAddText: {
        fontSize: 12,
        fontWeight: "600",
    },

    saveButton: {
        marginTop: 28,
        marginBottom: 16,
        minHeight: 52,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#FF8C00",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    savingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    saveButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },

});
