import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function InicioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio</Text>
      
      <Link href="/onboarding" style={styles.button}>
        <Text style={styles.buttonText}>Probar Registro de Profesional</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    padding: 20
  },
  title: {
    fontSize: 24,
    marginBottom: 40
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  }
});
