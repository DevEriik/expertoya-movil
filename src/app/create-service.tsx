import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function CreateServiceModal() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const handleSave = () => {
    console.log("Guardando Servicio:", { title, price, duration });
    if (router.canDismiss()) {
      router.dismiss();
    } else {
      router.back();
    }
  };

  const handleClose = () => {
    if (router.canDismiss()) {
      router.dismiss();
    } else {
      router.back();
    }
  };

  return (
    <BlurView intensity={100} tint="dark" style={styles.overlay}>
      <View
        style={[
          styles.modalView,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={[styles.modalTitle, { color: colors.text }]}>
          Nuevo Servicio
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>Título</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.textSecondary, color: colors.text },
          ]}
          placeholder="Ej: Reparación..."
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.text }]}>Precio (ARS)</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.textSecondary, color: colors.text },
          ]}
          placeholder="Ej: 15000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={[styles.label, { color: colors.text }]}>Duración</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.textSecondary, color: colors.text },
          ]}
          placeholder="Ej: 1 a 2 horas"
          placeholderTextColor={colors.textSecondary}
          value={duration}
          onChangeText={setDuration}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>Publicar</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "90%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 4,
  },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16 },
  saveButton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
