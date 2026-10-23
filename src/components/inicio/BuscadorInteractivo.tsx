import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface Props {
  busqueda: string;
  setBusqueda: (texto: string) => void;
  onCameraPress: () => void;
  onSubmit: () => void;
  imagenSeleccionada: ImagePicker.ImagePickerAsset | null;
  onRemoveImage: () => void;
}

export function BuscadorInteractivo({
  busqueda,
  setBusqueda,
  onCameraPress,
  onSubmit,
  imagenSeleccionada,
  onRemoveImage,
}: Props) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.inputRow}>
        {/* Miniatura de la imagen seleccionada */}
        {imagenSeleccionada && (
          <View style={styles.thumbnailWrapper}>
            <Image
              source={{ uri: imagenSeleccionada.uri }}
              style={styles.thumbnail}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={onRemoveImage}
            >
              <Ionicons name="close" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          style={styles.textInput}
          placeholder="Ej., Tengo una pérdida de agua..."
          placeholderTextColor="#9CA3AF"
          multiline={true}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <View style={styles.toolsRow}>
        <View style={styles.iconGroup}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="mic-outline" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Botón para abrir cámara */}
          <TouchableOpacity style={styles.iconButton} onPress={onCameraPress}>
            <Ionicons
              name="camera-outline"
              size={24}
              color={imagenSeleccionada ? "#33EFA5" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>

        {/* Botón para enviar datos */}
        <TouchableOpacity style={styles.aiButton} onPress={onSubmit}>
          <MaterialCommunityIcons
            name="magic-staff"
            size={18}
            color="#121826"
          />
          <Text style={styles.aiButtonText}>Preguntar a la IA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    width: "100%",
    backgroundColor: "#121826",
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  textInput: { flex: 1, fontSize: 16, color: "#FDFCF4", minHeight: 40 },
  thumbnailWrapper: { position: "relative", marginRight: 12 },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  toolsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  iconGroup: { flexDirection: "row", alignItems: "center" },
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
