import { Colors } from "@/constants/theme";
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>
        Título del Servicio
      </Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: colors.textSecondary, color: colors.text },
        ]}
        placeholder="Ej: Reparación de tubería..."
        placeholderTextColor={colors.textSecondary}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { color: colors.text }]}>
        Precio Estimado (ARS)
      </Text>
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

      <Text style={[styles.label, { color: colors.text }]}>
        Duración Aproximada
      </Text>
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
        <Text style={styles.buttonText}>Publicar Servicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
