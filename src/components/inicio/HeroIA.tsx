import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

export function HeroIA() {
    return (
        <View style={styles.card}>
        <View style={styles.badgeContainer}>
            <MaterialCommunityIcons name="magic-staff" size={16} color="#33EFA5" />
            <Text style={styles.badgeText}>
            Búsqueda con Inteligencia Artificial
            </Text>
        </View>

        <Text style={styles.mainTitle}>
            ¿No estás seguro{"\n"}de a qué{"\n"}especialista{"\n"}llamar?
        </Text>

        <Text style={styles.subtitle}>
            Describe tu problema o sube una foto/video, y nuestra IA te conectará al
            instante con el experto exacto que necesitas.
        </Text>

        <View style={styles.searchContainer}>
            <View style={styles.inputRow}>
            <TextInput
                style={styles.textInput}
                placeholder="Ej., Tengo una pérdida de agua..."
                placeholderTextColor="#9CA3AF"
                multiline={true}
            />
            </View>

            <View style={styles.toolsRow}>
            <View style={styles.iconGroup}>
                <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="mic-outline" size={24} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="camera-outline" size={24} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.aiButton}>
                <MaterialCommunityIcons
                name="magic-staff"
                size={18}
                color="#121826"
                />
                <Text style={styles.aiButtonText}>Preguntar a la IA</Text>
            </TouchableOpacity>
            </View>
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "100%",
        backgroundColor: "#1F2937",
        borderRadius: 32,
        padding: 24,
        alignItems: "center",
        ...Platform.select({
        ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
        },
        android: { elevation: 8 },
        }),
    },
    badgeContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(51, 239, 165, 0.1)",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 32,
    },
    badgeText: {
        color: "#33EFA5",
        fontWeight: "700",
        marginLeft: 8,
        fontSize: 13,
    },
    mainTitle: {
        fontSize: 38,
        fontWeight: "800",
        color: "#FDFCF4",
        textAlign: "center",
        lineHeight: 44,
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "400",
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    searchContainer: {
        width: "100%",
        backgroundColor: "#121826",
        borderRadius: 24,
        padding: 8,
        borderWidth: 1,
        borderColor: "#374151",
    },
    inputRow: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 16,
    },
    textInput: {
        fontSize: 16,
        color: "#FDFCF4",
        minHeight: 40,
    },
    toolsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 4,
        paddingBottom: 4,
    },
    iconGroup: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconButton: {
        padding: 10,
        backgroundColor: "#1F2937",
        borderRadius: 20,
        marginRight: 8,
    },
    aiButton: {
        flexDirection: "row",
        backgroundColor: "#33EFA5",
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    aiButtonText: {
        color: "#121826",
        fontWeight: "700",
        fontSize: 15,
        marginLeft: 8,
    },
});
